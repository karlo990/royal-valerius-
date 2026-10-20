"""Slow down teaching moments: insert silence before chosen characters in a voice line,
and shift that line's character timestamps to match. Keeps the original as lNN.orig.*
Usage: python3 tools/pace.py   (edit PACE below)"""
import json, pathlib, shutil, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent; A = ROOT/'audio'
PACE = {'l15': (['麻', '马', '骂'], 0.55)}   # line: (insert a gap before each of these, gap seconds)
for lid, (marks, gap) in PACE.items():
    mp3, js = A/f'{lid}.mp3', A/f'{lid}.json'
    omp3, ojs = A/f'{lid}.orig.mp3', A/f'{lid}.orig.json'
    if not omp3.exists(): shutil.copy(mp3, omp3); shutil.copy(js, ojs)
    al = json.load(open(ojs)); ch, st = al['characters'], al['character_start_times_seconds']
    cuts = [st[ch.index(m)] - 0.04 for m in marks]
    edges = [0.0] + cuts + [None]; parts = []
    for i in range(len(edges)-1):
        seg = f"atrim=start={edges[i]}" + (f":end={edges[i+1]}" if edges[i+1] else '')
        parts.append(f"[0:a]{seg},asetpts=PTS-STARTPTS[s{i}]")
    chain = ''.join(f"[s{i}]" + (f"[g{i}]" if i < len(cuts) else '') for i in range(len(edges)-1))
    gaps = [f"anullsrc=r=44100:cl=mono,atrim=0:{gap}[g{i}]" for i in range(len(cuts))]
    n = len(edges)-1 + len(cuts)
    f = ';'.join(parts + gaps + [f"{chain}concat=n={n}:v=0:a=1[o]"])
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(omp3),'-filter_complex',f,'-map','[o]','-ac','1','-ar','44100','-b:a','128k',str(mp3)], check=True)
    shift = lambda t: t + gap*sum(1 for c in cuts if t >= c)
    al['character_start_times_seconds'] = [round(shift(t),3) for t in st]
    if 'character_end_times_seconds' in al: al['character_end_times_seconds'] = [round(shift(t),3) for t in al['character_end_times_seconds']]
    json.dump(al, open(js,'w'), ensure_ascii=False)
    print(lid, 'paced: +', round(gap*len(cuts),2), 's')
