"""Build build/sfx.wav: every sound effect for "Newton's apples + Crest Slate", placed on the voice cues
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
RUSTLE = gen('rustle', 'anoisesrc=c=pink:a=1:r=48000:seed=4', .5, "highpass=f=1800,volume='exp(-t*9)':eval=frame")
WHOOSH = gen('whoosh', 'anoisesrc=c=white:a=1:r=48000:seed=5', 1.2, "bandpass=f=900:w=1400,volume='sin(PI*t/1.2)^2':eval=frame")
CHALK = gen('chalk', 'anoisesrc=c=white:a=1:r=48000:seed=6', .7, "highpass=f=2500,lowpass=f=7000,tremolo=f=24:d=0.8,volume='sin(PI*t/.7)':eval=frame,volume=.8")
POP = gen('pop', "aevalsrc='sin(2*PI*(520+900*exp(-t*30))*t)*exp(-t*28)':s=48000:d=0.25", .25, 'volume=.9')
CLUNK = gen('clunk', "aevalsrc='(sin(2*PI*140*t)+.5*sin(2*PI*310*t))*exp(-t*16)':s=48000:d=0.5", .5, 'lowpass=f=900,volume=1.4')
CREAK = gen('creak', "aevalsrc='sin(2*PI*(220+60*sin(2*PI*7*t))*t)*.5':s=48000:d=0.8", .8, "bandpass=f=700:w=600,volume='sin(PI*t/.8)':eval=frame")
CHIME = gen('chime', "aevalsrc='(sin(2*PI*1046*t)+.6*sin(2*PI*1568*t)+.3*sin(2*PI*2093*t))*exp(-t*3.2)':s=48000:d=1.6", 1.6, 'volume=.5')
DING = gen('ding', "aevalsrc='(sin(2*PI*1318*t)+.4*sin(2*PI*2637*t))*exp(-t*4)':s=48000:d=1.2", 1.2, 'volume=.55')
TICK = gen('tick', "aevalsrc='sin(2*PI*2200*t)*exp(-t*90)':s=48000:d=0.08", .08, 'volume=.8')
PENCIL = gen('pencil', 'anoisesrc=c=pink:a=1:r=48000:seed=8', 1.1, "highpass=f=1200,lowpass=f=5000,tremolo=f=11:d=0.9,volume='sin(PI*t/1.1)':eval=frame,volume=.7")
SHUTTER = gen('shutter', 'anoisesrc=c=white:a=1:r=48000:seed=9', .22, "highpass=f=1500,volume='if(lt(t,.03),1,if(lt(t,.09),.15,if(lt(t,.13),.9,0)))*exp(-t*8)':eval=frame,volume=1.4")
TAP = gen('tap', "aevalsrc='sin(2*PI*1800*t)*exp(-t*70)+.4*sin(2*PI*900*t)*exp(-t*50)':s=48000:d=0.12", .12, 'volume=.7')
KEYS = gen('keys', 'anoisesrc=c=white:a=1:r=48000:seed=10', 1.6, "highpass=f=2000,lowpass=f=6000,volume='0.15+0.85*gt(sin(2*PI*9.3*t)+sin(2*PI*5.1*t),1.2)':eval=frame,volume=.6")
SOFTNO = gen('softno', "aevalsrc='sin(2*PI*330*t)*exp(-t*6)+sin(2*PI*262*t)*exp(-(t-.18)*6)*gt(t,.18)':s=48000:d=0.9", .9, 'volume=.35')
RISE = gen('rise', 'anoisesrc=c=pink:a=1:r=48000:seed=12', 2.5, "lowpass=f=2500,volume='(t/2.5)^2':eval=frame,afade=t=out:st=2.2:d=0.3")
BREEZE = gen('breeze', 'anoisesrc=c=brown:a=1:r=48000:seed=13', SC['story']['end'] - SC['story']['start'] + 1, "lowpass=f=600,tremolo=f=.3:d=0.6,afade=t=in:d=1.5,afade=t=out:st=%.2f:d=1.5" % (SC['story']['end'] - SC['story']['start'] - .5))
BIRD = gen('bird', "aevalsrc='sin(2*PI*(3200+900*sin(2*PI*14*t))*t)*exp(-t*9)':s=48000:d=0.35", .35, 'volume=.35')

# ---- story: garden, the apple
add(BREEZE, SC['story']['start'], .25)
for i, at in enumerate([1.2, 3.4, 6.8, 11.5, 16, 21]):
    if SC['story']['start'] + at < SC['story']['end']: add(BIRD, SC['story']['start'] + at, .5 - .05 * (i % 3))
fall = cue('n02', 'falls') + .3
add(THUD, fall, .9)
# ---- transition: doodles, whooshes (no scratchy chalk, pencil, rustle or keys: the school asked for them out)
d0 = cue('n05', 'think') - .2
add(WHOOSH, SC['title']['start'] - .4, .6)
# ---- lesson
for i in range(5): add(POP, SC['title']['start'] + .4 + i * .12, .35)
add(POP, cue('m08', 'x') - .1, .5)
bs = SC['balance']['start']; add(POP, bs + .4, .4); add(POP, bs + 1.2, .4)
for i in range(7): add(POP, cue('m11', 'seven') - .2 + i * .06, .25)
add(CLUNK, cue('m11', 'balances'), .8)
add(WHOOSH, cue('m13', 'Take') + .3, .35)
add(CHIME, cue('m14', 'four') - .1, .7)
add(CREAK, cue('m15', 'Open'), .6)
for i in range(5): add(POP, cue('m17', 'Two baskets') + i * .15, .3)
add(SOFTNO, cue('m19', 'No'), .8)
add(CREAK, cue('m21', 'six'), .4); add(DING, cue('m22', 'twenty'), .5)
add(CREAK, cue('m27', 'five'), .4)
ans = cue('m30'); t = L['m29']['end']
while t < ans - .3: add(TICK, t, .6); t += .5
add(DING, ans - .1, .7); add(CREAK, ans, .35)
# ---- bridge + marketing
add(WHOOSH, SC['bridge']['start'] - .3, .6)
add(RISE, cue('b02', 'Crest Slate') - 2.4, .5); add(CHIME, cue('b02', 'Crest Slate') - .2, .5)
for sc in ('reveal', 'snap', 'checked', 'graph', 'marking', 'features', 'anydevice'): add(WHOOSH, SC[sc]['start'] - .3, .35)
add(SHUTTER, cue('b04', 'photo'), 1.0)
for w in ('step by step', 'hint', 'mark'): add(TAP, cue('b05', w) - .1, .8)
add(CHIME, cue('b06', 'back into') - .1, .8)
add(SOFTNO, cue('b08', 'wrong'), .5)
for i in range(9): add(POP, cue('b10', 'nine') + i * .22, .25)
add(CHIME, cue('b11', 'own') - .2, .4)
for i in range(4): add(TAP, L['b12']['start'] + .3 + i * .4, .5)
add(RISE, SC['outro']['start'] - 2.2, .45); add(CHIME, L['b14']['start'], .45); add(DING, L['b15']['start'] - .1, .5)
add(TAP, cue('b12', 'royal') - .3, .6)

ins, fl, lab = [], [], []
for i, (f, at, gain) in enumerate(E):
    ms = max(0, int(at * 1000)); ins += ['-i', str(f)]
    fl.append(f"[{i}:a]volume={gain},adelay={ms}|{ms}[e{i}]"); lab.append(f'[e{i}]')
fl.append(f"{''.join(lab)}amix=inputs={len(lab)}:normalize=0,apad,atrim=0:{total:.2f}[o]")
subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[o]', '-ar', '48000', '-ac', '2', str(ROOT / 'build/sfx.wav')], check=True)
print('wrote build/sfx.wav with', len(E), 'sound effects')
