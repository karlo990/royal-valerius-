"""Build build/sfx.wav: rain, thunder, drone hum, cloud whoosh and wind, placed on the film's timeline.
Every sound is synthesised with ffmpeg (no samples needed); times come from the voice cues in build/timeline.js."""
import json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'build/timeline.js').read_text(); TL = json.loads(s[s.index('{'):s.rindex('}') + 1])
L = {l['id']: l for l in TL['lines']}; SC = {x['id']: x for x in TL['scenes']}; total = TL['total']
def cue(i, sub=None):
    l = L[i]
    if sub is None: return l['start']
    k = l['chars'].find(sub); return l['start'] + (l['times'][k] if k >= 0 else 0)
TMP = ROOT / 'build/sfx'; TMP.mkdir(exist_ok=True)
def gen(name, src, dur, fil):
    out = TMP / f'{name}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', src, '-t', f'{dur:.2f}', '-af', fil, '-ar', '48000', '-ac', '2', str(out)], check=True)
    return out

# the same times the picture uses (see build/wide.src.html, drone and rain scenes)
fpv_end = cue('g22', 'The ground') - .2; c0 = cue('g24') - .6; c1 = c0 + 9.4
rain_on = cue('g25', 'fall as rain'); storm = cue('g25', 'cumulonimbus')
ns = cue('g28', 'nimbostratus'); rain_end = SC['rain']['end'] + .4
gust = cue('g18', 'east')
events = []  # (file, start, gain)
# drone propellers: FPV flight and the climb, quieter once we're climbing
d0 = SC['drone']['start'] - .2; dl = c0 + .8 - d0
events.append((gen('hum', f"aevalsrc='0.55*sin(2*PI*196*t)+0.25*sin(2*PI*392*t)+0.12*sin(2*PI*588*t)':s=48000:d={dl:.2f}", dl, f"tremolo=f=28:d=0.25,volume='if(lt(t,{fpv_end-d0}),1,0.55)':eval=frame,afade=t=in:d=0.8,afade=t=out:st={dl-1.2}:d=1.2,lowpass=f=2500"), d0, .22))
# into the cloud: a whoosh, then soft wind while we're inside
events.append((gen('whoosh', 'anoisesrc=c=white:a=1:r=48000', 2.2, "bandpass=f=1100:w=1600,volume='sin(PI*t/2.2)^2':eval=frame"), c0 - .3, .5))
events.append((gen('cloudwind', 'anoisesrc=c=brown:a=1:r=48000:seed=5', c1 - c0, f"lowpass=f=700,tremolo=f=0.4:d=0.5,afade=t=in:d=1,afade=t=out:st={c1-c0-1.5}:d=1.5"), c0, .35))
# thunder: two rumbles as the cumulonimbus builds
for i, at in enumerate([storm + .4, storm + 4.2]):
    events.append((gen(f'thunder{i}', f'anoisesrc=c=brown:a=1:r=48000:seed={11+i}', 7, "lowpass=f=160,volume='if(lt(t,0.12),t/0.12,exp(-(t-0.12)*0.75))':eval=frame,tremolo=f=5:d=0.45,volume=2.2"), at, .9 - .2 * i))
# rain: heavy from "fall as rain", easing through the three rain panels, steady drizzle for nimbostratus
rl = rain_end - rain_on
env = (f"volume='if(lt(t,1.5),t/1.5,1)*if(lt(t,{SC['drone']['end']-rain_on}),1,if(lt(t,{ns-rain_on}),0.6,0.45))':eval=frame")
events.append((gen('rainL', 'anoisesrc=c=pink:a=1:r=48000:seed=21', rl, f"highpass=f=450,lowpass=f=7500,{env},afade=t=out:st={rl-2}:d=2"), rain_on, .42))
events.append((gen('drops', 'anoisesrc=c=white:a=1:r=48000:seed=31', rl, f"highpass=f=3000,tremolo=f=13:d=0.9,{env},afade=t=out:st={rl-2}:d=2"), rain_on, .12))
# the wind vane swings round: a gust
events.append((gen('gust', 'anoisesrc=c=brown:a=1:r=48000:seed=41', 3.4, "lowpass=f=650,volume='sin(PI*t/3.4)^1.5':eval=frame,volume=1.6"), gust - .6, .45))

ins, fl, lab = [], [], []
for i, (f, at, gain) in enumerate(events):
    ms = max(0, int(at * 1000)); ins += ['-i', str(f)]
    fl.append(f"[{i}:a]volume={gain},adelay={ms}|{ms}[e{i}]"); lab.append(f'[e{i}]')
fl.append(f"{''.join(lab)}amix=inputs={len(lab)}:normalize=0,apad,atrim=0:{total:.2f}[o]")
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[o]', '-ar', '48000', '-ac', '2', str(ROOT / 'build/sfx.wav')], check=True)
print('wrote build/sfx.wav with', len(events), 'effects')
for f, at, gain in events: print(f'  {f.stem:10s} at {at:7.2f}s  gain {gain}')
