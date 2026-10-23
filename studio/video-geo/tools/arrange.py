"""Build build/music_arr.wav from the two Vee Mampeezy songs, cut to the film's scenes:
  Your Time  open → readings  (the station lessons; starts past its quiet intro)
  Dumalana   wind → data      (the big one: wind vane, drone flight, storm, rain, clouds)
  Your Time  edu5 → outro     (its last minutes, so the film ends on the song's own ending)
Crossfades at the scene changes; the music eases down a little under the rain so the rain is heard.
Times come from build/timeline.js, so it follows the real voices."""
import json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'build/timeline.js').read_text(); TL = json.loads(s[s.index('{'):s.rindex('}') + 1])
SC = {x['id']: x for x in TL['scenes']}; L = {l['id']: l for l in TL['lines']}; total = TL['total']
def cue(i, sub):
    l = L[i]; k = l['chars'].find(sub); return l['start'] + (l['times'][k] if k >= 0 else 0)
YT, DU = str(ROOT / 'music/your-time.mp3'), str(ROOT / 'music/dumalana.mp3')
YT_LEN, XF = 254.7, 3.0
b1, b2 = SC['wind']['start'], SC['edu5']['start']          # the two song changes
p1 = (YT, 30.0, b1 + XF / 2, 0.0)                           # (file, from, length, gain dB)
p2 = (DU, 12.0, b2 - b1 + XF, -2.0)                         # Dumalana is ~2 LU louder
p3 = (YT, max(0, YT_LEN - (total - b2 + XF / 2)), total - b2 + XF / 2 + .5, 0.0)
ins, fl = [], []
for i, (f, ss, d, g) in enumerate([p1, p2, p3]):
    ins += ['-ss', f'{ss:.2f}', '-t', f'{d:.2f}', '-i', f]
    fl.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB[p{i}]')
fl.append(f'[p0][p1]acrossfade=d={XF}:c1=qsin:c2=qsin[a]')
fl.append(f'[a][p2]acrossfade=d={XF}:c1=qsin:c2=qsin[b]')
r0, r1 = cue('g25', 'fall as rain'), SC['rain']['end']
fl.append(f"[b]volume='if(between(t,{r0:.2f},{r1:.2f}),0.75,1)':eval=frame,atrim=0:{total:.2f}[o]")
out = ROOT / 'build/music_arr.wav'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[o]', str(out)], check=True)
print(f'wrote {out}: Your Time 0–{b1:.1f}s, Dumalana {b1:.1f}–{b2:.1f}s, Your Time {b2:.1f}–{total:.1f}s')
