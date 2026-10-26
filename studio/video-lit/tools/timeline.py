"""Literature film. Build build/timeline.js from script.json, using real ElevenLabs audio + alignment when present,
otherwise an estimate (so visuals can be previewed before the voices exist)."""
import json, pathlib, subprocess, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
S = json.load(open(ROOT / "script.json"))
LEAD = {"open": 1.4, "bridge": .8, "boyclip": .4}; TAIL = {"outro": 5.0, "practice": 1.5, "boyclip": .6}
GAP_LINE, GAP_SCENE = 0.4, 1.0
HOLD_AFTER = {'o01': .8, 'o02': 1.2, 'o03': 1.0, 'w01': 1.2, 'w02': .8, 'p01': 1.6, 'p02': 1.4, 'p03': 1.6, 'p04': 1.6, 'p05': 1.2, 'e01': .8, 'e02': 2.0, 'e03': 1.2, 'g01': 2.0, 'b01': 1.2, 's01': .8, 's02': 1.6, 's03': 1.6, 's04': 2.0, 's05': 1.6, 't01': 1.6, 't02': 1.2, 't03': 1.2, 'r01': 1.0, 'r02': 3.0, 'x01': 1.0}


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
