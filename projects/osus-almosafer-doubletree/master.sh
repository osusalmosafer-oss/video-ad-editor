set -e
cd "$(dirname "$0")"
ffmpeg -v error -i ad-final.mp4 -c:v copy \
 -af "loudnorm=I=-14:TP=-2.2:LRA=11:measured_I=-13.02:measured_TP=0.11:measured_LRA=4.10:measured_thresh=-23.61:offset=0.30:linear=true:print_format=summary" \
 -c:a aac -b:a 192k -movflags +faststart -y ad-master.mp4
