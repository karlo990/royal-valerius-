"""Original music bed: plucked-string (Karplus–Strong) melody on the D major pentatonic scale,
a soft drone, gentle hand-drum pulses, and a simple reverb. Length follows build/timeline.js."""
import json, re, numpy as np, wave, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads(re.sub(r'^window.TL=|;$', '', open(ROOT/'build/timeline.js').read().strip()))
SR = 44100; DUR = TL['total'] + 2.5; N = int(SR*DUR)
rng = np.random.default_rng(7)
def pluck(f, dur, bright=.5, amp=.5):
    n = int(SR*dur); p = max(2, int(SR/f)); buf = rng.uniform(-1, 1, p) * amp; out = np.zeros(n)
    decay = .996 + .0025*bright
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = decay*.5*(buf[i % p] + buf[(i+1) % p])
    env = np.minimum(1, np.arange(n)/40); return out*env
def note(m): return 440*2**((m-69)/12)
SCALE = [62, 64, 66, 69, 71]                      # D E F# A B
mel = [m+o for o in (0, 12) for m in SCALE] + [86]
L = np.zeros(N); R = np.zeros(N)
bpm = 80; beat = 60/bpm
# drone (D + A), slow swell
t = np.arange(N)/SR
drone = (np.sin(2*np.pi*73.42*t) + .6*np.sin(2*np.pi*110*t) + .25*np.sin(2*np.pi*146.83*t+.3)) * (.5+.5*np.sin(2*np.pi*t/14))
drone *= np.minimum(1, t/4) * .045; L += drone; R += drone
# melody phrases: 8-beat motifs, sparse and calm
motifs = [[0,None,2,None,4,3,None,None],[5,None,4,2,None,1,None,None],[2,4,5,None,7,None,5,None],[4,None,3,2,0,None,None,None]]
cache = {}
b = 0; k = 0
while b*beat < DUR-3:
    for j, idx in enumerate(motifs[k % 4]):
        if idx is None: continue
        st = int((b+j)*beat*SR); f = note(mel[idx % len(mel)])
        if st >= N - SR: continue
        key = (idx, j % 2)
        if key not in cache: cache[key] = pluck(f, 2.6, bright=.3+.4*(j % 2), amp=.32)
        s = cache[key]; e = min(N, st+len(s)); pan = .35+.3*((idx*37) % 10)/10
        L[st:e] += s[:e-st]*(1-pan); R[st:e] += s[:e-st]*pan
        # soft octave-below echo note on strong beats
        if j % 4 == 0:
            kb = ('lo', idx)
            if kb not in cache: cache[kb] = pluck(f/2, 3.0, bright=.1, amp=.22)
            s2 = cache[kb]; e2 = min(N, st+len(s2)); L[st:e2] += s2[:e2-st]*.5; R[st:e2] += s2[:e2-st]*.5
    b += 8; k += 1
# hand-drum pulse every 2 beats after the cold open
drum_t = np.arange(int(.35*SR))/SR; drum = np.sin(2*np.pi*(90*np.exp(-drum_t*9))*drum_t)*np.exp(-drum_t*11)*.18
x = 4.0
while x < DUR-3:
    st = int(x*SR); e = min(N, st+len(drum)); L[st:e] += drum[:e-st]; R[st:e] += drum[:e-st]; x += beat*2
# reverb: convolve with decaying noise
ir_n = int(2.2*SR); ir = rng.standard_normal(ir_n)*np.exp(-np.arange(ir_n)/SR*3.2); ir /= np.abs(ir).sum()/6
def conv(a): F = 1 << int(np.ceil(np.log2(len(a)+ir_n))); return np.fft.irfft(np.fft.rfft(a, F)*np.fft.rfft(ir, F), F)[:len(a)]
L = L + .35*conv(L); R = R + .35*conv(R)
fade = np.ones(N); fo = int(3*SR); fade[-fo:] = np.linspace(1, 0, fo); fi = int(1.5*SR); fade[:fi] = np.linspace(0, 1, fi)
st = np.stack([L*fade, R*fade], 1); st /= np.abs(st).max()/0.6
with wave.open(str(ROOT/'build/music.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes())
print('music', round(DUR, 1), 's')
