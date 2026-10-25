"""Unpack voices.zip (made by voice-kit/make_voices.py) into audio/ and check every line is there.
Usage: python3 tools/import_voices.py path/to/voices.zip"""
import json, pathlib, sys, zipfile
ROOT = pathlib.Path(__file__).resolve().parent.parent
z = zipfile.ZipFile(sys.argv[1]); out = ROOT / "audio"; out.mkdir(exist_ok=True)
for n in z.namelist():
    p = pathlib.PurePosixPath(n)
    if p.suffix in (".mp3", ".json") and ".." not in p.parts:
        (out / p.name).write_bytes(z.read(n))
ids = [l["id"] for l in json.load(open(ROOT / "script.json"))["lines"]]
missing = [i for i in ids if not ((out/f"{i}.mp3").exists() and (out/f"{i}.json").exists())]
print(f"{len(ids)-len(missing)}/{len(ids)} lines present" + (f"; missing: {', '.join(missing)}" if missing else ""))
