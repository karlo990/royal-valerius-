"""Crest Slate maths endpoint. Run from the karlissa folder:  python -m pytest -q tests"""
import json

from tests.test_hub import client, portal, staff  # first: it sets up the test hub
from hub import config, maths  # noqa: E402


def test_needs_sign_in():
    assert client.get("/api/v1/maths/status").status_code == 401
    assert client.post("/api/v1/maths/solve", json={"question": "2x = 10"}).status_code == 401


def test_status_for_learner_and_staff():
    for h in (portal(), staff()):
        r = client.get("/api/v1/maths/status", headers=h)
        assert r.status_code == 200 and len(r.json()["topics"]) == 9


def test_ai_off_says_so(monkeypatch):
    monkeypatch.setattr(config, "MATHS_LLM", "off")
    r = client.post("/api/v1/maths/solve", headers=portal(), json={"question": "2x = 10"})
    assert r.status_code == 503 and "MATHS_LLM" in r.json()["detail"]


def test_solve_hint_and_check(monkeypatch):
    monkeypatch.setattr(config, "MATHS_LLM", "ollama")
    maths.PER_USER.hits.clear()
    replies = {
        "solve": {"topic": "Algebra and graphs", "steps": [{"text": "Take 2 from both sides", "math": "3x = 15"}, {"text": "Divide by 3", "math": "x = 5"}], "answer": "x = 5", "solution": "x=5"},
        "hint": {"topic": "Algebra and graphs", "hint": "What can you take away from both sides?", "math": "3x + 2 - 2", "last": False},
        "check": {"topic": "Nonsense topic", "verdict": "incorrect", "feedback": "Close!", "first_error": "3x = 19", "answer": "x = 5"},
    }
    seen = {}
    def fake(system, user):
        mode = "hint" if "hint number" in system else "check" if "Mark the learner" in system else "solve"
        seen[mode] = user
        return json.dumps(replies[mode])
    monkeypatch.setattr(maths, "_ollama", fake)
    h = portal()
    r = client.post("/api/v1/maths/solve", headers=h, json={"question": "3x + 2 = 17"}).json()
    assert r["answer"] == "x = 5" and len(r["steps"]) == 2 and r["solution"] == "x=5" and r["mode"] == "solve"
    r = client.post("/api/v1/maths/solve", headers=h, json={"question": "3x + 2 = 17", "mode": "hint"}).json()
    assert r["hint"].startswith("What can") and r["last"] is False
    r = client.post("/api/v1/maths/solve", headers=h, json={"question": "3x + 2 = 17", "mode": "check", "working": "3x = 19"}).json()
    assert r["verdict"] == "incorrect" and r["topic"] == ""          # unknown topics are dropped
    assert "LEARNER'S WORKING" in seen["check"]


def test_wordy_or_broken_model_reply(monkeypatch):
    monkeypatch.setattr(config, "MATHS_LLM", "ollama")
    maths.PER_USER.hits.clear()
    monkeypatch.setattr(maths, "_ollama", lambda s, u: 'Sure! {"steps": [{"text": "Divide by 2", "math": "x=5"}], "answer": "x=5"} Hope that helps.')
    assert client.post("/api/v1/maths/solve", headers=portal(), json={"question": "2x=10"}).json()["answer"] == "x=5"
    monkeypatch.setattr(maths, "_ollama", lambda s, u: "x is five")
    r = client.post("/api/v1/maths/solve", headers=portal(), json={"question": "2x=10"}).json()
    assert r["steps"][0]["text"] == "x is five"
    def boom(s, u):
        raise TimeoutError
    monkeypatch.setattr(maths, "_ollama", boom)
    assert client.post("/api/v1/maths/solve", headers=portal(), json={"question": "2x=10"}).status_code == 502


def test_hourly_limit(monkeypatch):
    monkeypatch.setattr(config, "MATHS_LLM", "ollama")
    monkeypatch.setattr(maths, "_ollama", lambda s, u: '{"steps": [], "answer": "1"}')
    maths.PER_USER.hits.clear()
    h = portal()
    codes = [client.post("/api/v1/maths/solve", headers=h, json={"question": "1+0"}).status_code for _ in range(config.MATHS_PER_HOUR + 1)]
    assert codes[:-1] == [200] * config.MATHS_PER_HOUR and codes[-1] == 429
    maths.PER_USER.hits.clear()
