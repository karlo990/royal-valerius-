"""Royal Crest hub: the live server behind the Crest Quest portal, Kudzi and the dashboard.

  /api/v1/...          portal + Royal Crest Connect app API (contract: portal/api/openapi.json)
  /api/v1/register     parents register; staff approve in the dashboard
  /api/v1/admin/...    dashboard API (staff sign-in), backups (also the PC agent's X-Sync-Key)
  /admin               the live dashboard

Run locally:  uvicorn hub.app:app --port 8780   (from the karlissa folder)
"""
from __future__ import annotations

import asyncio
import html
import logging
import re
import secrets
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import backup, config, db, kudzi, views
from .auth import client_ip, end_session, bearer, portal_user, start_session
from .events import BROKER
from .security import (LOGIN_BY_ID, LOGIN_BY_IP, REGISTER_BY_IP, hash_password, mask_phone, norm_adm, norm_phone,
                       phones_match, pretty_phone, verify_password)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("hub")
STARTED = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    BROKER.bind(asyncio.get_running_loop())
    how = backup.boot()
    log.info("database ready (%s) at %s, data version %s", how, config.DB_PATH, db.data_version())
    BROKER.publish({"type": "system", "summary": f"Hub started ({how} database)"})
    if not backup.SCHEDULER.is_alive():
        backup.SCHEDULER.start()
    yield
    try:                                  # Space restarting: last backup + cloud copy
        backup.SCHEDULER.tick(final=True)
    except Exception as e:
        log.warning("final backup failed: %s", e)


app = FastAPI(title="Royal Crest hub", version=config.VERSION, lifespan=lifespan,
              description="Crest Quest portal API, Kudzi the Crestbot, parent registration, the live dashboard and backups.")
app.add_middleware(CORSMiddleware, allow_origins=config.PORTAL_ORIGINS, allow_credentials=False,
                   allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type", "X-Sync-Key"])


@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    if request.url.path.startswith("/api/"):
        resp.headers.setdefault("Cache-Control", "no-store")
    return resp


def publish(type_: str, summary: str, **kw) -> None:
    BROKER.publish({"type": type_, "summary": summary, **kw})


# ───────────────────────────── public ─────────────────────────────
@app.get("/api/v1/health")
def health():
    return {"ok": True, "time": db.now_iso(), "version": config.VERSION, "school": config.SCHOOL["name"],
            "data_version": db.data_version(), "uptime_s": int(time.time() - STARTED)}


def setting(key: str, default: str) -> str:
    r = db.row("SELECT value FROM memory WHERE scope='settings' AND key=?", (key,))
    return r["value"] if r and r["value"] is not None else default


@app.get("/api/v1/school")
def school():
    c = db.connect()
    try:
        t = views.current_term(c)
    finally:
        c.close()
    return {**config.SCHOOL, "current_term": t["label"] if t else None, "forms": [1, 2, 3, 4, 5],
            "registration_open": setting("registration_open", "1") == "1"}


# ───────────────────────────── sign-in ─────────────────────────────
class LoginIn(BaseModel):
    role: Literal["learner", "parent"]
    identifier: str = Field(..., max_length=80, description="Learner's admission number (a parent may also use their phone number once they have set a password)")
    password: Optional[str] = Field(None, max_length=128, description="The parent's phone number, or a password they set")
    pin: Optional[str] = Field(None, max_length=128, description="Older name for `password`")


BAD_LOGIN = "Those details don't match our records. Use the admission number and the parent's phone number registered with the school."


def _check_parent(ident: str, pw: str) -> dict | None:
    adm = norm_adm(ident)
    cands = db.rows("SELECT p.* FROM parents p JOIN guardians g ON g.parent_id=p.id JOIN learners l ON l.id=g.learner_id "
                    "WHERE l.id=? AND l.status='active' AND p.status='active'", (adm,))
    for p in cands:
        if (p["pw_hash"] and verify_password(pw, p["pw_hash"])) or (not p["pw_hash"] and phones_match(pw, p["phone"])):
            return p
    phone = norm_phone(ident)                      # phone + own password (after they changed it)
    if not cands and len(phone) >= 9:
        p = db.row("SELECT * FROM parents WHERE phone=? AND status='active'", (phone,))
        if p and p["pw_hash"] and verify_password(pw, p["pw_hash"]):
            return p
    return None


def _check_learner(ident: str, pw: str) -> dict | None:
    L = db.row("SELECT * FROM learners WHERE id=? AND status='active'", (norm_adm(ident),))
    if not L:
        return None
    if L["pw_hash"]:
        return L if verify_password(pw, L["pw_hash"]) else None
    for p in db.rows("SELECT p.phone FROM parents p JOIN guardians g ON g.parent_id=p.id WHERE g.learner_id=? AND p.status='active'", (L["id"],)):
        if phones_match(pw, p["phone"]):
            return L
    return None


@app.post("/api/v1/auth/login")
def login(body: LoginIn, request: Request):
    from .auth import portal_user_for
    ip, pw = client_ip(request), (body.password or body.pin or "").strip()
    key = f"{body.role}:{body.identifier.strip().lower()}"
    wait = max(LOGIN_BY_ID.blocked(key), LOGIN_BY_IP.blocked(ip))
    if wait:
        raise HTTPException(429, f"Too many attempts. Please wait {max(1, round(wait / 60))} minutes, or call the school office.")
    hit = _check_parent(body.identifier, pw) if body.role == "parent" else _check_learner(body.identifier, pw)
    if not hit:
        LOGIN_BY_ID.fail(key)
        LOGIN_BY_IP.fail(ip)
        with db.quiet() as c:
            db.audit(c, body.identifier[:40], "login.failed", body.role, "", ip)
        publish("login_failed", f"Failed {body.role} sign-in for {body.identifier[:40]}")
        raise HTTPException(401, BAD_LOGIN)
    LOGIN_BY_ID.clear(key)
    kind, subject = body.role, str(hit["id"])
    tok, exp = start_session(kind, subject, request, config.SESSION_DAYS * 24)
    user = portal_user_for(kind, subject)
    with db.quiet() as c:
        c.execute(f"UPDATE {'parents' if kind == 'parent' else 'learners'} SET last_login=? WHERE id=?", (db.now_iso(), hit["id"]))
        db.audit(c, user["id"], "login", kind, user["name"], ip)
    publish("login", f"{user['name']} signed in ({kind})")
    return {"token": tok, "user": _public_user(user), "expires_at": datetime.fromtimestamp(exp, timezone.utc).isoformat(), "demo": False}


def _public_user(u: dict) -> dict:
    out = {k: u[k] for k in ("role", "name", "students", "password_is_phone")}
    if u.get("phone"):
        out["phone_masked"] = mask_phone(u["phone"])
    if u.get("preview"):
        out["preview"] = True
    return out


@app.post("/api/v1/auth/logout", status_code=204)
def logout(request: Request):
    end_session(bearer(request))


@app.get("/api/v1/me")
def me(user: dict = Depends(portal_user)):
    return _public_user(user)


class PasswordIn(BaseModel):
    current: str = Field(..., max_length=128)
    new: str = Field(..., min_length=6, max_length=128)


@app.post("/api/v1/me/password")
def change_password(body: PasswordIn, request: Request, user: dict = Depends(portal_user)):
    if user.get("preview"):
        raise HTTPException(403, "Staff previews can't change passwords.")
    if body.new.strip() == body.current.strip() or norm_phone(body.new) and phones_match(body.new, user.get("phone") or "-"):
        raise HTTPException(400, "Choose a password that is not your phone number.")
    if user["role"] == "parent":
        p = db.row("SELECT * FROM parents WHERE id=?", (user["parent_id"],))
        ok = verify_password(body.current, p["pw_hash"]) if p["pw_hash"] else phones_match(body.current, p["phone"])
        table, rid = "parents", p["id"]
    else:
        lid = user["students"][0]
        ok = _check_learner(lid, body.current) is not None
        table, rid = "learners", lid
    if not ok:
        raise HTTPException(400, "Your current password is not right.")
    with db.tx({"type": "password", "summary": f"{user['name']} set a new password"}) as c:
        c.execute(f"UPDATE {table} SET pw_hash=? WHERE id=?", (hash_password(body.new), rid))
        db.audit(c, user["id"], "password.change", table, "", client_ip(request))
    return {"ok": True}


# ───────────────────────────── learners ─────────────────────────────
def _learner(student_id: str, user: dict) -> dict:
    sid = norm_adm(student_id)
    if sid not in user["students"]:
        raise HTTPException(404, "Learner not found")
    L = db.row("SELECT * FROM learners WHERE id=?", (sid,))
    if not L:
        raise HTTPException(404, "Learner not found")
    return L


def _with(student_id: str, user: dict, fn):
    L = _learner(student_id, user)
    c = db.connect()
    try:
        return fn(c, L)
    finally:
        c.close()


@app.get("/api/v1/students/{student_id}")
def student(student_id: str, user: dict = Depends(portal_user)):
    return _with(student_id, user, views.summary)


@app.get("/api/v1/students/{student_id}/results")
def results(student_id: str, term: Optional[str] = None, user: dict = Depends(portal_user)):
    return [r for r in _with(student_id, user, views.results) if term in (None, r["term"])]


@app.get("/api/v1/students/{student_id}/attendance")
def attendance(student_id: str, user: dict = Depends(portal_user)):
    return _with(student_id, user, views.attendance)


@app.get("/api/v1/students/{student_id}/timetable")
def timetable(student_id: str, user: dict = Depends(portal_user)):
    return _with(student_id, user, views.timetable)


@app.get("/api/v1/students/{student_id}/assignments")
def assignments(student_id: str, user: dict = Depends(portal_user)):
    return _with(student_id, user, views.assignments)


@app.get("/api/v1/students/{student_id}/skills")
def skills(student_id: str, user: dict = Depends(portal_user)):
    return _with(student_id, user, views.skills)


@app.get("/api/v1/students/{student_id}/fees")
def fees(student_id: str, user: dict = Depends(portal_user)):
    return _with(student_id, user, views.fees)


@app.get("/api/v1/students/{student_id}/everything")
def everything(student_id: str, user: dict = Depends(portal_user)):
    """One call with every section (the app's offline cache uses this)."""
    return _with(student_id, user, views.everything)


@app.get("/api/v1/students/{student_id}/report", response_class=HTMLResponse)
def report(student_id: str, term: Optional[str] = None, user: dict = Depends(portal_user)):
    """Printable report card (the portal opens it in a new tab; Print → Save as PDF)."""
    def build(c, L):
        s = views.summary(c, L)
        rs = [r for r in views.results(c, L) if r["published"] and (term in (None, r["term"]))]
        if not rs:
            raise HTTPException(404, "No published results for that term.")
        return s, rs[-1]
    s, t = _with(student_id, user, build)
    e = html.escape
    avg = round(sum(x["total"] for x in t["subjects"]) / max(1, len(t["subjects"])))
    rows = "".join(f"<tr><td>{e(x['name'])}<small>{e(x['teacher'])}</small></td><td>{x['ca']}</td><td>{x['exam']}</td><td><b>{x['total']}</b></td>"
                   f"<td><b>{x['grade']}</b></td><td>{x['class_avg']}</td><td>{e(x['comment'])}</td></tr>" for x in t["subjects"])
    return REPORT_HTML.format(name=e(s["name"]), adm=e(s["admission_no"]), form=e(s["form"]), stream=e(s["stream"]), house=e(s["house"]),
                              term=e(t["label"]), rows=rows, avg=avg, pos=s["position"], size=s["class_size"], ct=e(s["class_teacher"]),
                              school=e(config.SCHOOL["name"]), addr=e(config.SCHOOL["address"]), email=e(config.SCHOOL["email"]),
                              phone=e(config.SCHOOL["phones"][0]["number"]), printed=datetime.now().strftime("%d %B %Y"))


REPORT_HTML = """<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{name} · {term} report</title>
<style>
@page {{ size: A4; margin: 16mm; }} body {{ font: 13px/1.5 Georgia, 'Times New Roman', serif; color: #10183a; margin: 0 auto; max-width: 780px; padding: 24px; }}
header {{ display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #10183a; padding-bottom: 10px; }}
h1 {{ font-size: 24px; margin: 0; letter-spacing: .02em; }} .muted {{ color: #5a6280; font-size: 11.5px; }}
.who {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 16px; margin: 18px 0; font-size: 12.5px; }} .who b {{ display: block; font-size: 14px; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }} th, td {{ border-bottom: 1px solid #d9dceb; padding: 7px 6px; text-align: left; vertical-align: top; }}
th {{ font: 600 10.5px/1.2 Arial, sans-serif; text-transform: uppercase; letter-spacing: .08em; color: #5a6280; }} td small {{ display: block; color: #5a6280; font-size: 11px; }}
.sum {{ display: flex; gap: 28px; margin: 20px 0; }} .sum b {{ display: block; font-size: 22px; }} .gold {{ color: #a07c17; }}
footer {{ margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }} .sig {{ flex: 1; border-top: 1px solid #10183a; padding-top: 6px; font-size: 11.5px; }}
.print {{ position: fixed; right: 16px; top: 16px; padding: 8px 14px; background: #10183a; color: #fff; border: 0; border-radius: 8px; cursor: pointer; }} @media print {{ .print {{ display: none; }} }}
</style></head><body><button class="print" onclick="print()">Print / Save as PDF</button>
<header><div><div class="muted gold">Science · Innovation · Skill</div><h1>{school}</h1><div class="muted">{addr} · {email} · {phone}</div></div>
<div style="text-align:right"><div class="muted">Report card</div><b style="font-size:16px">{term}</b></div></header>
<div class="who"><div><span class="muted">Learner</span><b>{name}</b></div><div><span class="muted">Admission no.</span><b>{adm}</b></div>
<div><span class="muted">Class</span><b>{form} · {stream}</b></div><div><span class="muted">House</span><b>{house}</b></div></div>
<table><thead><tr><th>Subject</th><th>CA /40</th><th>Exam /60</th><th>Total</th><th>Grade</th><th>Class avg</th><th>Teacher's comment</th></tr></thead><tbody>{rows}</tbody></table>
<div class="sum"><div><span class="muted">Average</span><b>{avg}%</b></div><div><span class="muted">Class position</span><b>{pos} / {size}</b></div>
<div><span class="muted">Class teacher</span><b style="font-size:15px">{ct}</b></div></div>
<p class="muted">Grades: A 75–100 · B 65–74 · C 50–64 · D 45–49 · E 40–44 · U below 40.</p>
<footer><div class="sig">Class teacher</div><div class="sig">Head of school</div><div class="sig">Parent / guardian</div></footer>
<p class="muted" style="margin-top:24px">Printed {printed} from Crest Quest, the Royal Crest Academy portal.</p></body></html>"""


@app.get("/api/v1/notices")
def notices(user: dict = Depends(portal_user)):
    ls = [db.row("SELECT * FROM learners WHERE id=?", (i,)) for i in user["students"]]
    c = db.connect()
    try:
        return views.notices_for(c, user["role"], [L for L in ls if L])
    finally:
        c.close()


# ───────────────────────────── Kudzi ─────────────────────────────
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=4000)


class ChatIn(BaseModel):
    student_id: str
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatTurn] = []
    client: Literal["web", "app"] = "web"


def kudzi_context(c, L: dict, role: str) -> dict:
    full = views.everything(c, L)
    term = next((r for r in reversed(full["results"]) if r["published"]), None)
    return {"role": role, "student": full, "term": term, "attendance": full["attendance"], "assignments": full["assignments"],
            "fees": full["fees"], "timetable": full["timetable"], "skills": full["skills"],
            "notices": views.notices_for(c, role, [L]), "today": db.today()}


def kudzi_reply(L: dict, role: str, message: str, history: list[dict]) -> dict:
    c = db.connect()
    try:
        ctx = kudzi_context(c, L, role)
    finally:
        c.close()
    faqs = db.rows("SELECT key, value FROM memory WHERE scope='kudzi_faq'")
    return kudzi.answer(message, ctx, history, faqs)


@app.post("/api/v1/crestbot/chat")
def crestbot_chat(body: ChatIn, user: dict = Depends(portal_user)):
    L = _learner(body.student_id, user)
    out = kudzi_reply(L, user["role"], body.message, [h.model_dump() for h in body.history])
    with db.quiet() as c:
        cid = c.execute("INSERT INTO chats(at,kind,actor,learner_id,message,reply,source) VALUES(?,?,?,?,?,?,?) RETURNING id",
                        (db.now_iso(), user["role"], user["id"], L["id"], body.message, out["reply"], out["source"])).fetchone()[0]
    publish("chat", f"Kudzi answered {user['name']}: “{body.message[:60]}”", source=out["source"])
    return {**out, "chat_id": cid, "suggestions": kudzi.suggestions(user["role"])}


@app.get("/api/v1/crestbot/suggestions")
def crestbot_suggestions(student_id: str = Query(...), user: dict = Depends(portal_user)):
    _learner(student_id, user)
    return {"suggestions": kudzi.suggestions(user["role"])}


class FeedbackIn(BaseModel):
    student_id: str
    message: str = ""
    reply: str = ""
    helpful: bool
    chat_id: Optional[int] = None


@app.post("/api/v1/crestbot/feedback", status_code=204)
def crestbot_feedback(body: FeedbackIn, user: dict = Depends(portal_user)):
    L = _learner(body.student_id, user)
    with db.quiet() as c:
        if body.chat_id:
            c.execute("UPDATE chats SET helpful=? WHERE id=? AND actor=?", (int(body.helpful), body.chat_id, user["id"]))
        else:
            c.execute("UPDATE chats SET helpful=? WHERE id=(SELECT MAX(id) FROM chats WHERE actor=? AND learner_id=?)",
                      (int(body.helpful), user["id"], L["id"]))


# ───────────────────────────── app hooks ─────────────────────────────
class DeviceIn(BaseModel):
    platform: Literal["android", "ios", "web"]
    push_token: str = Field(..., max_length=4096)
    student_ids: list[str] = []


@app.post("/api/v1/devices", status_code=201)
def register_device(body: DeviceIn, user: dict = Depends(portal_user)):
    allowed = [norm_adm(x) for x in body.student_ids if norm_adm(x) in user["students"]] or user["students"]
    did = secrets.token_hex(8)
    with db.quiet() as c:
        c.execute("DELETE FROM devices WHERE push_token=?", (body.push_token,))
        c.execute("INSERT INTO devices(id,kind,actor,platform,push_token,learner_ids,created_at) VALUES(?,?,?,?,?,?,?)",
                  (did, user["role"], user["id"], body.platform, body.push_token, ",".join(allowed), db.now_iso()))
    return {"device_id": did, "student_ids": allowed}


@app.get("/api/v1/sync")
def sync(since: Optional[str] = None, user: dict = Depends(portal_user)):
    """Changes since the last cursor that concern this user (the portal and app poll this)."""
    cur = int(since) if since and since.isdigit() else 0
    forms = {r["form"] for r in db.rows(f"SELECT form FROM learners WHERE id IN ({','.join('?' * len(user['students']))})",
                                        user["students"])} if user["students"] else set()
    aud = {"all", "parents" if user["role"] == "parent" else "learners"} | {f"form:{f}" for f in forms} | {f"learner:{i}" for i in user["students"]}
    rs = db.rows("SELECT * FROM changes WHERE id > ? ORDER BY id LIMIT 500", (cur,))
    mine = [{"id": r["id"], "at": r["at"], "type": r["type"], "learner_id": r["learner_id"], "summary": r["summary"]}
            for r in rs if (r["learner_id"] in user["students"]) or (not r["learner_id"] and r["audience"] in aud)]
    top = db.scalar("SELECT MAX(id) FROM changes", default=0)
    return {"cursor": str(top), "changes": mine if since is not None else []}


# ───────────────────────────── parent registration ─────────────────────────────
class RegisterIn(BaseModel):
    parent_name: str = Field(..., min_length=3, max_length=120)
    phone: str = Field(..., min_length=7, max_length=30)
    email: Optional[str] = Field(None, max_length=160)
    relationship: str = Field("Parent", max_length=40)
    address: Optional[str] = Field(None, max_length=300)
    learner_name: str = Field(..., min_length=3, max_length=120)
    admission_no: Optional[str] = Field(None, max_length=30)
    form: Optional[int] = Field(None, ge=1, le=6)
    residence: Optional[Literal["Boarder", "Day scholar"]] = None
    message: Optional[str] = Field(None, max_length=1000)
    consent: bool
    website: Optional[str] = None            # honeypot: real people leave it empty


@app.post("/api/v1/register", status_code=201)
def register(body: RegisterIn, request: Request):
    ip = client_ip(request)
    if setting("registration_open", "1") != "1":
        raise HTTPException(403, "Online registration is closed right now. Please call the school office.")
    if body.website:
        return {"ref": "REG-" + secrets.token_hex(3).upper(), "status": "pending"}
    if not body.consent:
        raise HTTPException(400, "Please agree to the school keeping these details.")
    if REGISTER_BY_IP.blocked(ip):
        raise HTTPException(429, "Too many registrations from this connection. Please call the school office.")
    phone = norm_phone(body.phone)
    if len(phone) < 9:
        raise HTTPException(400, "Please enter a full phone number, e.g. 0771 234 567 or +44 7700 900123.")
    if body.email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", body.email):
        raise HTTPException(400, "That email address doesn't look right.")
    REGISTER_BY_IP.fail(ip)                # counts every attempt
    adm = norm_adm(body.admission_no) if body.admission_no else None
    # Already linked? Then there is nothing to approve: tell them how to sign in.
    if adm and db.row("SELECT 1 FROM guardians g JOIN parents p ON p.id=g.parent_id WHERE g.learner_id=? AND p.phone=?", (adm, phone)):
        return {"ref": None, "status": "already_registered",
                "message": f"You're already registered. Sign in with admission number {adm} and your phone number."}
    ref = "REG-" + secrets.token_hex(3).upper()
    with db.tx({"type": "registration", "summary": f"New registration: {body.parent_name} for {body.learner_name}", "ref": ref}) as c:
        c.execute("INSERT INTO registrations(ref,parent_name,phone,email,relationship,address,learner_name,admission_no,form,residence,"
                  "message,status,created_at,ip) VALUES(?,?,?,?,?,?,?,?,?,?,?, 'pending', ?, ?)",
                  (ref, body.parent_name.strip(), phone, (body.email or "").strip() or None, body.relationship, body.address,
                   body.learner_name.strip(), adm, body.form, body.residence, body.message, db.now_iso(), ip))
        db.audit(c, f"public:{pretty_phone(phone)}", "registration.new", ref, body.learner_name, ip)
    return {"ref": ref, "status": "pending",
            "message": "Thank you. The school office will check your details, usually within one working day. "
                       "Once approved, sign in with your child's admission number and your phone number."}


class RegStatusIn(BaseModel):
    ref: str = Field(..., max_length=20)
    phone: str = Field(..., max_length=30)


@app.post("/api/v1/register/status")
def register_status(body: RegStatusIn, request: Request):
    ip = client_ip(request)
    if LOGIN_BY_IP.blocked(ip):
        raise HTTPException(429, "Too many attempts. Please wait a few minutes.")
    r = db.row("SELECT * FROM registrations WHERE ref=?", (body.ref.strip().upper(),))
    if not r or not phones_match(body.phone, r["phone"]):
        LOGIN_BY_IP.fail(ip)
        raise HTTPException(404, "We couldn't find a registration with that reference and phone number.")
    out = {"ref": r["ref"], "status": r["status"], "submitted": r["created_at"]}
    if r["status"] == "approved" and r["learner_id"]:
        out["message"] = f"Approved. Sign in with admission number {r['learner_id']} and your phone number."
        out["admission_no"] = r["learner_id"]
    elif r["status"] == "rejected":
        out["message"] = "The school could not approve this registration" + (f": {r['note']}" if r["note"] else ".") + " Please call the office."
    else:
        out["message"] = "Waiting for the school office to check your details."
    return out


# ───────────────────────────── dashboard ─────────────────────────────
from .admin import router as admin_router  # noqa: E402
from .maths import router as maths_router  # noqa: E402

app.include_router(admin_router)
app.include_router(maths_router)
app.mount("/admin/static", StaticFiles(directory=str(config.HERE / "static")), name="static")


@app.get("/admin", include_in_schema=False)
@app.get("/admin/", include_in_schema=False)
def admin_page():
    return FileResponse(config.HERE / "static" / "admin.html", headers={"Cache-Control": "no-cache"})


@app.get("/hub", include_in_schema=False)
def hub_root():
    return RedirectResponse("/admin")


@app.exception_handler(backup.RestoreError)
def restore_error(_: Request, e: backup.RestoreError):
    return JSONResponse({"detail": str(e)}, status_code=400)
