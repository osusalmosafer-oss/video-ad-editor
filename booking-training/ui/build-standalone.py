#!/usr/bin/env python3
"""يبني نسخة مستقلة من صفحة التدريب تفتح بأي متصفح بلا إنترنت ولا منصة."""
import pathlib, re, sys
src = pathlib.Path(__file__).with_name("index.html")
out = pathlib.Path(__file__).with_name("training-standalone.html")
body = src.read_text(encoding="utf-8")
title = re.search(r"<title>(.*?)</title>", body).group(1)
body = body.replace(f"<title>{title}</title>\n", "", 1)
out.write_text(f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<style>
  :root{{color-scheme:light dark; padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px);}}
  body{{margin:0; font:14px system-ui,-apple-system,"Segoe UI",sans-serif; background:#fafaf8;}}
  img{{max-width:100%;}}
  [hidden]{{display:none !important;}}
</style>
</head>
<body>
{body}
</body>
</html>
""", encoding="utf-8")
print("built:", out, out.stat().st_size // 1024, "KB")
