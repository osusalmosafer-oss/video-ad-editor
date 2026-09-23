"""Builds data.json (embedded in the dashboard) from the Windsor pulls.

Usage: python3 build.py <retention.json from Windsor get_data>
Retention rows with no second (photo posts) are skipped.
"""
import json
import sys
from pathlib import Path

from videos import VIDEOS, DAILY, SOURCES, AUDIENCE, ACTIVITY

HERE = Path(__file__).parent

ret_rows = json.load(open(sys.argv[1]))["result"]
retention = {}
for r in ret_rows:
    if r["video_view_retention_second"] is None:
        continue
    retention.setdefault(r["video_id"], {})[int(r["video_view_retention_second"])] = r["video_view_retention_percentage"]

videos = []
for (vid, dt, dur, views, likes, comments, shares, favs, avg_w, total_w, full, new_f, reach, prof, cap) in VIDEOS:
    curve = retention.get(vid)
    videos.append({
        "id": vid, "dt": dt, "dur": dur or None, "views": views, "likes": likes, "comments": comments,
        "shares": shares, "saves": favs, "avgWatch": avg_w, "totalWatch": total_w, "fullRate": full,
        "newFollowers": new_f, "reach": reach, "profileViews": prof, "caption": cap.strip().strip('"').strip(),
        "sources": dict(zip(["foryou", "search", "profile", "follow", "others", "sound", "dm"], SOURCES[vid])),
        "audience": None if AUDIENCE[vid][:2] == [0, 0] else dict(zip(["newV", "returnV"], AUDIENCE[vid][:2])),
        "followerShare": AUDIENCE[vid][2],
        "retention": [curve[s] for s in sorted(curve)] if curve else None,
    })

daily = [dict(zip(["date", "views", "likes", "shares", "comments", "followersRaw", "lost", "totalFollowers", "profileViews"], d)) for d in DAILY]

hours = [round(sum(day[h] for day in ACTIVITY.values()) / len(ACTIVITY)) for h in range(24)]

out = {
    "account": {"name": "أسس المسافر", "id": "_0001OJD1f9oJlKfflwjGby9CK6vdKbqVR59", "isBusiness": True, "lifetimeVideos": 45},
    "pulledAt": "2026-09-23",
    "videos": videos,
    "daily": daily,
    "activityByHour": hours,
    "activityDates": sorted(ACTIVITY),
}
(HERE / "data.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print("videos", len(videos), "with retention", sum(1 for v in videos if v["retention"]), "bytes", (HERE / "data.json").stat().st_size)

template = (HERE.parent / "src" / "template.html").read_text()
chartjs = (HERE.parent / "src" / "vendor" / "chart.umd.js").read_text()
html = template.replace("/*CHARTJS*/", chartjs).replace("/*DATA*/", json.dumps(out, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
(HERE.parent / "tiktok-dashboard.html").write_text(html)
print("wrote tiktok-dashboard.html", len(html.encode()), "bytes")
