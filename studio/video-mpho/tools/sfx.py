"""Build build/sfx.wav: every sound effect for "From Page to Podium", placed on the voice cues
in build/timeline.js. All synthesised with ffmpeg (no samples). Mixed on top of the music by tools/mix.py --sfx."""
import json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'build/timeline.js').read_text(); TL = json.loads(s[s.index('{'):s.rindex('}') + 1])
L = {l['id']: l for l in TL['lines']}; SC = {x['id']: x for x in TL['scenes']}; total = TL['total']
def cue(i, sub=None, nth=0):
    l = L[i]
    if sub is None: return l['start']
    k = -1
    for _ in range(nth + 1):
        k = l['chars'].find(sub, k + 1)
        if k < 0: break
    return l['start'] + (l['times'][k] if k >= 0 else 0)
TMP = ROOT / 'build/sfx'; TMP.mkdir(exist_ok=True)
made = {}
def gen(name, src, dur, fil):
    if name in made: return made[name]
    out = TMP / f'{name}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', src, '-t', f'{dur:.2f}', '-af', fil, '-ar', '48000', '-ac', '2', str(out)], check=True)
    made[name] = out; return out
tone = lambda f, d, extra='': f"aevalsrc='sin(2*PI*{f}*t)*exp(-{extra or 6}*t)':s=48000:d={d}"
E = []                                  # (file, start, gain)
add = lambda f, at, g: E.append((f, at, g))

# ---- sound kit
THUD = gen('thud', 'anoisesrc=c=brown:a=1:r=48000:seed=3', .6, "lowpass=f=180,volume='exp(-t*14)':eval=frame,volume=3")
WHOOSH = gen('whoosh', 'anoisesrc=c=white:a=1:r=48000:seed=5', 1.2, "bandpass=f=900:w=1400,volume='sin(PI*t/1.2)^2':eval=frame")
POP = gen('pop', "aevalsrc='sin(2*PI*(520+900*exp(-t*30))*t)*exp(-t*28)':s=48000:d=0.25", .25, 'volume=.9')
CLUNK = gen('clunk', "aevalsrc='(sin(2*PI*140*t)+.5*sin(2*PI*310*t))*exp(-t*16)':s=48000:d=0.5", .5, 'lowpass=f=900,volume=1.4')
CREAK = gen('creak', "aevalsrc='sin(2*PI*(220+60*sin(2*PI*7*t))*t)*.5':s=48000:d=0.8", .8, "bandpass=f=700:w=600,volume='sin(PI*t/.8)':eval=frame")
CHIME = gen('chime', "aevalsrc='(sin(2*PI*1046*t)+.6*sin(2*PI*1568*t)+.3*sin(2*PI*2093*t))*exp(-t*3.2)':s=48000:d=1.6", 1.6, 'volume=.5')
DING = gen('ding', "aevalsrc='(sin(2*PI*1318*t)+.4*sin(2*PI*2637*t))*exp(-t*4)':s=48000:d=1.2", 1.2, 'volume=.55')
TICK = gen('tick', "aevalsrc='sin(2*PI*2200*t)*exp(-t*90)':s=48000:d=0.08", .08, 'volume=.8')
SHUTTER = gen('shutter', 'anoisesrc=c=white:a=1:r=48000:seed=9', .22, "highpass=f=1500,volume='if(lt(t,.03),1,if(lt(t,.09),.15,if(lt(t,.13),.9,0)))*exp(-t*8)':eval=frame,volume=1.4")
TAP = gen('tap', "aevalsrc='sin(2*PI*1800*t)*exp(-t*70)+.4*sin(2*PI*900*t)*exp(-t*50)':s=48000:d=0.12", .12, 'volume=.7')
SOFTNO = gen('softno', "aevalsrc='sin(2*PI*330*t)*exp(-t*6)+sin(2*PI*262*t)*exp(-(t-.18)*6)*gt(t,.18)':s=48000:d=0.9", .9, 'volume=.35')
RISE = gen('rise', 'anoisesrc=c=pink:a=1:r=48000:seed=12', 2.5, "lowpass=f=2500,volume='(t/2.5)^2':eval=frame,afade=t=out:st=2.2:d=0.3")

# ---- open: dusk on the farm, the sheep are counted (no scratchy sounds: the school asked for none)
s0 = SC['open']['start']
for i in range(6): add(POP, s0 + .6 + i * .45, .2)
add(SOFTNO, cue('m01', 'missing'), .5)
add(WHOOSH, SC['title']['start'] - .3, .45); add(CHIME, SC['title']['start'] + .4, .5)
add(POP, cue('m04', 'Baas') - .2, .4); add(POP, cue('m04', 'Johannesburg') - .2, .4)
add(WHOOSH, SC['baas']['start'] - .3, .4); add(RISE, cue('m06', 'Baas') - 1.6, .35); add(CLUNK, cue('m06', 'power'), .5)
add(WHOOSH, SC['plot']['start'] - .3, .4); add(POP, cue('m07', 'sheep') - .3, .4); add(POP, cue('m08', 'Johannesburg') - .4, .4)
add(WHOOSH, SC['city']['start'] - .3, .4); add(DING, cue('m09', 'Themba'), .35)
for w in ('determined', 'hard', 'hope'): add(POP, cue('m11', w) - .1, .35)
add(WHOOSH, SC['history']['start'] - .3, .4); add(CLUNK, cue('m12', 'elections') + .9, .6); add(CHIME, cue('m12', 'nineteen'), .45)
add(WHOOSH, SC['themes']['start'] - .3, .4)
for w in ('Family', 'Survival', 'Friendship', 'Power', 'hope'): add(POP, cue('m15', w) - .15, .35)
add(WHOOSH, SC['chars']['start'] - .3, .4)
for w in ('Mpho,', 'Themba', 'Baas'): add(POP, cue('m16', w) - .2, .4)
add(WHOOSH, SC['study']['start'] - .3, .35)
add(WHOOSH, SC['questions']['start'] - .3, .4); add(DING, cue('m21') - .2, .4)
add(RISE, SC['outro']['start'] - 2.2, .4); add(CHIME, L['m22']['start'], .45); add(DING, cue('m23', 'Form') - .1, .5)

ins, fl, lab = [], [], []
for i, (f, at, gain) in enumerate(E):
    ms = max(0, int(at * 1000)); ins += ['-i', str(f)]
    fl.append(f"[{i}:a]volume={gain},adelay={ms}|{ms}[e{i}]"); lab.append(f'[e{i}]')
fl.append(f"{''.join(lab)}amix=inputs={len(lab)}:normalize=0,apad,atrim=0:{total:.2f}[o]")
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[o]', '-ar', '48000', '-ac', '2', str(ROOT / 'build/sfx.wav')], check=True)
print('wrote build/sfx.wav with', len(E), 'sound effects')
