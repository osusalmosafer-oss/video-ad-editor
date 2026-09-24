#!/usr/bin/env python3
"""Build two repurposed cuts of the DoubleTree Aziziyah suite tour (no prices)."""
import subprocess, os, sys

S = os.path.dirname(os.path.abspath(__file__))
SRC = "/root/.claude/uploads/212d884e-dbfa-5618-88de-4574d1f25ce1/1e73007e-hotel-tour-v3-compressed.mp4"
OUT = sys.argv[1] if len(sys.argv) > 1 else S
FONTS = os.path.join(S, "fonts")
NAVY, BLUE, WHITE = "&H49241F&", "&HFF8428&", "&HFFFFFF&"
GRADE = "eq=contrast=1.04:saturation=1.08:brightness=0.01,unsharp=5:5:0.4"
VENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30"]
AENC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-3000:])


def clip(name, a, b):
    """Cut [a,b) from source with graded video and click-free audio."""
    d = b - a
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{a}", "-t", f"{d}", "-i", SRC,
         "-vf", GRADE, "-af", f"aresample=48000,afade=t=in:d=0.04,afade=t=out:st={d-0.06:.3f}:d=0.06",
         *VENC, *AENC, name])
    return d


def split_clip(name, top, bottom, audio, d):
    """Split-screen hook: two scenes stacked (middle band, old captions cropped out)."""
    run(["ffmpeg", "-y", "-v", "error",
         "-ss", f"{top}", "-t", f"{d}", "-i", SRC,
         "-ss", f"{bottom}", "-t", f"{d}", "-i", SRC,
         "-ss", f"{audio}", "-t", f"{d}", "-i", SRC,
         "-filter_complex",
         f"[0:v]crop=1080:956:0:380,{GRADE}[t];[1:v]crop=1080:956:0:380,{GRADE}[b];"
         "[t][b]vstack,pad=1080:1920:0:4:color=0x1F2449[v];"
         f"[2:a]aresample=48000,afade=t=in:d=0.04,afade=t=out:st={d-0.06:.3f}:d=0.06[a]",
         "-map", "[v]", "-map", "[a]", *VENC, *AENC, name])
    return d


def card(name, d):
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color=c=0x1F2449:s=1080x1920:r=30:d={d}",
         "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-t", f"{d}", *VENC, *AENC, name])
    return d


def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def rbox(x, y, w, h, r=36):
    return (f"m {x+r} {y} l {x+w-r} {y} b {x+w} {y} {x+w} {y} {x+w} {y+r} l {x+w} {y+h-r} "
            f"b {x+w} {y+h} {x+w} {y+h} {x+w-r} {y+h} l {x+r} {y+h} b {x} {y+h} {x} {y+h} {x} {y+h-r} "
            f"l {x} {y+r} b {x} {y} {x} {y} {x+r} {y}")


class ASS:
    def __init__(self):
        self.ev = []

    def box(self, a, b, x, y, w, h, col, layer=0, r=36, alpha="&H00&", fade=(120, 120)):
        self.ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},T,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\bord0\\shad0\\c{col}\\1a{alpha}\\fad({fade[0]},{fade[1]})}}"
                       f"{rbox(x, y, w, h, r)}{{\\p0}}")

    def text(self, a, b, x, y, txt, size=64, col=WHITE, font="Tajawal ExtraBold", layer=2, an=5, fade=(120, 120), extra=""):
        self.ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},T,,0,0,0,,"
                       f"{{\\an{an}\\pos({x},{y})\\fn{font}\\fs{size}\\c{col}\\bord0\\shad0\\fad({fade[0]},{fade[1]}){extra}}}{txt}")

    def write(self, path):
        head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: T,Tajawal ExtraBold,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        open(path, "w", encoding="utf-8").write(head + "\n".join(self.ev) + "\n")


def assemble(parts, ass, out):
    lst = os.path.join(S, "concat.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst,
         "-vf", f"ass={ass}:fontsdir={FONTS}", *VENC, *AENC, "-movflags", "+faststart", out])


# Caption panel covers the original burned-in subtitles (y≈1380-1480).
PANEL = (80, 1340, 920, 190)


def endcard(a, t0, d, lines):
    a.text(t0, t0 + d, 540, 700, "أسس المسافر", 96, WHITE, fade=(200, 0))
    a.box(t0, t0 + d, 390, 780, 300, 8, BLUE, layer=1, r=4, fade=(200, 0))
    y = 960
    for txt, size, col in lines:
        a.text(t0 + 0.15, t0 + d, 540, y, txt, size, col, fade=(250, 0))
        y += size + 40
    a.box(t0 + 0.3, t0 + d, 190, 1330, 700, 150, BLUE, layer=1, r=75, fade=(250, 0))
    a.text(t0 + 0.3, t0 + d, 540, 1405, "الرابط في البايو", 62, WHITE, fade=(250, 0))


def v1():
    """Version 1 — format change: chaptered suite mini-tour, view-first hook."""
    segs = [  # (src_a, src_b, chapter, caption lines [(rel_start, rel_end, text)])
        (37.5, 41.2, "الإطلالة", [(0, 3.7, "وهنا عندكم إطلالة جزئية على المسجد الحرام")]),
        (15.0, 20.2, "الجناح", [(0, 2.9, "وهذا الجناح بغرفة نوم وصالة"), (2.9, 5.2, "ودورة المياه")]),
        (21.0, 24.3, "الصالة", [(0, 3.3, "وهذه الصالة.. شوفوا سعة المكان")]),
        (25.3, 27.3, "مكتب", [(0, 2.0, "كذلك يوجد مكتب")]),
        (28.0, 32.6, "غرفة ثنائية", [(0, 4.6, "والآن ننتقل للغرفة الثنائية")]),
        (34.4, 36.9, "المساحة", [(0, 2.5, "شوفوا سعة الغرفة")]),
    ]
    a, parts, t = ASS(), [], 0.0
    for i, (sa, sb, chap, caps) in enumerate(segs):
        p = os.path.join(S, f"v1_{i}.mp4"); d = clip(p, sa, sb); parts.append(p)
        if i == 0:
            a.box(t, t + d, 70, 270, 940, 250, NAVY, layer=1, alpha="&H10&", fade=(0, 150))
            a.text(t, t + d, 540, 350, "دبل تري العزيزية من الداخل", 68, WHITE, fade=(0, 150))
            a.text(t + 0.25, t + d, 540, 445, "الجناح والغرف.. قبل لا تحجز", 54, BLUE, font="Tajawal Bold", fade=(150, 150))
        else:
            w = 90 + 34 * len(chap)
            a.box(t, t + d, 540 - w // 2, 270, w, 96, BLUE, layer=1, r=48, fade=(100, 80))
            a.text(t, t + d, 540, 320, chap, 50, WHITE, fade=(100, 80))
        for rs, re_, txt in caps:
            size = 58 if len(txt) < 30 else 48
            a.box(t + rs, t + re_, *PANEL, NAVY, layer=1, alpha="&H00&", fade=(0, 0))
            a.text(t + rs, t + re_, 540, PANEL[1] + PANEL[3] // 2, txt, size, WHITE, fade=(80, 0))
        t += d
    p = os.path.join(S, "v1_end.mp4"); d = card(p, 3.2); parts.append(p)
    endcard(a, t, d, [("وش تنتظر؟ اسأل عن السعر", 64, WHITE), ("في الواتساب", 64, BLUE)])
    ass = os.path.join(S, "v1.ass"); a.write(ass)
    out = os.path.join(OUT, "doubletree-aziziyah_v1_suite-tour.mp4")
    assemble(parts, ass, out); print(out, round(t + d, 1))


def v2():
    """Version 2 — angle change: 'twin room or suite?' decision video for families."""
    a, parts, t = ASS(), [], 0.0
    # Hook: split screen twin room (top) vs suite living room (bottom), lobby VO names the hotel.
    p = os.path.join(S, "v2_hook.mp4"); d = split_clip(p, 4.6, 21.0, 0.0, 4.1); parts.append(p)
    a.box(t, t + d, 60, 250, 960, 230, "&HFFFFFF&", layer=1, alpha="&H00&", fade=(0, 150))
    a.text(t, t + d, 540, 318, "رايحين عمرة كعائلة؟", 62, NAVY, fade=(0, 150))
    a.text(t + 0.2, t + d, 540, 410, "غرفة ثنائية ولا جناح؟", 70, BLUE, fade=(120, 150))
    a.box(t + 0.3, t + d, 60, 520, 330, 90, NAVY, layer=1, r=45, fade=(150, 150))
    a.text(t + 0.3, t + d, 225, 566, "غرفة ثنائية", 48, WHITE, fade=(150, 150))
    a.box(t + 0.6, t + d, 60, 990, 220, 90, BLUE, layer=1, r=45, fade=(150, 150))
    a.text(t + 0.6, t + d, 170, 1036, "جناح", 48, WHITE, fade=(150, 150))
    a.box(t, t + d, *PANEL, NAVY, layer=1, alpha="&H10&", fade=(0, 150))
    a.text(t, t + d, 540, PANEL[1] + PANEL[3] // 2, "من أجمل الفنادق القريبة من الحرم: دبل تري", 46, WHITE, fade=(0, 150))
    t += d

    sections = [
        ("الخيار 1: غرفة ثنائية", NAVY, [(4.2, 10.4, [(0, 2.8, "تعالوا نستعرض الغرفة الثنائية"), (2.8, 6.2, "ودورة المياه")])]),
        ("الخيار 2: الجناح", BLUE, [(15.0, 20.2, [(0, 2.9, "جناح بغرفة نوم وصالة"), (2.9, 5.2, "ودورة المياه")]),
                                   (21.0, 24.3, [(0, 3.3, "والصالة.. شوفوا سعة المكان")])]),
    ]
    k = 0
    for title, col, clips in sections:
        first = True
        for sa, sb, caps in clips:
            p = os.path.join(S, f"v2_{k}.mp4"); k += 1; d = clip(p, sa, sb); parts.append(p)
            a.box(t, t + d, 0, 250, 1080, 110, col, layer=1, r=0, fade=((200 if first else 0), 0))
            a.text(t, t + d, 540, 307, title, 58, WHITE, fade=((200 if first else 0), 0))
            for rs, re_, txt in caps:
                a.box(t + rs, t + re_, *PANEL, "&HFFFFFF&", layer=1, alpha="&H00&", fade=(0, 0))
                a.text(t + rs, t + re_, 540, PANEL[1] + PANEL[3] // 2, txt, 56, NAVY, fade=(80, 0))
            first = False
            t += d
    p = os.path.join(S, "v2_end.mp4"); d = card(p, 3.6); parts.append(p)
    endcard(a, t, d, [("قل لنا كم شخص معك", 60, WHITE), ("ونرشّح لك الأنسب", 60, WHITE), ("واسأل عن السعر في الواتساب", 54, BLUE)])
    ass = os.path.join(S, "v2.ass"); a.write(ass)
    out = os.path.join(OUT, "doubletree-aziziyah_v2_room-or-suite.mp4")
    assemble(parts, ass, out); print(out, round(t + d, 1))


if __name__ == "__main__":
    v1(); v2()
