"""Mix voice lines (audio/lNN.mp3 at their timeline starts) over the music bed with ducking,
then mux with build/video_silent.mp4 → out/<name>.mp4"""
import json, re, subprocess, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads(re.sub(r'^window.TL=|;$', '', open(ROOT/'build/timeline.js').read().strip()))
name = sys.argv[1] if len(sys.argv) > 1 else ('royal-crest-mandarin-connect' if TL['real_audio'] else 'royal-crest-mandarin-connect_PREVIEW_no-voice')
(ROOT/'out').mkdir(exist_ok=True)
ins, flt, labels = ['-i', str(ROOT/'build/video_silent.mp4'), '-i', str(ROOT/'build/music.wav')], [], []
for i, l in enumerate([l for l in TL['lines'] if (ROOT/'audio'/f"{l['id']}.mp3").exists()]):
    ins += ['-i', str(ROOT/'audio'/f"{l['id']}.mp3")]; ms = int(l['start']*1000)
    flt.append(f"[{i+2}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{i}]"); labels.append(f"[v{i}]")
if labels:
    flt.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,volume=1.0,asplit[vo][sc]")
    flt.append("[1:a]volume=0.30[mu]; [mu][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck]")
    flt.append("[vo][duck]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9[a]")
else:
    flt.append("[1:a]volume=0.55,loudnorm=I=-18:TP=-1.5[a]")
cmd = ['ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(flt), '-map', '0:v', '-map', '[a]',
       '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(ROOT/'out'/f'{name}.mp4')]
subprocess.run(cmd, check=True); print('wrote', ROOT/'out'/f'{name}.mp4')
