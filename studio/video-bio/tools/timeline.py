"""Build build/timeline.js from script.json, using real ElevenLabs audio + alignment when present,
otherwise an estimate (so visuals can be previewed before the voices exist)."""
import json, pathlib, subprocess, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
S = json.load(open(ROOT / "script.json"))
LEAD = {"open": 4.0, "dna": 0.8, "rbc": 0.8, "scale": 0.8}; TAIL = {"outro": 4.5, "careers": 0.6, "virus": 1.0}
GAP_LINE, GAP_SCENE = 0.32, 0.9
HOLD_AFTER = {"b03": 0.8, "b04": 0.6, "b05": 1.6, "b06": 1.8, "b08": 1.2, "b10": 2.2, "b11": 1.4, "b12": 2.6, "b15": 1.4, "b17": 1.6, "b18": 2.4,
              "b19": 1.4, "b21": 1.2, "b22": 1.8, "b23": 1.4, "b25": 2.2, "b27": 2.2, "b29": 1.2, "b30": 1.2, "b33": 1.0, "b35": 0.8}

def cjk(c): return '㐀' <= c <= '鿿'
def estimate(text):
    t, times = 0.0, []
    for c in text:
        times.append(t)
        if cjk(c): t += 0.34
        elif c in '。！？': t += 0.45
        elif c in '.!?': t += 0.38
        elif c in ',;:，、': t += 0.18
        elif c == ' ': t += 0.03
        else: t += 0.062
    return times, t + 0.15
def probe(p):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)]).decode())

lines, scenes, t, prev_scene, real = [], [], 0.0, None, True
for ln in S["lines"]:
    a, mp3 = ROOT/"audio"/f"{ln['id']}.json", ROOT/"audio"/f"{ln['id']}.mp3"
    if a.exists() and mp3.exists():
        al = json.load(open(a)); chars, times, dur = al["characters"], al["character_start_times_seconds"], probe(mp3)
    else:
        real = False; chars = list(ln["say"]); times, dur = estimate(ln["say"])
    if ln["scene"] != prev_scene:
        if prev_scene: scenes[-1]["end"] = t + TAIL.get(prev_scene, 0) + 0.5; t += GAP_SCENE + TAIL.get(prev_scene, 0)
        t += LEAD.get(ln["scene"], 0.6)
        scenes.append({"id": ln["scene"], "start": t - LEAD.get(ln["scene"], 0.6)}); prev_scene = ln["scene"]
    lines.append({**ln, "start": round(t,3), "end": round(t+dur,3), "chars": "".join(chars), "times": [round(x,3) for x in times]})
    t += dur + GAP_LINE + HOLD_AFTER.get(ln["id"], 0)
scenes[-1]["end"] = t + TAIL.get(prev_scene, 0)
total = round(scenes[-1]["end"], 2)
(ROOT/"build").mkdir(exist_ok=True)
open(ROOT/"build"/"timeline.js","w").write("window.TL="+json.dumps({"real_audio": real, "total": total, "lines": lines, "scenes": scenes}, ensure_ascii=False)+";")
print("real audio:", real, "| total", total, "s")
for s in scenes: print(f"  {s['id']:9s} {s['start']:6.1f} → {s['end']:6.1f}")
