"""Generate every line of script.json with ElevenLabs (with character timestamps).
Usage: ELEVENLABS_API_KEY=... python3 tools/tts.py   (skips lines already generated)"""
import json, os, sys, base64, urllib.request, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
key = os.environ.get("ELEVENLABS_API_KEY") or sys.exit("Set ELEVENLABS_API_KEY")
script = json.load(open(ROOT / "script.json"))
out = ROOT / "audio"; out.mkdir(exist_ok=True)
SETTINGS = {"WEN": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True},
            "SAM": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.5, "use_speaker_boost": True}}
for ln in script["lines"]:
    mp3, js = out / f"{ln['id']}.mp3", out / f"{ln['id']}.json"
    if mp3.exists() and js.exists(): continue
    vid = script["voices"][ln["who"]]["voice_id"]
    body = json.dumps({"text": ln["say"], "model_id": "eleven_multilingual_v2",
                       "voice_settings": SETTINGS[ln["who"]]}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128",
                                 data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r: res = json.load(r)
    mp3.write_bytes(base64.b64decode(res["audio_base64"]))
    json.dump(res.get("alignment"), open(js, "w"), ensure_ascii=False)
    print("ok", ln["id"], ln["who"], ln["say"][:50])
