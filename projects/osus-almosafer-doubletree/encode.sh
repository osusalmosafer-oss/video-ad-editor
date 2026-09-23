set -e
W="$(cd "$(dirname "$0")" && pwd)"; cd "$W"
TOTAL=$(python3 -c "import re;s=open('plan.js',encoding='utf-8').read();print(float(re.search(r'SRC_END\s*=\s*([\d.]+)',s).group(1))+float(re.search(r'OUTRO\s*=\s*([\d.]+)',s).group(1)))")
SRCEND=$(python3 -c "import re;print(re.search(r'SRC_END\s*=\s*([\d.]+)',open('plan.js',encoding='utf-8').read()).group(1))")
FADE=$(python3 -c "print(max(0,$SRCEND-0.55))")
# 1) صوت المصدر مقصوصاً عند نهاية الفيديو وممتدّاً بصمت لمدة كرت النهاية
ffmpeg -v error -i src.mp4 -vn -ac 2 -ar 48000 -af "atrim=0:$SRCEND,afade=t=out:st=$FADE:d=0.55,apad" -t $TOTAL -y voice.wav
# 2) المزج: خفض لحظي للأصلي + المؤثرات
python3 sfx.py
# 3) التجميع
ffmpeg -v error -framerate 30 -i out/%05d.jpg -i mix.wav \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -level 4.1 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 192k -movflags +faststart -shortest -y ad-final.mp4
echo "--- ad-final ---"; ffprobe -v error -show_entries format=duration,size -of csv=p=0 ad-final.mp4
