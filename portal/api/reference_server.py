"""Crest Quest reference server: the /api/v1 contract the portal and the Royal Crest Connect
app talk to, served from the demo dataset (demo-data.json).

It is the template for the real portal / Crestbot server: keep every path and response
shape, swap the demo dictionaries for the school database, and replace `crestbot_reply`
with the AI model. Spec: openapi.json in this folder.

Run:   pip install fastapi uvicorn
       uvicorn reference_server:app --reload --port 8000
Then open the portal with  /portal/?api=http://127.0.0.1:8000

Env:   RC_PORTAL_ORIGINS   comma-separated origins allowed by CORS
                           (default: http://127.0.0.1:8790,https://royalcrestzw.vercel.app)
"""
from __future__ import annotations

import json
import os
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DATA = json.loads((Path(__file__).with_name("demo-data.json")).read_text(encoding="utf-8"))

# Demo accounts. A real server stores a salted hash of each PIN and rate-limits /auth/login.
ACCOUNTS = {
    ("learner", "RCA-27-0142"): {"pin": "2027", "user": DATA["users"]["learner"]},
    ("parent", "0771234567"): {"pin": "2027", "user": DATA["users"]["parent"]},
}
SESSIONS: dict[str, dict] = {}
DEVICES: dict[str, dict] = {}

app = FastAPI(title="Crest Quest API (reference)", version="1.0.0",
              description="Royal Crest Academy learner & parent portal, Kudzi the Crestbot, and app hooks.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get(
        "RC_PORTAL_ORIGINS", "http://127.0.0.1:8790,https://royalcrestzw.vercel.app").split(",") if o.strip()],
    allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"],
)


# ─────────────────────────────── auth ───────────────────────────────
class LoginIn(BaseModel):
    role: Literal["learner", "parent"]
    identifier: str = Field(..., description="Admission number (learner) or phone number (parent)")
    pin: str


def current_user(authorization: Optional[str] = Header(None)) -> dict:
    token = (authorization or "").removeprefix("Bearer ").strip()
    if token not in SESSIONS:
        raise HTTPException(401, "Please sign in again.")
    return SESSIONS[token]


def student_for(student_id: str, user: dict = Depends(current_user)) -> dict:
    # A user only ever sees their own learners; anything else looks like it does not exist.
    if student_id not in user["students"] or student_id not in DATA["students"]:
        raise HTTPException(404, "Learner not found")
    return DATA["students"][student_id]


@app.get("/api/v1/health")
def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}


@app.post("/api/v1/auth/login")
def login(body: LoginIn):
    ident = re.sub(r"\s", "", body.identifier).upper() if body.role == "learner" else re.sub(r"\D", "", body.identifier)
    acct = ACCOUNTS.get((body.role, ident))
    if not acct or not secrets.compare_digest(acct["pin"], body.pin):
        raise HTTPException(401, "Those details do not match our records.")
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = acct["user"]
    return {"token": token, "user": acct["user"], "demo": True}


@app.post("/api/v1/auth/logout", status_code=204)
def logout(authorization: Optional[str] = Header(None)):
    SESSIONS.pop((authorization or "").removeprefix("Bearer ").strip(), None)


@app.get("/api/v1/me")
def me(user: dict = Depends(current_user)):
    return user


# ───────────────────────────── learners ─────────────────────────────
HEAVY = {"results", "attendance", "timetable", "assignments", "fees", "skills"}


@app.get("/api/v1/students/{student_id}")
def student(s: dict = Depends(student_for)):
    return {k: v for k, v in s.items() if k not in HEAVY}


@app.get("/api/v1/students/{student_id}/results")
def results(term: Optional[str] = None, s: dict = Depends(student_for)):
    return [r for r in s["results"] if term in (None, r["term"])]


@app.get("/api/v1/students/{student_id}/attendance")
def attendance(s: dict = Depends(student_for)):
    return s["attendance"]


@app.get("/api/v1/students/{student_id}/timetable")
def timetable(s: dict = Depends(student_for)):
    return s["timetable"]


@app.get("/api/v1/students/{student_id}/assignments")
def assignments(s: dict = Depends(student_for)):
    return s["assignments"]


@app.get("/api/v1/students/{student_id}/skills")
def skills(s: dict = Depends(student_for)):
    return s["skills"]


@app.get("/api/v1/students/{student_id}/fees")
def fees(s: dict = Depends(student_for)):
    # Real server: read from Royal Crest Connect's fee_documents by admission_no
    # (the same data as GET /api/fees/balances), never expose the staff RCA_API_KEY to parents.
    return s["fees"]


@app.get("/api/v1/students/{student_id}/reports/{term}.pdf")
def report_pdf(term: str, s: dict = Depends(student_for)):
    raise HTTPException(501, "Report PDFs are produced by the school server (fee_worker-style renderer).")


@app.get("/api/v1/notices")
def notices(user: dict = Depends(current_user)):
    return DATA["notices"]


# ───────────────────────── Kudzi the Crestbot ─────────────────────────
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatIn(BaseModel):
    student_id: str
    message: str = Field(..., max_length=2000)
    history: list[ChatTurn] = []
    client: Literal["web", "app"] = "web"


def crestbot_reply(s: dict, msg: str, role: str) -> dict:
    """Placeholder brain. Replace with the AI model: give it the learner's data from the
    endpoints above as context (never other learners'), and keep this response shape."""
    m, first = msg.lower(), s["first"]
    term = next((r for r in reversed(s["results"]) if r["published"]), s["results"][0])
    avg = round(sum(x["total"] for x in term["subjects"]) / len(term["subjects"]))
    who = "Your" if role == "learner" else f"{first}'s"
    if re.search(r"fee|balance|pay", m):
        f = s["fees"]
        return {"reply": f"{f['term']}: balance US${f['balance']} of US${f['invoiced']}.", "actions": [{"label": "Open fees", "route": "#/fees"}]}
    if re.search(r"homework|due|assignment", m):
        due = [a for a in s["assignments"] if a["status"] == "pending"]
        return {"reply": "\n".join(f"• {a['due']}: {a['subject']}, {a['title']}" for a in due) or "Nothing due.", "actions": []}
    return {"reply": f"{who} {term['label']} average is {avg}%, position {s['position']} of {s['class_size']}.",
            "actions": [{"label": "Open results", "route": "#/results"}]}


@app.post("/api/v1/crestbot/chat")
def crestbot_chat(body: ChatIn, user: dict = Depends(current_user)):
    s = student_for(body.student_id, user)
    out = crestbot_reply(s, body.message, user["role"])
    return {**out, "suggestions": crestbot_suggestions(body.student_id, user)["suggestions"], "source": "rules"}


@app.get("/api/v1/crestbot/suggestions")
def crestbot_suggestions(student_id: str = Query(...), user: dict = Depends(current_user)):
    student_for(student_id, user)
    return {"suggestions": ["How am I doing?", "What is due this week?", "Fees balance"] if user["role"] == "learner"
            else ["How is my child doing?", "Fees balance", "Homework due"]}


class FeedbackIn(BaseModel):
    student_id: str
    message: str
    reply: str
    helpful: bool


@app.post("/api/v1/crestbot/feedback", status_code=204)
def crestbot_feedback(body: FeedbackIn, user: dict = Depends(current_user)):
    student_for(body.student_id, user)      # stored for improving Kudzi; nothing kept in the reference server


# ───────────────────── Royal Crest Connect (app) hooks ─────────────────────
class DeviceIn(BaseModel):
    platform: Literal["android", "ios", "web"]
    push_token: str = Field(..., max_length=4096)
    student_ids: list[str] = []


@app.post("/api/v1/devices", status_code=201)
def register_device(body: DeviceIn, user: dict = Depends(current_user)):
    allowed = [x for x in body.student_ids if x in user["students"]] or user["students"]
    device_id = secrets.token_hex(8)
    DEVICES[device_id] = {"platform": body.platform, "push_token": body.push_token, "student_ids": allowed}
    return {"device_id": device_id, "student_ids": allowed}


@app.get("/api/v1/sync")
def sync(since: Optional[str] = None, user: dict = Depends(current_user)):
    """Delta feed for the app's offline cache: what changed since the last cursor."""
    changes = [{"type": "notice", "id": n["id"], "at": n["date"]} for n in DATA["notices"] if not since or n["date"] > since]
    return {"cursor": datetime.now(timezone.utc).date().isoformat(), "changes": changes}
