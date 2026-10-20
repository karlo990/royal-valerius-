#!/bin/bash
# =============================================================================
#  ATLAS Conscious Worker — startup script
#  Compatible with: Karl-Con/conscious-worker-alpha
#                   Karl-Con/conscious-worker-beta
#                   Karl-Con/conscious-worker-gamma
#
#  Architecture (single public port: 7860):
#    1. Start Ollama        (localhost:11434)
#    2. Detect real CPU budget (cgroup-aware — FIX-M, see below)
#    3. Pull phi4-mini:3.8b-q4_K_M (pinned quant — FIX-N, see below)
#    4. Start uvicorn       (localhost:8765)
#    5. Start nginx         (0.0.0.0:7860)  ← only HF-exposed port
#
#  nginx routes:
#    /api/jarvis/conscious  → uvicorn (660 s timeout — cold-load safe)
#    /qt_sync*              → uvicorn (30 s)
#    /health*               → uvicorn (5 s)
#    /*                     → uvicorn (120 s catch-all)
#
#  Secrets required (set on each Space in HF → Settings → Secrets):
#    JARVIS_MODEL      = phi4-mini:3.8b-q4_K_M   (pinned — see FIX-N below;
#                        override only with another EXPLICIT quant tag, never
#                        a bare/floating model name)
#    INTERNAL_API_KEY  = <shared secret — same value any caller uses:
#                        ASGARD if you run the optional multi-node pool,
#                        atlas_ptz.py's ATLAS_CONSCIOUS_API_KEY otherwise>
#    OLLAMA_NUM_THREAD = <optional override — see FIX-M below; leave unset to
#                        use the cgroup-detected core count>
# =============================================================================
# NOTE: this Space is fully standalone — it needs no ASGARD/jarvis_server
# instance running anywhere. Every network call it makes at runtime targets
# only localhost:11434 (its own Ollama) or its own /health (anti-idle-sleep
# self-ping). ASGARD is an optional external caller for a 3-node pool setup,
# not a dependency of this container.
# =============================================================================
set -e

echo "===== ATLAS Conscious Worker startup at $(date -u '+%Y-%m-%d %H:%M:%S') ====="

# ── 1. Persistent storage ─────────────────────────────────────────────────────
mkdir -p /data/ollama/models
echo "==> Storage: /data/ollama/models"

# ── 2. Start Ollama ───────────────────────────────────────────────────────────
# ── Royal Crest hub (portal API + Control Room) starts first so it is ready early ──
mkdir -p /data/royal-crest 2>/dev/null || true
echo "==> Starting Royal Crest hub on :8780..."
(cd /app && python3 -m uvicorn hub.app:app --host 127.0.0.1 --port 8780 --proxy-headers --forwarded-allow-ips='*' --log-level info) &
HUB_PID=$!
echo "==> Royal Crest hub PID: $HUB_PID"

echo "==> Starting Ollama..."
ollama serve &
OLLAMA_PID=$!
echo "==> Ollama PID: $OLLAMA_PID"

# ── 3. Wait for Ollama ready ─────────────────────────────────────────────────
echo "==> Waiting for Ollama..."
for i in $(seq 1 60); do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "==> Ollama ready (${i}s)"
        break
    fi
    sleep 1
done

# ── 4. Detect real container CPU budget  [FIX-M, bounty report E1/E3/E6] ─────
# OLLAMA_NUM_THREAD used to be hardcoded (14), inherited from a different
# box's boot log rather than measured on this one. Root-caused as the
# dominant contributor to the 0.08-0.9 tok/s decode collapse (vs 7.2 tok/s
# prefill): decode is memory-bandwidth-bound and strictly sequential (Pope
# et al., "Efficiently Scaling Transformer Inference", MLSys 2022), so
# requesting more OS threads than the container's cgroup actually grants
# means every decode step pays scheduler context-switch and cache-thrashing
# overhead on top of an already latency-bound operation. Prefill tolerates
# oversubscription fine (embarrassingly parallel across the token batch);
# decode does not — this asymmetry is exactly the ~90x cliff seen in
# production logs (11:12:45, worker beta: prefill 7.20 tok/s vs decode
# 0.08 tok/s). Fix: read the ACTUAL cgroup-visible core count at boot
# instead of guessing. Checks cgroup v2 first, falls back to cgroup v1,
# falls back to nproc if neither cgroup file is present (non-containerized
# or unusual runtime).
detect_cpu_count() {
    local quota period cpus
    if [ -r /sys/fs/cgroup/cpu.max ]; then
        read -r quota period < /sys/fs/cgroup/cpu.max
        if [ "$quota" != "max" ] && [ -n "$quota" ] && [ -n "$period" ] && [ "$period" -gt 0 ] 2>/dev/null; then
            cpus=$(( quota / period ))
            [ "$cpus" -ge 1 ] 2>/dev/null && { echo "$cpus"; return; }
        fi
    fi
    if [ -r /sys/fs/cgroup/cpu/cpu.cfs_quota_us ] && [ -r /sys/fs/cgroup/cpu/cpu.cfs_period_us ]; then
        quota=$(cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us)
        period=$(cat /sys/fs/cgroup/cpu/cpu.cfs_period_us)
        if [ "$quota" -gt 0 ] 2>/dev/null && [ "$period" -gt 0 ] 2>/dev/null; then
            cpus=$(( quota / period ))
            [ "$cpus" -ge 1 ] 2>/dev/null && { echo "$cpus"; return; }
        fi
    fi
    nproc
}

_NPROC_RAW=$(nproc 2>/dev/null || echo "?")
_DETECTED_CPUS=$(detect_cpu_count)
if [ -z "$_DETECTED_CPUS" ] || ! [ "$_DETECTED_CPUS" -ge 1 ] 2>/dev/null; then
    echo "==> WARNING: CPU detection returned '$_DETECTED_CPUS' — falling back to nproc"
    _DETECTED_CPUS=$(nproc)
fi
echo "==> CPU detection: nproc=${_NPROC_RAW}  cgroup-derived=${_DETECTED_CPUS}"
if [ "$_NPROC_RAW" != "?" ] && [ "$_DETECTED_CPUS" != "$_NPROC_RAW" ]; then
    echo "==> NOTE: cgroup quota (${_DETECTED_CPUS}) differs from nproc (${_NPROC_RAW})"
    echo "==>       — this exact mismatch is what caused this box to previously"
    echo "==>       'self-select only 8/16 available threads' (see FIX-M)."
fi

# ── 5. Pull phi4-mini  [FIX-N, bounty report E5] ─────────────────────────────
# Was `ollama pull phi4-mini` (floating tag, resolves to whatever ":latest"
# happens to be on pull day, undeclared in source control — a reproducibility
# defect independent of the threading bug: a redeploy on a different day
# could silently pull a different quantization with no corresponding code
# change to explain the latency/quality shift). Also previously ignored
# JARVIS_MODEL entirely even when a caller overrode it via HF secret — this
# now pulls exactly the model that will actually be served.
export JARVIS_MODEL="${JARVIS_MODEL:-phi4-mini:3.8b-q4_K_M}"
echo "==> Pulling ${JARVIS_MODEL} (conscious inference model, pinned quant)..."
ollama pull "${JARVIS_MODEL}" && echo "==> ${JARVIS_MODEL} ready."

# ── 6. Install Python dependencies (belt-and-suspenders) ─────────────────────
echo "==> Installing Python deps..."
pip install --no-cache-dir fastapi "uvicorn[standard]" requests httpx

# ── 7. Export runtime environment ────────────────────────────────────────────
export WORKER_PORT=8765
export WORKER_HOST=0.0.0.0
export OLLAMA_URL=http://localhost:11434/api/chat
# FIX-H/K [bug hunt, 2026-07-04]: was 2 — see Dockerfile comment for the full
# rationale (llama.cpp discussion #23147 / issue #9016: -np > 1 splits n_ctx
# AND the thread pool across slots on CPU-only hardware, which is what was
# producing the 0.2-0.6 tok/s decode collapses in production logs whenever
# both slots were busy simultaneously). Override at deploy time only after
# adding real concurrency headroom (GPU / more dedicated cores).
export OLLAMA_NUM_PARALLEL="${OLLAMA_NUM_PARALLEL:-1}"
# FIX-M: was a hardcoded 14 inherited from a different box. Now defaults to
# the cgroup-detected count from step 4; an HF secret named OLLAMA_NUM_THREAD
# still wins if explicitly set (e.g. to deliberately under-provision and
# leave headroom for nginx/uvicorn on a very small instance).
export OLLAMA_NUM_THREAD="${OLLAMA_NUM_THREAD:-$_DETECTED_CPUS}"
export OLLAMA_FLASH_ATTENTION="${OLLAMA_FLASH_ATTENTION:-1}"   # FIX-L: was never set — see Dockerfile
export OLLAMA_KV_CACHE_SIZE=2G
export OLLAMA_KEEP_ALIVE=-1          # KEEP MODEL LOADED FOREVER — never unload phi4-mini between calls
export OLLAMA_LOAD_TIMEOUT=300s
export MAX_INFLIGHT="${MAX_INFLIGHT:-2}"                       # FIX-H: matched to OLLAMA_NUM_PARALLEL, not a flat 20
export QT_RESYNC_STALE_SEC="${QT_RESYNC_STALE_SEC:-90}"        # FIX-I: HLC epoch-reset window, see conscious_worker.py

echo "==> JARVIS_MODEL       : $JARVIS_MODEL  (pinned quant — see FIX-N)"
echo "==> OLLAMA_URL         : $OLLAMA_URL"
echo "==> OLLAMA_NUM_PARALLEL: $OLLAMA_NUM_PARALLEL  (was 2 — see FIX-H/K)"
echo "==> OLLAMA_NUM_THREAD  : $OLLAMA_NUM_THREAD  (was hardcoded 14 — see FIX-M)"
echo "==> MAX_INFLIGHT       : $MAX_INFLIGHT  (was flat 20 — see FIX-H)"
echo "==> QT_RESYNC_STALE_SEC: $QT_RESYNC_STALE_SEC  (see FIX-I)"
echo "==> WORKER_PORT        : $WORKER_PORT"
echo "==> INTERNAL_API_KEY   : ${INTERNAL_API_KEY:+SET}"

# ── 8. Ensure nginx.conf is in place ─────────────────────────────────────────
# Lock the ATLAS trace dashboard with the same ADMIN_PASSWORD as the Control Room (user: admin)
python3 -c "import crypt,os; print('admin:' + crypt.crypt(os.environ.get('ADMIN_PASSWORD') or os.urandom(24).hex(), crypt.mksalt(crypt.METHOD_SHA512)))" > /tmp/atlas.htpasswd
chmod 644 /tmp/atlas.htpasswd
echo "==> Checking nginx.conf..."
nginx -t && echo "==> nginx config OK."

# ── 9. Start uvicorn ─────────────────────────────────────────────────────────
echo "==> Starting conscious_worker (uvicorn) on port 8765..."
cd /app
python3 -m uvicorn conscious_worker:app \
    --host 0.0.0.0 \
    --port 8765 \
    --log-level info \
    --ws-ping-interval 20 \
    --ws-ping-timeout 60 &
UVICORN_PID=$!
echo "==> uvicorn PID: $UVICORN_PID"

# ── 10. Wait for uvicorn ready ────────────────────────────────────────────────
echo "==> Waiting for conscious_worker..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8765/health | grep -q '"status":"ok"'; then
        echo "==> conscious_worker ready (${i}s)"
        break
    fi
    sleep 1
done

# ── 11. Pre-warm Ollama KV cache ─────────────────────────────────────────────
# Fire a num_predict=1 call so phi4-mini is fully loaded into memory before
# the first real conscious call arrives. Without this, the first inference
# call pays the full model-load cost (~30-60s on HF CPU).
# NOT num_predict=0 -- Ollama 0.30.x silently treats 0 as "unset" (Go
# zero-value ambiguity) and falls through to infinite generation; see
# conscious_worker.py FIX-5 for the full root-cause writeup (a prior
# incident hit 1577+ decoded tokens at ~1 tok/s before HF killed the Space).
# FIX-N: fallback here was still the bare floating "phi4-mini" tag — dead
# code in practice since JARVIS_MODEL is now always set by step 5, but fixed
# for consistency so no code path in this file can ever hit the unpinned tag.
echo "==> Pre-warming ${JARVIS_MODEL} KV cache..."
curl -s -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"'"${JARVIS_MODEL}"'","messages":[{"role":"system","content":"ATLAS"}],"stream":false,"keep_alive":-1,"options":{"num_predict":1,"num_ctx":8192,"temperature":0}}' \
  > /dev/null && echo "==> KV warm complete." || echo "==> KV warm skipped (non-fatal)."

# ── 12. Start nginx ──────────────────────────────────────────────────────────
echo "==> Live trace dashboard: http://<space-host>:7860/dashboard"
echo "==> Starting nginx on port 7860..."
nginx -g "daemon off;"
