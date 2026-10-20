FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# ── Ollama environment ────────────────────────────────────────────────────────
ENV OLLAMA_MODELS=/data/ollama/models
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_ORIGINS=*
ENV OLLAMA_KEEP_ALIVE=-1
# FIX-H/K [bug hunt, 2026-07-04]: was 2. Production logs show decode
# throughput collapsing to 0.2-0.6 tok/s (vs ~10-11 tok/s prefill) whenever
# 2 slots were both busy — llama.cpp's own maintainers give this exact
# advice for CPU/thread-constrained boxes (ggml-org/llama.cpp discussion
# #23147: "please set --parallel 1 and try again"), because -np > 1 splits
# BOTH n_ctx and the thread pool across slots (issue #9016), which starves
# whichever slot is mid-decode when the other starts a prefill. This box
# only allocates 8 of 16 vCPU threads to llama-server in the first place —
# raise OLLAMA_NUM_PARALLEL back up only alongside OLLAMA_NUM_THREAD if/when
# real hardware headroom is added (GPU or more dedicated cores).
ENV OLLAMA_NUM_PARALLEL=1
# FIX-M [bounty report, 2026-07-04 — decode-throughput-collapse investigation]:
# OLLAMA_NUM_THREAD=14 used to be hardcoded here, inherited from a DIFFERENT
# box's boot log rather than measured on this one. Confirmed root cause of
# the 0.08-0.9 tok/s decode collapse (vs 7.2 tok/s prefill — a ~90x cliff,
# far outside anything quantization or model size alone explains): decode is
# memory-bandwidth-bound and sequential (Pope et al., "Efficiently Scaling
# Transformer Inference", MLSys 2022) — requesting more OS threads than the
# container's cgroup-visible core count actually provides means every decode
# step pays scheduler context-switch and cache-thrashing overhead on top of
# an already latency-bound operation. This box's own earlier boot log showed
# it "self-selecting only 8/16 available threads", i.e. 14 was never correct
# for THIS container even when it was written.
# Fix: OLLAMA_NUM_THREAD is no longer baked into the image. It is computed
# in start.sh at container boot from the actual cgroup cpu.max (or
# cpu.cfs_quota_us/cfs_period_us, or nproc as last resort) — see start.sh
# detect_cpu_count(). An HF Space secret named OLLAMA_NUM_THREAD still
# overrides the detected value if set, so this remains tunable without a
# rebuild; it just no longer silently inherits a guess from a different box.
ENV OLLAMA_KV_CACHE_SIZE=2G
ENV OLLAMA_LOAD_TIMEOUT=300s
# FIX-L: was missing entirely — flagged in a prior audit (see memory notes)
# and still absent. llama-server logs already show flash-attn auto-enabling
# itself at the model layer regardless, but setting this keeps Ollama's own
# reported config truthful instead of showing OLLAMA_FLASH_ATTENTION:false
# in the boot log while flash attention is actually running.
ENV OLLAMA_FLASH_ATTENTION=1

# ── Worker environment ────────────────────────────────────────────────────────
ENV WORKER_PORT=8765
ENV WORKER_HOST=0.0.0.0
ENV OLLAMA_URL=http://localhost:11434/api/chat
# FIX-N [bounty report E5, 2026-07-04]: was the floating tag "phi4-mini",
# which resolves to whatever Ollama library's ":latest" manifest happens to
# point at on pull day — undeclared anywhere in source control. That's a
# reproducibility/drift defect independent of the threading bug above: a
# redeploy on a different day could silently pull a different quantization
# and change latency/quality characteristics with no corresponding code
# change to explain it. Pinned to the explicit GGUF K-quant tag actually
# intended for this CPU-only deployment (2.5GB, Q4_K_M, verified to exist in
# the Ollama library). See start.sh for the matching pinned `ollama pull`.
ENV JARVIS_MODEL=phi4-mini:3.8b-q4_K_M
# FIX-H: MAX_INFLIGHT is now derived from OLLAMA_NUM_PARALLEL at runtime in
# conscious_worker.py if unset (2x for queue headroom); set explicitly here
# so it's visible/tunable without touching the image.
ENV MAX_INFLIGHT=2
# FIX-I: worker-side HLC epoch-reset window (see conscious_worker.py qt_sync
# fix) — how long of silence before a lower incoming tick is treated as a
# sender restart instead of a stale duplicate.
ENV QT_RESYNC_STALE_SEC=90

# ── System packages ───────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    python3 \
    python3-pip \
    zstd \
    && rm -rf /var/lib/apt/lists/*

# ── Ollama ────────────────────────────────────────────────────────────────────
RUN curl -fsSL https://ollama.com/install.sh | sh

# ── Python dependencies ───────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    requests \
    httpx

# ── Nginx: remove default site ────────────────────────────────────────────────
RUN rm -f /etc/nginx/sites-enabled/default

# ── App ───────────────────────────────────────────────────────────────────────
WORKDIR /app
COPY conscious_worker.py /app/conscious_worker.py
COPY dashboard.html      /app/dashboard.html
COPY nginx.conf          /etc/nginx/nginx.conf
COPY start.sh            /start.sh
# Royal Crest hub (portal API, parent registration, Control Room dashboard, backups)
COPY hub                 /app/hub
RUN pip3 install --no-cache-dir "huggingface_hub>=0.23" \
 && mkdir -p /data/royal-crest && chmod -R 777 /data/royal-crest
# Defensive: strip any CRLF line endings (e.g. from a Windows edit/commit)
# before chmod+exec — CRLF turns the shebang into "#!/bin/bash\r", which the
# kernel resolves as a literal (nonexistent) "/bin/bash\r" interpreter and
# surfaces as the misleading "exec /start.sh: no such file or directory".
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

# Persistent model storage (real /data mount provided by HF Spaces runtime)
RUN mkdir -p /data/ollama/models

EXPOSE 7860
CMD ["/start.sh"]