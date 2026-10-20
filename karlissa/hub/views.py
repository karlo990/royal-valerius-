"""Builds the learner payloads the portal shows. The shapes match portal/api/openapi.json
exactly, so the portal works the same on demo data and on this server."""
from __future__ import annotations

import sqlite3
from datetime import date, timedelta

from . import db

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
XP_PER_LEVEL = 350


def grade(m: float) -> str:
    return "A" if m >= 75 else "B" if m >= 65 else "C" if m >= 50 else "D" if m >= 45 else "E" if m >= 40 else "U"


def full_name(L: dict) -> str:
    return f"{L['first']} {L['last']}".strip()


def current_term(c: sqlite3.Connection) -> dict | None:
    r = c.execute("SELECT * FROM terms WHERE current=1 ORDER BY starts DESC LIMIT 1").fetchone() \
        or c.execute("SELECT * FROM terms ORDER BY starts DESC, id DESC LIMIT 1").fetchone()
    return dict(r) if r else None


def _term_avgs(c: sqlite3.Connection, term_id: str, form: int) -> dict:
    return {r["code"]: round(r["a"]) for r in c.execute(
        "SELECT r.code, AVG(COALESCE(r.ca,0)+COALESCE(r.exam,0)) a FROM results r JOIN learners l ON l.id=r.learner_id "
        "WHERE r.term_id=? AND l.form=? AND l.status='active' GROUP BY r.code", (term_id, form))}


def results(c: sqlite3.Connection, L: dict) -> list[dict]:
    terms = [dict(t) for t in c.execute("SELECT * FROM terms ORDER BY starts, id")]
    out = []
    for t in terms:
        rs = c.execute("SELECT r.*, s.teacher AS s_teacher, s.name AS s_name FROM results r LEFT JOIN subjects s ON s.code=r.code "
                       "WHERE r.learner_id=? AND r.term_id=? ORDER BY r.rowid", (L["id"], t["id"])).fetchall()
        if not rs and not t["current"]:
            continue
        subs = []
        if t["published"]:        # unpublished marks never leave the server
            avgs = _term_avgs(c, t["id"], L["form"])
            for r in rs:
                ca, ex = r["ca"] or 0, r["exam"] or 0
                total = int(round(min(100, ca + ex)))
                subs.append({"code": r["code"], "name": r["name"] or r["s_name"] or r["code"], "teacher": r["teacher"] or r["s_teacher"] or "",
                             "ca": int(round(ca)), "exam": int(round(ex)), "total": total, "grade": grade(total),
                             "comment": r["comment"] or "", "class_avg": avgs.get(r["code"], total)})
        out.append({"term": t["id"], "label": t["label"], "published": bool(t["published"]), "subjects": subs})
    return out


def _avg(c: sqlite3.Connection, lid: str, term_id: str) -> float | None:
    return db_scalar(c, "SELECT AVG(MIN(100, COALESCE(ca,0)+COALESCE(exam,0))) FROM results WHERE learner_id=? AND term_id=?", (lid, term_id))


def db_scalar(c: sqlite3.Connection, sql: str, args=()):
    r = c.execute(sql, args).fetchone()
    return r[0] if r else None


def position(c: sqlite3.Connection, L: dict) -> tuple:
    stream = L["stream"] or str(L["form"])
    size = db_scalar(c, "SELECT COUNT(*) FROM learners WHERE status='active' AND COALESCE(stream, CAST(form AS TEXT))=?", (stream,)) or 1
    t = c.execute("SELECT id FROM terms WHERE published=1 ORDER BY starts DESC, id DESC LIMIT 1").fetchone()
    if not t:
        return "—", size
    ranking = c.execute(
        "SELECT r.learner_id, AVG(MIN(100, COALESCE(r.ca,0)+COALESCE(r.exam,0))) a FROM results r JOIN learners l ON l.id=r.learner_id "
        "WHERE r.term_id=? AND l.status='active' AND COALESCE(l.stream, CAST(l.form AS TEXT))=? GROUP BY r.learner_id ORDER BY a DESC",
        (t["id"], stream)).fetchall()
    ids = [r["learner_id"] for r in ranking]
    return (ids.index(L["id"]) + 1 if L["id"] in ids else "—"), max(size, len(ids))


def trend(c: sqlite3.Connection, L: dict) -> list[dict]:
    pts = []
    for t in c.execute("SELECT id, label FROM terms WHERE published=1 ORDER BY starts, id"):
        a = _avg(c, L["id"], t["id"])
        if a is not None:
            short = t["label"].replace("Term ", "T").replace(" · ", " '").replace("'20", "'")
            pts.append({"label": short, "avg": int(round(a))})
    return pts


def summary(c: sqlite3.Connection, L: dict) -> dict:
    lvl = (L["xp"] or 0) // XP_PER_LEVEL + 1
    pos, size = position(c, L)
    return {
        "id": L["id"], "admission_no": L["id"], "name": full_name(L), "first": L["first"], "last": L["last"],
        "form": f"Form {L['form']}", "form_no": L["form"], "stream": L["stream"] or f"Form {L['form']}",
        "house": L["house"] or "—", "residence": L["residence"] or "Day scholar", "hostel": L["hostel"] or None,
        "class_teacher": L["class_teacher"] or "—", "xp": L["xp"] or 0, "level": lvl, "next_level_xp": lvl * XP_PER_LEVEL,
        "merits": L["merits"] or 0, "demerits": L["demerits"] or 0, "position": pos, "class_size": size,
        "trend": trend(c, L), "status": L["status"],
    }


def attendance(c: sqlite3.Connection, L: dict) -> list[dict]:
    t = current_term(c)
    lo = (t or {}).get("starts") or (date.today() - timedelta(days=120)).isoformat()
    hi = (t or {}).get("ends") or "9999-12-31"
    return [{"date": r["date"], "status": r["status"]} for r in c.execute(
        "SELECT date, status FROM attendance WHERE learner_id=? AND date BETWEEN ? AND ? ORDER BY date", (L["id"], lo, hi))]


def timetable(c: sqlite3.Connection, L: dict) -> list[dict]:
    cls = L["stream"] or f"Form {L['form']}"
    rs = c.execute("SELECT * FROM timetable WHERE class=? ORDER BY start", (cls,)).fetchall()
    if not rs:
        return []
    starts = sorted({r["start"] for r in rs})
    by = {(r["day"], r["start"]): r for r in rs}
    out = []
    for d in DAYS:
        periods = []
        for s in starts:
            r = by.get((d, s))
            periods.append({"start": s, "code": r["code"] if r else "", "subject": (r["subject"] if r else "") or "Free",
                            "teacher": (r["teacher"] if r else "") or "", "room": (r["room"] if r else "") or ""})
        out.append({"day": d, "periods": periods})
    return out


def assignments(c: sqlite3.Connection, L: dict) -> list[dict]:
    since = (date.today() - timedelta(days=21)).isoformat()
    rs = c.execute(
        "SELECT a.*, COALESCE(s.status,'pending') st FROM assignments a LEFT JOIN submissions s ON s.assignment_id=a.id AND s.learner_id=? "
        "WHERE a.form=? AND (a.stream IS NULL OR a.stream='' OR a.stream=?) AND (a.due>=? OR COALESCE(s.status,'pending')='pending') "
        "ORDER BY a.due", (L["id"], L["form"], L["stream"] or "", since)).fetchall()
    return [{"id": str(r["id"]), "subject": r["subject"], "title": r["title"], "details": r["details"] or "",
             "due": r["due"], "status": r["st"]} for r in rs]


def skills(c: sqlite3.Connection, L: dict) -> list[dict]:
    own = {r["form"]: dict(r) for r in c.execute("SELECT * FROM skills WHERE learner_id=?", (L["id"],))}
    out = []
    for t in c.execute("SELECT form, trade FROM trades ORDER BY form"):
        f = t["form"]
        if f in own:
            s = own[f]
            out.append({"form": f, "trade": s["trade"] or t["trade"], "status": s["status"], "progress": s["progress"] or 0,
                        **({"badge": s["badge"]} if s["badge"] else {})})
        else:
            st = "done" if f < L["form"] else "active" if f == L["form"] else "locked"
            out.append({"form": f, "trade": t["trade"], "status": st, "progress": 1 if st == "done" else 0})
    return out


def fee_lines(c: sqlite3.Connection, L: dict, term_id: str) -> list[list]:
    res = (L["residence"] or "").lower()
    kind = "boarder" if res.startswith("board") else "day"
    return [[r["item"], r["amount"]] for r in c.execute(
        "SELECT item, amount FROM fee_items WHERE term_id=? AND applies_to IN ('all', ?) ORDER BY rowid", (term_id, kind))]


def fees(c: sqlite3.Connection, L: dict) -> dict:
    t = current_term(c)
    if not t:
        return {"currency": "USD", "term": "No term set", "due": db.today(), "lines": [], "invoiced": 0, "paid": 0, "balance": 0,
                "brought_forward": 0, "payments": []}
    lines = fee_lines(c, L, t["id"])
    # unpaid balance from earlier terms
    bf = 0.0
    for p in c.execute("SELECT id FROM terms WHERE COALESCE(starts,'') < COALESCE(?, '') AND id<>?", (t["starts"], t["id"])):
        inv = sum(v for _, v in fee_lines(c, L, p["id"]))
        if inv:
            paid_p = db_scalar(c, "SELECT COALESCE(SUM(amount),0) FROM payments WHERE learner_id=? AND term_id=?", (L["id"], p["id"])) or 0
            bf += inv - paid_p
    bf = max(0.0, bf)
    if bf:
        lines.append(["Balance brought forward", bf])
    invoiced = sum(v for _, v in lines)
    pays = [dict(r) for r in c.execute("SELECT date, amount, ref, method FROM payments WHERE learner_id=? AND term_id=? ORDER BY date",
                                        (L["id"], t["id"]))]
    paid = sum(p["amount"] for p in pays)
    num = lambda v: int(v) if float(v).is_integer() else round(v, 2)  # noqa: E731
    return {"currency": "USD", "term": t["label"], "term_id": t["id"], "due": t["fees_due"] or t["starts"] or db.today(),
            "lines": [[k, num(v)] for k, v in lines], "invoiced": num(invoiced), "paid": num(paid),
            "balance": num(max(0.0, invoiced - paid)), "brought_forward": num(bf),
            "payments": [{**p, "amount": num(p["amount"])} for p in pays]}


def notices_for(c: sqlite3.Connection, role: str, learners: list[dict]) -> list[dict]:
    aud = {"all", "parents" if role == "parent" else "learners"}
    aud |= {f"form:{L['form']}" for L in learners} | {f"learner:{L['id']}" for L in learners}
    q = ",".join("?" * len(aud))
    return [{"id": f"n{r['id']}", "date": r["date"], "title": r["title"], "body": r["body"] or "", "tag": r["tag"] or "General",
             "pinned": bool(r["pinned"]), "personal": r["audience"].startswith("learner:")}
            for r in c.execute(f"SELECT * FROM notices WHERE audience IN ({q}) ORDER BY pinned DESC, date DESC, id DESC LIMIT 40", list(aud))]


def everything(c: sqlite3.Connection, L: dict) -> dict:
    return {**summary(c, L), "results": results(c, L), "attendance": attendance(c, L), "timetable": timetable(c, L),
            "assignments": assignments(c, L), "skills": skills(c, L), "fees": fees(c, L)}
