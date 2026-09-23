set -e
cd "$(dirname "$0")"
ffmpeg -v error -i ad-final.mp4 -c:v copy \
 -af "loudnorm=I=-14:TP=-2.6:LRA=11:measured_I=-13.30:measured_TP=1.76:measured_LRA=4.60:measured_thresh=-23.82:offset=0.44:linear=true:print_format=summary" \
 -c:a aac -b:a 192k -movflags +faststart -y ad-master.mp4
