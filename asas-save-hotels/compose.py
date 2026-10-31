#!/usr/bin/env python3
"""نسخة الفيديو: يركّب لقطات المالك داخل بطاقة مستديرة (قصّ الشعار والكابشن القديم) تحت طبقة الرسوم.
python3 compose.py <clip.mp4> <out.mp4>   (بعد رسم المحرّك بوضع save.mode=footage → renders/video.mp4)"""
import json, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__)); clip, out = sys.argv[1], sys.argv[2]
film = os.path.join(here, 'renders', 'video.mp4')
# نوافذ اللقطات: (بداية على الخط الزمني، مدة، بداية المصدر ثانية)
WIN = [(0, 4, 0.2), (4, 4.5, 4.4), (20, 3, 27.2)]
total = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', film]))
CW, CH, CX, CY, R = 1000, 972, 40, 380, 56
parts, chain, labels, cur = [], [], [], 0.0
def cut(a, b, name):
    chain.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[{name}]"); labels.append(name)
for i, (s, d, src) in enumerate(WIN):
    if s > cur: cut(cur, s, f"g{i}")
    # بطاقة اللقطة: قصّ الوسط (يخفي الشعار والكابشن)، تقريب بطيء، زوايا مستديرة
    chain.append(f"[1:v]trim=start={src}:duration={d},setpts=PTS-STARTPTS,fps=60,crop=576:560:0:240,scale=w='trunc(1000*(1+0.05*t/{d})/2)*2':h=-2:eval=frame,crop={CW}:{CH},format=yuva420p,"
                 f"geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='if(gt(abs(X-W/2),W/2-{R})*gt(abs(Y-H/2),H/2-{R})*gt(hypot(abs(X-W/2)-(W/2-{R}),abs(Y-H/2)-(H/2-{R})),{R}),0,255)',"
                 f"fade=t=in:st=0:d=0.35:alpha=1[card{i}]")
    chain.append(f"color=c=0x1F2449:s=1080x1920:r=60:d={d}[bg{i}]")
    chain.append(f"[bg{i}][card{i}]overlay=x={CX}:y={CY}:shortest=1[base{i}]")
    chain.append(f"[0:v]trim={s}:{s+d},setpts=PTS-STARTPTS,colorkey=0x000000:0.22:0.18[ov{i}]")
    chain.append(f"[base{i}][ov{i}]overlay=format=auto[seg{i}]"); labels.append(f"seg{i}"); cur = s + d
if cur < total: cut(cur, total, "gend")
chain.append("".join(f"[{l}]" for l in labels) + f"concat=n={len(labels)}:v=1:a=0[v]")
subprocess.check_call(['ffmpeg', '-y', '-v', 'error', '-i', film, '-i', clip, '-filter_complex', ';'.join(chain), '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '60', '-movflags', '+faststart', out])
print('تم', out)
