"""Caption Desk endpoint. Run from the karlissa folder:  python -m pytest -q tests"""
import json

from tests.test_hub import client, portal, staff  # first: it sets up the test hub
from hub import captions, config  # noqa: E402


def test_staff_only():
    assert client.post("/api/v1/captions", json={"about": "Open day"}).status_code == 401
    assert client.post("/api/v1/captions", headers=portal(), json={"about": "Open day"}).status_code == 401


def test_off_says_so(monkeypatch):
    monkeypatch.setattr(config, "CAPTIONS_LLM", "off")
    r = client.post("/api/v1/captions", headers=staff(), json={"about": "Open day"})
    assert r.status_code == 503 and "CAPTIONS_LLM" in r.json()["detail"]


def test_caption_and_house_rules(monkeypatch):
    monkeypatch.setattr(config, "CAPTIONS_LLM", "ollama")
    captions.PER_USER.hits.clear()
    seen = {}
    def fake(system, user):
        seen["system"], seen["user"] = system, user
        return json.dumps({"caption": "Wait! 😮 The human body makes 2 million red blood cells every second.\nLearn more.\n📞 +263 714 404 090",
                           "status": "2 million red blood cells a second!", "hashtags": ["Biology", "#Bikita", "bad tag!"]})
    monkeypatch.setattr(captions, "_ollama", fake)
    r = client.post("/api/v1/captions", headers=staff(), json={"about": "Biology film", "facts": "2 million red cells per second", "kind": "film"}).json()
    assert r["caption"].startswith("The human body") and "😮" not in r["caption"]
    assert r["hashtags"] == ["#RoyalCrestAcademy", "#Biology", "#Bikita"]
    assert "FACTS TO USE" in seen["user"] and "+263 714 404 090" in seen["system"]


def test_devotion_has_no_sales_lines(monkeypatch):
    monkeypatch.setattr(config, "CAPTIONS_LLM", "ollama")
    captions.PER_USER.hits.clear()
    monkeypatch.setattr(captions, "_ollama", lambda s, u: json.dumps({"caption": "Proverbs 16:3\nCommit thy works unto the LORD.\nForm 1 enrolment is open!\n📞 +263 714 404 090\nHave a blessed Sunday. 💙💛",
                                                                     "status": "Have a blessed Sunday", "hashtags": ["#VerseOfTheDay"]}))
    r = client.post("/api/v1/captions", headers=staff(), json={"about": "Sunday devotion", "kind": "devotion"}).json()
    assert "+263" not in r["caption"] and "enrolment" not in r["caption"] and "blessed Sunday" in r["caption"]
