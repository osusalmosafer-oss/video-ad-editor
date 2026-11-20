#!/usr/bin/env python3
# يقصّ مقاطع الآيات من تلاوة القارئ (mp3quran.net) بحسب توقيت الكلمات (تفريغ آلي + توقيت الآيات) ويكتب verses.json
import json, os, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__)); A = f'{D}/assets'; Q = '/tmp/claude-0/-home-user-video-ad-editor/f99eb695-52fc-566e-b92f-10fb72f13a7b/scratchpad/lh'
al = json.load(open(f'{D}/ayat_lh.json'))
al['65:2']['words'] = [['ومن', 72.22, 72.72], ['يتق', 72.72, 73.62], ['الله', 73.62, 74.14], ['يجعل', 74.14, 74.85], ['له', 74.85, 75.34], ['مخرجا', 75.34, 76.4]]
# (id, مفتاح الآية, ملف السورة, عدد الكلمات المأخوذة من أول المطابقة, كلمات العرض بالتشكيل, السورة والآية)
V = [
 ('v195', '2:195', 'l002.mp3', 5, ['﴿وَلَا', 'تُلْقُوا', 'بِأَيْدِيكُمْ', 'إِلَى', 'التَّهْلُكَةِ﴾'], 'سورة البقرة · 195'),
 ('v29', '4:29', 'l004.mp3', 3, ['﴿وَلَا', 'تَقْتُلُوا', 'أَنفُسَكُمْ﴾'], 'سورة النساء · 29'),
 ('v157', '7:157', 'l007.mp3', 3, ['﴿وَيُحَرِّمُ', 'عَلَيْهِمُ', 'الْخَبَائِثَ﴾'], 'سورة الأعراف · 157'),
 ('v27', '17:27', 'l017.mp3', 5, ['﴿إِنَّ', 'الْمُبَذِّرِينَ', 'كَانُوا', 'إِخْوَانَ', 'الشَّيَاطِينِ﴾'], 'سورة الإسراء · 27'),
 ('v65', '65:2', 'l065.mp3', 6, ['﴿وَمَن', 'يَتَّقِ', 'اللَّهَ', 'يَجْعَل', 'لَّهُ', 'مَخْرَجًا﴾'], 'سورة الطلاق · 2'),
]
OFF = {'v157': 3, 'v29': 0, 'v195': 0, 'v27': 0, 'v65': 0}   # ترتيب أول كلمة مأخوذة داخل مطابقة الهدف
out = {}
for vid, key, f, n, disp, ref in V:
    ws = al[key]['words']; skip = OFF[vid] if vid == 'v157' else 0
    ws = ws[skip:skip + n] if vid != 'v157' else ws[3:6]
    s = ws[0][1] - (0.05 if vid == 'v27' else 0.12); e = ws[-1][2] + 0.18
    if vid == 'v27': s = ws[0][1] - 0.05
    wav = f'{A}/{vid}.wav'; d = e - s
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s:.3f}', '-t', f'{d:.3f}', '-i', f'{Q}/{f}', '-af', f'afade=t=in:d=0.05,afade=t=out:st={d-0.12:.3f}:d=0.12,loudnorm=I=-16:TP=-1.5', '-ac', '1', '-ar', '48000', wav], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
    out[vid] = {'wav': f'assets/{vid}.wav', 'dur': round(dur, 2), 'ref': ref, 'words': [[w, round(max(0, t[1] - s), 2)] for w, t in zip(disp, ws)]}
    print(vid, round(dur, 2), out[vid]['words'])
json.dump(out, open(f'{D}/verses.json', 'w'), ensure_ascii=False, indent=1)
