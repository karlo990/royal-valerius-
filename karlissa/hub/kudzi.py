"""Kudzi, the Crestbot, server side.

1. School FAQs the staff teach Kudzi in the dashboard (Memory → Kudzi FAQs).
2. Rules that answer from the signed-in learner's own records (the same rules as the portal).
3. Optional AI model for open questions (KUDZI_LLM=ollama uses the model in this Space).
   It only ever sees this one learner's summary, never anyone else's data.
"""
from __future__ import annotations

import json
import re
import urllib.request
from datetime import date, timedelta

from . import config

TIPS = {
    "titration": "Titration finds an unknown concentration. Fill the burette, read the bottom of the meniscus at eye level, and add "
                 "drop by drop while swirling. The end point is the first permanent colour change: pale pink with phenolphthalein. "
                 "Repeat until two titres agree within 0.10 cm³, then average them.",
    "revise": "Try 25-minute focus blocks with 5-minute breaks, then test yourself with past papers instead of re-reading notes. "
              "Explain each topic out loud, as if teaching a friend. That is the fastest way to find gaps.",
}


def _day(iso: str) -> str:
    d = date.fromisoformat(iso)
    return d.strftime("%a %d %b").replace(" 0", " ")


def suggestions(role: str) -> list[str]:
    return (["How is my child doing?", "Fees balance", "Homework due", "Attendance", "Weakest subject"] if role == "parent"
            else ["How am I doing?", "What is due this week?", "Today's lessons", "My skill progress", "Explain titration"])


def faq_answer(msg: str, faqs: list[dict]) -> str | None:
    m = msg.lower()
    best, score = None, 0
    for f in faqs:
        keys = [k.strip().lower() for k in re.split(r"[,;|]", f["key"]) if k.strip()]
        hits = sum(1 for k in keys if k and k in m)
        if hits > score:
            best, score = f["value"], hits
    return best


def rules(msg: str, ctx: dict) -> dict | None:
    m = msg.lower().strip()
    s, role = ctx["student"], ctx["role"]
    me = role == "learner"
    who = "you" if me else s["first"]
    your = "your" if me else f"{s['first']}'s"
    Your = "Your" if me else f"{s['first']}'s"
    term = ctx.get("term") or {"label": "this term", "subjects": []}
    subs = term["subjects"]
    ranked = sorted(subs, key=lambda x: -x["total"])
    has = lambda pat: re.search(pat, m) is not None  # noqa: E731
    subject = next((x for x in subs if x["name"].lower() in m or x["name"].lower().split()[0] in m or f"{x['code'].lower()} " in f"{m} "), None)

    if has(r"^(hi|hello|hey|mhoro|makadii|good (morning|afternoon|evening))\b"):
        extra = " or fees" if role == "parent" else ""
        return {"reply": f"Hello{' ' + s['first'] if me else ''}! I'm Kudzi, the Crestbot. Ask me about {your} marks, homework, timetable, attendance{extra}."}
    if has(r"help|what can you|who are you"):
        return {"reply": f"I can tell {who} about: term marks and grades, the best and weakest subjects, homework due, today's lessons, attendance, "
                         f"{'fees balance, ' if role == 'parent' else ''}skills progress and school notices. I also give quick study tips, e.g. \"explain titration\"."}
    if has(r"titrat"):
        return {"reply": TIPS["titration"]}
    if has(r"revis|study tip|how (do|can) i study|exam prep"):
        return {"reply": TIPS["revise"]}
    if subject:
        d = subject["total"] - subject["class_avg"]
        return {"reply": f"{subject['name']}: **{subject['total']}%** (grade {subject['grade']}). CA {subject['ca']}/40, exam {subject['exam']}/60, "
                         f"class average {subject['class_avg']}%, so {abs(d)} points {'above' if d >= 0 else 'below'} average. "
                         f"{subject['teacher']} says: “{subject['comment']}”", "actions": [{"label": "Open results", "route": "#/results"}]}
    if not subs and has(r"best|weak|average|how (am i|is|are)|perform|overall|progress|doing|marks|results|grade|position|rank"):
        return {"reply": f"{Your} results for this term are not published yet. I'll have them as soon as the school publishes them.",
                "actions": [{"label": "Open results", "route": "#/results"}]}
    if has(r"best|strongest|top subject|favourite"):
        return {"reply": f"{Your} strongest subjects are " + ", ".join(f"{x['name']} ({x['total']}%)" for x in ranked[:3]) + ". 🏆"}
    if has(r"weak|worst|improve|struggl|lowest|fail"):
        low = list(reversed(ranked[-2:]))
        return {"reply": f"{'Focus' if me else s['first'] + ' could focus'} on " + " and ".join(f"{x['name']} ({x['total']}%)" for x in low)
                         + f". Tip: ask {low[0]['teacher'] or 'the subject teacher'} for past-paper practice; 20 minutes a day makes a real difference.",
                "actions": [{"label": "See all subjects", "route": "#/results"}]}
    if has(r"average|how (am i|is|are)|perform|overall|progress|doing|marks|results|grade"):
        avg = round(sum(x["total"] for x in subs) / len(subs))
        tr = s.get("trend") or []
        delta = (tr[-1]["avg"] - tr[0]["avg"]) if len(tr) > 1 else 0
        trend_txt = f", {'up' if delta >= 0 else 'down'} {abs(delta)} points since {tr[0]['label']}" if len(tr) > 1 else ""
        return {"reply": f"{Your} {term['label']} average is **{avg}%**{trend_txt}. Position {s['position']} of {s['class_size']} in {s['stream']}. "
                         f"Best: {ranked[0]['name']} ({ranked[0]['total']}%).", "actions": [{"label": "View progress", "route": "#/overview"}]}
    if has(r"position|rank|place|number in class"):
        return {"reply": f"{Your} class position is **{s['position']} of {s['class_size']}** in {s['stream']}."}
    if has(r"homework|assignment|due|deadline|task"):
        open_ = sorted((a for a in ctx["assignments"] if a["status"] == "pending"), key=lambda a: a["due"])
        if not open_:
            return {"reply": "Nothing due right now. 🎉"}
        return {"reply": f"{len(open_)} task{'s' if len(open_) > 1 else ''} due:\n" + "\n".join(f"• {_day(a['due'])}: {a['subject']}, {a['title']}" for a in open_),
                "actions": [{"label": "Open overview", "route": "#/overview"}]}
    if has(r"fee|balance|owe|pay|invoice|money"):
        f = ctx["fees"]
        if f["balance"] > 0:
            return {"reply": f"{f['term']}: invoiced US${f['invoiced']}, paid US${f['paid']}. **Balance US${f['balance']}** (due {_day(f['due'])}). "
                             f"Pay at the bursar's office or on the RCA Portal app.", "actions": [{"label": "Open fees", "route": "#/fees"}]}
        return {"reply": f"{f['term']} fees are fully paid (US${f['paid']}). Thank you! ✅", "actions": [{"label": "Open fees", "route": "#/fees"}]}
    if has(r"attend|absent|late|present|missed|bunk"):
        a = ctx["attendance"]
        if not a:
            return {"reply": "No register entries yet this term."}
        n = lambda k: sum(1 for d in a if d["status"] == k)  # noqa: E731
        rate = round((n("present") + n("late")) * 100 / len(a))
        return {"reply": f"Attendance this term: **{rate}%**. {n('present')} present, {n('late')} late, {n('absent')} absent, {n('excused')} excused "
                         f"out of {len(a)} school days.", "actions": [{"label": "Open attendance", "route": "#/attendance"}]}
    if has(r"today|tomorrow|timetable|lesson|schedule|next class|period"):
        d = date.fromisoformat(ctx["today"]) + timedelta(days=1 if has(r"tomorrow") else 0)
        name = d.strftime("%a")
        row = next((r for r in ctx["timetable"] if r["day"] == name), None)
        if not row:
            return {"reply": "No lessons that day. Enjoy the weekend!" if ctx["timetable"] else "The timetable for this class is not on the portal yet."}
        return {"reply": f"{'Tomorrow' if has(r'tomorrow') else 'Today'} ({name}):\n" + "\n".join(f"• {p['start']} {p['subject']} · {p['room']}" for p in row["periods"]),
                "actions": [{"label": "Full timetable", "route": "#/timetable"}]}
    if has(r"skill|trade|bak|weld|solar|carpent|cosmet|xp|level|badge"):
        act = next((k for k in ctx["skills"] if k["status"] == "active"), None)
        nxt = next((k for k in ctx["skills"] if k["status"] == "locked"), None)
        return {"reply": f"Level {s['level']}, {s['xp']:,} XP ({s['next_level_xp'] - s['xp']} to level {s['level'] + 1}). "
                         + (f"Current trade: **{act['trade']}**, {round(act['progress'] * 100)}% complete. " if act else "")
                         + f"Next to unlock: {nxt['trade'] if nxt else 'all unlocked!'}.", "actions": [{"label": "Open skill tree", "route": "#/skills"}]}
    if has(r"notice|news|event|visit|announcement"):
        ns = ctx["notices"][:3]
        return {"reply": "\n".join(f"• {_day(n['date'])}: {n['title']}" for n in ns) or "No notices right now.",
                "actions": [{"label": "All notices", "route": "#/notices"}]}
    if has(r"contact|phone|call|whatsapp|office"):
        ph = config.SCHOOL["phones"][0]["number"]
        return {"reply": f"School office: {ph} (call or WhatsApp). Class teacher: {s['class_teacher']}. Email: {config.SCHOOL['email']}."}
    if has(r"thank|thanks|ndatenda"):
        return {"reply": "Any time! Keep levelling up. 👑"}
    return None


def llm_answer(msg: str, ctx: dict, history: list[dict]) -> str | None:
    if config.KUDZI_LLM != "ollama":
        return None
    s, term = ctx["student"], ctx.get("term") or {}
    facts = {
        "learner": {k: s[k] for k in ("first", "form", "stream", "house", "level", "position", "class_size")},
        "term": term.get("label"),
        "marks": [{"subject": x["name"], "total": x["total"], "grade": x["grade"]} for x in term.get("subjects", [])],
        "fees_balance_usd": ctx["fees"]["balance"] if ctx["role"] == "parent" else None,
        "homework_due": [f"{a['due']}: {a['subject']} - {a['title']}" for a in ctx["assignments"] if a["status"] == "pending"][:5],
    }
    system = (
        f"You are Kudzi, the friendly Crestbot of {config.SCHOOL['name']} in Masvingo, Zimbabwe. "
        f"You are talking to {'the learner' if ctx['role'] == 'learner' else 'a parent of ' + s['first']}. "
        "Answer in at most 4 short sentences, warmly and accurately. Use only the facts below about this learner; if you do not "
        "know something, say so and suggest calling the school office on " + config.SCHOOL["phones"][0]["number"] + ". "
        "Never invent marks, fees or dates. For general study questions, give a clear, correct explanation for a secondary-school learner.\n"
        "FACTS: " + json.dumps(facts, ensure_ascii=False))
    msgs = [{"role": "system", "content": system}]
    msgs += [{"role": h.get("role", "user"), "content": str(h.get("content", ""))[:600]} for h in history[-6:] if h.get("role") in ("user", "assistant")]
    msgs.append({"role": "user", "content": msg[:800]})
    body = json.dumps({"model": config.KUDZI_MODEL, "messages": msgs, "stream": False,
                       "options": {"temperature": 0.3, "num_predict": 200}}).encode()
    try:
        req = urllib.request.Request(config.KUDZI_LLM_URL, data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=config.KUDZI_LLM_TIMEOUT) as r:
            out = json.loads(r.read().decode())
        text = ((out.get("message") or {}).get("content") or "").strip()
        return text or None
    except Exception:
        return None


def answer(msg: str, ctx: dict, history: list[dict], faqs: list[dict]) -> dict:
    hit = faq_answer(msg, faqs)
    if hit:
        return {"reply": hit, "actions": [], "source": "faq"}
    r = rules(msg, ctx)
    if r:
        return {"actions": [], **r, "source": "rules"}
    ai = llm_answer(msg, ctx, history)
    if ai:
        return {"reply": ai, "actions": [], "source": "ai"}
    return {"reply": "I'm still learning that one. Try asking about marks, homework, fees, attendance, the timetable or skills, or call the "
                     f"school office on {config.SCHOOL['phones'][0]['number']}.", "actions": [], "source": "fallback"}
