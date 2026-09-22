set -e
W="$(cd "$(dirname "$0")" && pwd)"; cd "$W"
TOTAL=43.20
# 1) صوت الفيديو الأصلي ممتدّاً لمدة الإعلان (كرت النهاية بلا كلام)
ffmpeg -v error -i src.mp4 -vn -ac 2 -ar 48000 -af "afade=t=out:st=36.9:d=0.7,apad" -t $TOTAL -y voice.wav
# 2) مزج الصوت مع المؤثرات
ffmpeg -v error -i voice.wav -i sfx.wav -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]" -map "[a]" -ac 2 -ar 48000 -y mix.wav
# 3) التجميع
ffmpeg -v error -framerate 30 -i out/%05d.jpg -i mix.wav \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -level 4.1 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 192k -movflags +faststart -shortest -y ad-final.mp4
echo "--- ad-final ---"; ffprobe -v error -show_entries format=duration,size -of csv=p=0 ad-final.mp4
