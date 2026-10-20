"""SQLite storage. Every write goes through `tx()`, which serialises writers, bumps the
data version (what backups and the PC agent compare), and tells the live dashboard."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from . import config

SCHEMA_VERSION = 1
WRITE_LOCK = threading.RLock()
_listeners: list = []          # called after each committed write: fn(event: dict)
LAST_WRITE = {"at": 0.0}

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS staff(
  id INTEGER PRIMARY KEY, username TEXT UNIQUE COLLATE NOCASE, name TEXT, role TEXT NOT NULL DEFAULT 'admin',
  pw_hash TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT, last_login TEXT);
CREATE TABLE IF NOT EXISTS learners(
  id TEXT PRIMARY KEY, first TEXT NOT NULL, last TEXT NOT NULL DEFAULT '', form INTEGER NOT NULL DEFAULT 1,
  stream TEXT, house TEXT, residence TEXT DEFAULT 'Boarder', hostel TEXT, class_teacher TEXT, gender TEXT, dob TEXT,
  status TEXT NOT NULL DEFAULT 'active', xp INTEGER NOT NULL DEFAULT 0, merits INTEGER NOT NULL DEFAULT 0,
  demerits INTEGER NOT NULL DEFAULT 0, pw_hash TEXT, notes TEXT, demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT, updated_at TEXT, last_login TEXT);
CREATE TABLE IF NOT EXISTS parents(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, email TEXT, relationship TEXT,
  address TEXT, pw_hash TEXT, status TEXT NOT NULL DEFAULT 'active', demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT, last_login TEXT);
CREATE TABLE IF NOT EXISTS guardians(
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  relationship TEXT, PRIMARY KEY(parent_id, learner_id));
CREATE TABLE IF NOT EXISTS subjects(code TEXT PRIMARY KEY, name TEXT NOT NULL, teacher TEXT, forms TEXT DEFAULT '1,2,3,4,5');
CREATE TABLE IF NOT EXISTS terms(
  id TEXT PRIMARY KEY, label TEXT NOT NULL, starts TEXT, ends TEXT, fees_due TEXT,
  published INTEGER NOT NULL DEFAULT 0, current INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS results(
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  term_id TEXT NOT NULL REFERENCES terms(id) ON DELETE CASCADE, code TEXT NOT NULL, name TEXT, teacher TEXT,
  ca REAL, exam REAL, comment TEXT, updated_at TEXT, PRIMARY KEY(learner_id, term_id, code));
CREATE TABLE IF NOT EXISTS attendance(
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  date TEXT NOT NULL, status TEXT NOT NULL, note TEXT, PRIMARY KEY(learner_id, date));
CREATE TABLE IF NOT EXISTS timetable(
  class TEXT NOT NULL, day TEXT NOT NULL, start TEXT NOT NULL, code TEXT, subject TEXT, teacher TEXT, room TEXT,
  PRIMARY KEY(class, day, start));
CREATE TABLE IF NOT EXISTS assignments(
  id INTEGER PRIMARY KEY, form INTEGER NOT NULL, stream TEXT, subject TEXT NOT NULL, title TEXT NOT NULL,
  details TEXT, due TEXT NOT NULL, created_by TEXT, created_at TEXT, demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS submissions(
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted', PRIMARY KEY(assignment_id, learner_id));
CREATE TABLE IF NOT EXISTS trades(form INTEGER PRIMARY KEY, trade TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS skills(
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  form INTEGER NOT NULL, trade TEXT, status TEXT, progress REAL, badge TEXT, PRIMARY KEY(learner_id, form));
CREATE TABLE IF NOT EXISTS fee_items(
  term_id TEXT NOT NULL REFERENCES terms(id) ON DELETE CASCADE, item TEXT NOT NULL, amount REAL NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all', PRIMARY KEY(term_id, item));
CREATE TABLE IF NOT EXISTS payments(
  id INTEGER PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE ON UPDATE CASCADE,
  term_id TEXT NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL, method TEXT, ref TEXT UNIQUE, note TEXT,
  recorded_by TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS notices(
  id INTEGER PRIMARY KEY, date TEXT NOT NULL, title TEXT NOT NULL, body TEXT, tag TEXT DEFAULT 'General',
  audience TEXT NOT NULL DEFAULT 'all', pinned INTEGER NOT NULL DEFAULT 0, created_by TEXT, created_at TEXT,
  demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS registrations(
  id INTEGER PRIMARY KEY, ref TEXT UNIQUE NOT NULL, parent_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
  relationship TEXT, address TEXT, learner_name TEXT NOT NULL, admission_no TEXT, form INTEGER, residence TEXT,
  message TEXT, status TEXT NOT NULL DEFAULT 'pending', learner_id TEXT, parent_id INTEGER, note TEXT,
  created_at TEXT, decided_at TEXT, decided_by TEXT, ip TEXT);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, subject TEXT NOT NULL, created_at TEXT, expires_at REAL,
  last_seen REAL, ip TEXT, ua TEXT);
CREATE TABLE IF NOT EXISTS audit(
  id INTEGER PRIMARY KEY, at TEXT NOT NULL, actor TEXT, action TEXT NOT NULL, target TEXT, detail TEXT, ip TEXT);
CREATE TABLE IF NOT EXISTS chats(
  id INTEGER PRIMARY KEY, at TEXT NOT NULL, kind TEXT, actor TEXT, learner_id TEXT, message TEXT, reply TEXT,
  source TEXT, helpful INTEGER);
CREATE TABLE IF NOT EXISTS devices(
  id TEXT PRIMARY KEY, kind TEXT, actor TEXT, platform TEXT, push_token TEXT, learner_ids TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS memory(
  scope TEXT NOT NULL, key TEXT NOT NULL, value TEXT, updated_at TEXT, updated_by TEXT, PRIMARY KEY(scope, key));
CREATE TABLE IF NOT EXISTS changes(
  id INTEGER PRIMARY KEY, at TEXT NOT NULL, type TEXT NOT NULL, learner_id TEXT, audience TEXT DEFAULT 'all',
  summary TEXT);
CREATE INDEX IF NOT EXISTS ix_att_date ON attendance(date);
CREATE INDEX IF NOT EXISTS ix_pay_learner ON payments(learner_id, term_id);
CREATE INDEX IF NOT EXISTS ix_audit_at ON audit(at);
CREATE INDEX IF NOT EXISTS ix_chats_at ON chats(at);
CREATE INDEX IF NOT EXISTS ix_guard_learner ON guardians(learner_id);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def connect(path: Path | str | None = None) -> sqlite3.Connection:
    c = sqlite3.connect(str(path or config.DB_PATH), timeout=30, check_same_thread=False)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.execute("PRAGMA busy_timeout=30000")
    return c


def rows(sql: str, args: tuple | list = ()) -> list[dict]:
    c = connect()
    try:
        return [dict(r) for r in c.execute(sql, args).fetchall()]
    finally:
        c.close()


def row(sql: str, args: tuple | list = ()) -> dict | None:
    r = rows(sql, args)
    return r[0] if r else None


def scalar(sql: str, args: tuple | list = (), default=None):
    c = connect()
    try:
        r = c.execute(sql, args).fetchone()
        return r[0] if r and r[0] is not None else default
    finally:
        c.close()


def get_meta(key: str, default: str | None = None, c: sqlite3.Connection | None = None) -> str | None:
    own = c is None
    c = c or connect()
    try:
        r = c.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return r[0] if r else default
    finally:
        if own:
            c.close()


def set_meta(c: sqlite3.Connection, key: str, value) -> None:
    c.execute("INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, str(value)))


def data_version() -> int:
    return int(get_meta("data_version", "0") or 0)


def on_write(fn) -> None:
    _listeners.append(fn)


@contextmanager
def tx(event: dict | None = None, *, real: bool = True):
    """Write transaction. `event` is published to the live dashboard after commit.
    `real=False` marks seed/demo writes, which do not count as the school's own data."""
    with WRITE_LOCK:
        c = connect()
        try:
            yield c
            v = int(get_meta("data_version", "0", c) or 0) + 1
            set_meta(c, "data_version", v)
            set_meta(c, "last_change_at", now_iso())
            if real:
                set_meta(c, "fresh", "0")
            c.commit()
        except Exception:
            c.rollback()
            raise
        finally:
            c.close()
    LAST_WRITE["at"] = time.time()
    if event:
        ev = {**event, "data_version": v, "at": now_iso()}
        for fn in list(_listeners):
            try:
                fn(ev)
            except Exception:
                pass


@contextmanager
def quiet():
    """Write that is activity, not school data (sign-ins, sessions, chat logs): no version bump,
    so it doesn't trigger a backup on its own. It still lands in the next backup."""
    with WRITE_LOCK:
        c = connect()
        try:
            yield c
            c.commit()
        except Exception:
            c.rollback()
            raise
        finally:
            c.close()


def audit(c: sqlite3.Connection, actor: str, action: str, target: str = "", detail="", ip: str = "") -> None:
    if not isinstance(detail, str):
        detail = json.dumps(detail, default=str)
    c.execute("INSERT INTO audit(at,actor,action,target,detail,ip) VALUES(?,?,?,?,?,?)",
              (now_iso(), actor, action, target, detail[:2000], ip))


def change(c: sqlite3.Connection, type_: str, summary: str, learner_id: str | None = None, audience: str = "all") -> None:
    """Feed for GET /api/v1/sync, which the portal and the app poll for updates."""
    c.execute("INSERT INTO changes(at,type,learner_id,audience,summary) VALUES(?,?,?,?,?)",
              (now_iso(), type_, learner_id, audience, summary[:300]))


DEFAULT_TRADES = [
    (1, "Bakery & Food Production"), (2, "Arc & Gas Welding"), (3, "Solar PV Installation"),
    (4, "Carpentry & Joinery"), (5, "Cosmetology & Design"),
]
DEFAULT_SUBJECTS = [
    ("MAT", "Mathematics", "Mr T. Gama"), ("ENG", "English Language", "Mrs C. Binda"), ("SHO", "ChiShona", "Mr K. Mutasa"),
    ("SCI", "Combined Science", "Ms J. Chikore"), ("CHE", "Chemistry", "Ms J. Chikore"), ("PHY", "Physics", "Mr R. Zhou"),
    ("BIO", "Biology", "Ms N. Hove"), ("CSC", "Computer Science", "Mr P. Ndlovu"), ("GEO", "Geography", "Mrs F. Dube"),
    ("HIS", "History", "Mr A. Sibanda"), ("HER", "Heritage Studies", "Mrs F. Dube"), ("ACC", "Principles of Accounts", "Mr S. Banda"),
]


def is_initialised(path: Path | None = None) -> bool:
    p = Path(path or config.DB_PATH)
    if not p.exists() or p.stat().st_size == 0:
        return False
    try:
        c = connect(p)
        try:
            return bool(c.execute("SELECT value FROM meta WHERE key='instance_id'").fetchone())
        finally:
            c.close()
    except sqlite3.DatabaseError:
        return False


def migrate(c: sqlite3.Connection | None = None) -> None:
    own = c is None
    c = c or connect()
    try:
        c.executescript(SCHEMA)
        c.execute("PRAGMA journal_mode=WAL")
        set_meta(c, "schema_version", SCHEMA_VERSION)
        c.commit()
    finally:
        if own:
            c.close()


def create_fresh() -> None:
    """A brand-new, empty school database (school settings and defaults only)."""
    with WRITE_LOCK:
        c = connect()
        try:
            c.executescript(SCHEMA)
            c.execute("PRAGMA journal_mode=WAL")
            for k, v in {"instance_id": uuid.uuid4().hex, "created_at": now_iso(), "data_version": 0,
                         "schema_version": SCHEMA_VERSION, "fresh": "1", "last_change_at": now_iso()}.items():
                set_meta(c, k, v)
            c.executemany("INSERT OR IGNORE INTO trades(form,trade) VALUES(?,?)", DEFAULT_TRADES)
            c.executemany("INSERT OR IGNORE INTO subjects(code,name,teacher) VALUES(?,?,?)", DEFAULT_SUBJECTS)
            c.commit()
        finally:
            c.close()
