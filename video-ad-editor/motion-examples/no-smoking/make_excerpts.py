#!/usr/bin/env python3
# يقصّ مقتطفات صوتية قصيرة من شريطي الشيخين (التوقيت من تفريغ آلي + قياس طاقة الصوت) ويكتب excerpts.json
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)); A = f'{D}/assets'
GAP = 0.32
def make(name, src, segs, words, tail=0.25):
    # segs: [(from,to)] من الملف · words: [(word, seg_index, offset داخل المقطع)]
    parts = []; fl = []; t = 0.0; starts = []
    for i, (a, b) in enumerate(segs):
        fl.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.06,afade=t=out:st={b-a-0.08}:d=0.08[s{i}]')
        starts.append(t); parts.append(f'[s{i}]'); t += (b - a)
        if i < len(segs) - 1: fl.append(f'aevalsrc=0:d={GAP}:s=48000[g{i}]'); parts.append(f'[g{i}]'); t += GAP
    fl.append(''.join(parts) + f'concat=n={len(parts)}:v=0:a=1,aresample=48000,loudnorm=I=-16:TP=-1.5,apad=pad_dur={tail}[o]')
    out = f'{A}/{name}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{A}/{src}', '-filter_complex', ';'.join(fl), '-map', '[o]', '-ac', '1', '-ar', '48000', out], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout)
    # الفجوات تُدمج مع أول الكلمات: starts[i] + offset
    wt = [[w, round(starts[si] + (segs[si][0] * 0 + off), 2)] for (w, si, off) in words]
    return {'wav': f'assets/{name}.wav', 'dur': round(dur, 2), 'words': wt}
ex = {}
# ابن عثيمين: «… محرم بدلالة الكتاب والسنة والاعتبار الصحيح»
ex['uth'] = make('uth_x', 'uth_smoking.mp3', [(33.55, 34.6), (36.5, 37.95), (38.6, 39.7), (40.2, 42.2)],
    [('محرم', 0, 0.25), ('بدلالة', 1, 0.25), ('الكتاب', 1, 0.95), ('والسنة', 2, 0.25), ('والاعتبار', 3, 0.1), ('الصحيح', 3, 1.0)])
# ابن باز: «… يضيق مجاري الدم، يسيء إلى شرايينه، يسيء إلى صدره، يسيء إلى قلبه»
ex['baz'] = make('baz_x', 'baz_smoking.mp3', [(52.9, 59.05)],
    [('يضيق', 0, 0.2), ('مجاري', 0, 0.56), ('الدم،', 0, 0.82), ('يسيء', 0, 1.68), ('إلى', 0, 1.95), ('شرايينه،', 0, 2.28), ('يسيء', 0, 3.14), ('إلى', 0, 3.45), ('صدره،', 0, 4.16), ('يسيء', 0, 5.02), ('إلى', 0, 5.3), ('قلبه', 0, 5.42)])
json.dump(ex, open(f'{D}/excerpts.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: (v['dur'], v['words'][:3]) for k, v in ex.items()}, ensure_ascii=False))
