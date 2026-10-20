"""Royal Crest · Mandarin Connect: make the two commentator voices with ElevenLabs.

Run it (Windows: double-click make_voices.bat · Mac: double-click make_voices.command),
then upload the voices.zip it creates back to Claude.
Needs only Python 3 (python.org). No extra packages.
"""
import base64, json, os, pathlib, sys, time, urllib.error, urllib.request, zipfile

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "audio"
SETTINGS = {  # Teacher Wen: warm and steady · Sam: livelier commentator
    "WEN": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True},
    "SAM": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.5, "use_speaker_boost": True},
}

def api_key():
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    env = HERE / ".env"
    if not key and env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                key = line.split("=", 1)[1].strip()
    if not key:
        key = input("Paste your ElevenLabs API key and press Enter: ").strip()
    if not key:
        sys.exit("No API key given.")
    return key

def speak(key, voice_id, who, text):
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": SETTINGS[who]}).encode()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128"
    for attempt in range(4):
        req = urllib.request.Request(url, data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:400]
            if e.code == 401:
                sys.exit(f"\nElevenLabs rejected the API key (401). Check the key in .env.\n{msg}")
            if e.code in (402, 403):
                sys.exit(f"\nElevenLabs refused the request ({e.code}). Usually: out of credits, or the voice "
                         f"isn't in your account. Add the voice from the Voice Library, then run again.\n{msg}")
            if e.code == 404:
                sys.exit(f"\nVoice {voice_id} not found. Add it to 'My Voices' in ElevenLabs, then run again.\n{msg}")
            wait = 5 * (attempt + 1)
            print(f"   ElevenLabs said {e.code}; retrying in {wait}s…"); time.sleep(wait)
        except urllib.error.URLError as e:
            wait = 5 * (attempt + 1)
            print(f"   Network problem ({e.reason}); retrying in {wait}s…"); time.sleep(wait)
    sys.exit("\nGave up after 4 tries. Check your internet connection and run again (finished lines are kept).")

def main():
    script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))
    key = api_key(); OUT.mkdir(exist_ok=True)
    lines = script["lines"]; done = 0
    print(f"\nMaking {len(lines)} voice lines…\n")
    for i, ln in enumerate(lines, 1):
        mp3, js = OUT / f"{ln['id']}.mp3", OUT / f"{ln['id']}.json"
        name = script["voices"][ln["who"]]["name"]
        if mp3.exists() and js.exists():
            print(f"[{i:2}/{len(lines)}] {ln['id']} already made, skipping"); done += 1; continue
        res = speak(key, script["voices"][ln["who"]]["voice_id"], ln["who"], ln["say"])
        mp3.write_bytes(base64.b64decode(res["audio_base64"]))
        js.write_text(json.dumps(res.get("alignment"), ensure_ascii=False), encoding="utf-8")
        print(f"[{i:2}/{len(lines)}] {ln['id']} {name}: {ln['cap'][:60]}"); done += 1
    zpath = HERE / "voices.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(OUT.iterdir()):
            if f.suffix in (".mp3", ".json"):
                z.write(f, f"audio/{f.name}")
    print(f"\nDone: {done} lines.\nNow upload this file to Claude:\n  {zpath}\n")

if __name__ == "__main__":
    try:
        main()
    finally:
        if os.name == "nt" and not os.environ.get("NO_PAUSE"):
            input("Press Enter to close…")
