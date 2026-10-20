"""Contract tests for the Crest Quest reference server.  Run: pytest portal/api"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent))
from reference_server import app  # noqa: E402

c = TestClient(app)


def login(role, identifier, pin="2027"):
    r = c.post("/api/v1/auth/login", json={"role": role, "identifier": identifier, "pin": pin})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_health_is_open():
    assert c.get("/api/v1/health").json()["ok"] is True


def test_wrong_pin_is_rejected():
    r = c.post("/api/v1/auth/login", json={"role": "parent", "identifier": "0771234567", "pin": "0000"})
    assert r.status_code == 401


def test_everything_else_needs_a_token():
    assert c.get("/api/v1/me").status_code == 401
    assert c.get("/api/v1/students/RCA-27-0142").status_code == 401


def test_parent_sees_both_children_learner_only_self():
    p = login("parent", "077 123 4567")
    assert c.get("/api/v1/me", headers=p).json()["students"] == ["RCA-27-0142", "RCA-27-0087"]
    assert c.get("/api/v1/students/RCA-27-0087/fees", headers=p).status_code == 200
    l = login("learner", "rca-27-0142")
    assert c.get("/api/v1/students/RCA-27-0142", headers=l).json()["name"] == "Tanaka Moyo"
    assert c.get("/api/v1/students/RCA-27-0087", headers=l).status_code == 404     # a sibling is not theirs


@pytest.mark.parametrize("part", ["results", "attendance", "timetable", "assignments", "skills", "fees"])
def test_student_sections(part):
    h = login("learner", "RCA-27-0142")
    r = c.get(f"/api/v1/students/RCA-27-0142/{part}", headers=h)
    assert r.status_code == 200 and r.json()


def test_summary_leaves_out_heavy_sections():
    h = login("learner", "RCA-27-0142")
    body = c.get("/api/v1/students/RCA-27-0142", headers=h).json()
    assert "results" not in body and body["admission_no"] == "RCA-27-0142"


def test_crestbot_chat_shape_and_scope():
    h = login("parent", "0771234567")
    r = c.post("/api/v1/crestbot/chat", headers=h, json={"student_id": "RCA-27-0142", "message": "fees balance?"})
    body = r.json()
    assert r.status_code == 200 and "US$250" in body["reply"] and body["suggestions"]
    l = login("learner", "RCA-27-0142")
    assert c.post("/api/v1/crestbot/chat", headers=l, json={"student_id": "RCA-27-0087", "message": "hi"}).status_code == 404


def test_device_registration_keeps_only_own_learners():
    h = login("learner", "RCA-27-0142")
    r = c.post("/api/v1/devices", headers=h, json={"platform": "android", "push_token": "tok", "student_ids": ["RCA-27-0087"]})
    assert r.status_code == 201 and r.json()["student_ids"] == ["RCA-27-0142"]


def test_sync_cursor():
    h = login("parent", "0771234567")
    assert len(c.get("/api/v1/sync", headers=h).json()["changes"]) == 3
    assert c.get("/api/v1/sync?since=2027-03-06", headers=h).json()["changes"][0]["id"] == "n1"


def test_logout_ends_session():
    h = login("learner", "RCA-27-0142")
    assert c.post("/api/v1/auth/logout", headers=h).status_code == 204
    assert c.get("/api/v1/me", headers=h).status_code == 401
