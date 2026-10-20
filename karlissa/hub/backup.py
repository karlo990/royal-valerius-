"""Backups: the hub's persistent memory.

A backup is one zip:
  manifest.json      instance id, data version, counts, checksum
  school.db          the whole database (sign-in sessions removed)
  export/*.csv       every table as a spreadsheet (opens in Excel)
  export/everything.json
  README.txt

Where copies live:
  1. DATA_DIR/backups on the Space (automatic, a minute after any change)
  2. A private Hugging Face dataset repo (HF_TOKEN + HF_BACKUP_REPO), restored on boot
  3. The school PC, via sync/karlissa_sync.py, into a Google Drive for desktop folder
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import logging
import os
import shutil
import sqlite3
import tempfile
import threading
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from . import config, db

log = logging.getLogger("hub.backup")
FORMAT = "royal-crest-hub-backup/1"
EXPORT_TABLES = ["learners", "parents", "guardians", "subjects", "terms", "results", "attendance", "timetable", "assignments",
                 "submissions", "trades", "skills", "fee_items", "payments", "notices", "registrations", "memory", "chats",
                 "devices", "audit", "staff"]
SECRET_COLUMNS = {"pw_hash"}
STATE_LOCK = threading.Lock()


# ───────────────────────── state file (kept outside the db so it doesn't bump versions) ─────────────────────────
def state() -> dict:
    try:
        return json.loads(config.STATE_FILE.read_text())
    except (OSError, ValueError):
        return {}


def save_state(**kw) -> dict:
    with STATE_LOCK:
        s = {**state(), **kw}
        config.STATE_FILE.write_text(json.dumps(s, indent=2))
        return s


def _sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# ───────────────────────── create ─────────────────────────
def _snapshot(dest: Path) -> None:
    with db.WRITE_LOCK:
        src = db.connect()
        dst = sqlite3.connect(str(dest))
        try:
            src.backup(dst)
        finally:
            src.close()
    try:
        dst.execute("DELETE FROM sessions")
        dst.commit()
        dst.execute("PRAGMA journal_mode=DELETE")
        dst.execute("VACUUM")
    finally:
        dst.close()


def _csv(c: sqlite3.Connection, table: str) -> str:
    cur = c.execute(f"SELECT * FROM {table}")
    cols = [d[0] for d in cur.description]
    keep = [i for i, n in enumerate(cols) if n not in SECRET_COLUMNS]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow([cols[i] for i in keep])
    for r in cur:
        w.writerow([r[i] for i in keep])
    return "﻿" + buf.getvalue()           # BOM so Excel reads UTF-8 names correctly


def make_backup(reason: str = "manual", actor: str = "system") -> dict:
    config.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    with tempfile.TemporaryDirectory(dir=config.DATA_DIR) as tmp:
        snap = Path(tmp) / "school.db"
        _snapshot(snap)
        c = sqlite3.connect(str(snap))
        c.row_factory = sqlite3.Row
        try:
            meta = {r["key"]: r["value"] for r in c.execute("SELECT key, value FROM meta")}
            counts = {t: c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in EXPORT_TABLES}
            csvs = {t: _csv(c, t) for t in EXPORT_TABLES}
            everything = {t: [{k: v for k, v in dict(r).items() if k not in SECRET_COLUMNS} for r in c.execute(f"SELECT * FROM {t}")]
                          for t in EXPORT_TABLES if t not in ("audit", "chats")}
        finally:
            c.close()
        version = int(meta.get("data_version", 0))
        manifest = {
            "format": FORMAT, "app_version": config.VERSION, "school": config.SCHOOL["name"],
            "instance_id": meta.get("instance_id"), "data_version": version, "schema_version": int(meta.get("schema_version", 1)),
            "created_at": db.now_iso(), "reason": reason, "by": actor, "counts": counts,
            "db_sha256": _sha256(snap), "db_bytes": snap.stat().st_size,
        }
        name = f"royal-crest-{stamp}-v{version}.zip"
        out = config.BACKUP_DIR / name
        part = out.with_suffix(".part")
        with zipfile.ZipFile(part, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            z.writestr("manifest.json", json.dumps(manifest, indent=2))
            z.write(snap, "school.db")
            for t, text in csvs.items():
                z.writestr(f"export/{t}.csv", text)
            z.writestr("export/everything.json", json.dumps(everything, indent=1, default=str, ensure_ascii=False))
            z.writestr("README.txt", README.format(**manifest))
        part.replace(out)
    prune()
    save_state(last_local={"name": name, "at": manifest["created_at"], "data_version": version, "reason": reason})
    log.info("backup %s (%s)", name, reason)
    return {"name": name, "bytes": out.stat().st_size, **manifest}


README = """Royal Crest Academy · hub backup
================================
Made {created_at} ({reason}) · data version {data_version} · instance {instance_id}

What is inside
  school.db      the full database. To restore: dashboard → Backups → Restore from file,
                 or `python karlissa_sync.py restore <this zip>` on the school PC.
  export/*.csv   every table as a spreadsheet you can open in Excel or Google Sheets.
  export/everything.json   the same data as JSON.

This file holds learners' records and parents' contact details. Keep it private
(the school's Google Drive or PC only) and never post it anywhere public.
"""


def list_backups() -> list[dict]:
    out = []
    for p in sorted(config.BACKUP_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
        item = {"name": p.name, "bytes": p.stat().st_size,
                "at": datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).replace(microsecond=0).isoformat()}
        try:
            with zipfile.ZipFile(p) as z:
                m = json.loads(z.read("manifest.json"))
            item.update(data_version=m.get("data_version"), reason=m.get("reason"), counts=m.get("counts", {}))
        except (zipfile.BadZipFile, KeyError, ValueError):
            item["damaged"] = True
        out.append(item)
    return out


def prune() -> None:
    """Keep the newest KEEP_LOCAL_BACKUPS, plus the last backup of each of the past 30 days."""
    files = sorted(config.BACKUP_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)
    keep = set(files[:config.KEEP_LOCAL_BACKUPS])
    days: dict[str, Path] = {}
    for p in files:
        d = datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).date().isoformat()
        days.setdefault(d, p)
    keep |= set(list(days.values())[:30])
    for p in files:
        if p not in keep:
            p.unlink(missing_ok=True)


def backup_path(name: str) -> Path:
    p = (config.BACKUP_DIR / name).resolve()
    if p.parent != config.BACKUP_DIR.resolve() or p.suffix != ".zip" or not p.exists():
        raise FileNotFoundError(name)
    return p


# ───────────────────────── restore ─────────────────────────
class RestoreError(ValueError):
    pass


def read_manifest(zip_path: Path) -> dict:
    try:
        with zipfile.ZipFile(zip_path) as z:
            return json.loads(z.read("manifest.json"))
    except (zipfile.BadZipFile, KeyError, ValueError) as e:
        raise RestoreError(f"Not a hub backup zip ({e.__class__.__name__}).") from e


def restore(zip_path: Path, actor: str = "system", reason: str = "restore") -> dict:
    m = read_manifest(zip_path)
    if m.get("format") != FORMAT:
        raise RestoreError("This zip was not made by the Royal Crest hub.")
    with tempfile.TemporaryDirectory(dir=config.DATA_DIR) as tmp:
        snap = Path(tmp) / "school.db"
        with zipfile.ZipFile(zip_path) as z:
            with z.open("school.db") as src, open(snap, "wb") as dst:
                shutil.copyfileobj(src, dst)
        if _sha256(snap) != m.get("db_sha256"):
            raise RestoreError("The database inside the zip is damaged (checksum mismatch).")
        chk = sqlite3.connect(str(snap))
        try:
            if chk.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise RestoreError("The database inside the zip failed SQLite's integrity check.")
            if not chk.execute("SELECT value FROM meta WHERE key='instance_id'").fetchone():
                raise RestoreError("The database inside the zip has no school data.")
        finally:
            chk.close()
        if db.is_initialised():
            try:
                make_backup("before-restore", actor)
            except Exception as e:          # never block a restore on the safety copy
                log.warning("pre-restore backup failed: %s", e)
        with db.WRITE_LOCK:
            live = db.connect()
            staff_sessions = []
            try:
                staff_sessions = [dict(r) for r in live.execute("SELECT * FROM sessions WHERE kind='staff'")]
            except sqlite3.DatabaseError:
                pass
            src = sqlite3.connect(str(snap))
            try:
                src.backup(live)
            finally:
                src.close()
            db.migrate(live)
            # keep staff signed in (by username); parents and learners sign in again
            for s in staff_sessions:
                if live.execute("SELECT 1 FROM staff WHERE username=?", (s["subject"],)).fetchone() or s["subject"] == "admin":
                    live.execute("INSERT OR REPLACE INTO sessions(token_hash,kind,subject,created_at,expires_at,last_seen,ip,ua) "
                                 "VALUES(:token_hash,:kind,:subject,:created_at,:expires_at,:last_seen,:ip,:ua)", s)
            db.set_meta(live, "restored_from", json.dumps({"name": zip_path.name, "data_version": m.get("data_version"),
                                                           "made": m.get("created_at"), "at": db.now_iso(), "by": actor, "reason": reason}))
            db.set_meta(live, "fresh", "0")
            db.audit(live, actor, "backup.restore", zip_path.name, f"data version {m.get('data_version')} ({reason})")
            live.commit()
            live.close()
    save_state(last_restore={"name": zip_path.name, "at": db.now_iso(), "data_version": m.get("data_version"), "reason": reason})
    log.info("restored %s (v%s, %s)", zip_path.name, m.get("data_version"), reason)
    return {"restored": zip_path.name, "data_version": m.get("data_version"), "instance_id": m.get("instance_id"),
            "made": m.get("created_at"), "counts": m.get("counts", {})}


# ───────────────────────── Hugging Face dataset (off-site copy) ─────────────────────────
def hf_enabled() -> bool:
    return bool(config.HF_TOKEN and config.HF_BACKUP_REPO)


def hf_push(zip_path: Path) -> dict:
    from huggingface_hub import CommitOperationAdd, HfApi     # imported lazily: optional dependency
    api = HfApi(token=config.HF_TOKEN)
    api.create_repo(config.HF_BACKUP_REPO, repo_type="dataset", private=True, exist_ok=True)
    m = read_manifest(zip_path)
    day = m["created_at"][:10]
    ops = [CommitOperationAdd("latest.zip", str(zip_path)),
           CommitOperationAdd(f"daily/{day}.zip", str(zip_path)),
           CommitOperationAdd("latest.json", io.BytesIO(json.dumps(m, indent=2).encode()))]
    api.create_commit(config.HF_BACKUP_REPO, repo_type="dataset", operations=ops,
                      commit_message=f"Backup v{m['data_version']} ({m['reason']})")
    st = save_state(last_cloud={"name": zip_path.name, "at": db.now_iso(), "data_version": m["data_version"]}, cloud_error=None)
    log.info("pushed %s to hf://datasets/%s", zip_path.name, config.HF_BACKUP_REPO)
    return st["last_cloud"]


def hf_pull_latest(dest_dir: Path) -> Path | None:
    from huggingface_hub import hf_hub_download
    try:
        p = hf_hub_download(config.HF_BACKUP_REPO, "latest.zip", repo_type="dataset", token=config.HF_TOKEN,
                            local_dir=str(dest_dir))
        return Path(p)
    except Exception as e:
        log.warning("no cloud backup to restore: %s", e)
        return None


# ───────────────────────── boot + scheduler ─────────────────────────
def boot() -> str:
    """Open the database, restoring the newest copy if this container started empty."""
    if db.is_initialised():
        db.migrate()
        return "existing"
    if hf_enabled():
        tmp = Path(tempfile.mkdtemp(dir=config.DATA_DIR))
        p = hf_pull_latest(tmp)
        if p:
            try:
                restore(p, "system", "boot: cloud backup")
                shutil.rmtree(tmp, ignore_errors=True)
                return "cloud"
            except RestoreError as e:
                log.error("cloud backup unusable: %s", e)
        shutil.rmtree(tmp, ignore_errors=True)
    for item in list_backups():
        if not item.get("damaged"):
            try:
                restore(config.BACKUP_DIR / item["name"], "system", "boot: local backup")
                return "local"
            except RestoreError as e:
                log.error("local backup %s unusable: %s", item["name"], e)
    db.create_fresh()
    if config.SEED_DEMO:
        from . import seed
        seed.load_demo()
    return "fresh"


class Scheduler(threading.Thread):
    """A minute after the last change: local backup. Every HF_PUSH_MINUTES (if changed): cloud copy."""

    def __init__(self):
        super().__init__(daemon=True, name="backup-scheduler")
        self.stop = threading.Event()
        self.kick = threading.Event()

    def run(self):
        while not self.stop.is_set():
            self.kick.wait(20)
            self.kick.clear()
            try:
                self.tick()
            except Exception as e:
                log.exception("backup tick failed: %s", e)

    def tick(self, final: bool = False):
        st = state()
        ver = db.data_version()
        last_local = (st.get("last_local") or {}).get("data_version", -1)
        quiet = time.time() - db.LAST_WRITE["at"] > 45
        if ver != last_local and (quiet or final):
            self.latest = make_backup("shutdown" if final else "auto")
            st = state()
        if hf_enabled():
            cloud = st.get("last_cloud") or {}
            due = time.time() - st.get("cloud_try_ts", 0) > config.HF_PUSH_MINUTES * 60
            local = st.get("last_local") or {}
            if local and cloud.get("data_version") != local.get("data_version") and (due or final):
                save_state(cloud_try_ts=time.time())
                try:
                    hf_push(config.BACKUP_DIR / local["name"])
                except Exception as e:
                    save_state(cloud_error=f"{db.now_iso()}: {str(e)[:300]}")
                    log.warning("cloud backup failed: %s", e)


SCHEDULER = Scheduler()


def status() -> dict:
    st = state()
    return {
        "instance_id": db.get_meta("instance_id"), "data_version": db.data_version(),
        "fresh": db.get_meta("fresh") == "1", "last_change_at": db.get_meta("last_change_at"),
        "created_at": db.get_meta("created_at"), "restored_from": json.loads(db.get_meta("restored_from") or "null"),
        "real_learners": db.scalar("SELECT COUNT(*) FROM learners WHERE demo=0", default=0),
        "last_local": st.get("last_local"), "last_cloud": st.get("last_cloud"), "cloud_error": st.get("cloud_error"),
        "last_restore": st.get("last_restore"), "cloud_enabled": hf_enabled(), "cloud_repo": config.HF_BACKUP_REPO or None,
        "data_dir": str(config.DATA_DIR), "persistent_disk": config.PERSISTENT_DISK,
        "db_bytes": config.DB_PATH.stat().st_size if config.DB_PATH.exists() else 0,
        "local_count": len(list(config.BACKUP_DIR.glob("*.zip"))) if config.BACKUP_DIR.exists() else 0,
        "sync_key_set": bool(config.SYNC_KEY),
    }


def save_upload(data: bytes) -> Path:
    config.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    p = config.BACKUP_DIR / f"uploaded-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.zip"
    p.write_bytes(data)
    return p


def wipe_local_for_tests() -> None:          # used by the test-suite only
    for p in config.BACKUP_DIR.glob("*.zip"):
        p.unlink()
    if config.STATE_FILE.exists():
        os.remove(config.STATE_FILE)
