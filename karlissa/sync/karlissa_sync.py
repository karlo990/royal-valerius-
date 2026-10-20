#!/usr/bin/env python3
"""Royal Crest hub · school PC backup agent (Python 3.8+, no extra packages).

Keeps the hub's memory on the school PC and in Google Drive:

  * pulls a backup zip of everything whenever the hub's data changes, into a folder
    (point it at a Google Drive for desktop folder and Drive syncs it to the cloud);
  * on start-up ("resume") checks the hub: if the Space restarted empty, or came back
    with older data than this PC has, it uploads the newest zip so the hub carries on
    where it left off;
  * never overwrites a different school database: it saves a copy and warns instead.

Commands
  python karlissa_sync.py setup            ask for the hub address, sync key and folder
  python karlissa_sync.py run              resume, then keep pulling (every 5 minutes)
  python karlissa_sync.py pull             pull one backup now
  python karlissa_sync.py resume           only the start-up check
  python karlissa_sync.py status           what the hub and this PC hold
  python karlissa_sync.py restore FILE     upload a specific zip to the hub
  python karlissa_sync.py install          start automatically when Windows starts
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONFIG = Path(os.environ.get("KARLISSA_CONFIG", HERE / "karlissa_sync.json"))
DEFAULTS = {
    "hub_url": "https://davincii-code-karlissa.hf.space",
    "sync_key": "",
    "folder": str(Path.home() / "Google Drive" / "My Drive" / "Royal Crest Backups"),
    "every_minutes": 5,
    "keep_latest": 60,          # newest zips always kept
    "keep_daily_days": 365,     # plus one per day for this long
    "rclone_remote": "",        # optional, e.g. "gdrive:Royal Crest Backups" if you use rclone instead of Drive for desktop
}
log = logging.getLogger("karlissa-sync")


# ───────────────────────── config ─────────────────────────
def load_config() -> dict:
    cfg = dict(DEFAULTS)
    if CONFIG.exists():
        cfg.update(json.loads(CONFIG.read_text(encoding="utf-8")))
    for k, env in (("hub_url", "KARLISSA_URL"), ("sync_key", "KARLISSA_SYNC_KEY"), ("folder", "KARLISSA_BACKUP_DIR")):
        if os.environ.get(env):
            cfg[k] = os.environ[env]
    cfg["hub_url"] = cfg["hub_url"].rstrip("/")
    return cfg


def setup() -> None:
    cfg = load_config()
    print("Royal Crest hub · PC backup agent setup (press Enter to keep the value in brackets)\n")
    for key, label in (("hub_url", "Hub address"), ("sync_key", "Sync key (the SYNC_KEY secret of the Space)"),
                       ("folder", "Backup folder (a Google Drive folder is best)")):
        shown = "•" * 8 if key == "sync_key" and cfg[key] else cfg[key]
        v = input(f"{label} [{shown}]: ").strip()
        if v:
            cfg[key] = v
    CONFIG.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    try:
        os.chmod(CONFIG, 0o600)
    except OSError:
        pass
    print(f"\nSaved {CONFIG}. Checking the hub…")
    status_cmd(cfg)


# ───────────────────────── http ─────────────────────────
def call(cfg: dict, method: str, path: str, data: bytes | None = None, timeout: int = 300):
    req = urllib.request.Request(cfg["hub_url"] + path, data=data, method=method,
                                 headers={"X-Sync-Key": cfg["sync_key"], "User-Agent": "karlissa-sync/1.0",
                                          **({"Content-Type": "application/zip"} if data else {})})
    return urllib.request.urlopen(req, timeout=timeout)


def hub_status(cfg: dict) -> dict:
    with call(cfg, "GET", "/api/v1/admin/backup/status", timeout=60) as r:
        return json.loads(r.read().decode())


def wait_for_hub(cfg: dict, minutes: int = 20) -> dict | None:
    """A sleeping or restarting Space can take a few minutes to answer."""
    end = time.time() + minutes * 60
    delay = 10
    while time.time() < end:
        try:
            return hub_status(cfg)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                log.error("The hub refused the sync key (HTTP %s). Check SYNC_KEY in the Space and in %s.", e.code, CONFIG)
                return None
            log.info("Hub not ready (HTTP %s); retrying in %ss", e.code, delay)
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            log.info("Hub not reachable (%s); retrying in %ss", getattr(e, "reason", e), delay)
        time.sleep(delay)
        delay = min(delay * 2, 120)
    log.error("The hub did not answer within %s minutes.", minutes)
    return None


# ───────────────────────── local backups ─────────────────────────
def folder(cfg: dict) -> Path:
    p = Path(cfg["folder"]).expanduser()
    p.mkdir(parents=True, exist_ok=True)
    return p


def manifest(p: Path) -> dict | None:
    try:
        with zipfile.ZipFile(p) as z:
            return json.loads(z.read("manifest.json"))
    except (zipfile.BadZipFile, KeyError, ValueError, OSError):
        return None


def local_backups(cfg: dict) -> list[tuple[Path, dict]]:
    out = []
    for p in folder(cfg).glob("royal-crest-*.zip"):
        m = manifest(p)
        if m:
            out.append((p, m))
    return sorted(out, key=lambda pm: (pm[1].get("data_version", 0), pm[1].get("created_at", "")), reverse=True)


def newest_for(cfg: dict, instance_id: str | None) -> tuple[Path, dict] | None:
    for p, m in local_backups(cfg):
        if instance_id is None or m.get("instance_id") == instance_id:
            return p, m
    return None


def prune(cfg: dict) -> None:
    files = sorted(folder(cfg).glob("royal-crest-*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)
    keep = set(files[: int(cfg["keep_latest"])])
    seen_days = set()
    cutoff = datetime.now() - timedelta(days=int(cfg["keep_daily_days"]))
    for p in files:
        d = datetime.fromtimestamp(p.stat().st_mtime)
        if d >= cutoff and d.date() not in seen_days:
            seen_days.add(d.date())
            keep.add(p)
    for p in files:
        if p not in keep:
            p.unlink()
            log.info("pruned %s", p.name)


def write_state(cfg: dict, **kw) -> None:
    p = folder(cfg) / "sync-state.json"
    try:
        st = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        st = {}
    st.update(kw, updated=datetime.now().isoformat(timespec="seconds"))
    p.write_text(json.dumps(st, indent=2), encoding="utf-8")


# ───────────────────────── actions ─────────────────────────
def pull(cfg: dict, st: dict | None = None) -> Path | None:
    st = st or hub_status(cfg)
    have = newest_for(cfg, st["instance_id"])
    if have and have[1].get("data_version") == st["data_version"]:
        log.info("Up to date (data version %s).", st["data_version"])
        return have[0]
    with call(cfg, "GET", "/api/v1/admin/backup/export") as r:
        name = (r.headers.get("Content-Disposition", "").split("filename=")[-1].strip('"; ') or
                f"royal-crest-{datetime.now():%Y%m%d-%H%M%S}.zip")
        dest = folder(cfg) / name
        tmp = dest.with_suffix(".part")
        with open(tmp, "wb") as f:
            shutil.copyfileobj(r, f)
    m = manifest(tmp)
    if not m:
        tmp.unlink(missing_ok=True)
        raise RuntimeError("The hub sent something that is not a backup zip.")
    tmp.replace(dest)
    shutil.copyfile(dest, folder(cfg) / "LATEST-royal-crest-backup.zip")
    log.info("Saved %s (data version %s, %s learners).", dest.name, m["data_version"], m.get("counts", {}).get("learners"))
    write_state(cfg, last_pull=dest.name, data_version=m["data_version"], instance_id=m["instance_id"])
    if cfg.get("rclone_remote") and shutil.which("rclone"):
        subprocess.run(["rclone", "copy", str(dest), cfg["rclone_remote"]], check=False)
    prune(cfg)
    return dest


def restore(cfg: dict, path: Path, why: str) -> dict:
    m = manifest(path)
    if not m:
        raise RuntimeError(f"{path} is not a hub backup zip.")
    log.warning("Restoring %s (data version %s) to the hub: %s", path.name, m["data_version"], why)
    with call(cfg, "PUT", "/api/v1/admin/backup/restore", data=path.read_bytes(), timeout=600) as r:
        out = json.loads(r.read().decode())
    write_state(cfg, last_restore=path.name, restore_reason=why, data_version=m["data_version"])
    log.info("Hub restored to data version %s.", out.get("data_version"))
    return out


def resume(cfg: dict) -> dict | None:
    """Start-up check: put the newest data back if the hub lost it."""
    st = wait_for_hub(cfg)
    if not st:
        return None
    mine = newest_for(cfg, st["instance_id"])
    anyb = local_backups(cfg)
    if st.get("fresh") and anyb:
        restore(cfg, anyb[0][0], "the hub restarted with an empty database")
        return hub_status(cfg)
    if mine and mine[1]["data_version"] > st["data_version"]:
        restore(cfg, mine[0], f"the hub has older data (v{st['data_version']}) than this PC (v{mine[1]['data_version']})")
        return hub_status(cfg)
    if not mine and anyb and st.get("real_learners", 0) > 0:
        log.warning("The hub holds a different school database (instance %s) from this PC's backups (%s). "
                    "Nothing was overwritten; a copy of the hub's data is saved next to them.",
                    st["instance_id"][:12], anyb[0][1]["instance_id"][:12])
        pull(cfg, st)
    log.info("Hub is current (data version %s).", st["data_version"])
    return st


def run(cfg: dict) -> None:
    st = resume(cfg)
    every = max(1, int(cfg["every_minutes"])) * 60
    while True:
        try:
            st = hub_status(cfg)
            if st.get("fresh") and local_backups(cfg):
                st = resume(cfg) or st
            pull(cfg, st)
        except urllib.error.HTTPError as e:
            log.error("Hub error HTTP %s: %s", e.code, e.read()[:200])
        except Exception as e:                       # keep running through network blips
            log.error("%s", e)
        time.sleep(every)


def status_cmd(cfg: dict) -> None:
    try:
        st = hub_status(cfg)
        print(f"Hub {cfg['hub_url']}\n  instance {st['instance_id']}\n  data version {st['data_version']} · last change {st['last_change_at']}"
              f"\n  fresh: {st['fresh']} · cloud backup: {st['cloud_enabled']}")
    except Exception as e:
        print(f"Hub {cfg['hub_url']}: not reachable ({e})")
    b = local_backups(cfg)
    print(f"This PC: {len(b)} backups in {folder(cfg)}")
    if b:
        print(f"  newest {b[0][0].name} (data version {b[0][1]['data_version']})")


def install() -> None:
    py = Path(sys.executable)
    pyw = py.with_name("pythonw.exe") if os.name == "nt" and py.with_name("pythonw.exe").exists() else py
    if os.name == "nt":
        startup = Path(os.environ["APPDATA"]) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
        bat = startup / "Royal Crest backup agent.bat"
        bat.write_text(f'@echo off\r\ncd /d "{HERE}"\r\nstart "" "{pyw}" "{Path(__file__).resolve()}" run\r\n', encoding="utf-8")
        print(f"Installed: {bat}\nThe agent now starts when you sign in to Windows. Start it now with: python karlissa_sync.py run")
    else:
        line = f"@reboot cd {HERE} && {py} {Path(__file__).resolve()} run >> {HERE / 'karlissa_sync.log'} 2>&1"
        print("Add this line with `crontab -e` to start the agent at boot:\n\n" + line)


def main(argv: list[str]) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=[logging.StreamHandler(), logging.FileHandler(HERE / "karlissa_sync.log", encoding="utf-8")])
    cmd = argv[1] if len(argv) > 1 else "run"
    if cmd == "setup":
        setup()
        return 0
    if cmd == "install":
        install()
        return 0
    cfg = load_config()
    if not cfg["sync_key"]:
        print("No sync key yet. Run:  python karlissa_sync.py setup")
        return 2
    if cmd == "run":
        run(cfg)
    elif cmd == "pull":
        pull(cfg)
    elif cmd == "resume":
        resume(cfg)
    elif cmd == "status":
        status_cmd(cfg)
    elif cmd == "restore" and len(argv) > 2:
        restore(cfg, Path(argv[2]), "requested from the command line")
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
