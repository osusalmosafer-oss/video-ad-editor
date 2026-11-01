#!/usr/bin/env python3
"""يضيف أصوات انتقالات (whoosh ناعم) إلى الفيديو عند كل انتقال. python3 sfx.py in.mp4 out.mp4"""
import subprocess, sys, os, tempfile
inp, out = sys.argv[1], sys.argv[2]
T_TR = 0.8
starts = [float(x) for x in sys.argv[3:]] or [3.6, 8.2, 12.8, 17.4, 22.0, 26.2]   # بدايات المشاهد (تطابق scenes/main.js)
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inp]))
d = tempfile.mkdtemp()
wh = os.path.join(d, 'whoosh.wav')
# whoosh: نغمة صاعدة 220→2400Hz + ضجيج وردي مُرشَّح، بغلاف ناعم (دخول 0.45 ث، خروج 0.35 ث)
subprocess.check_call(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', "aevalsrc='0.32*sin(2*PI*(220*t+1360*t*t))':d=0.8:s=48000", '-f', 'lavfi', '-i', 'anoisesrc=d=0.8:c=pink:a=0.5:r=48000',
                       '-filter_complex', "[0:a]afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.35[t];[1:a]highpass=f=700,lowpass=f=7000,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.35[n];[t][n]amix=inputs=2:normalize=0,volume=0.95,aformat=sample_fmts=fltp:channel_layouts=stereo",
                       wh])
inputs, delays = [], []
cmd = ['ffmpeg', '-y', '-v', 'error', '-i', inp]
for s in starts:
    cmd += ['-i', wh]
fc = ';'.join(f"[{i + 1}:a]adelay={int((s - T_TR) * 1000)}|{int((s - T_TR) * 1000)}[w{i}]" for i, s in enumerate(starts))
fc += ';' + ''.join(f'[w{i}]' for i in range(len(starts))) + f"amix=inputs={len(starts)}:normalize=0,apad,atrim=0:{dur}[a]"
cmd += ['-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out]
subprocess.check_call(cmd); print('تم', out)
