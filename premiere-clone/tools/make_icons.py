#!/usr/bin/env python3
"""يولّد كل أيقونات التطبيق من ملف شعار واحد مربّع.
الاستعمال:  python3 tools/make_icons.py [logo.png]
بدون وسيط يستخدم icons/logo-master.png. لاستبدال الشعار بشعارك الخاص: ضع ملفك (PNG مربّع، يفضّل 1024×1024) واكتب مساره."""
import sys, os
from PIL import Image, ImageDraw
root = os.path.join(os.path.dirname(__file__), '..', 'icons')
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'logo-master.png')
m = Image.open(src).convert('RGBA')
S = 1024
if m.size != (S, S): m = m.resize((S, S), Image.LANCZOS)
def rounded(img, rad):
    mask = Image.new('L', img.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius=rad, fill=255)
    out = img.copy(); out.putalpha(mask); return out
# شعار جاهز بزوايا شفافة (مثل شعار أبو صهيب) أم مربّع كامل؟
prerounded = m.getpixel((6, 6))[3] < 250
def bg_color():                      # أغمق 15% من البكسلات المعتمة داخل الشعار = لون خلفيته الكحلي
    if not prerounded: return m.getpixel((8, 8))
    px = [p for p in list(m.convert('RGBA').getdata())[::97] if p[3] > 250]; px.sort(key=lambda p: p[0] + p[1] + p[2]); px = px[:max(1, len(px) // 7)]
    return tuple(int(sum(p[i] for p in px) / len(px)) for i in range(3)) + (255,)
BG = bg_color()
INSET = int(S * 0.055) if prerounded else 0
def core(img):                       # الشعار بلا حافة التوهّج الخارجية (لنسختي القناع وآيفون)
    return img.crop((INSET, INSET, S - INSET, S - INSET)) if INSET else img
def flat(img):                       # صورة كاملة التعبئة (آيفون يقصّ الزوايا بنفسه)
    bg = Image.new('RGBA', img.size, BG); c = core(img).resize(img.size, Image.LANCZOS); bg.alpha_composite(c); return bg
def safe(img, k=0.80):               # المنطقة الآمنة للأيقونة القابلة للقناع
    c = Image.new('RGBA', img.size, BG); inner = core(img).resize((int(S * k), int(S * k)), Image.LANCZOS); c.alpha_composite(inner, ((S - inner.size[0]) // 2, (S - inner.size[1]) // 2)); return c.convert('RGB')
r = m if prerounded else rounded(m, int(S * 0.22))
for n, sz in [('icon-512', 512), ('icon-192', 192), ('favicon-48', 48)]: r.resize((sz, sz), Image.LANCZOS).save(os.path.join(root, n + '.png'), optimize=True)
safe(m, 0.86).resize((512, 512), Image.LANCZOS).save(os.path.join(root, 'icon-maskable-512.png'), optimize=True)
flat(m).convert('RGB').resize((180, 180), Image.LANCZOS).save(os.path.join(root, 'apple-touch-icon.png'), optimize=True)
print('تم توليد الأيقونات من', src)
