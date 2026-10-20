"""Who is calling: portal users (parents, learners), staff, and the PC backup agent."""
from __future__ import annotations

import hmac
import time

from fastapi import Depends, HTTPException, Request

from . import config, db
from .security import new_token, token_hash

PERMS = {
    "owner": {"*"},
    "admin": {"learners", "parents", "registrations", "academics", "attendance", "timetable", "assignments", "fees",
              "notices", "kudzi", "memory", "backups", "audit", "settings"},
    "teacher": {"learners:read", "parents:read", "academics", "attendance", "timetable", "assignments", "notices", "kudzi"},
    "bursar": {"learners:read", "parents:read", "fees"},
}
ROLE_LABELS = {"owner": "Owner", "admin": "Administrator", "teacher": "Teacher", "bursar": "Bursar"}


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return (fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "")) or "?"


def bearer(request: Request) -> str:
    h = request.headers.get("authorization", "")
    return h[7:].strip() if h.lower().startswith("bearer ") else ""


def start_session(kind: str, subject: str, request: Request, hours: float) -> tuple[str, float]:
    tok = new_token()
    exp = time.time() + hours * 3600
    with db.quiet() as c:
        c.execute("INSERT INTO sessions(token_hash,kind,subject,created_at,expires_at,last_seen,ip,ua) VALUES(?,?,?,?,?,?,?,?)",
                  (token_hash(tok), kind, subject, db.now_iso(), exp, time.time(), client_ip(request),
                   request.headers.get("user-agent", "")[:200]))
        c.execute("DELETE FROM sessions WHERE expires_at < ?", (time.time(),))
    return tok, exp


def end_session(token: str) -> None:
    with db.quiet() as c:
        c.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(token),))


def _session(token: str) -> dict | None:
    if not token:
        return None
    s = db.row("SELECT * FROM sessions WHERE token_hash=? AND expires_at > ?", (token_hash(token), time.time()))
    if s and time.time() - (s["last_seen"] or 0) > 60:
        with db.quiet() as c:
            c.execute("UPDATE sessions SET last_seen=? WHERE token_hash=?", (time.time(), s["token_hash"]))
    return s


def portal_user_for(kind: str, subject: str) -> dict | None:
    if kind == "parent":
        p = db.row("SELECT * FROM parents WHERE id=? AND status='active'", (int(subject),))
        if not p:
            return None
        ids = [r["learner_id"] for r in db.rows(
            "SELECT g.learner_id FROM guardians g JOIN learners l ON l.id=g.learner_id WHERE g.parent_id=? AND l.status='active' ORDER BY g.rowid",
            (p["id"],))]
        return {"role": "parent", "name": p["name"], "students": ids, "id": f"parent:{p['id']}", "parent_id": p["id"],
                "phone": p["phone"], "password_is_phone": not p["pw_hash"]}
    if kind == "learner":
        L = db.row("SELECT * FROM learners WHERE id=? AND status='active'", (subject,))
        if not L:
            return None
        return {"role": "learner", "name": f"{L['first']} {L['last']}".strip(), "students": [L["id"]], "id": f"learner:{L['id']}",
                "password_is_phone": not L["pw_hash"]}
    if kind == "preview":                          # staff "open in portal" (read-only look at one learner)
        L = db.row("SELECT * FROM learners WHERE id=?", (subject,))
        if not L:
            return None
        return {"role": "parent", "name": "Staff preview", "students": [L["id"]], "id": f"preview:{L['id']}", "preview": True,
                "password_is_phone": False}
    return None


def portal_user(request: Request) -> dict:
    s = _session(bearer(request))
    u = portal_user_for(s["kind"], s["subject"]) if s else None
    if not u:
        raise HTTPException(401, "Please sign in again.")
    return u


def staff_for(username: str) -> dict | None:
    st = db.row("SELECT * FROM staff WHERE username=? AND active=1", (username,))
    if st:
        return st
    if username == "admin" and config.ADMIN_PASSWORD:
        return {"id": 0, "username": "admin", "name": "School administrator", "role": "owner", "active": 1}
    return None


def staff_user(request: Request) -> dict:
    s = _session(bearer(request))
    st = staff_for(s["subject"]) if s and s["kind"] == "staff" else None
    if not st:
        raise HTTPException(401, "Please sign in to the dashboard again.")
    return {**{k: st[k] for k in ("id", "username", "name", "role")}, "perms": sorted(PERMS.get(st["role"], set())),
            "ip": client_ip(request)}


def can(user: dict, perm: str) -> bool:
    have = PERMS.get(user["role"], set())
    base = perm.split(":")[0]
    return "*" in have or perm in have or base in have


def need(perm: str):
    def dep(user: dict = Depends(staff_user)) -> dict:
        if not can(user, perm):
            raise HTTPException(403, f"Your role ({ROLE_LABELS.get(user['role'], user['role'])}) can't do this.")
        return user
    return dep


def sync_or_staff(perm: str = "backups"):
    """The PC agent sends X-Sync-Key; people use their dashboard session."""
    def dep(request: Request) -> dict:
        key = request.headers.get("x-sync-key", "")
        if key and config.SYNC_KEY and hmac.compare_digest(key, config.SYNC_KEY):
            return {"id": -1, "username": "pc-sync", "name": "PC backup agent", "role": "owner", "perms": ["*"], "ip": client_ip(request)}
        user = staff_user(request)
        if not can(user, perm):
            raise HTTPException(403, "Your role can't manage backups.")
        return user
    return dep
