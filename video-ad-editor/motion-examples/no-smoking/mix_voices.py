#!/usr/bin/env python3
# يركّب أصوات الشيخين فوق مسار الصوت الحالي (renders/final-nobed.mp4 من audio.py) → renders/final.mp4
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)); tl = json.load(open(f'{D}/timeline.json'))
s4b = next(s for s in tl['scenes'] if s['id'] == 's4b')['start']
ex = json.load(open(f'{D}/excerpts.json', encoding='utf8')); LEAD, TAILC = 0.6, 0.6
cards = [('uth', s4b + LEAD), ('baz', s4b + LEAD + ex['uth']['dur'] + LEAD + TAILC)]
ins = ['-i', f'{D}/renders/final-nobed.mp4']; fl = ['[0:a]volume=0.55[bg]']; labs = ['[bg]']
for i, (k, at) in enumerate(cards):
    ins += ['-i', f'{D}/{ex[k]["wav"]}']; ms = int(at * 1000)
    fl.append(f'[{i+1}:a]adelay={ms}|{ms},volume=1.5[v{i}]'); labs.append(f'[v{i}]')
fl.append(''.join(labs) + f'amix=inputs={len(labs)}:normalize=0,loudnorm=I=-15:TP=-1.5[a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', f'{D}/renders/final.mp4'], check=True)
print('✅ final.mp4', cards)
