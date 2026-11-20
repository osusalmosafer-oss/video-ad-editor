#!/usr/bin/env python3
# يركّب الأصوات (الآيات + أقوال العلماء) فوق مسار المؤثرات → renders/final.mp4. المواضع من audio_cues.json
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)); tl = json.load(open(f'{D}/timeline.json')); cues = json.load(open(f'{D}/audio_cues.json'))
st = {s['id']: s['start'] for s in tl['scenes']}
ins = ['-i', f'{D}/renders/final-nobed.mp4']; fl = ['[0:a]volume=0.45[bg]']; labs = ['[bg]']
for i, c in enumerate(cues):
    ins += ['-i', f'{D}/{c["wav"]}']; ms = int((st[c['scene']] + c['at']) * 1000)
    fl.append(f'[{i+1}:a]adelay={ms}|{ms},volume={c["gain"]}[v{i}]'); labs.append(f'[v{i}]')
fl.append(''.join(labs) + f'amix=inputs={len(labs)}:normalize=0,loudnorm=I=-15:TP=-1.5[a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fl), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', f'{D}/renders/final.mp4'], check=True)
print('✅ final.mp4', len(cues), 'cues')
