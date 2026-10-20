"""Dashboard API: /api/v1/admin/... (staff sign-in; backups also accept the PC agent's X-Sync-Key)."""
from __future__ import annotations

import csv
import hmac
import io
import json
import re
import secrets
import time
from datetime import date, datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from . import backup, config, db, kudzi, seed, views
from .auth import PERMS, ROLE_LABELS, can, client_ip, need, staff_for, staff_user, start_session, sync_or_staff
from .events import BROKER
from .security import (LOGIN_BY_ID, LOGIN_BY_IP, hash_password, norm_adm, norm_phone, pretty_phone, verify_password)

router = APIRouter(prefix="/api/v1/admin", tags=["dashboard"])
STARTED = time.time()


def _404(what: str = "Not found"):
    raise HTTPException(404, what)


# ───────────────────────────── sign-in ─────────────────────────────
class StaffLoginIn(BaseModel):
    username: str = Field(..., max_length=60)
    password: str = Field(..., max_length=200)


@router.get("/setup")
def setup_state():
    """Tells the sign-in page whether anyone can sign in yet."""
    has_staff = bool(db.scalar("SELECT COUNT(*) FROM staff WHERE active=1 AND pw_hash IS NOT NULL", default=0))
    return {"ready": bool(config.ADMIN_PASSWORD) or has_staff, "school": config.SCHOOL["name"], "version": config.VERSION}


@router.post("/login")
def staff_login(body: StaffLoginIn, request: Request):
    ip, key = client_ip(request), f"staff:{body.username.strip().lower()}"
    wait = max(LOGIN_BY_ID.blocked(key), LOGIN_BY_IP.blocked(ip))
    if wait:
        raise HTTPException(429, f"Too many attempts. Wait {max(1, round(wait / 60))} minutes.")
    uname = body.username.strip()
    st = db.row("SELECT * FROM staff WHERE username=? AND active=1", (uname,))
    ok = bool(st and st["pw_hash"] and verify_password(body.password, st["pw_hash"]))
    if not ok and uname.lower() == "admin" and config.ADMIN_PASSWORD:
        ok = hmac.compare_digest(body.password.encode(), config.ADMIN_PASSWORD.encode())
        uname = "admin"
    if not ok:
        LOGIN_BY_ID.fail(key)
        LOGIN_BY_IP.fail(ip)
        with db.quiet() as c:
            db.audit(c, uname[:40], "staff.login.failed", "", "", ip)
        BROKER.publish({"type": "login_failed", "summary": f"Failed dashboard sign-in for “{uname[:40]}”"})
        raise HTTPException(401, "Wrong username or password.")
    LOGIN_BY_ID.clear(key)
    uname = st["username"] if st else uname
    tok, exp = start_session("staff", uname, request, config.STAFF_SESSION_HOURS)
    with db.quiet() as c:
        c.execute("UPDATE staff SET last_login=? WHERE username=?", (db.now_iso(), uname))
        db.audit(c, f"staff:{uname}", "staff.login", "", "", ip)
    BROKER.publish({"type": "staff", "summary": f"{uname} opened the dashboard"})
    return {"token": tok, "expires_at": exp, "user": me_payload(staff_for(uname))}


def me_payload(st: dict) -> dict:
    return {"username": st["username"], "name": st["name"], "role": st["role"], "role_label": ROLE_LABELS.get(st["role"], st["role"]),
            "perms": sorted(PERMS.get(st["role"], set()))}


@router.get("/me")
def staff_me(user: dict = Depends(staff_user)):
    return me_payload(user)


@router.post("/logout", status_code=204)
def staff_logout(request: Request, user: dict = Depends(staff_user)):
    from .auth import bearer, end_session
    end_session(bearer(request))


class OwnPasswordIn(BaseModel):
    current: str
    new: str = Field(..., min_length=8, max_length=200)


@router.post("/me/password")
def staff_password(body: OwnPasswordIn, user: dict = Depends(staff_user)):
    st = db.row("SELECT * FROM staff WHERE username=?", (user["username"],))
    if not st:
        raise HTTPException(400, "The built-in admin account's password is the ADMIN_PASSWORD secret in the Space settings.")
    if not verify_password(body.current, st["pw_hash"]):
        raise HTTPException(400, "Your current password is not right.")
    with db.tx() as c:
        c.execute("UPDATE staff SET pw_hash=? WHERE id=?", (hash_password(body.new), st["id"]))
        db.audit(c, f"staff:{user['username']}", "staff.password", user["username"], "", user["ip"])
    return {"ok": True}


# ───────────────────────────── live ─────────────────────────────
@router.get("/events")
async def events(user: dict = Depends(staff_user)):
    return StreamingResponse(BROKER.stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})


def _series(sql: str, days: int = 14) -> list[dict]:
    start = date.today() - timedelta(days=days - 1)
    got = {r["d"]: r["n"] for r in db.rows(sql, (start.isoformat(),))}
    return [{"date": (start + timedelta(i)).isoformat(), "n": got.get((start + timedelta(i)).isoformat(), 0)} for i in range(days)]


@router.get("/overview")
def overview(user: dict = Depends(staff_user)):
    now = time.time()
    c = db.connect()
    try:
        term = views.current_term(c)
        fee_tot = {"invoiced": 0.0, "paid": 0.0, "outstanding": 0.0, "families_owing": 0}
        by_form: dict[int, dict] = {}
        if term:
            for L in c.execute("SELECT * FROM learners WHERE status='active'"):
                L = dict(L)
                f = views.fees(c, L)
                fee_tot["invoiced"] += f["invoiced"]
                fee_tot["paid"] += f["paid"]
                fee_tot["outstanding"] += f["balance"]
                fee_tot["families_owing"] += 1 if f["balance"] > 0 else 0
                b = by_form.setdefault(L["form"], {"form": L["form"], "learners": 0, "paid": 0.0, "outstanding": 0.0})
                b["learners"] += 1
                b["paid"] += f["paid"]
                b["outstanding"] += f["balance"]
        else:
            for r in c.execute("SELECT form, COUNT(*) n FROM learners WHERE status='active' GROUP BY form"):
                by_form[r["form"]] = {"form": r["form"], "learners": r["n"], "paid": 0, "outstanding": 0}
        today = db.today()
        att = {r["status"]: r["n"] for r in c.execute("SELECT status, COUNT(*) n FROM attendance WHERE date=? GROUP BY status", (today,))}
    finally:
        c.close()
    online = db.rows("SELECT kind, COUNT(*) n FROM sessions WHERE last_seen > ? AND expires_at > ? GROUP BY kind", (now - 900, now))
    return {
        "school": config.SCHOOL["name"], "term": term,
        "counts": {
            "learners": db.scalar("SELECT COUNT(*) FROM learners WHERE status='active'", default=0),
            "demo_learners": db.scalar("SELECT COUNT(*) FROM learners WHERE demo=1", default=0),
            "parents": db.scalar("SELECT COUNT(*) FROM parents WHERE status='active'", default=0),
            "parents_active_30d": db.scalar("SELECT COUNT(*) FROM parents WHERE last_login >= ?", ((date.today() - timedelta(30)).isoformat(),), 0),
            "pending_registrations": db.scalar("SELECT COUNT(*) FROM registrations WHERE status='pending'", default=0),
            "notices": db.scalar("SELECT COUNT(*) FROM notices", default=0),
            "chats_today": db.scalar("SELECT COUNT(*) FROM chats WHERE at >= ?", (today,), 0),
            "chats_helpful": db.scalar("SELECT COUNT(*) FROM chats WHERE helpful=1", default=0),
            "chats_unhelpful": db.scalar("SELECT COUNT(*) FROM chats WHERE helpful=0", default=0),
        },
        "online": {r["kind"]: r["n"] for r in online},
        "fees": {k: round(v, 2) for k, v in fee_tot.items()},
        "by_form": sorted(by_form.values(), key=lambda b: b["form"]),
        "attendance_today": att,
        "series": {
            "logins": _series("SELECT substr(at,1,10) d, COUNT(*) n FROM audit WHERE action='login' AND at >= ? GROUP BY d"),
            "chats": _series("SELECT substr(at,1,10) d, COUNT(*) n FROM chats WHERE at >= ? GROUP BY d"),
            "payments": _series("SELECT date d, ROUND(SUM(amount)) n FROM payments WHERE date >= ? GROUP BY d"),
        },
        "recent": db.rows("SELECT at, actor, action, target, detail FROM audit ORDER BY id DESC LIMIT 25"),
        "live": list(BROKER.recent)[:25],
        "backup": backup.status(),
        "system": {"version": config.VERSION, "uptime_s": int(now - STARTED), "kudzi_ai": config.KUDZI_LLM,
                   "kudzi_model": config.KUDZI_MODEL if config.KUDZI_LLM == "ollama" else None,
                   "portal_origins": config.PORTAL_ORIGINS, "listeners": len(BROKER.subs)},
    }


# ───────────────────────────── learners ─────────────────────────────
class LearnerIn(BaseModel):
    id: Optional[str] = Field(None, max_length=30, description="Admission number; generated if empty")
    first: str = Field(..., min_length=1, max_length=60)
    last: str = Field("", max_length=60)
    form: int = Field(..., ge=1, le=6)
    stream: Optional[str] = Field(None, max_length=30)
    house: Optional[str] = Field(None, max_length=40)
    residence: Optional[str] = Field("Boarder", max_length=20)
    hostel: Optional[str] = Field(None, max_length=40)
    class_teacher: Optional[str] = Field(None, max_length=60)
    gender: Optional[str] = Field(None, max_length=10)
    dob: Optional[str] = Field(None, max_length=10)
    status: Literal["active", "left", "suspended"] = "active"
    notes: Optional[str] = Field(None, max_length=2000)
    parent_name: Optional[str] = Field(None, max_length=120, description="Optional: add or link a parent at the same time")
    parent_phone: Optional[str] = Field(None, max_length=30)
    parent_email: Optional[str] = Field(None, max_length=160)
    relationship: Optional[str] = Field(None, max_length=40)


def next_admission_no(c) -> str:
    yy = date.today().year % 100
    rows = c.execute("SELECT id FROM learners WHERE id LIKE ?", (f"RCA-{yy:02d}-%",)).fetchall()
    n = max([int(m.group(1)) for r in rows if (m := re.match(rf"RCA-{yy:02d}-(\d+)$", r[0]))] or [0]) + 1
    return f"RCA-{yy:02d}-{n:04d}"


def _upsert_parent(c, name: str, phone: str, email: str | None, rel: str | None, demo: int = 0) -> int:
    p = norm_phone(phone)
    if len(p) < 9:
        raise HTTPException(400, f"“{phone}” is not a full phone number.")
    r = c.execute("SELECT id FROM parents WHERE phone=?", (p,)).fetchone()
    if r:
        c.execute("UPDATE parents SET name=COALESCE(NULLIF(?,''),name), email=COALESCE(NULLIF(?,''),email), "
                  "relationship=COALESCE(NULLIF(?,''),relationship) WHERE id=?", (name, email or "", rel or "", r[0]))
        return r[0]
    return c.execute("INSERT INTO parents(name,phone,email,relationship,demo,created_at) VALUES(?,?,?,?,?,?) RETURNING id",
                     (name or "Parent", p, email, rel, demo, db.now_iso())).fetchone()[0]


def learner_full(c, lid: str) -> dict:
    L = c.execute("SELECT * FROM learners WHERE id=?", (lid,)).fetchone()
    if not L:
        _404("Learner not found")
    L = dict(L)
    L.pop("pw_hash", None)
    has_pw = bool(c.execute("SELECT pw_hash FROM learners WHERE id=?", (lid,)).fetchone()[0])
    guardians = [dict(r) for r in c.execute(
        "SELECT p.id, p.name, p.phone, p.email, g.relationship, p.status, p.last_login, (p.pw_hash IS NOT NULL) own_password "
        "FROM guardians g JOIN parents p ON p.id=g.parent_id WHERE g.learner_id=? ORDER BY g.rowid", (lid,))]
    for g in guardians:
        g["phone_pretty"] = pretty_phone(g["phone"])
    raw_results = [dict(r) for r in c.execute(
        "SELECT r.*, t.label, t.published FROM results r JOIN terms t ON t.id=r.term_id WHERE r.learner_id=? ORDER BY t.starts, r.rowid", (lid,))]
    att = [dict(r) for r in c.execute("SELECT date, status, note FROM attendance WHERE learner_id=? ORDER BY date DESC LIMIT 60", (lid,))]
    pays = [dict(r) for r in c.execute("SELECT * FROM payments WHERE learner_id=? ORDER BY date DESC", (lid,))]
    return {**L, "own_password": has_pw, "summary": views.summary(c, L), "fees": views.fees(c, L), "skills": views.skills(c, L),
            "guardians": guardians, "results": raw_results, "attendance": att, "payments": pays,
            "chats": db.rows("SELECT at, kind, message, reply, source, helpful FROM chats WHERE learner_id=? ORDER BY id DESC LIMIT 20", (lid,))}


@router.get("/learners")
def learners(q: str = "", form: Optional[int] = None, status: str = "active", user: dict = Depends(need("learners:read"))):
    sql = ("SELECT l.id, l.first, l.last, l.form, l.stream, l.house, l.residence, l.status, l.demo, l.xp, l.last_login, "
           "(SELECT COUNT(*) FROM guardians g WHERE g.learner_id=l.id) guardians, "
           "(SELECT GROUP_CONCAT(p.phone) FROM guardians g JOIN parents p ON p.id=g.parent_id WHERE g.learner_id=l.id) phones "
           "FROM learners l WHERE 1=1")
    args: list = []
    if status != "all":
        sql += " AND l.status=?"
        args.append(status)
    if form:
        sql += " AND l.form=?"
        args.append(form)
    if q:
        sql += " AND (l.id LIKE ? OR l.first || ' ' || l.last LIKE ? OR l.stream LIKE ? OR phones LIKE ?)"
        args += [f"%{q}%"] * 3 + [f"%{norm_phone(q) or q}%"]
    sql += " ORDER BY l.form, l.last, l.first"
    out = db.rows(sql, args)
    c = db.connect()
    try:
        for r in out:
            if can(user, "fees"):
                L = dict(c.execute("SELECT * FROM learners WHERE id=?", (r["id"],)).fetchone())
                r["balance"] = views.fees(c, L)["balance"]
            r.pop("phones", None)
    finally:
        c.close()
    return out


@router.get("/learners/{lid}")
def learner(lid: str, user: dict = Depends(need("learners:read"))):
    c = db.connect()
    try:
        return learner_full(c, norm_adm(lid))
    finally:
        c.close()


@router.post("/learners", status_code=201)
def learner_create(body: LearnerIn, user: dict = Depends(need("learners"))):
    with db.tx({"type": "learner", "summary": f"Learner added: {body.first} {body.last}"}) as c:
        lid = norm_adm(body.id) if body.id else next_admission_no(c)
        if c.execute("SELECT 1 FROM learners WHERE id=?", (lid,)).fetchone():
            raise HTTPException(409, f"Admission number {lid} is already in use.")
        c.execute("INSERT INTO learners(id,first,last,form,stream,house,residence,hostel,class_teacher,gender,dob,status,notes,created_at,updated_at) "
                  "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                  (lid, body.first.strip(), body.last.strip(), body.form, body.stream, body.house, body.residence, body.hostel,
                   body.class_teacher, body.gender, body.dob, body.status, body.notes, db.now_iso(), db.now_iso()))
        if body.parent_phone:
            pid = _upsert_parent(c, body.parent_name or "Parent", body.parent_phone, body.parent_email, body.relationship)
            c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)", (pid, lid, body.relationship))
        db.audit(c, f"staff:{user['username']}", "learner.create", lid, f"{body.first} {body.last}", user["ip"])
    return learner(lid, user)


@router.put("/learners/{lid}")
def learner_update(lid: str, body: LearnerIn, user: dict = Depends(need("learners"))):
    lid = norm_adm(lid)
    new_id = norm_adm(body.id) if body.id else lid
    with db.tx({"type": "learner", "summary": f"Learner updated: {body.first} {body.last}", "learner_id": lid}) as c:
        if not c.execute("SELECT 1 FROM learners WHERE id=?", (lid,)).fetchone():
            _404("Learner not found")
        if new_id != lid and c.execute("SELECT 1 FROM learners WHERE id=?", (new_id,)).fetchone():
            raise HTTPException(409, f"Admission number {new_id} is already in use.")
        c.execute("UPDATE learners SET id=?, first=?, last=?, form=?, stream=?, house=?, residence=?, hostel=?, class_teacher=?, gender=?, dob=?, "
                  "status=?, notes=?, updated_at=? WHERE id=?",
                  (new_id, body.first.strip(), body.last.strip(), body.form, body.stream, body.house, body.residence, body.hostel,
                   body.class_teacher, body.gender, body.dob, body.status, body.notes, db.now_iso(), lid))
        if body.parent_phone:
            pid = _upsert_parent(c, body.parent_name or "Parent", body.parent_phone, body.parent_email, body.relationship)
            c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)", (pid, new_id, body.relationship))
        if body.status != "active":
            c.execute("DELETE FROM sessions WHERE kind='learner' AND subject=?", (lid,))
        db.audit(c, f"staff:{user['username']}", "learner.update", new_id, "", user["ip"])
    return learner(new_id, user)


@router.delete("/learners/{lid}")
def learner_delete(lid: str, hard: bool = False, user: dict = Depends(need("learners"))):
    lid = norm_adm(lid)
    if hard and user["role"] != "owner":
        raise HTTPException(403, "Only the owner can delete a learner's records permanently.")
    with db.tx({"type": "learner", "summary": f"Learner {'deleted' if hard else 'marked as left'}: {lid}"}) as c:
        if hard:
            c.execute("DELETE FROM learners WHERE id=?", (lid,))
        else:
            c.execute("UPDATE learners SET status='left', updated_at=? WHERE id=?", (db.now_iso(), lid))
        c.execute("DELETE FROM sessions WHERE kind='learner' AND subject=?", (lid,))
        db.audit(c, f"staff:{user['username']}", "learner.delete" if hard else "learner.left", lid, "", user["ip"])
    return {"ok": True}


@router.post("/learners/{lid}/reset-password")
def learner_reset(lid: str, user: dict = Depends(need("learners"))):
    lid = norm_adm(lid)
    with db.tx() as c:
        c.execute("UPDATE learners SET pw_hash=NULL WHERE id=?", (lid,))
        c.execute("DELETE FROM sessions WHERE kind='learner' AND subject=?", (lid,))
        db.audit(c, f"staff:{user['username']}", "learner.reset_password", lid, "", user["ip"])
    return {"ok": True, "message": "The learner signs in with their admission number and a parent's phone number again."}


class XpIn(BaseModel):
    xp: int = Field(0, ge=-5000, le=5000)
    merits: int = Field(0, ge=-50, le=50)
    demerits: int = Field(0, ge=-50, le=50)
    reason: str = Field("", max_length=200)


@router.post("/learners/{lid}/award")
def learner_award(lid: str, body: XpIn, user: dict = Depends(need("academics"))):
    lid = norm_adm(lid)
    xp = body.xp + body.merits * 50
    with db.tx({"type": "award", "summary": f"{lid}: {body.reason or 'award'}", "learner_id": lid}) as c:
        c.execute("UPDATE learners SET xp=MAX(0, xp+?), merits=MAX(0, merits+?), demerits=MAX(0, demerits+?) WHERE id=?",
                  (xp, body.merits, body.demerits, lid))
        if body.merits > 0:
            db.change(c, "award", f"Merit awarded: {body.reason or 'well done'}", lid)
        db.audit(c, f"staff:{user['username']}", "learner.award", lid, body.model_dump(), user["ip"])
    return {"ok": True}


class SkillIn(BaseModel):
    form: int
    trade: Optional[str] = None
    status: Literal["locked", "active", "done"]
    progress: float = Field(0, ge=0, le=1)
    badge: Optional[str] = None


@router.put("/learners/{lid}/skills")
def learner_skills(lid: str, body: list[SkillIn], user: dict = Depends(need("academics"))):
    lid = norm_adm(lid)
    with db.tx({"type": "skills", "summary": f"Skills updated for {lid}", "learner_id": lid}) as c:
        for s in body:
            c.execute("INSERT OR REPLACE INTO skills(learner_id,form,trade,status,progress,badge) VALUES(?,?,?,?,?,?)",
                      (lid, s.form, s.trade, s.status, s.progress, s.badge))
        db.change(c, "skills", "Skill tree progress updated", lid)
        db.audit(c, f"staff:{user['username']}", "learner.skills", lid, "", user["ip"])
    return {"ok": True}


@router.post("/learners/{lid}/preview")
def learner_preview(lid: str, request: Request, user: dict = Depends(need("learners:read"))):
    """A one-hour read-only portal session, to see exactly what the family sees."""
    lid = norm_adm(lid)
    if not db.row("SELECT 1 FROM learners WHERE id=?", (lid,)):
        _404("Learner not found")
    tok, _ = start_session("preview", lid, request, 1)
    with db.quiet() as c:
        db.audit(c, f"staff:{user['username']}", "learner.preview", lid, "", user["ip"])
    portal = (db.row("SELECT value FROM memory WHERE scope='settings' AND key='portal_url'") or {}).get("value") \
        or "https://royalcrestzw.vercel.app/portal/"
    return {"token": tok, "portal_url": portal}


# ───────────────────────────── parents ─────────────────────────────
class ParentIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., max_length=30)
    email: Optional[str] = Field(None, max_length=160)
    relationship: Optional[str] = Field(None, max_length=40)
    address: Optional[str] = Field(None, max_length=300)
    status: Literal["active", "disabled"] = "active"
    learner_ids: list[str] = []


@router.get("/parents")
def parents(q: str = "", user: dict = Depends(need("parents:read"))):
    sql = ("SELECT p.id, p.name, p.phone, p.email, p.relationship, p.status, p.demo, p.last_login, p.created_at, (p.pw_hash IS NOT NULL) own_password, "
           "(SELECT GROUP_CONCAT(g.learner_id) FROM guardians g WHERE g.parent_id=p.id) learners FROM parents p")
    args: list = []
    if q:
        sql += " WHERE p.name LIKE ? OR p.phone LIKE ? OR p.email LIKE ? OR learners LIKE ?"
        args = [f"%{q}%", f"%{norm_phone(q) or q}%", f"%{q}%", f"%{q.upper()}%"]
    out = db.rows(sql + " ORDER BY p.name", args)
    for p in out:
        p["phone_pretty"] = pretty_phone(p["phone"])
        p["learners"] = (p["learners"] or "").split(",") if p["learners"] else []
    return out


@router.post("/parents", status_code=201)
def parent_create(body: ParentIn, user: dict = Depends(need("parents"))):
    with db.tx({"type": "parent", "summary": f"Parent added: {body.name}"}) as c:
        if c.execute("SELECT 1 FROM parents WHERE phone=?", (norm_phone(body.phone),)).fetchone():
            raise HTTPException(409, "A parent with that phone number already exists.")
        pid = _upsert_parent(c, body.name, body.phone, body.email, body.relationship)
        c.execute("UPDATE parents SET address=?, status=? WHERE id=?", (body.address, body.status, pid))
        for lid in body.learner_ids:
            if c.execute("SELECT 1 FROM learners WHERE id=?", (norm_adm(lid),)).fetchone():
                c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)", (pid, norm_adm(lid), body.relationship))
        db.audit(c, f"staff:{user['username']}", "parent.create", str(pid), body.name, user["ip"])
    return {"id": pid}


@router.put("/parents/{pid}")
def parent_update(pid: int, body: ParentIn, user: dict = Depends(need("parents"))):
    with db.tx({"type": "parent", "summary": f"Parent updated: {body.name}"}) as c:
        other = c.execute("SELECT id FROM parents WHERE phone=? AND id<>?", (norm_phone(body.phone), pid)).fetchone()
        if other:
            raise HTTPException(409, "Another parent already has that phone number.")
        old = c.execute("SELECT phone FROM parents WHERE id=?", (pid,)).fetchone()
        if not old:
            _404("Parent not found")
        c.execute("UPDATE parents SET name=?, phone=?, email=?, relationship=?, address=?, status=? WHERE id=?",
                  (body.name, norm_phone(body.phone), body.email, body.relationship, body.address, body.status, pid))
        if body.status != "active" or old[0] != norm_phone(body.phone):
            c.execute("DELETE FROM sessions WHERE kind='parent' AND subject=?", (str(pid),))
        c.execute("DELETE FROM guardians WHERE parent_id=?", (pid,))
        for lid in body.learner_ids:
            if c.execute("SELECT 1 FROM learners WHERE id=?", (norm_adm(lid),)).fetchone():
                c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)", (pid, norm_adm(lid), body.relationship))
        db.audit(c, f"staff:{user['username']}", "parent.update", str(pid), body.name, user["ip"])
    return {"ok": True}


@router.delete("/parents/{pid}")
def parent_delete(pid: int, user: dict = Depends(need("parents"))):
    with db.tx({"type": "parent", "summary": "Parent removed"}) as c:
        c.execute("DELETE FROM sessions WHERE kind='parent' AND subject=?", (str(pid),))
        c.execute("DELETE FROM parents WHERE id=?", (pid,))
        db.audit(c, f"staff:{user['username']}", "parent.delete", str(pid), "", user["ip"])
    return {"ok": True}


@router.post("/parents/{pid}/reset-password")
def parent_reset(pid: int, user: dict = Depends(need("parents"))):
    with db.tx() as c:
        c.execute("UPDATE parents SET pw_hash=NULL WHERE id=?", (pid,))
        c.execute("DELETE FROM sessions WHERE kind='parent' AND subject=?", (str(pid),))
        db.audit(c, f"staff:{user['username']}", "parent.reset_password", str(pid), "", user["ip"])
    return {"ok": True, "message": "Their password is their phone number again."}


# ───────────────────────────── registrations ─────────────────────────────
@router.get("/registrations")
def registrations(status: str = "pending", user: dict = Depends(need("registrations"))):
    rs = db.rows("SELECT * FROM registrations" + ("" if status == "all" else " WHERE status=?") + " ORDER BY id DESC LIMIT 300",
                 () if status == "all" else (status,))
    for r in rs:
        r["phone_pretty"] = pretty_phone(r["phone"])
        matches = []
        if r["admission_no"]:
            matches += db.rows("SELECT id, first, last, form, stream FROM learners WHERE id=?", (r["admission_no"],))
        parts = r["learner_name"].split()
        if parts:
            matches += db.rows("SELECT id, first, last, form, stream FROM learners WHERE (first LIKE ? AND last LIKE ?) OR (first || ' ' || last LIKE ?) LIMIT 5",
                               (f"%{parts[0]}%", f"%{parts[-1]}%", f"%{r['learner_name']}%"))
        seen, uniq = set(), []
        for m in matches:
            if m["id"] not in seen:
                seen.add(m["id"])
                uniq.append(m)
        r["matches"] = uniq
        r["existing_parent"] = db.row("SELECT id, name FROM parents WHERE phone=?", (r["phone"],))
    return rs


class ApproveIn(BaseModel):
    learner_id: Optional[str] = Field(None, description="Link to this existing learner; empty = create a new learner")
    first: Optional[str] = None
    last: Optional[str] = None
    form: Optional[int] = Field(None, ge=1, le=6)
    stream: Optional[str] = None
    residence: Optional[str] = None
    note: Optional[str] = Field(None, max_length=500)


@router.post("/registrations/{rid}/approve")
def registration_approve(rid: int, body: ApproveIn, user: dict = Depends(need("registrations"))):
    r = db.row("SELECT * FROM registrations WHERE id=?", (rid,))
    if not r:
        _404("Registration not found")
    if r["status"] != "pending":
        raise HTTPException(409, f"This registration is already {r['status']}.")
    with db.tx({"type": "registration", "summary": f"Registration {r['ref']} approved"}) as c:
        if body.learner_id:
            lid = norm_adm(body.learner_id)
            if not c.execute("SELECT 1 FROM learners WHERE id=?", (lid,)).fetchone():
                _404(f"No learner {lid}")
        else:
            parts = r["learner_name"].split()
            first = body.first or (parts[0] if parts else r["learner_name"])
            last = body.last if body.last is not None else " ".join(parts[1:])
            lid = next_admission_no(c)
            c.execute("INSERT INTO learners(id,first,last,form,stream,residence,status,created_at,updated_at) VALUES(?,?,?,?,?,?, 'active', ?, ?)",
                      (lid, first, last, body.form or r["form"] or 1, body.stream, body.residence or r["residence"] or "Boarder",
                       db.now_iso(), db.now_iso()))
        pid = _upsert_parent(c, r["parent_name"], r["phone"], r["email"], r["relationship"])
        c.execute("UPDATE parents SET address=COALESCE(address, ?) WHERE id=?", (r["address"], pid))
        c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)", (pid, lid, r["relationship"]))
        c.execute("UPDATE registrations SET status='approved', learner_id=?, parent_id=?, note=?, decided_at=?, decided_by=? WHERE id=?",
                  (lid, pid, body.note, db.now_iso(), user["username"], rid))
        c.execute("INSERT INTO notices(date,title,body,tag,audience,created_by,created_at) VALUES(?,?,?,?,?,?,?)",
                  (db.today(), "Welcome to Crest Quest", f"Your registration {r['ref']} is approved. You can now follow {r['learner_name']}'s "
                   "marks, attendance, homework and fees here, and ask Kudzi anything.", "Welcome", f"learner:{lid}", user["username"], db.now_iso()))
        db.audit(c, f"staff:{user['username']}", "registration.approve", r["ref"], f"{lid} / parent {pid}", user["ip"])
    return {"ok": True, "learner_id": lid, "parent_id": pid,
            "sign_in": {"username": lid, "password": f"the parent's phone number ({pretty_phone(r['phone'])})"}}


class RejectIn(BaseModel):
    note: str = Field("", max_length=500)


@router.post("/registrations/{rid}/reject")
def registration_reject(rid: int, body: RejectIn, user: dict = Depends(need("registrations"))):
    with db.tx({"type": "registration", "summary": "Registration declined"}) as c:
        n = c.execute("UPDATE registrations SET status='rejected', note=?, decided_at=?, decided_by=? WHERE id=? AND status='pending'",
                      (body.note, db.now_iso(), user["username"], rid)).rowcount
        if not n:
            raise HTTPException(409, "Only pending registrations can be declined.")
        db.audit(c, f"staff:{user['username']}", "registration.reject", str(rid), body.note, user["ip"])
    return {"ok": True}


# ───────────────────────────── academics ─────────────────────────────
class TermIn(BaseModel):
    id: str = Field(..., pattern=r"^[A-Za-z0-9\-]{2,20}$")
    label: str = Field(..., max_length=60)
    starts: Optional[str] = None
    ends: Optional[str] = None
    fees_due: Optional[str] = None
    published: bool = False
    current: bool = False


@router.get("/terms")
def terms(user: dict = Depends(staff_user)):
    return db.rows("SELECT t.*, (SELECT COUNT(*) FROM results r WHERE r.term_id=t.id) results FROM terms t ORDER BY starts DESC, id DESC")


@router.put("/terms/{tid}")
def term_put(tid: str, body: TermIn, user: dict = Depends(need("academics"))):
    old = db.row("SELECT * FROM terms WHERE id=?", (tid,))
    with db.tx({"type": "term", "summary": f"Term saved: {body.label}"}) as c:
        if body.current:
            c.execute("UPDATE terms SET current=0")
        c.execute("INSERT INTO terms(id,label,starts,ends,fees_due,published,current) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET "
                  "label=excluded.label, starts=excluded.starts, ends=excluded.ends, fees_due=excluded.fees_due, published=excluded.published, "
                  "current=excluded.current", (tid, body.label, body.starts, body.ends, body.fees_due, int(body.published), int(body.current)))
        if body.published and not (old and old["published"]):
            db.change(c, "results", f"{body.label} results are published")
            c.execute("INSERT INTO notices(date,title,body,tag,audience,created_by,created_at) VALUES(?,?,?,?, 'all', ?, ?)",
                      (db.today(), f"{body.label} results published", "Results are now available in the Results tab. Ask Kudzi for a summary.",
                       "Academics", user["username"], db.now_iso()))
        db.audit(c, f"staff:{user['username']}", "term.save", tid, body.model_dump(), user["ip"])
    return {"ok": True}


@router.delete("/terms/{tid}")
def term_delete(tid: str, user: dict = Depends(need("academics"))):
    if user["role"] not in ("owner", "admin"):
        raise HTTPException(403, "Only administrators can delete a term.")
    with db.tx({"type": "term", "summary": f"Term deleted: {tid}"}) as c:
        c.execute("DELETE FROM terms WHERE id=?", (tid,))
        db.audit(c, f"staff:{user['username']}", "term.delete", tid, "", user["ip"])
    return {"ok": True}


class SubjectIn(BaseModel):
    code: str = Field(..., pattern=r"^[A-Za-z0-9]{2,8}$")
    name: str = Field(..., max_length=60)
    teacher: Optional[str] = Field(None, max_length=60)


@router.get("/subjects")
def subjects(user: dict = Depends(staff_user)):
    return db.rows("SELECT * FROM subjects ORDER BY name")


@router.put("/subjects")
def subjects_put(body: list[SubjectIn], user: dict = Depends(need("academics"))):
    with db.tx({"type": "subjects", "summary": "Subjects updated"}) as c:
        for s in body:
            c.execute("INSERT INTO subjects(code,name,teacher) VALUES(?,?,?) ON CONFLICT(code) DO UPDATE SET name=excluded.name, teacher=excluded.teacher",
                      (s.code.upper(), s.name, s.teacher))
        db.audit(c, f"staff:{user['username']}", "subjects.save", "", f"{len(body)} subjects", user["ip"])
    return {"ok": True}


def _class_learners(c, stream: str | None, form: int | None) -> list[dict]:
    if stream:
        return [dict(r) for r in c.execute("SELECT * FROM learners WHERE status='active' AND COALESCE(stream, 'Form '||form)=? ORDER BY last, first", (stream,))]
    if form:
        return [dict(r) for r in c.execute("SELECT * FROM learners WHERE status='active' AND form=? ORDER BY last, first", (form,))]
    return [dict(r) for r in c.execute("SELECT * FROM learners WHERE status='active' ORDER BY form, last, first")]


@router.get("/classes")
def classes(user: dict = Depends(staff_user)):
    return db.rows("SELECT form, COALESCE(stream, 'Form '||form) stream, COUNT(*) n FROM learners WHERE status='active' GROUP BY form, 2 ORDER BY form, 2")


@router.get("/results")
def results_grid(term: str, code: str, stream: Optional[str] = None, form: Optional[int] = None, user: dict = Depends(need("academics"))):
    c = db.connect()
    try:
        ls = _class_learners(c, stream, form)
        got = {r["learner_id"]: dict(r) for r in c.execute("SELECT * FROM results WHERE term_id=? AND code=?", (term, code.upper()))}
    finally:
        c.close()
    return [{"learner_id": L["id"], "name": f"{L['first']} {L['last']}".strip(), "stream": L["stream"],
             "ca": (got.get(L["id"]) or {}).get("ca"), "exam": (got.get(L["id"]) or {}).get("exam"),
             "comment": (got.get(L["id"]) or {}).get("comment") or ""} for L in ls]


class MarkIn(BaseModel):
    learner_id: str
    code: Optional[str] = None
    ca: Optional[float] = Field(None, ge=0, le=40)
    exam: Optional[float] = Field(None, ge=0, le=60)
    comment: Optional[str] = Field(None, max_length=300)


class MarksIn(BaseModel):
    term: str
    code: Optional[str] = None
    teacher: Optional[str] = None
    rows: list[MarkIn]


@router.put("/results")
def results_save(body: MarksIn, user: dict = Depends(need("academics"))):
    if not db.row("SELECT 1 FROM terms WHERE id=?", (body.term,)):
        _404("Unknown term")
    n = 0
    with db.tx({"type": "results", "summary": f"Marks saved ({body.code or 'several subjects'}, {body.term})"}) as c:
        for m in body.rows:
            code = (m.code or body.code or "").upper()
            s = c.execute("SELECT * FROM subjects WHERE code=?", (code,)).fetchone()
            if not s:
                raise HTTPException(400, f"Unknown subject code {code}. Add it under Academics → Subjects first.")
            if m.ca is None and m.exam is None and not m.comment:
                c.execute("DELETE FROM results WHERE learner_id=? AND term_id=? AND code=?", (norm_adm(m.learner_id), body.term, code))
                continue
            c.execute("INSERT INTO results(learner_id,term_id,code,name,teacher,ca,exam,comment,updated_at) VALUES(?,?,?,?,?,?,?,?,?) "
                      "ON CONFLICT(learner_id,term_id,code) DO UPDATE SET ca=excluded.ca, exam=excluded.exam, comment=excluded.comment, "
                      "teacher=COALESCE(excluded.teacher, teacher), updated_at=excluded.updated_at",
                      (norm_adm(m.learner_id), body.term, code, s["name"], body.teacher or s["teacher"], m.ca, m.exam, m.comment, db.now_iso()))
            n += 1
        db.audit(c, f"staff:{user['username']}", "results.save", body.term, f"{n} marks · {body.code or 'mixed'}", user["ip"])
    return {"saved": n}


# ───────────────────────────── attendance ─────────────────────────────
@router.get("/attendance")
def attendance_register(day: str, stream: Optional[str] = None, form: Optional[int] = None, user: dict = Depends(need("attendance"))):
    c = db.connect()
    try:
        ls = _class_learners(c, stream, form)
        got = {r["learner_id"]: dict(r) for r in c.execute("SELECT * FROM attendance WHERE date=?", (day,))}
    finally:
        c.close()
    return [{"learner_id": L["id"], "name": f"{L['first']} {L['last']}".strip(), "stream": L["stream"],
             "status": (got.get(L["id"]) or {}).get("status"), "note": (got.get(L["id"]) or {}).get("note") or ""} for L in ls]


class AttIn(BaseModel):
    learner_id: str
    status: Optional[Literal["present", "late", "absent", "excused"]] = None
    note: Optional[str] = Field(None, max_length=200)


class RegisterIn(BaseModel):
    day: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    entries: list[AttIn]


@router.put("/attendance")
def attendance_save(body: RegisterIn, user: dict = Depends(need("attendance"))):
    n = 0
    with db.tx({"type": "attendance", "summary": f"Register saved for {body.day}"}) as c:
        for e in body.entries:
            lid = norm_adm(e.learner_id)
            if not e.status:
                c.execute("DELETE FROM attendance WHERE learner_id=? AND date=?", (lid, body.day))
                continue
            prev = c.execute("SELECT status FROM attendance WHERE learner_id=? AND date=?", (lid, body.day)).fetchone()
            c.execute("INSERT OR REPLACE INTO attendance(learner_id,date,status,note) VALUES(?,?,?,?)", (lid, body.day, e.status, e.note))
            if e.status == "absent" and (not prev or prev[0] != "absent"):
                db.change(c, "attendance", f"Marked absent on {body.day}" + (f": {e.note}" if e.note else ""), lid)
            n += 1
        db.audit(c, f"staff:{user['username']}", "attendance.save", body.day, f"{n} entries", user["ip"])
    return {"saved": n}


# ───────────────────────────── timetable ─────────────────────────────
class CellIn(BaseModel):
    day: Literal["Mon", "Tue", "Wed", "Thu", "Fri"]
    start: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    code: Optional[str] = None
    subject: Optional[str] = None
    teacher: Optional[str] = None
    room: Optional[str] = None


class TimetableIn(BaseModel):
    cls: str = Field(..., alias="class")
    cells: list[CellIn]


@router.get("/timetable")
def timetable_get(cls: str, user: dict = Depends(staff_user)):
    return db.rows("SELECT * FROM timetable WHERE class=? ORDER BY start, day", (cls,))


@router.put("/timetable")
def timetable_put(body: TimetableIn, user: dict = Depends(need("timetable"))):
    with db.tx({"type": "timetable", "summary": f"Timetable saved for {body.cls}"}) as c:
        c.execute("DELETE FROM timetable WHERE class=?", (body.cls,))
        for x in body.cells:
            if x.subject or x.code:
                s = c.execute("SELECT * FROM subjects WHERE code=?", ((x.code or "").upper(),)).fetchone()
                c.execute("INSERT OR REPLACE INTO timetable(class,day,start,code,subject,teacher,room) VALUES(?,?,?,?,?,?,?)",
                          (body.cls, x.day, x.start, (x.code or "").upper() or None, x.subject or (s["name"] if s else x.code),
                           x.teacher or (s["teacher"] if s else None), x.room))
        db.change(c, "timetable", f"Timetable updated for {body.cls}")
        db.audit(c, f"staff:{user['username']}", "timetable.save", body.cls, f"{len(body.cells)} cells", user["ip"])
    return {"ok": True}


# ───────────────────────────── homework ─────────────────────────────
class AssignmentIn(BaseModel):
    form: int = Field(..., ge=1, le=6)
    stream: Optional[str] = None
    subject: str = Field(..., max_length=60)
    title: str = Field(..., max_length=200)
    details: Optional[str] = Field(None, max_length=2000)
    due: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")


@router.get("/assignments")
def assignments(form: Optional[int] = None, user: dict = Depends(need("assignments"))):
    sql = ("SELECT a.*, (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id=a.id) submitted, "
           "(SELECT COUNT(*) FROM learners l WHERE l.status='active' AND l.form=a.form AND (a.stream IS NULL OR a.stream='' OR l.stream=a.stream)) learners "
           "FROM assignments a")
    return db.rows(sql + (" WHERE a.form=?" if form else "") + " ORDER BY a.due DESC LIMIT 300", (form,) if form else ())


@router.post("/assignments", status_code=201)
def assignment_create(body: AssignmentIn, user: dict = Depends(need("assignments"))):
    with db.tx({"type": "homework", "summary": f"Homework set: {body.subject}, {body.title}"}) as c:
        aid = c.execute("INSERT INTO assignments(form,stream,subject,title,details,due,created_by,created_at) VALUES(?,?,?,?,?,?,?,?) RETURNING id",
                        (body.form, body.stream or None, body.subject, body.title, body.details, body.due, user["username"], db.now_iso())).fetchone()[0]
        db.change(c, "homework", f"New homework: {body.subject}, {body.title} (due {body.due})", None, f"form:{body.form}")
        db.audit(c, f"staff:{user['username']}", "assignment.create", str(aid), body.title, user["ip"])
    return {"id": aid}


@router.put("/assignments/{aid}")
def assignment_update(aid: int, body: AssignmentIn, user: dict = Depends(need("assignments"))):
    with db.tx({"type": "homework", "summary": f"Homework updated: {body.title}"}) as c:
        c.execute("UPDATE assignments SET form=?, stream=?, subject=?, title=?, details=?, due=? WHERE id=?",
                  (body.form, body.stream or None, body.subject, body.title, body.details, body.due, aid))
        db.audit(c, f"staff:{user['username']}", "assignment.update", str(aid), body.title, user["ip"])
    return {"ok": True}


@router.delete("/assignments/{aid}")
def assignment_delete(aid: int, user: dict = Depends(need("assignments"))):
    with db.tx({"type": "homework", "summary": "Homework removed"}) as c:
        c.execute("DELETE FROM assignments WHERE id=?", (aid,))
        db.audit(c, f"staff:{user['username']}", "assignment.delete", str(aid), "", user["ip"])
    return {"ok": True}


@router.get("/assignments/{aid}/submissions")
def submissions(aid: int, user: dict = Depends(need("assignments"))):
    a = db.row("SELECT * FROM assignments WHERE id=?", (aid,))
    if not a:
        _404()
    c = db.connect()
    try:
        ls = [L for L in _class_learners(c, None, a["form"]) if not a["stream"] or L["stream"] == a["stream"]]
        got = {r["learner_id"]: r["status"] for r in c.execute("SELECT * FROM submissions WHERE assignment_id=?", (aid,))}
    finally:
        c.close()
    return [{"learner_id": L["id"], "name": f"{L['first']} {L['last']}".strip(), "status": got.get(L["id"], "pending")} for L in ls]


class SubIn(BaseModel):
    learner_id: str
    status: Literal["pending", "submitted", "marked", "late"]


@router.put("/assignments/{aid}/submissions")
def submissions_put(aid: int, body: list[SubIn], user: dict = Depends(need("assignments"))):
    with db.tx({"type": "homework", "summary": "Homework ticked off"}) as c:
        for s in body:
            if s.status == "pending":
                c.execute("DELETE FROM submissions WHERE assignment_id=? AND learner_id=?", (aid, norm_adm(s.learner_id)))
            else:
                c.execute("INSERT OR REPLACE INTO submissions(assignment_id,learner_id,status) VALUES(?,?,?)", (aid, norm_adm(s.learner_id), s.status))
        db.audit(c, f"staff:{user['username']}", "submissions.save", str(aid), f"{len(body)}", user["ip"])
    return {"ok": True}


@router.get("/trades")
def trades(user: dict = Depends(staff_user)):
    return db.rows("SELECT * FROM trades ORDER BY form")


class TradeIn(BaseModel):
    form: int = Field(..., ge=1, le=6)
    trade: str = Field(..., max_length=60)


@router.put("/trades")
def trades_put(body: list[TradeIn], user: dict = Depends(need("academics"))):
    with db.tx({"type": "skills", "summary": "Skill tree trades updated"}) as c:
        for t in body:
            c.execute("INSERT OR REPLACE INTO trades(form,trade) VALUES(?,?)", (t.form, t.trade))
        db.audit(c, f"staff:{user['username']}", "trades.save", "", "", user["ip"])
    return {"ok": True}


# ───────────────────────────── fees ─────────────────────────────
class FeeItemIn(BaseModel):
    item: str = Field(..., max_length=80)
    amount: float = Field(..., ge=0, le=100000)
    applies_to: Literal["all", "boarder", "day"] = "all"


class FeeStructureIn(BaseModel):
    term: str
    items: list[FeeItemIn]


@router.get("/fees/structure")
def fee_structure(term: Optional[str] = None, user: dict = Depends(need("fees"))):
    c = db.connect()
    try:
        tid = term or (views.current_term(c) or {}).get("id")
    finally:
        c.close()
    return {"term": tid, "items": db.rows("SELECT item, amount, applies_to FROM fee_items WHERE term_id=? ORDER BY rowid", (tid,))}


@router.put("/fees/structure")
def fee_structure_put(body: FeeStructureIn, user: dict = Depends(need("fees"))):
    with db.tx({"type": "fees", "summary": f"Fee structure saved for {body.term}"}) as c:
        c.execute("DELETE FROM fee_items WHERE term_id=?", (body.term,))
        for i in body.items:
            c.execute("INSERT INTO fee_items(term_id,item,amount,applies_to) VALUES(?,?,?,?)", (body.term, i.item, i.amount, i.applies_to))
        db.change(c, "fees", "Fee statement updated", None, "parents")
        db.audit(c, f"staff:{user['username']}", "fees.structure", body.term, f"{len(body.items)} items", user["ip"])
    return {"ok": True}


@router.get("/fees/balances")
def fee_balances(stream: Optional[str] = None, form: Optional[int] = None, owing: bool = False, user: dict = Depends(need("fees"))):
    c = db.connect()
    try:
        out = []
        for L in _class_learners(c, stream, form):
            f = views.fees(c, L)
            if owing and f["balance"] <= 0:
                continue
            phones = [pretty_phone(r[0]) for r in c.execute("SELECT p.phone FROM guardians g JOIN parents p ON p.id=g.parent_id WHERE g.learner_id=?", (L["id"],))]
            out.append({"learner_id": L["id"], "name": f"{L['first']} {L['last']}".strip(), "form": L["form"], "stream": L["stream"],
                        "residence": L["residence"], "invoiced": f["invoiced"], "paid": f["paid"], "balance": f["balance"], "phones": phones})
        return out
    finally:
        c.close()


class PaymentIn(BaseModel):
    learner_id: str
    amount: float = Field(..., gt=0, le=100000)
    date: str = Field(default_factory=db.today, pattern=r"^\d{4}-\d{2}-\d{2}$")
    method: str = Field("Cash", max_length=40)
    ref: Optional[str] = Field(None, max_length=40)
    note: Optional[str] = Field(None, max_length=300)
    term: Optional[str] = None


@router.get("/payments")
def payments(learner_id: Optional[str] = None, limit: int = 200, user: dict = Depends(need("fees"))):
    sql = "SELECT p.*, l.first || ' ' || l.last AS name FROM payments p LEFT JOIN learners l ON l.id=p.learner_id"
    args: list = []
    if learner_id:
        sql += " WHERE p.learner_id=?"
        args.append(norm_adm(learner_id))
    return db.rows(sql + " ORDER BY p.date DESC, p.id DESC LIMIT ?", args + [min(limit, 2000)])


@router.post("/payments", status_code=201)
def payment_create(body: PaymentIn, user: dict = Depends(need("fees"))):
    lid = norm_adm(body.learner_id)
    with db.tx({"type": "payment", "summary": f"Payment US${body.amount:g} for {lid}", "learner_id": lid}) as c:
        L = c.execute("SELECT * FROM learners WHERE id=?", (lid,)).fetchone()
        if not L:
            _404("Learner not found")
        term = body.term or (views.current_term(c) or {}).get("id")
        if not term:
            raise HTTPException(400, "Set up a term first (Academics → Terms).")
        ref = body.ref or f"RC-{datetime.now(timezone.utc).strftime('%y%m%d')}-{secrets.token_hex(2).upper()}"
        if c.execute("SELECT 1 FROM payments WHERE ref=?", (ref,)).fetchone():
            raise HTTPException(409, f"Receipt {ref} is already recorded.")
        pid = c.execute("INSERT INTO payments(learner_id,term_id,amount,date,method,ref,note,recorded_by,created_at) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id",
                        (lid, term, body.amount, body.date, body.method, ref, body.note, user["username"], db.now_iso())).fetchone()[0]
        db.change(c, "payment", f"Payment of US${body.amount:g} received (receipt {ref}). Thank you!", lid)
        db.audit(c, f"staff:{user['username']}", "payment.create", ref, f"{lid} US${body.amount:g} {body.method}", user["ip"])
    return {"id": pid, "ref": ref}


@router.delete("/payments/{pid}")
def payment_delete(pid: int, user: dict = Depends(need("fees"))):
    if user["role"] not in ("owner", "admin", "bursar"):
        raise HTTPException(403, "Only the bursar or an administrator can remove a payment.")
    with db.tx({"type": "payment", "summary": "Payment removed"}) as c:
        p = c.execute("SELECT * FROM payments WHERE id=?", (pid,)).fetchone()
        if not p:
            _404()
        c.execute("DELETE FROM payments WHERE id=?", (pid,))
        db.audit(c, f"staff:{user['username']}", "payment.delete", p["ref"], f"{p['learner_id']} US${p['amount']:g}", user["ip"])
    return {"ok": True}


# ───────────────────────────── notices ─────────────────────────────
class NoticeIn(BaseModel):
    title: str = Field(..., max_length=140)
    body: str = Field("", max_length=4000)
    tag: str = Field("General", max_length=30)
    audience: str = Field("all", pattern=r"^(all|parents|learners|form:[1-6]|learner:[A-Za-z0-9\-]{2,30})$")
    pinned: bool = False
    date: Optional[str] = None


@router.get("/notices")
def notices(user: dict = Depends(staff_user)):
    return db.rows("SELECT * FROM notices ORDER BY pinned DESC, date DESC, id DESC LIMIT 300")


@router.post("/notices", status_code=201)
def notice_create(body: NoticeIn, user: dict = Depends(need("notices"))):
    aud = body.audience if not body.audience.startswith("learner:") else "learner:" + norm_adm(body.audience[8:])
    with db.tx({"type": "notice", "summary": f"Notice posted: {body.title}"}) as c:
        nid = c.execute("INSERT INTO notices(date,title,body,tag,audience,pinned,created_by,created_at) VALUES(?,?,?,?,?,?,?,?) RETURNING id",
                        (body.date or db.today(), body.title, body.body, body.tag, aud, int(body.pinned), user["username"], db.now_iso())).fetchone()[0]
        db.change(c, "notice", body.title, aud[8:] if aud.startswith("learner:") else None, aud)
        db.audit(c, f"staff:{user['username']}", "notice.create", str(nid), body.title, user["ip"])
    return {"id": nid}


@router.put("/notices/{nid}")
def notice_update(nid: int, body: NoticeIn, user: dict = Depends(need("notices"))):
    with db.tx({"type": "notice", "summary": f"Notice edited: {body.title}"}) as c:
        c.execute("UPDATE notices SET title=?, body=?, tag=?, audience=?, pinned=?, date=COALESCE(?, date) WHERE id=?",
                  (body.title, body.body, body.tag, body.audience, int(body.pinned), body.date, nid))
        db.audit(c, f"staff:{user['username']}", "notice.update", str(nid), body.title, user["ip"])
    return {"ok": True}


@router.delete("/notices/{nid}")
def notice_delete(nid: int, user: dict = Depends(need("notices"))):
    with db.tx({"type": "notice", "summary": "Notice removed"}) as c:
        c.execute("DELETE FROM notices WHERE id=?", (nid,))
        db.audit(c, f"staff:{user['username']}", "notice.delete", str(nid), "", user["ip"])
    return {"ok": True}


# ───────────────────────────── Kudzi + memory ─────────────────────────────
@router.get("/kudzi/chats")
def kudzi_chats(limit: int = 100, source: Optional[str] = None, user: dict = Depends(need("kudzi"))):
    sql = "SELECT * FROM chats" + (" WHERE source=?" if source else "") + " ORDER BY id DESC LIMIT ?"
    return db.rows(sql, ([source] if source else []) + [min(limit, 1000)])


@router.get("/kudzi/stats")
def kudzi_stats(user: dict = Depends(need("kudzi"))):
    return {"by_source": db.rows("SELECT source, COUNT(*) n FROM chats GROUP BY source"),
            "helpful": db.scalar("SELECT COUNT(*) FROM chats WHERE helpful=1", default=0),
            "unhelpful": db.scalar("SELECT COUNT(*) FROM chats WHERE helpful=0", default=0),
            "unanswered": db.rows("SELECT message, COUNT(*) n FROM chats WHERE source='fallback' GROUP BY lower(message) ORDER BY n DESC LIMIT 15"),
            "ai": config.KUDZI_LLM, "model": config.KUDZI_MODEL}


class KudziTestIn(BaseModel):
    learner_id: str
    role: Literal["parent", "learner"] = "parent"
    message: str = Field(..., max_length=2000)


@router.post("/kudzi/test")
def kudzi_test(body: KudziTestIn, user: dict = Depends(need("kudzi"))):
    from .app import kudzi_reply
    L = db.row("SELECT * FROM learners WHERE id=?", (norm_adm(body.learner_id),))
    if not L:
        _404("Learner not found")
    return kudzi_reply(L, body.role, body.message, [])


class MemoryIn(BaseModel):
    scope: str = Field(..., pattern=r"^[a-z0-9_\-]{1,40}$")
    key: str = Field(..., min_length=1, max_length=200)
    value: str = Field("", max_length=20000)


@router.get("/memory")
def memory(scope: Optional[str] = None, user: dict = Depends(need("memory"))):
    if scope:
        return db.rows("SELECT * FROM memory WHERE scope=? ORDER BY key", (scope,))
    return db.rows("SELECT * FROM memory ORDER BY scope, key")


@router.put("/memory")
def memory_put(body: MemoryIn, user: dict = Depends(need("memory"))):
    with db.tx({"type": "memory", "summary": f"Memory saved: {body.scope}/{body.key[:40]}"}) as c:
        c.execute("INSERT INTO memory(scope,key,value,updated_at,updated_by) VALUES(?,?,?,?,?) ON CONFLICT(scope,key) DO UPDATE SET "
                  "value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by",
                  (body.scope, body.key, body.value, db.now_iso(), user["username"]))
        db.audit(c, f"staff:{user['username']}", "memory.put", f"{body.scope}/{body.key[:60]}", "", user["ip"])
    return {"ok": True}


@router.delete("/memory/{scope}/{key:path}")
def memory_delete(scope: str, key: str, user: dict = Depends(need("memory"))):
    with db.tx({"type": "memory", "summary": f"Memory removed: {scope}/{key[:40]}"}) as c:
        c.execute("DELETE FROM memory WHERE scope=? AND key=?", (scope, key))
        db.audit(c, f"staff:{user['username']}", "memory.delete", f"{scope}/{key[:60]}", "", user["ip"])
    return {"ok": True}


SETTINGS = {"portal_url": "https://royalcrestzw.vercel.app/portal/", "registration_open": "1"}


@router.get("/settings")
def settings(user: dict = Depends(staff_user)):
    got = {r["key"]: r["value"] for r in db.rows("SELECT key, value FROM memory WHERE scope='settings'")}
    return {**SETTINGS, **got, "school": config.SCHOOL, "env": {
        "admin_password_set": bool(config.ADMIN_PASSWORD), "sync_key_set": bool(config.SYNC_KEY), "cloud_backup": backup.hf_enabled(),
        "cloud_repo": config.HF_BACKUP_REPO or None, "kudzi_ai": config.KUDZI_LLM, "portal_origins": config.PORTAL_ORIGINS,
        "data_dir": str(config.DATA_DIR), "persistent_disk": config.PERSISTENT_DISK, "session_days": config.SESSION_DAYS}}


@router.put("/settings")
def settings_put(body: dict, user: dict = Depends(need("settings"))):
    allowed = {k: str(v) for k, v in body.items() if k in SETTINGS}
    with db.tx({"type": "settings", "summary": "Settings saved"}) as c:
        for k, v in allowed.items():
            c.execute("INSERT INTO memory(scope,key,value,updated_at,updated_by) VALUES('settings',?,?,?,?) ON CONFLICT(scope,key) DO UPDATE SET "
                      "value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by", (k, v, db.now_iso(), user["username"]))
        db.audit(c, f"staff:{user['username']}", "settings.save", "", allowed, user["ip"])
    return settings(user)


# ───────────────────────────── people online, audit, staff ─────────────────────────────
@router.get("/sessions")
def sessions(user: dict = Depends(need("audit"))):
    out = db.rows("SELECT kind, subject, created_at, last_seen, ip, ua FROM sessions WHERE expires_at > ? ORDER BY last_seen DESC LIMIT 300", (time.time(),))
    for s in out:
        s["last_seen_iso"] = datetime.fromtimestamp(s["last_seen"] or 0, timezone.utc).replace(microsecond=0).isoformat()
        if s["kind"] == "parent":
            p = db.row("SELECT name FROM parents WHERE id=?", (int(s["subject"]),))
            s["name"] = p["name"] if p else "?"
        elif s["kind"] in ("learner", "preview"):
            L = db.row("SELECT first, last FROM learners WHERE id=?", (s["subject"],))
            s["name"] = f"{L['first']} {L['last']}" if L else s["subject"]
        else:
            s["name"] = s["subject"]
    return out


@router.delete("/sessions/{kind}/{subject}")
def session_kill(kind: str, subject: str, user: dict = Depends(need("audit"))):
    with db.quiet() as c:
        n = c.execute("DELETE FROM sessions WHERE kind=? AND subject=?", (kind, subject)).rowcount
        db.audit(c, f"staff:{user['username']}", "sessions.end", f"{kind}:{subject}", f"{n} sessions", user["ip"])
    return {"ended": n}


@router.get("/audit")
def audit_log(q: str = "", limit: int = 200, offset: int = 0, user: dict = Depends(need("audit"))):
    sql, args = "SELECT * FROM audit", []
    if q:
        sql += " WHERE actor LIKE ? OR action LIKE ? OR target LIKE ? OR detail LIKE ?"
        args = [f"%{q}%"] * 4
    return db.rows(sql + " ORDER BY id DESC LIMIT ? OFFSET ?", args + [min(limit, 1000), max(0, offset)])


class StaffIn(BaseModel):
    username: str = Field(..., pattern=r"^[A-Za-z0-9_.\-]{3,40}$")
    name: str = Field(..., max_length=80)
    role: Literal["owner", "admin", "teacher", "bursar"]
    password: Optional[str] = Field(None, min_length=8, max_length=200)
    active: bool = True


@router.get("/staff")
def staff(user: dict = Depends(need("staff"))):
    return db.rows("SELECT id, username, name, role, active, created_at, last_login FROM staff ORDER BY role, name")


@router.post("/staff", status_code=201)
def staff_create(body: StaffIn, user: dict = Depends(need("staff"))):
    if not body.password:
        raise HTTPException(400, "Give the new account a password (at least 8 characters).")
    if body.username.lower() == "admin":
        raise HTTPException(400, "“admin” is the built-in account. Choose another username.")
    with db.tx({"type": "staff", "summary": f"Staff account added: {body.username}"}) as c:
        if c.execute("SELECT 1 FROM staff WHERE username=?", (body.username,)).fetchone():
            raise HTTPException(409, "That username is taken.")
        c.execute("INSERT INTO staff(username,name,role,pw_hash,active,created_at) VALUES(?,?,?,?,?,?)",
                  (body.username, body.name, body.role, hash_password(body.password), int(body.active), db.now_iso()))
        db.audit(c, f"staff:{user['username']}", "staff.create", body.username, body.role, user["ip"])
    return {"ok": True}


@router.put("/staff/{sid}")
def staff_update(sid: int, body: StaffIn, user: dict = Depends(need("staff"))):
    with db.tx({"type": "staff", "summary": f"Staff account updated: {body.username}"}) as c:
        c.execute("UPDATE staff SET name=?, role=?, active=? WHERE id=?", (body.name, body.role, int(body.active), sid))
        if body.password:
            c.execute("UPDATE staff SET pw_hash=? WHERE id=?", (hash_password(body.password), sid))
        if not body.active or body.password:
            c.execute("DELETE FROM sessions WHERE kind='staff' AND subject=(SELECT username FROM staff WHERE id=?)", (sid,))
        db.audit(c, f"staff:{user['username']}", "staff.update", body.username, body.role, user["ip"])
    return {"ok": True}


@router.delete("/staff/{sid}")
def staff_delete(sid: int, user: dict = Depends(need("staff"))):
    with db.tx({"type": "staff", "summary": "Staff account removed"}) as c:
        c.execute("DELETE FROM sessions WHERE kind='staff' AND subject=(SELECT username FROM staff WHERE id=?)", (sid,))
        c.execute("DELETE FROM staff WHERE id=?", (sid,))
        db.audit(c, f"staff:{user['username']}", "staff.delete", str(sid), "", user["ip"])
    return {"ok": True}


# ───────────────────────────── import / export ─────────────────────────────
def _csv_rows(text: str) -> list[dict]:
    text = text.lstrip("﻿")
    rd = csv.DictReader(io.StringIO(text))
    norm = lambda k: re.sub(r"[^a-z0-9]+", "_", (k or "").strip().lower()).strip("_")  # noqa: E731
    return [{norm(k): (v or "").strip() for k, v in r.items() if k} for r in rd]


ALIASES = {
    "id": ("admission_no", "admission_number", "adm_no", "admission", "id", "reg_no"),
    "first": ("first", "first_name", "firstname", "name"),
    "last": ("last", "last_name", "surname", "lastname"),
    "form": ("form", "grade", "class_form"),
    "stream": ("stream", "class"),
    "house": ("house",), "residence": ("residence", "boarding", "boarder_day"), "hostel": ("hostel", "block"),
    "class_teacher": ("class_teacher", "teacher"), "gender": ("gender", "sex"), "dob": ("dob", "date_of_birth", "birthday"),
    "parent_name": ("parent_name", "guardian_name", "parent", "guardian"),
    "parent_phone": ("parent_phone", "guardian_phone", "phone", "phone_number", "cell", "mobile"),
    "parent_email": ("parent_email", "email", "guardian_email"), "relationship": ("relationship", "relation"),
}


def _pick(r: dict, field: str) -> str:
    for k in ALIASES[field]:
        if r.get(k):
            return r[k]
    return ""


@router.post("/import/learners")
async def import_learners(request: Request, user: dict = Depends(need("learners"))):
    """CSV (header row) with: admission_no, first, last, form, stream, house, residence, hostel, parent_name, parent_phone,
    parent_email, relationship. Existing admission numbers are updated; new parents are linked by phone."""
    text = (await request.body()).decode("utf-8", "replace")
    rows = _csv_rows(text)
    if not rows:
        raise HTTPException(400, "The file is empty or has no header row.")
    stats = {"created": 0, "updated": 0, "parents": 0, "links": 0, "errors": []}
    with db.tx({"type": "import", "summary": f"Learners imported ({len(rows)} rows)"}) as c:
        for i, r in enumerate(rows, start=2):
            try:
                first, last = _pick(r, "first"), _pick(r, "last")
                if first and not last and " " in first:
                    first, last = first.split(" ", 1)
                if not first:
                    raise ValueError("no first name")
                form = int(re.sub(r"\D", "", _pick(r, "form")) or 1)
                lid = norm_adm(_pick(r, "id")) or next_admission_no(c)
                res = _pick(r, "residence")
                res = "Day scholar" if res.lower().startswith("d") else "Boarder" if res else None
                exists = c.execute("SELECT 1 FROM learners WHERE id=?", (lid,)).fetchone()
                vals = dict(first=first, last=last, form=form, stream=_pick(r, "stream") or None, house=_pick(r, "house") or None,
                            residence=res, hostel=_pick(r, "hostel") or None, class_teacher=_pick(r, "class_teacher") or None,
                            gender=_pick(r, "gender") or None, dob=_pick(r, "dob") or None)
                if exists:
                    sets = ", ".join(f"{k}=COALESCE(?, {k})" for k in vals)
                    c.execute(f"UPDATE learners SET {sets}, updated_at=? WHERE id=?", [*vals.values(), db.now_iso(), lid])
                    stats["updated"] += 1
                else:
                    c.execute("INSERT INTO learners(id,first,last,form,stream,house,residence,hostel,class_teacher,gender,dob,created_at,updated_at) "
                              "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", (lid, *vals.values(), db.now_iso(), db.now_iso()))
                    if not res:
                        c.execute("UPDATE learners SET residence='Boarder' WHERE id=?", (lid,))
                    stats["created"] += 1
                ph = _pick(r, "parent_phone")
                if ph:
                    before = c.execute("SELECT COUNT(*) FROM parents").fetchone()[0]
                    pid = _upsert_parent(c, _pick(r, "parent_name") or "Parent", ph, _pick(r, "parent_email") or None, _pick(r, "relationship") or None)
                    stats["parents"] += c.execute("SELECT COUNT(*) FROM parents").fetchone()[0] - before
                    stats["links"] += c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)",
                                                (pid, lid, _pick(r, "relationship") or None)).rowcount
            except (ValueError, HTTPException) as e:
                stats["errors"].append(f"Row {i}: {getattr(e, 'detail', None) or e}")
        db.audit(c, f"staff:{user['username']}", "import.learners", "", {k: v for k, v in stats.items() if k != "errors"}, user["ip"])
    return stats


@router.post("/import/results")
async def import_results(request: Request, term: str, user: dict = Depends(need("academics"))):
    """CSV with: admission_no, subject code (or `code`), ca, exam, comment."""
    rows = _csv_rows((await request.body()).decode("utf-8", "replace"))
    if not db.row("SELECT 1 FROM terms WHERE id=?", (term,)):
        _404("Unknown term")
    marks, errors = [], []
    for i, r in enumerate(rows, start=2):
        try:
            marks.append(MarkIn(learner_id=_pick(r, "id"), code=(r.get("code") or r.get("subject") or "").upper(),
                                ca=float(r["ca"]) if r.get("ca") else None, exam=float(r["exam"]) if r.get("exam") else None,
                                comment=r.get("comment") or None))
        except (ValueError, KeyError) as e:
            errors.append(f"Row {i}: {e}")
    out = results_save(MarksIn(term=term, rows=marks), user)
    return {**out, "errors": errors}


@router.get("/export/{table}.csv")
def export_csv(table: str, user: dict = Depends(need("backups"))):
    if table not in backup.EXPORT_TABLES:
        _404("Unknown table")
    c = db.connect()
    try:
        text = backup._csv(c, table)
    finally:
        c.close()
    return Response(text, media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="royal-crest-{table}-{db.today()}.csv"'})


# ───────────────────────────── backups ─────────────────────────────
@router.get("/backup/status")
def backup_status(user: dict = Depends(sync_or_staff())):
    return backup.status()


@router.get("/backups")
def backups(user: dict = Depends(need("backups"))):
    return {"status": backup.status(), "items": backup.list_backups()}


@router.post("/backups", status_code=201)
def backup_now(user: dict = Depends(need("backups"))):
    item = backup.make_backup("manual", user["username"])
    with db.quiet() as c:
        db.audit(c, f"staff:{user['username']}", "backup.create", item["name"], "", user["ip"])
    BROKER.publish({"type": "backup", "summary": f"Backup made: {item['name']}"})
    return item


def _zip_response(p) -> FileResponse:
    return FileResponse(p, media_type="application/zip", filename=p.name, headers={"Cache-Control": "no-store"})


@router.get("/backup/export")
def backup_export(user: dict = Depends(sync_or_staff())):
    """Everything, as one fresh zip (the PC agent downloads this)."""
    st = backup.state().get("last_local") or {}
    if st.get("data_version") == db.data_version() and (config.BACKUP_DIR / st.get("name", "-")).exists():
        p = config.BACKUP_DIR / st["name"]                    # nothing changed since the last zip: reuse it
    else:
        p = config.BACKUP_DIR / backup.make_backup("export", user["username"])["name"]
    with db.quiet() as c:
        db.audit(c, f"staff:{user['username']}" if user["id"] != -1 else "pc-sync", "backup.export", p.name, "", user["ip"])
    BROKER.publish({"type": "backup", "summary": f"Backup downloaded by {user['name']}"})
    return _zip_response(p)


@router.get("/backups/{name}")
def backup_download(name: str, user: dict = Depends(sync_or_staff())):
    try:
        return _zip_response(backup.backup_path(name))
    except FileNotFoundError:
        _404("No such backup")


@router.delete("/backups/{name}")
def backup_delete(name: str, user: dict = Depends(need("backups"))):
    try:
        backup.backup_path(name).unlink()
    except FileNotFoundError:
        _404("No such backup")
    return {"ok": True}


def _after_restore(user: dict, out: dict) -> dict:
    BROKER.publish({"type": "restore", "summary": f"Restored {out['restored']} (data version {out['data_version']})"})
    return out


@router.put("/backup/restore")
async def backup_restore_upload(request: Request, user: dict = Depends(sync_or_staff())):
    """Body: the backup zip itself (Content-Type: application/zip)."""
    if user["role"] not in ("owner", "admin"):
        raise HTTPException(403, "Only an administrator can restore.")
    data = await request.body()
    if len(data) < 100:
        raise HTTPException(400, "Send the backup zip as the request body.")
    p = backup.save_upload(data)
    return _after_restore(user, backup.restore(p, user["username"], "upload"))


@router.post("/backups/{name}/restore")
def backup_restore_named(name: str, user: dict = Depends(need("backups"))):
    if user["role"] not in ("owner", "admin"):
        raise HTTPException(403, "Only an administrator can restore.")
    try:
        p = backup.backup_path(name)
    except FileNotFoundError:
        _404("No such backup")
    return _after_restore(user, backup.restore(p, user["username"], "dashboard"))


@router.post("/backup/cloud")
def backup_cloud(user: dict = Depends(need("backups"))):
    if not backup.hf_enabled():
        raise HTTPException(400, "Cloud backup is off. Add HF_TOKEN and HF_BACKUP_REPO in the Space settings.")
    st = backup.state().get("last_local") or {}
    if st.get("data_version") != db.data_version() or not (config.BACKUP_DIR / st.get("name", "-")).exists():
        st = backup.make_backup("cloud", user["username"])
    try:
        return backup.hf_push(config.BACKUP_DIR / st["name"])
    except Exception as e:
        backup.save_state(cloud_error=f"{db.now_iso()}: {str(e)[:300]}")
        raise HTTPException(502, f"Hugging Face refused the upload: {str(e)[:200]}")


# ───────────────────────────── demo data ─────────────────────────────
@router.post("/demo")
def demo_load(user: dict = Depends(need("settings"))):
    return seed.load_demo()


@router.delete("/demo")
def demo_remove(user: dict = Depends(need("settings"))):
    return seed.remove_demo(f"staff:{user['username']}")
