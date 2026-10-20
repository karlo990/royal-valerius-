"""Hub tests. Run from the karlissa folder:  python -m pytest -q tests"""
import io
import os
import sys
import tempfile
import zipfile
from pathlib import Path

TMP = tempfile.mkdtemp(prefix="hub-test-")
os.environ.update(HUB_DATA_DIR=TMP, ADMIN_PASSWORD="test-owner-pass", SYNC_KEY="sync-test-key", SEED_DEMO="1", KUDZI_LLM="off")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from hub import backup, db  # noqa: E402
from hub.app import app  # noqa: E402
from hub.security import LOGIN_BY_ID, LOGIN_BY_IP, norm_phone, phones_match  # noqa: E402

client = TestClient(app)
client.__enter__()          # run startup (creates the database with demo learners)

TANAKA, RUFARO, PHONE = "RCA-27-0142", "RCA-27-0087", "0771234567"


@pytest.fixture(autouse=True)
def _reset_limits():
    LOGIN_BY_ID.hits.clear()
    LOGIN_BY_IP.hits.clear()


def portal(role="parent", ident=TANAKA, pw=PHONE):
    r = client.post("/api/v1/auth/login", json={"role": role, "identifier": ident, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def staff(user="admin", pw="test-owner-pass"):
    r = client.post("/api/v1/admin/login", json={"username": user, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_phone_normalising():
    assert norm_phone("077 123 4567") == norm_phone("+263 77 123 4567") == norm_phone("263771234567") == "263771234567"
    assert norm_phone("+44 7700 900123") == "447700900123"
    assert phones_match("0771234567", "263771234567") and not phones_match("0771234568", "263771234567")


def test_parent_signs_in_with_admission_number_and_phone():
    h = portal()
    me = client.get("/api/v1/me", headers=h).json()
    assert me["role"] == "parent" and me["students"] == [TANAKA, RUFARO] and me["password_is_phone"]
    # any child's admission number works, and formatting of the phone doesn't matter
    portal(ident=RUFARO.lower(), pw="+263 77 123 4567")


def test_wrong_phone_is_rejected_and_rate_limited():
    for _ in range(6):
        assert client.post("/api/v1/auth/login", json={"role": "parent", "identifier": TANAKA, "password": "0770000000"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"role": "parent", "identifier": TANAKA, "password": PHONE}).status_code == 429


def test_learner_sees_only_self():
    h = portal("learner")
    assert client.get(f"/api/v1/students/{TANAKA}", headers=h).json()["name"] == "Tanaka Moyo"
    assert client.get(f"/api/v1/students/{RUFARO}", headers=h).status_code == 404


def test_sections_have_portal_shapes():
    h = portal()
    s = client.get(f"/api/v1/students/{TANAKA}", headers=h).json()
    assert {"xp", "level", "next_level_xp", "position", "class_size", "trend", "house"} <= set(s)
    res = client.get(f"/api/v1/students/{TANAKA}/results", headers=h).json()
    pub = [r for r in res if r["published"]]
    assert pub and pub[0]["subjects"][0]["grade"] in "ABCDEU"
    assert all(not r["subjects"] for r in res if not r["published"])          # unpublished marks stay on the server
    f = client.get(f"/api/v1/students/{TANAKA}/fees", headers=h).json()
    assert f["invoiced"] == 850 and f["paid"] == 600 and f["balance"] == 250
    tt = client.get(f"/api/v1/students/{TANAKA}/timetable", headers=h).json()
    assert len(tt) == 5 and tt[0]["periods"]
    assert client.get(f"/api/v1/students/{TANAKA}/report", headers=h).status_code == 200


def test_kudzi_answers_from_records_and_faq():
    h, a = portal(), staff()
    r = client.post("/api/v1/crestbot/chat", headers=h, json={"student_id": TANAKA, "message": "fees balance?"}).json()
    assert "US$250" in r["reply"] and r["source"] == "rules"
    client.put("/api/v1/admin/memory", headers=a, json={"scope": "kudzi_faq", "key": "uniform, blazer", "value": "Blazers are sold at the bursar's office."})
    r = client.post("/api/v1/crestbot/chat", headers=h, json={"student_id": TANAKA, "message": "Where do we buy the blazer?"}).json()
    assert r["source"] == "faq" and "bursar" in r["reply"]


def test_registration_flow():
    r = client.post("/api/v1/register", json={"parent_name": "Mr T. Chiweshe", "phone": "0782 555 111", "email": "t@example.com",
                                              "learner_name": "Nyasha Chiweshe", "form": 1, "residence": "Boarder", "consent": True})
    assert r.status_code == 201
    ref = r.json()["ref"]
    assert client.post("/api/v1/register/status", json={"ref": ref, "phone": "0782555111"}).json()["status"] == "pending"
    a = staff()
    pend = client.get("/api/v1/admin/registrations", headers=a).json()
    rid = next(x["id"] for x in pend if x["ref"] == ref)
    ok = client.post(f"/api/v1/admin/registrations/{rid}/approve", headers=a, json={}).json()
    lid = ok["learner_id"]
    h = portal("parent", lid, "+263782555111")
    assert client.get("/api/v1/me", headers=h).json()["students"] == [lid]
    # a brand-new learner with no records still renders
    s = client.get(f"/api/v1/students/{lid}", headers=h).json()
    assert s["position"] == "—" and client.get(f"/api/v1/students/{lid}/fees", headers=h).json()["balance"] >= 0
    assert any(n["title"] == "Welcome to Crest Quest" for n in client.get("/api/v1/notices", headers=h).json())


def test_change_password_replaces_phone():
    a = staff()
    client.post("/api/v1/admin/parents", headers=a, json={"name": "Mrs P. Dube", "phone": "0713000999", "learner_ids": [RUFARO]})
    h = portal("parent", RUFARO, "0713000999")
    assert client.post("/api/v1/me/password", headers=h, json={"current": "0713000999", "new": "0713000999"}).status_code == 400
    assert client.post("/api/v1/me/password", headers=h, json={"current": "0713000999", "new": "kudzi-rocks-27"}).status_code == 200
    assert client.post("/api/v1/auth/login", json={"role": "parent", "identifier": RUFARO, "password": "0713000999"}).status_code == 401
    portal("parent", RUFARO, "kudzi-rocks-27")
    portal("parent", "0713000999", "kudzi-rocks-27")         # phone + own password also works now


def test_payment_and_sync_feed():
    h, a = portal(), staff()
    cur = client.get("/api/v1/sync", headers=h).json()["cursor"]
    assert client.post("/api/v1/admin/payments", headers=a, json={"learner_id": TANAKA, "amount": 50, "method": "EcoCash"}).status_code == 201
    ch = client.get(f"/api/v1/sync?since={cur}", headers=h).json()["changes"]
    assert any(c["type"] == "payment" for c in ch)
    assert client.get(f"/api/v1/students/{TANAKA}/fees", headers=h).json()["balance"] == 200


def test_roles_are_enforced():
    a = staff()
    client.post("/api/v1/admin/staff", headers=a, json={"username": "bursar1", "name": "Bursar", "role": "bursar", "password": "bursar-pass-1"})
    b = staff("bursar1", "bursar-pass-1")
    assert client.get("/api/v1/admin/fees/balances", headers=b).status_code == 200
    assert client.put("/api/v1/admin/results", headers=b, json={"term": "DEMO-NOW", "code": "MAT", "rows": []}).status_code == 403
    assert client.get("/api/v1/admin/staff", headers=b).status_code == 403
    assert client.get("/api/v1/admin/overview").status_code == 401


def test_import_learners_csv():
    a = staff()
    csv_text = "Admission No,First Name,Surname,Form,Stream,Parent Name,Parent Phone\nRCA-25-0900,Chipo,Ncube,2,2 Blue,Mrs Ncube,0774 111 222\n,Farai,Gumbo,1,1 Blue,,\n"
    r = client.post("/api/v1/admin/import/learners", headers={**a, "Content-Type": "text/csv"}, content=csv_text).json()
    assert r["created"] == 2 and r["parents"] == 1 and not r["errors"]
    portal("learner", "RCA-25-0900", "0774111222")


def test_backup_export_and_restore_round_trip():
    a = staff()
    st = client.get("/api/v1/admin/backup/status", headers={"X-Sync-Key": "sync-test-key"}).json()
    assert st["instance_id"] and st["data_version"] > 0
    assert client.get("/api/v1/admin/backup/status", headers={"X-Sync-Key": "wrong"}).status_code == 401
    z = client.get("/api/v1/admin/backup/export", headers={"X-Sync-Key": "sync-test-key"})
    assert z.status_code == 200
    with zipfile.ZipFile(io.BytesIO(z.content)) as zf:
        names = zf.namelist()
        assert {"manifest.json", "school.db", "export/learners.csv", "export/everything.json"} <= set(names)
        assert b"pw_hash" not in zf.read("export/parents.csv")
    before = db.data_version()
    client.post("/api/v1/admin/notices", headers=a, json={"title": "After the backup", "body": "x"})
    assert db.scalar("SELECT COUNT(*) FROM notices WHERE title='After the backup'") == 1
    r = client.put("/api/v1/admin/backup/restore", headers={"X-Sync-Key": "sync-test-key", "Content-Type": "application/zip"}, content=z.content)
    assert r.status_code == 200, r.text
    assert db.scalar("SELECT COUNT(*) FROM notices WHERE title='After the backup'") == 0
    assert db.data_version() == before
    # staff stay signed in after a restore
    assert client.get("/api/v1/admin/me", headers=a).status_code == 200
    bad = client.put("/api/v1/admin/backup/restore", headers={"X-Sync-Key": "sync-test-key"}, content=b"not a zip" * 20)
    assert bad.status_code == 400


def test_boot_restores_newest_local_backup(tmp_path):
    backup.make_backup("test")
    v = db.data_version()
    db.DB_PATH = None
    os.remove(backup.config.DB_PATH)
    for ext in ("-wal", "-shm"):
        Path(str(backup.config.DB_PATH) + ext).unlink(missing_ok=True)
    assert backup.boot() == "local"
    assert db.data_version() == v and db.scalar("SELECT COUNT(*) FROM learners") >= 2


def test_dashboard_overview_and_page():
    a = staff()
    o = client.get("/api/v1/admin/overview", headers=a).json()
    assert o["counts"]["learners"] >= 2 and "logins" in o["series"]
    assert client.get("/admin").status_code == 200
