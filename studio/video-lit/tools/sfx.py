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

# ---- open: words fly from the page to the microphone (no scratchy sounds: the school asked for none)
s0 = SC['open']['start']
for i in range(7): add(POP, s0 + 1.2 + i * .62 + 2.0, .18)
add(RISE, cue('o02', 'speak') - 2.2, .35); add(CHIME, cue('o02', 'speak') - .1, .45)
add(WHOOSH, SC['title']['start'] - .3, .5); add(CHIME, SC['title']['start'] + .4, .5)
for w in ('think', 'feel', 'change'): add(POP, cue('w01', w) - .05, .45)
add(WHOOSH, SC['page']['start'] - .3, .4)
for a in (cue('p02', 'metaphor'), cue('p03', 'tone'), cue('p04', 'structure')): add(DING, a, .35)
add(CHIME, cue('p05', 'imagery'), .35)
add(WHOOSH, SC['essay']['start'] - .3, .4)
for w in ('Point', 'Evidence', 'Explain', 'Link'): add(CLUNK, cue('e02', w) - .2, .5)
add(CHIME, cue('e03', 'Point'), .4)
add(WHOOSH, SC['genres']['start'] - .3, .4)
for w in ('poetry', 'prose', 'drama'): add(POP, cue('g01', w) - .15, .4)
add(RISE, SC['bridge']['start'] - 1.6, .45); add(CLUNK, SC['bridge']['start'] + .4, .7)
for w in ('stand', 'eye', 'pace', 'voice'): add(TAP, cue(['s02', 's03', 's04', 's05'][['stand', 'eye', 'pace', 'voice'].index(w)], w) - .1, .6)
add(WHOOSH, SC['shape']['start'] - .3, .4)
for w in ('hook', 'body', 'close'): add(POP, cue('t01', w) - .15, .4)
add(DING, cue('t03', 'hook'), .45)
add(WHOOSH, SC['practice']['start'] - .3, .4)
go = cue('r02', 'now'); t = go
while t < SC['practice']['end'] - .2: add(TICK, t, .5); t += 1.0
add(RISE, SC['outro']['start'] - 2.2, .4); add(CHIME, L['x01']['start'], .45); add(DING, cue('x02', 'Form') - .1, .5)

ins, fl, lab = [], [], []
for i, (f, at, gain) in enumerate(E):
    ms = max(0, int(at * 1000)); ins += ['-i', str(f)]
    fl.append(f"[{i}:a]volume={gain},adelay={ms}|{ms}[e{i}]"); lab.append(f'[e{i}]')
fl.append(f"{''.join(lab)}amix=inputs={len(lab)}:normalize=0,apad,atrim=0:{total:.2f}[o]")
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[o]', '-ar', '48000', '-ac', '2', str(ROOT / 'build/sfx.wav')], check=True)
print('wrote build/sfx.wav with', len(E), 'sound effects')
