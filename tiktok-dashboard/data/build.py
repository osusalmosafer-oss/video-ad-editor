"""Builds data.json and ../tiktok-dashboard.html from raw Windsor.ai pulls.

raw/*.json are unedited Windsor get_data results (connector tiktok_organic):
  videos.json    video_* metrics + caption + share url
  retention.json video_view_retention_second / _percentage
  sources.json   video_impression_sources_*
  audience.json  video_audience_types_*
  activity.json  audience_activity_hour / _count (daily)
daily.py holds the account-level daily rows (see its header).

Usage: python3 build.py
"""
import json
from collections import defaultdict
from pathlib import Path

from daily import DAILY, PULLED_AT

HERE = Path(__file__).parent
raw = lambda name: json.load(open(HERE / "raw" / f"{name}.json"))["result"]

retention = defaultdict(dict)
for r in raw("retention"):
    if r["video_view_retention_second"] is None:
        continue  # photo posts have no curve
    retention[r["video_id"]][int(r["video_view_retention_second"])] = r["video_view_retention_percentage"]

SRC_KEYS = {"For You": "foryou", "Search": "search", "Personal Profile": "profile", "Follow": "follow",
            "Others": "others", "Sound": "sound", "Direct Message": "dm"}
sources = defaultdict(lambda: dict.fromkeys(SRC_KEYS.values()))
for r in raw("sources"):
    sources[r["video_id"]][SRC_KEYS[r["video_impression_sources_impression_source"]]] = r["video_impression_sources_percentage"]

audience = defaultdict(dict)
for r in raw("audience"):
    audience[r["video_id"]][r["video_audience_types_type"]] = r["video_audience_types_percentage"]


def caption_text(cap):
    """Caption before the first hashtag."""
    return (cap or "").split("#")[0].strip().strip('"').strip()


videos = []
for v in raw("videos"):
    vid = v["video_id"]
    curve = retention.get(vid)
    aud = audience.get(vid, {})
    has_viewer_split = (aud.get("NEW_VIEWER") or 0) + (aud.get("RETURN_VIEWER") or 0) > 0
    videos.append({
        "id": vid, "dt": v["video_create_datetime"], "dur": v["video_duration"] or None,
        "views": v["video_views_count"], "likes": v["video_likes"], "comments": v["video_comments"],
        "shares": v["video_shares"], "saves": v["video_favorites"], "avgWatch": v["video_average_time_watched"],
        "totalWatch": v["video_total_time_watched"], "fullRate": v["video_full_watched_rate"],
        "newFollowers": v["video_new_followers"], "reach": v["video_reach"], "profileViews": v["video_profile_views"],
        "caption": caption_text(v["video_caption"]), "shareUrl": v.get("video_share_url"),
        "sources": sources[vid],
        "audience": {"newV": aud.get("NEW_VIEWER"), "returnV": aud.get("RETURN_VIEWER")} if has_viewer_split else None,
        "followerShare": aud.get("FOLLOWER_PERCENT"),
        "retention": [curve[s] for s in sorted(curve)] if curve else None,
    })
videos.sort(key=lambda v: v["dt"])

daily = [dict(zip(["date", "views", "likes", "shares", "comments", "lost", "totalFollowers", "profileViews"], d)) for d in DAILY]

# follower activity: average of the last 7 complete days (24 hourly rows each)
act = defaultdict(dict)
for r in raw("activity"):
    if r["audience_activity_hour"] is None:
        continue
    act[r["date"]][int(r["audience_activity_hour"])] = r["audience_activity_count"]
days = [d for d in sorted(act) if len(act[d]) == 24][-7:]
hours = [round(sum(act[d][h] for d in days) / len(days)) for h in range(24)]

out = {
    "account": {"name": "أسس المسافر", "isBusiness": True},
    "pulledAt": PULLED_AT,
    "range": {"from": videos[0]["dt"][:10], "to": max(videos[-1]["dt"][:10], daily[-1]["date"])},
    "videos": videos,
    "daily": daily,
    "activityByHour": hours,
    "activityDates": days,
}
payload = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
(HERE / "data.json").write_text(payload)

template = (HERE.parent / "src" / "template.html").read_text()
chartjs = (HERE.parent / "src" / "vendor" / "chart.umd.js").read_text()
html = template.replace("/*CHARTJS*/", chartjs).replace("/*DATA*/", payload.replace("</", "<\\/"))
(HERE.parent / "tiktok-dashboard.html").write_text(html)
print(f"{len(videos)} videos ({sum(1 for v in videos if v['retention'])} with retention), "
      f"daily {daily[0]['date']}..{daily[-1]['date']}, activity {days[0]}..{days[-1]}, html {len(html.encode())} bytes")
