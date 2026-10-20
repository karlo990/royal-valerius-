"""Demo learners for a new hub: the same two learners and parent as the portal demo,
moved forward in time so the dates look current. Everything is flagged demo=1 and can be
removed from the dashboard (Settings → Demo data) before real learners go in."""
from __future__ import annotations

import json
from datetime import date, timedelta

from . import config, db
from .security import norm_phone

DEMO_TODAY = date(2027, 3, 10)
DEMO_PHONE = "0771234567"


def _terms(today: date) -> list[tuple]:
    """Two demo terms: the last one (published) and this one (results not published yet)."""
    shift = (today - DEMO_TODAY).days
    t1s, t1e = date(2027, 1, 11) + timedelta(shift), DEMO_TODAY + timedelta(shift)
    year = t1s.year
    return [
        ("DEMO-PREV", f"Term 1 · {year} (demo)", (t1s - timedelta(days=100)).isoformat(), (t1s - timedelta(days=30)).isoformat(), None, 1, 0),
        ("DEMO-NOW", f"Term 2 · {year} (demo)", t1s.isoformat(), (t1e + timedelta(days=40)).isoformat(), (t1s + timedelta(days=4)).isoformat(), 0, 1),
    ]


def load_demo() -> dict:
    data = json.loads((config.HERE / "demo_data.json").read_text(encoding="utf-8"))
    today = date.today()
    shift = timedelta((today - DEMO_TODAY).days)
    mv = lambda iso: (date.fromisoformat(iso) + shift).isoformat()  # noqa: E731
    terms = _terms(today)
    term_map = {"T1-2027": "DEMO-PREV", "T2-2027": "DEMO-NOW"}
    with db.tx({"type": "demo", "summary": "Demo learners loaded"}, real=False) as c:
        has_current = c.execute("SELECT 1 FROM terms WHERE current=1").fetchone()
        for t in terms:
            c.execute("INSERT OR IGNORE INTO terms(id,label,starts,ends,fees_due,published,current) VALUES(?,?,?,?,?,?,?)",
                      (*t[:6], 0 if has_current else t[6]))
        users = data["users"]
        pid = c.execute(
            "INSERT INTO parents(name,phone,email,relationship,demo,created_at) VALUES(?,?,?,?,1,?) "
            "ON CONFLICT(phone) DO UPDATE SET name=excluded.name RETURNING id",
            (users["parent"]["name"], norm_phone(DEMO_PHONE), "demo.parent@example.com", "Mother", db.now_iso())).fetchone()[0]
        for sid, s in data["students"].items():
            first, last = s["name"].split(" ", 1)
            form = int(s["form"].split()[-1])
            c.execute("INSERT OR REPLACE INTO learners(id,first,last,form,stream,house,residence,hostel,class_teacher,status,xp,merits,"
                      "demerits,demo,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,'active',?,?,?,1,?,?)",
                      (sid, first, last, form, s["stream"], s["house"], s["residence"], s["hostel"], s["class_teacher"],
                       s["xp"], s["merits"], s["demerits"], db.now_iso(), db.now_iso()))
            c.execute("INSERT OR IGNORE INTO guardians(parent_id,learner_id,relationship) VALUES(?,?,?)", (pid, sid, "Mother"))
            for term in s["results"]:
                for x in term["subjects"]:
                    c.execute("INSERT OR IGNORE INTO subjects(code,name,teacher) VALUES(?,?,?)", (x["code"], x["name"], x["teacher"]))
                    c.execute("INSERT OR REPLACE INTO results(learner_id,term_id,code,name,teacher,ca,exam,comment,updated_at) "
                              "VALUES(?,?,?,?,?,?,?,?,?)", (sid, term_map[term["term"]], x["code"], x["name"], x["teacher"],
                                                            x["ca"], x["exam"], x["comment"], db.now_iso()))
            for a in s["attendance"]:
                c.execute("INSERT OR REPLACE INTO attendance(learner_id,date,status) VALUES(?,?,?)", (sid, mv(a["date"]), a["status"]))
            for d in s["timetable"]:
                for p in d["periods"]:
                    c.execute("INSERT OR REPLACE INTO timetable(class,day,start,code,subject,teacher,room) VALUES(?,?,?,?,?,?,?)",
                              (s["stream"], d["day"], p["start"], p["code"], p["subject"], p["teacher"], p["room"]))
            for a in s["assignments"]:
                aid = c.execute("INSERT INTO assignments(form,stream,subject,title,due,created_by,created_at,demo) VALUES(?,?,?,?,?,?,?,1) "
                                "RETURNING id", (form, s["stream"], a["subject"], a["title"], mv(a["due"]), "demo", db.now_iso())).fetchone()[0]
                if a["status"] != "pending":
                    c.execute("INSERT OR REPLACE INTO submissions(assignment_id,learner_id,status) VALUES(?,?,?)", (aid, sid, a["status"]))
            for k in s["skills"]:
                c.execute("INSERT OR REPLACE INTO skills(learner_id,form,trade,status,progress,badge) VALUES(?,?,?,?,?,?)",
                          (sid, k["form"], k["trade"], k["status"], k["progress"], k.get("badge")))
            for item, amount in s["fees"]["lines"]:
                c.execute("INSERT OR IGNORE INTO fee_items(term_id,item,amount,applies_to) VALUES(?,?,?,?)",
                          ("DEMO-NOW", item, amount, "boarder" if item == "Boarding" else "all"))
            for p in s["fees"]["payments"]:
                c.execute("INSERT OR IGNORE INTO payments(learner_id,term_id,amount,date,method,ref,recorded_by,created_at) "
                          "VALUES(?,?,?,?,?,?,?,?)", (sid, "DEMO-NOW", p["amount"], mv(p["date"]), p["method"], f"DEMO-{p['ref']}",
                                                      "demo", db.now_iso()))
        for n in data["notices"]:
            c.execute("INSERT INTO notices(date,title,body,tag,audience,created_by,created_at,demo) VALUES(?,?,?,?, 'all', 'demo', ?, 1)",
                      (mv(n["date"]), n["title"], n["body"], n["tag"], db.now_iso()))
        db.audit(c, "system", "demo.load", "", "Demo learners loaded")
    return {"learners": list(data["students"]), "parent_phone": DEMO_PHONE}


def remove_demo(actor: str) -> dict:
    with db.tx({"type": "demo", "summary": "Demo data removed"}) as c:
        ids = [r[0] for r in c.execute("SELECT id FROM learners WHERE demo=1")]
        n = len(ids)
        c.execute("DELETE FROM learners WHERE demo=1")
        c.execute("DELETE FROM parents WHERE demo=1")
        c.execute("DELETE FROM notices WHERE demo=1")
        c.execute("DELETE FROM assignments WHERE demo=1")
        c.execute("DELETE FROM terms WHERE id LIKE 'DEMO-%'")
        c.execute("DELETE FROM sessions WHERE kind IN ('parent','learner')")
        db.audit(c, actor, "demo.remove", "", f"{n} demo learners removed")
    return {"removed_learners": n}
