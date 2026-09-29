"""Builds data.json and ../instagram-dashboard.html from windsor_raw.py.

Usage: python3 build.py
"""
import json
from datetime import datetime, timedelta
from pathlib import Path

import windsor_raw as W

HERE = Path(__file__).parent
ROOT = HERE.parent

# Manual story-type tagging of each Reel from its caption (Meta story types: meta-criteria.md M9-M11).
# A = practical Haram guide (places / routes / services / tips)      -> Tutorial (M9)
# B = ranked / numbered lists                                        -> Listicle (M10)
# C = measured walking time / distance proof                         -> Demo (M9)
# D = hotel showcase (tour / facts), no price hook                   -> no matching Meta story type
# E = direct price offer / promo                                     -> no matching Meta story type
CATS = {
    "A": "دليل عملي للمعتمر",
    "B": "قوائم وترتيب",
    "C": "إثبات مسافة/وقت المشي",
    "D": "استعراض فندق",
    "E": "عرض سعر مباشر",
}
TAG = {
    "DbYTAecCdnU": "E", "DbdxAjXE1AT": "B", "DbdNziwD8i0": "E", "DbgfO56IBtY": "A", "DbjEFldiAli": "E",
    "DbhiK4Ijx9k": "A", "DblgtYnjlzO": "B", "DboPIB4EqYg": "B", "DbqrkdkjFMc": "C", "DbtlVgSgvZh": "A",
    "DbyZ9tJghmi": "D", "Db0-zJdEW_K": "A", "Db3m6nWAdsw": "A", "Db6EgAuDIBX": "A", "Db8wf_9CKCC": "D",
    "Db7wVU4lLfG": "E", "Db_VXPUj6BE": "C", "DcB6JNdDjD9": "D", "DcHDqi0G8JD": "A", "DcJlD0LAVP0": "E",
    "DcMJ28tjOpT": "C", "DcOum9HjweQ": "E", "DcRTJvYkoxh": "A", "DcT4TlwjNvP": "A", "DcWbKKAiM3L": "D",
    "Dcboe3aAIjg": "D", "DceLY6eCag5": "A", "DcjVCvxlbsb": "B", "Dcl9NSDj7aH": "A", "Dcoeop7itjo": "B",
    "DctoKEJDGLv": "A", "Dc3--eGjgi5": "E", "DdCSFZ-EQXT": "D", "DdEzjkikTuM": "D", "DdHgWefiUkC": "D",
    "DdPGfxpiQDv": "C", "DdRrXAvFLKc": "D", "DdUJQa8CldT": "D", "DdZg_URD-Wa": "A", "Ddjr0edCWjQ": "E",
    "DdoUJweFRfF": "A", "Ddrexb0jX44": "D", "DdtVBQ4D_me": "C", "DdwoUASiBQp": "A", "Dd1x7qqH9Sr": "C",
}

posts = []
for row in W.MEDIA:
    m = dict(zip(W.MEDIA_FIELDS, row))
    utc = datetime.strptime(m["timestamp"][:19], "%Y-%m-%dT%H:%M:%S")
    ksa = utc + timedelta(hours=3)
    sc = m["media_permalink"]
    posts.append({
        "id": m["media_id"], "sc": sc, "url": f"https://www.instagram.com/reel/{sc}/",
        "utc": utc.isoformat(), "ksa": ksa.isoformat(), "wd": (ksa.weekday() + 1) % 7, "hr": ksa.hour,
        "cap": m["media_caption"], "cat": TAG[sc],
        "views": m["media_views"], "reach": m["media_reach"], "likes": m["media_like_count"],
        "comments": m["media_comments_count"], "saves": m["media_saved"], "shares": m["media_shares"],
        "reposts": m["media_reposts"], "eng": m["media_engagement"],
        "avgWatch": m["media_reel_avg_watch_time"], "skip": m["media_reel_skip_rate"],
        "totalWatch": m["media_reel_total_watch_time"],
    })
posts.sort(key=lambda p: p["utc"])
assert len(posts) == 45 and set(TAG) == {p["sc"] for p in posts}

daily = [dict(zip(["date", "reach", "newFollowers", "views", "engaged", "interactions", "likes", "comments",
                   "saves", "shares", "reposts", "taps"], d)) for d in W.DAILY]

out = {
    "pulledAt": W.PULLED_AT, "profile": W.PROFILE, "cats": CATS, "posts": posts, "daily": daily,
    "audience": {"gender": W.GENDER, "age": W.AGE, "country": W.COUNTRY, "city": W.CITY},
}
(HERE / "data.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")

tpl = (ROOT / "src" / "template.html").read_text(encoding="utf-8")
chart = (ROOT / "src" / "vendor" / "chart.umd.js").read_text(encoding="utf-8")
html = tpl.replace("/*CHARTJS*/", chart.replace("</script>", "<\\/script>"), 1)
import base64
def b64(name):
    return "data:image/png;base64," + base64.b64encode((ROOT / "src" / "assets" / name).read_bytes()).decode()
html = html.replace("/*LOGOC*/", b64("logo-color.png"))
html = html.replace("/*DATA*/null", json.dumps(out, ensure_ascii=False), 1)
(ROOT / "instagram-dashboard.html").write_text(html, encoding="utf-8")
print("posts", len(posts), "->", ROOT / "instagram-dashboard.html", f"{len(html)//1024} KB")
