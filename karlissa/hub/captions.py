"""Caption Desk: Facebook, WhatsApp and Instagram captions in the school's house style,
written by this Space's own model (phi4-mini through Ollama). Staff only.

POST /api/v1/captions  {about, kind, platform, length, facts}  →  {caption, status, hashtags[]}
The page is /studio/captions/. Turn it on with CAPTIONS_LLM=ollama (it follows KUDZI_LLM by default).
"""
from __future__ import annotations

import json
import re
import urllib.request
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from . import config
from .auth import staff_user
from .events import BROKER
from .security import RateLimiter

router = APIRouter(prefix="/api/v1/captions", tags=["captions"])
PER_USER = RateLimiter(limit=config.CAPTIONS_PER_HOUR, window=60 * 60)
PHONE = "+263 714 404 090"

# The house style, learned from the captions the school has approved
STYLE = (
    "House style: open with one striking fact or hook in the first line. Keep it short and warm. "
    "Use at most one emoji per line, and never the surprised-face emoji. Never start with 'Wait'. "
    "British spelling. Don't call staff 'teacher' by name unless the facts do. Never invent fees, dates, results or numbers "
    "that are not in the facts given. Name the school as Royal Crest Academy, Bikita, Masvingo, Zimbabwe."
)
KINDS = {
    "post": f"A school marketing post. End with '📞 {PHONE}' on its own line, then the hashtags.",
    "film": f"A post for a short educational film the school made. Tease what viewers will learn. End with '📞 {PHONE}', then the hashtags.",
    "lesson": f"A post that teaches one small idea (a fact, a quiz or a how-to). If it asks a question, invite answers in the comments. End with '📞 {PHONE}', then the hashtags.",
    "event": f"An announcement of a school event. Put what, when and where clearly, using only the facts given. End with '📞 {PHONE}', then the hashtags.",
    "devotion": "A morning devotion or verse of the day. Gentle and prayerful. NO phone number, NO enrolment or sales lines. Quote the scripture exactly as given. "
                "End with a short blessing, then '💙💛' and the hashtags #RoyalCrestAcademy #VerseOfTheDay.",
    "reply": "A short, gracious public reply to a comment on the school's page (one to three sentences). No phone number unless the facts ask for it. Two hashtags at most.",
}


class CaptionIn(BaseModel):
    about: str = Field(..., min_length=3, max_length=1500)        # what the post is about
    facts: str = Field("", max_length=2500)                        # anything that must be included, exactly
    kind: Literal["post", "film", "lesson", "event", "devotion", "reply"] = "post"
    platform: Literal["facebook", "whatsapp", "instagram"] = "facebook"
    length: Literal["short", "long"] = "short"


def _ollama(system: str, user: str) -> str:
    body = json.dumps({"model": config.CAPTIONS_MODEL, "stream": False, "format": "json",
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                       "options": {"temperature": 0.6, "num_predict": 700}}).encode()
    req = urllib.request.Request(config.CAPTIONS_LLM_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=config.CAPTIONS_LLM_TIMEOUT) as r:
        return ((json.loads(r.read().decode()).get("message") or {}).get("content") or "").strip()


def _parse(raw: str) -> dict:
    for text in (raw, (re.search(r"\{.*\}", raw, re.S) or [None])[0] if raw else None):
        if text:
            try:
                return json.loads(text)
            except ValueError:
                pass
    return {"caption": raw}


def _tidy(text: str, kind: str) -> str:
    text = re.sub(r"^\s*wait[,.!:]?\s*", "", str(text or ""), flags=re.I).replace("😮", "").replace("😲", "")
    if kind == "devotion":          # devotions carry no sales lines, whatever the model wrote
        text = "\n".join(l for l in text.splitlines() if PHONE not in l and not re.search(r"enrol|admission|fees|call or whatsapp", l, re.I))
    return re.sub(r"\n{3,}", "\n\n", text).strip()[:2200]


@router.post("")
def write_caption(body: CaptionIn, user: dict = Depends(staff_user)):
    if config.CAPTIONS_LLM != "ollama":
        raise HTTPException(503, "The caption AI is switched off on the hub (set CAPTIONS_LLM=ollama).")
    key = f"staff:{user['id']}"
    wait = PER_USER.blocked(key)
    if wait:
        raise HTTPException(429, f"That's plenty of captions for now. Try again in {wait // 60 + 1} minutes.")
    PER_USER.fail(key)
    words = "about 40 to 70 words" if body.length == "short" else "about 90 to 150 words"
    system = (f"You write social media captions for Royal Crest Academy, a new private secondary school (opening January 2027). {STYLE} "
              f"This is for {body.platform.title()}. {KINDS[body.kind]} The main caption should be {words}. "
              "Reply with JSON only: {\"caption\": \"the full caption with line breaks\", \"status\": \"a one-line version for WhatsApp Status, under 25 words\", "
              "\"hashtags\": [\"#RoyalCrestAcademy\", \"...\"]}")
    user_msg = f"THE POST IS ABOUT:\n{body.about}" + (f"\n\nFACTS TO USE (exactly, don't add others):\n{body.facts}" if body.facts else "")
    try:
        out = _parse(_ollama(system, user_msg))
    except Exception:
        raise HTTPException(502, "The caption model didn't answer in time. Try again.")
    tags = [t if t.startswith("#") else f"#{t}" for t in (out.get("hashtags") or []) if isinstance(t, str) and re.fullmatch(r"#?\w{2,40}", t)][:5]
    if "#RoyalCrestAcademy" not in tags:
        tags = ["#RoyalCrestAcademy", *tags][:5]
    BROKER.publish({"type": "captions", "summary": f"Caption Desk: {body.kind} for {body.platform} by {user['name']}", "source": "ai"})
    return {"caption": _tidy(out.get("caption"), body.kind), "status": _tidy(out.get("status"), body.kind)[:300], "hashtags": tags,
            "model": config.CAPTIONS_MODEL}
