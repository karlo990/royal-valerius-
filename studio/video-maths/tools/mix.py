"""Mix voice lines (audio/lNN.mp3 at their timeline starts) over a music bed, then mux with
build/video_silent.mp4 → out/<name>.mp4

  python3 tools/mix.py                       # original music bed (build/music.wav)
  python3 tools/mix.py --music song.mp3 --music-start 0

Voice: high-pass, gentle compression, light presence lift.
Music: high-pass, EQ dip where speech sits (1–4 kHz), ducked by the voices (sidechain),
rides back up in the gaps. Final loudness: two-pass EBU R128 to -14 LUFS, -1 dBTP (social media).
"""
import argparse, json, re, subprocess, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads(re.sub(r'^window.TL=|;$', '', open(ROOT/'build/timeline.js').read().strip()))
ap = argparse.ArgumentParser()
ap.add_argument('--music', default=str(ROOT/'build/music.wav'))
ap.add_argument('--music-start', type=float, default=0.0, help='seconds into the song to start from')
ap.add_argument('--bed', type=float, default=0.42, help='music level in gaps (linear)')
ap.add_argument('--name')
ap.add_argument('--loop-from', type=float, default=None, help='if the film is longer than the song, continue the song from this second with a crossfade')
ap.add_argument('--sfx', default=None, help='effects track (build/sfx.wav) laid on top, not ducked')
ap.add_argument('--sfx-gain', type=float, default=1.0)
ap.add_argument('--duck', type=float, default=10, help='how hard the music dips under the voices (compressor ratio)')
ap.add_argument('--video', default=str(ROOT/'build/video_silent.mp4'))
a = ap.parse_args()
name = a.name or ('royal-crest-biology' if TL['real_audio'] else 'royal-crest-biology_PREVIEW_no-voice')
total = TL['total']; (ROOT/'out').mkdir(exist_ok=True)

ins = ['-i', a.video, '-ss', str(a.music_start), '-i', a.music]
NM = 1
if a.loop_from is not None: ins += ['-ss', str(a.loop_from), '-i', a.music]; NM = 2
flt, labels = [], []
voiced = [l for l in TL['lines'] if (ROOT/'audio'/f"{l['id']}.mp3").exists()]
for i, l in enumerate(voiced):
    ins += ['-i', str(ROOT/'audio'/f"{l['id']}.mp3")]; ms = int(l['start']*1000)
    flt.append(f"[{i+1+NM}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{i}]"); labels.append(f"[v{i}]")
fade = f"afade=t=in:d=1.2,afade=t=out:st={max(0,total-3.5):.2f}:d=3.5"
src = "[1:a]" if NM == 1 else "[1:a]aresample=48000,aformat=channel_layouts=stereo[m1];[2:a]aresample=48000,aformat=channel_layouts=stereo[m2];[m1][m2]acrossfade=d=6:c1=tri:c2=tri,"
music = (f"{src}aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.2f},asetpts=PTS-STARTPTS,"
         f"highpass=f=40,equalizer=f=2500:t=o:w=1.6:g=-6,equalizer=f=1000:t=o:w=1:g=-2,volume={a.bed},{fade}")
if labels:
    flt.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,"
               "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,"
               "equalizer=f=3500:t=o:w=1.2:g=2,apad,asplit=" + ("3[vo][key][key2]" if a.sfx else "2[vo][key]"))
    flt.append(music + "[mu]")
    flt.append(f"[mu][key]sidechaincompress=threshold=0.02:ratio={a.duck:g}:attack=15:release=450:knee=4:makeup=1[duck]")
    flt.append(f"[vo][duck]amix=inputs=2:normalize=0:duration=longest,atrim=0:{total:.2f}[pre]")
else:
    flt.append(music + "[pre]")
if a.sfx:
    k = ins.count('-i'); ins += ['-i', a.sfx]
    flt[-1] = flt[-1][:-len('[pre]')] + '[pre0]'
    flt.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,volume={a.sfx_gain},apad,atrim=0:{total:.2f}[fx0];"
               + ("[fx0][key2]sidechaincompress=threshold=0.03:ratio=5:attack=10:release=350:knee=4[fx];" if labels else "[fx0]anull[fx];")
               + f"[pre0][fx]amix=inputs=2:normalize=0:duration=first[pre]")

def run(extra_tail, out_args, lvl='error'):
    cmd = ['ffmpeg', '-y', '-hide_banner', '-nostats', '-v', lvl, *ins, '-filter_complex', ';'.join(flt + [extra_tail]), *out_args]
    return subprocess.run(cmd, check=True, capture_output=True, text=True)

# pass 1: measure loudness
r = run('[pre]loudnorm=I=-14:TP=-1:LRA=11:print_format=json[a]', ['-map', '[a]', '-f', 'null', '-'], lvl='info')
m = json.loads(r.stderr[r.stderr.rindex('{'):])
ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
# pass 2: apply and mux
out = ROOT/'out'/f'{name}.mp4'
run(f'[pre]{ln},aresample=48000[a]', ['-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                                       '-movflags', '+faststart', str(out)])
print('wrote', out, '| measured', m['input_i'], 'LUFS →', -14)
