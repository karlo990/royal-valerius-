"""Flag sudden picture jumps: mean absolute difference between consecutive frames of the lens area,
reporting frames that spike far above their neighbours (scene crossfades are gradual, glitches are not)."""
import subprocess, sys, numpy as np
f = sys.argv[1]; W, H = 160, 90
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
v = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)
d = np.abs(np.diff(v, axis=0)).mean(axis=(1, 2))
med = np.array([np.median(d[max(0, i-15):i+15]) for i in range(len(d))])
bad = [i for i in range(1, len(d)-1) if d[i] > 4 * med[i] + 1.5 and d[i] > d[i-1] * 2 and d[i] > d[i+1] * 2]
print(f'{len(v)} frames, {len(bad)} spikes')
for i in bad[:40]: print(f'  {i/30:7.2f}s  diff {d[i]:.1f} (local median {med[i]:.1f})')
