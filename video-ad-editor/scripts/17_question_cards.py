#!/usr/bin/env python3
"""يركّب بطاقات «أسئلة من التعليقات» فوق الفيديو بتوقيت تحدده.
الاستعمال:
  python3 17_question_cards.py فيديو.mp4 cards.json خرج.mp4
cards.json (مثال):
  [ {"png": "l2_video-overlay.png", "start": 2.0, "dur": 3.0},
    {"png": "l1_video-overlay.png", "start": 14.5, "dur": 3.0} ]
  png: البطاقة الشفافة (من brand-kit/question-card/*/*_video-overlay.png)
  start: ثانية الظهور  ·  dur: مدة الظهور  (تدخل وتخرج بتلاشٍ 0.25 ثانية)
الصوت يُنسخ كما هو. تتمدد البطاقة لحجم الفيديو تلقائياً."""
import json, subprocess, sys, os

def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    src, cj, out = sys.argv[1:]
    base = os.path.dirname(os.path.abspath(cj))
    cards = json.load(open(cj, encoding='utf-8'))
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src]
    for c in cards:
        p = c['png'] if os.path.isabs(c['png']) else os.path.join(base, c['png'])
        if not os.path.exists(p):
            sys.exit(f"ما لقيت البطاقة: {p}")
        cmd += ['-loop', '1', '-framerate', '30', '-t', str(c['start'] + c['dur'] + 1), '-i', p]
    f, last = [], '0:v'
    for i, c in enumerate(cards, 1):
        s, d = float(c['start']), float(c['dur'])
        f.append(f"[{i}:v][{last}]scale2ref=flags=bicubic[k{i}][b{i}]")
        f.append(f"[k{i}]format=rgba,fade=t=in:st=0:d=0.25:alpha=1,"
                 f"fade=t=out:st={d-0.25}:d=0.25:alpha=1,setpts=PTS+{s}/TB[c{i}]")
        f.append(f"[b{i}][c{i}]overlay=eof_action=pass:format=auto[o{i}]")
        last = f'o{i}'
    cmd += ['-filter_complex', ';'.join(f), '-map', f'[{last}]', '-map', '0:a?',
            '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
            '-c:a', 'copy', '-shortest', out]
    subprocess.run(cmd, check=True)
    print('تم:', out)

main()
