"""مؤثرات صوتية هادئة لعيّنة الكلمات المفتاحية. تُولَّد بالكود (بلا ملفات خارجية).
الاستعمال: python sfx.py out.wav   (على ويندوز: python sfx.py out.wav)
القواعد: 5 أحداث فقط في 20 ثانية، الذروة تحت -18 dBFS."""
import sys, wave
import numpy as np

SR = 44100
DUR = 20.0
buf = np.zeros(int(SR * DUR), dtype=np.float64)

def add(t0, x):
    i = int(t0 * SR)
    buf[i:i + len(x)] += x[: len(buf) - i]

def env(n, decay):
    t = np.arange(n) / SR
    return np.exp(-t * decay)

def click(t0, f=1800, amp=1.0):
    n = int(0.05 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * f * t) * env(n, 90)
    rng = np.random.default_rng(3)
    noise = rng.standard_normal(n) * env(n, 400) * 0.35
    add(t0, (tone + noise) * 0.5 * amp)

def riser(t0, dur=0.9, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 300 + (2400 - 300) * (t / dur) ** 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    ramp = (t / dur) ** 1.5
    rng = np.random.default_rng(5)
    x = (np.sin(ph) * 0.55 + rng.standard_normal(n) * 0.12) * ramp
    x *= np.minimum(1, (dur - t) / 0.06)
    add(t0, x * 0.6 * amp)

def chime(t0, amp=1.0):
    n = int(0.7 * SR); t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 880 * t) + 0.6 * np.sin(2 * np.pi * 1320 * t)) * env(n, 6)
    add(t0, x * 0.45 * amp)

def shutter(t0, amp=1.0):
    click(t0, 1100, amp); click(t0 + 0.075, 800, amp * 0.9)

# الأحداث الخمسة (الثواني)
click(3.2)
riser(6.6, 0.9)
chime(7.5)
click(11.5)
shutter(14.5)

peak = np.max(np.abs(buf))
target = 10 ** (-18 / 20)
buf *= target / peak
pcm = (buf * 32767).astype(np.int16)
out = sys.argv[1] if len(sys.argv) > 1 else "sfx.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("OK", out, "peak dBFS", round(20 * np.log10(np.max(np.abs(buf))), 1))
