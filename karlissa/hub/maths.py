"""Crest Slate: maths help from this Space's own model (phi4-mini through Ollama).

The page (/portal/slate/) reads the question from a photo in the browser (OCR), lets the learner
fix the text, then calls POST /api/v1/maths/solve. Three modes:
  solve  worked solution, step by step, the way a Cambridge examiner gives method marks
  hint   one step at a time, never the final answer (learner-first)
  check  marks the learner's own working and points to the first mistake
The page double-checks final answers itself (it substitutes x back in), because a small model can slip.
Turn it on with MATHS_LLM=ollama (it follows KUDZI_LLM by default).
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from . import config
from .auth import portal_user, staff_user
from .events import BROKER
from .security import RateLimiter

router = APIRouter(prefix="/api/v1/maths", tags=["maths"])

# Cambridge IGCSE (0580) / O Level (4024) Mathematics: the nine topic areas
TOPICS = ["Number", "Algebra and graphs", "Coordinate geometry", "Geometry", "Mensuration",
          "Trigonometry", "Transformations and vectors", "Probability", "Statistics"]
LEVELS = {"cambridge-igcse": "Cambridge IGCSE Mathematics (0580)", "cambridge-olevel": "Cambridge O Level Mathematics (4024)",
          "zimsec-olevel": "ZIMSEC O Level Mathematics (4004)"}
PER_USER = RateLimiter(limit=config.MATHS_PER_HOUR, window=60 * 60)


def maths_user(request: Request) -> dict:
    """Signed-in learners and parents (portal) or staff (dashboard)."""
    try:
        return portal_user(request)
    except HTTPException:
        pass
    try:
        return {**staff_user(request), "role": "staff"}
    except HTTPException:
        raise HTTPException(401, "Please sign in to use Crest Slate.")


class SolveIn(BaseModel):
    question: str = Field(..., min_length=1, max_length=1500)
    mode: Literal["solve", "hint", "check"] = "solve"
    working: str = Field("", max_length=2000)          # the learner's own working, for "check"
    step: int = Field(0, ge=0, le=12)                    # which hint to give (0 = first)
    topic: str = Field("", max_length=60)
    level: Literal["cambridge-igcse", "cambridge-olevel", "zimsec-olevel"] = "cambridge-igcse"


def _system(body: SolveIn) -> str:
    base = (f"You are Crest Slate, a careful, encouraging mathematics tutor for {LEVELS[body.level]} learners at "
            f"{config.SCHOOL['name']} in Zimbabwe. The question may come from a photo read by OCR: silently fix obvious OCR slips "
            "(e.g. 'x2' meaning x squared, 'S' meaning 5). Write every mathematical expression in LaTeX WITHOUT dollar signs. "
            f"Choose the topic from: {', '.join(TOPICS)}. Reply with JSON only. ")
    if body.mode == "hint":
        return base + ("Give ONLY hint number " + str(body.step + 1) + " towards solving it: one small next step as a short guiding sentence, "
                       "never the final answer. JSON: {\"topic\": \"...\", \"hint\": \"...\", \"math\": \"LaTeX for this step or empty\", \"last\": true|false}")
    if body.mode == "check":
        return base + ("Mark the learner's working below. Say whether the final answer is right, and if not, where the first mistake is. "
                       "JSON: {\"topic\": \"...\", \"verdict\": \"correct\"|\"partly\"|\"incorrect\", \"feedback\": \"two or three kind sentences\", "
                       "\"first_error\": \"the first wrong line, or empty\", \"answer\": \"the correct final answer in LaTeX\"}")
    return base + ("Solve it step by step, showing the working an examiner gives method marks for, in at most 8 steps. "
                   "JSON: {\"topic\": \"...\", \"steps\": [{\"text\": \"short sentence\", \"math\": \"LaTeX\"}], "
                   "\"answer\": \"final answer in LaTeX\", \"solution\": \"for an equation in one unknown, e.g. x=4, else empty\"}")


def _ollama(system: str, user: str) -> str:
    body = json.dumps({"model": config.MATHS_MODEL, "stream": False, "format": "json",
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                       "options": {"temperature": 0.1, "num_predict": 900}}).encode()
    req = urllib.request.Request(config.MATHS_LLM_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=config.MATHS_LLM_TIMEOUT) as r:
        return ((json.loads(r.read().decode()).get("message") or {}).get("content") or "").strip()


def _parse(raw: str) -> dict:
    try:
        return json.loads(raw)
    except ValueError:
        m = re.search(r"\{.*\}", raw, re.S)          # model wrapped the JSON in words
        if m:
            try:
                return json.loads(m.group(0))
            except ValueError:
                pass
    return {"steps": [{"text": raw[:1500], "math": ""}], "answer": ""}


def _clean(mode: str, out: dict) -> dict:
    s = lambda v, n=600: str(v or "")[:n]          # noqa: E731
    topic = out.get("topic") if out.get("topic") in TOPICS else ""
    if mode == "hint":
        return {"topic": topic, "hint": s(out.get("hint")), "math": s(out.get("math")), "last": bool(out.get("last"))}
    if mode == "check":
        v = out.get("verdict") if out.get("verdict") in ("correct", "partly", "incorrect") else "partly"
        return {"topic": topic, "verdict": v, "feedback": s(out.get("feedback"), 900), "first_error": s(out.get("first_error")), "answer": s(out.get("answer"))}
    steps = [{"text": s(x.get("text"), 400), "math": s(x.get("math"), 400)} for x in (out.get("steps") or []) if isinstance(x, dict)][:10]
    return {"topic": topic, "steps": steps, "answer": s(out.get("answer")), "solution": s(out.get("solution"), 80)}


@router.get("/status")
def status(user: dict = Depends(maths_user)):
    return {"ai": config.MATHS_LLM == "ollama", "model": config.MATHS_MODEL if config.MATHS_LLM == "ollama" else None,
            "topics": TOPICS, "levels": LEVELS, "per_hour": config.MATHS_PER_HOUR}


@router.post("/solve")
def solve(body: SolveIn, user: dict = Depends(maths_user)):
    if config.MATHS_LLM != "ollama":
        raise HTTPException(503, "The maths AI is switched off on the hub (set MATHS_LLM=ollama). Crest Slate can still check simple equations itself.")
    key = str(user.get("id"))
    wait = PER_USER.blocked(key)
    if wait:
        raise HTTPException(429, f"That's a lot of questions! Try again in {wait // 60 + 1} minutes.")
    PER_USER.fail(key)                                # every request counts towards the hourly limit
    prompt = f"QUESTION:\n{body.question}"
    if body.topic:
        prompt += f"\nTOPIC (from the learner): {body.topic}"
    if body.mode == "check":
        prompt += f"\nLEARNER'S WORKING:\n{body.working or '(none given)'}"
    t0 = time.time()
    try:
        out = _clean(body.mode, _parse(_ollama(_system(body), prompt)))
    except Exception:
        raise HTTPException(502, "The maths model didn't answer in time. Try again, or ask for a hint.")
    BROKER.publish({"type": "maths", "summary": f"Crest Slate {body.mode} for {user.get('name', 'someone')}: “{body.question[:60]}”", "source": "ai"})
    return {**out, "mode": body.mode, "model": config.MATHS_MODEL, "ms": int((time.time() - t0) * 1000)}
