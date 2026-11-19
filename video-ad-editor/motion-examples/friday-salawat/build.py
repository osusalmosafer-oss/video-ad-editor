#!/usr/bin/env python3
# يولّد scenes/*.js (مع المساعدات المشتركة) + timeline.json (بلا صوت مولّد: الفيلم نصّي بالإيقاع)
import json, os
D = os.path.dirname(os.path.abspath(__file__))
HELP = r"""
const NG = (window.__NG = window.__NG || {});
NG.sky = function (ctx, t, lt, st, o = {}) {
  const { X, W, H, P } = ctx;
  const g = X.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#04071A'); g.addColorStop(.55, '#0B1233'); g.addColorStop(1, '#1A1F4A');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  const gl = X.createRadialGradient(W / 2, o.gy || 700, 0, W / 2, o.gy || 700, 900);
  gl.addColorStop(0, 'rgba(227,176,75,' + (o.glow == null ? .16 : o.glow) + ')'); gl.addColorStop(1, 'rgba(227,176,75,0)');
  X.fillStyle = gl; X.fillRect(0, 0, W, H);
  for (const s of st) {
    const tw = .45 + .55 * Math.sin(t * s.sp + s.ph);
    X.globalAlpha = Math.max(0, tw) * s.a * (o.starA == null ? 1 : o.starA);
    X.fillStyle = s.c; X.beginPath(); X.arc(s.x, s.y - (t * s.dr) % 60, s.r, 0, 6.283); X.fill();
  }
  X.globalAlpha = 1;
};
NG.mkStars = function (ctx, n, seed) {
  const r = ctx.rng(seed), a = [];
  for (let i = 0; i < n; i++) a.push({ x: r() * 1080, y: r() * 1500 + 60, r: r.range(1, 3.2), a: r.range(.35, 1), sp: r.range(1.2, 3.4), ph: r() * 6.28, dr: r.range(0, 3), c: r() > .75 ? '#FFE2A0' : '#DCE4FF' });
  return a;
};
NG.crescent = function (ctx, cx, cy, R, k, glow) {
  const X = ctx.X; X.save(); X.translate(cx, cy); X.rotate(-.35); X.scale(k, k);
  X.shadowColor = 'rgba(255,214,120,.9)'; X.shadowBlur = glow || 60;
  const g = X.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#FFF1C4'); g.addColorStop(1, '#E3B04B');
  X.fillStyle = g; const d = R * .42, r = R * .86, x0 = (d * d + R * R - r * r) / (2 * d), y0 = Math.sqrt(R * R - x0 * x0);
  X.beginPath(); X.arc(0, 0, R, Math.atan2(-y0, x0), Math.atan2(y0, x0), true); X.arc(d, 0, r, Math.atan2(y0, x0 - d), Math.atan2(-y0, x0 - d), false); X.closePath(); X.fill(); X.restore();
};
NG.star8 = function (ctx, cx, cy, R, rot, alpha, lw) {
  const X = ctx.X; X.save(); X.translate(cx, cy); X.rotate(rot); X.globalAlpha = alpha; X.strokeStyle = '#E3B04B'; X.lineWidth = lw || 3;
  for (let q = 0; q < 2; q++) { X.rotate(q * Math.PI / 4); X.strokeRect(-R / 1.4142, -R / 1.4142, R * 1.4142, R * 1.4142); }
  X.restore();
};
NG.words = function (ctx, str, y, o, lt, t0, step, size, color) {
  const { X } = ctx;
  const L = ctx.text.layout(X, str, { family: o.family || 'display', weight: o.weight || 700, size, maxWidth: o.maxW || 900, lineHeight: o.lh || 1.45 });
  ctx.text.drawLayout(X, L, 540, y, { align: 'center', color, perWord: (i) => {
    const k = ctx.at(lt, t0 + i * step, t0 + i * step + .5, 'expoOut');
    return { alpha: k, dy: (1 - k) * 70, clipUp: 0, shadow: { blur: 30, y: 0, color: 'rgba(227,176,75,.35)' } };
  } });
  return L;
};
NG.src = function (ctx, str, y, lt, t0) {
  const k = ctx.at(lt, t0, t0 + .6, 'cubicOut');
  ctx.text(ctx.X, str, 540, y, { family: 'body', weight: 400, size: 40, color: '#9AA6D6', align: 'center', alpha: k });
  ctx.X.globalAlpha = k * .7; ctx.X.strokeStyle = '#E3B04B'; ctx.X.lineWidth = 3;
  const w = 220 * k; ctx.X.beginPath(); ctx.X.moveTo(540 - w / 2, y - 70); ctx.X.lineTo(540 + w / 2, y - 70); ctx.X.stroke(); ctx.X.globalAlpha = 1;
};
"""
S = {}
S['s1'] = r"""
MOTION.scene({ id: 's1',
  setup(ctx) { this.st = NG.mkStars(ctx, 150, 'a'); },
  draw(t, lt, ctx) {
    const { X, at, E } = ctx;
    NG.sky(ctx, t, lt, this.st, { gy: 560, glow: .2 * at(lt, 0, 2, 'sineOut') });
    const k = at(lt, .2, 1.6, 'expoOut');
    for (let i = 0; i < 3; i++) NG.star8(ctx, 540, 560, 360 + i * 70 + 20 * Math.sin(lt + i), lt * (.12 + i * .05) * (i % 2 ? -1 : 1), .22 * k / (1 + i * .5), 2);
    NG.crescent(ctx, 540, 560 + (1 - k) * 220, 150, .6 + .4 * k, 50 + 40 * ctx.beatPulse(t, 3));
    const a = at(lt, 1.2, 2.0, 'expoOut');
    ctx.text(X, 'ليلة', 540, 980 + (1 - a) * 60, { family: 'display', size: 150, color: '#F6EBCB', align: 'center', alpha: a });
    const b = at(lt, 1.7, 2.6, 'expoOut');
    ctx.text(X, 'الجمعة', 540, 1160 + (1 - b) * 60, { family: 'display', size: 250, color: '#E3B04B', align: 'center', alpha: b, shadow: { blur: 50, y: 0, color: 'rgba(227,176,75,.55)' } });
    const c = at(lt, 2.9, 3.6, 'cubicOut');
    ctx.text(X, 'أكثِروا فيها من الصلاة على النبي ﷺ', 540, 1340, { family: 'body', weight: 700, size: 50, color: '#DCE4FF', align: 'center', alpha: c, maxWidth: 900 });
  } });
"""
S['s2'] = r"""
MOTION.scene({ id: 's2',
  setup(ctx) { this.st = NG.mkStars(ctx, 120, 'b'); },
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.sky(ctx, t, lt, this.st, { gy: 760 });
    NG.star8(ctx, 540, 760, 520, lt * .08, .12, 2); NG.star8(ctx, 540, 760, 400, -lt * .1, .14, 2);
    ctx.text(X, '❝', 540, 330, { family: 'display', size: 260, color: '#E3B04B', align: 'center', alpha: at(lt, 0, .6) * .8 });
    NG.words(ctx, 'أكثِروا من الصلاةِ عليَّ يومَ الجمعةِ وليلةَ الجمعة', 760, {}, lt, .5, .3, 100, '#F6EBCB');
    NG.src(ctx, 'حديث نبوي — رواه البيهقي', 1250, lt, 3.0);
  } });
"""
S['s3'] = r"""
MOTION.scene({ id: 's3',
  setup(ctx) { this.st = NG.mkStars(ctx, 120, 'c'); },
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.sky(ctx, t, lt, this.st, { gy: 1020, glow: .22 });
    NG.words(ctx, 'مَن صلّى عليَّ صلاةً', 430, {}, lt, .3, .28, 92, '#F6EBCB');
    NG.words(ctx, 'صلّى اللهُ عليهِ بها', 660, {}, lt, 1.5, .28, 92, '#F6EBCB');
    // ten orbs of light
    const cx = 540, cy = 1110, R = 300;
    for (let i = 0; i < 10; i++) {
      const s = 2.7 + i * .12, k = at(lt, s, s + .9, 'backOut');
      const ang = -Math.PI / 2 + i * 6.2832 / 10 + lt * .15;
      const x = cx + Math.cos(ang) * R * k, y = cy + Math.sin(ang) * R * k;
      const g = X.createRadialGradient(x, y, 0, x, y, 60); g.addColorStop(0, 'rgba(255,226,160,' + k + ')'); g.addColorStop(1, 'rgba(227,176,75,0)');
      X.fillStyle = g; X.beginPath(); X.arc(x, y, 60, 0, 6.283); X.fill();
      X.fillStyle = '#FFF4D6'; X.globalAlpha = k; X.beginPath(); X.arc(x, y, 12, 0, 6.283); X.fill(); X.globalAlpha = 1;
    }
    const w = at(lt, 3.9, 4.8, 'expoOut');
    ctx.text(X, 'عَشْرًا', cx, cy + 70 + (1 - w) * 40, { family: 'display', size: 230 * (.8 + .2 * w), color: '#E3B04B', align: 'center', alpha: w, shadow: { blur: 70, y: 0, color: 'rgba(255,214,120,.8)' } });
    NG.src(ctx, 'رواه مسلم', 1570, lt, 4.4);
  } });
"""
S['s4'] = r"""
MOTION.scene({ id: 's4',
  setup(ctx) { this.st = NG.mkStars(ctx, 120, 'd'); },
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.sky(ctx, t, lt, this.st, { gy: 900 });
    NG.crescent(ctx, 540, 380, 90, at(lt, 0, 1, 'backOut'), 40);
    NG.words(ctx, 'إنَّ أَوْلى الناسِ بي يومَ القيامةِ', 780, {}, lt, .5, .3, 92, '#F6EBCB');
    NG.words(ctx, 'أكثرُهم عليَّ صلاةً', 1090, {}, lt, 2.2, .35, 112, '#E3B04B');
    NG.src(ctx, 'رواه الترمذي', 1330, lt, 3.6);
  } });
"""
S['s5'] = r"""
MOTION.scene({ id: 's5',
  setup(ctx) { this.st = NG.mkStars(ctx, 100, 'e'); },
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.sky(ctx, t, lt, this.st, { gy: 800, glow: .12 });
    ctx.text(X, 'إذن', 540, 330, { family: 'display', size: 120, color: '#DCE4FF', align: 'center', alpha: at(lt, 0, .5) });
    const items = ['تُكفى همَّك', 'ويُغفرُ لك ذنبُك', 'وتُرفَعُ درجاتُك'];
    items.forEach((s, i) => {
      const t0 = .6 + i * 1.3, k = at(lt, t0, t0 + .7, 'expoOut');
      const y = 640 + i * 250;
      X.save(); X.globalAlpha = k; X.translate(540, y - 70);
      X.strokeStyle = 'rgba(227,176,75,.5)'; X.lineWidth = 2; X.strokeRect(-420 * k, -90, 840 * k, 200); X.restore();
      NG.star8(ctx, 540 + 330, y, 28, lt * .6, k, 3);
      ctx.text(X, s, 540 - 20, y + 20 - (1 - k) * 40, { family: 'display', size: 110, color: i == 1 ? '#E3B04B' : '#F6EBCB', align: 'center', alpha: k, maxWidth: 720 });
    });
    NG.src(ctx, 'رواه الترمذي', 1450, lt, 4.4);
  } });
"""
S['s6'] = r"""
MOTION.scene({ id: 's6',
  setup(ctx) { this.st = NG.mkStars(ctx, 170, 'f'); },
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.sky(ctx, t, lt, this.st, { gy: 760, glow: .26 });
    for (let i = 0; i < 4; i++) NG.star8(ctx, 540, 520, 300 + i * 80, lt * (.1 + i * .04) * (i % 2 ? -1 : 1), .22 / (1 + i * .3) * at(lt, 0, 1), 2);
    NG.crescent(ctx, 540, 520, 130, at(lt, 0, 1.2, 'expoOut'), 80 + 50 * ctx.beatPulse(t, 3));
    const lines = [['اللهمَّ صلِّ وسلِّمْ', 880, 118], ['على نبيِّنا محمد', 1040, 138]];
    lines.forEach(([s, y, sz], i) => {
      const k = at(lt, 1 + i * .7, 1.9 + i * .7, 'expoOut');
      ctx.text(X, s, 540, y + (1 - k) * 60, { family: 'display', size: sz, color: i ? '#E3B04B' : '#F6EBCB', align: 'center', alpha: k, maxWidth: 940, shadow: { blur: i ? 60 : 20, y: 0, color: 'rgba(255,214,120,.6)' } });
    });
    const c = at(lt, 3.6, 4.4, 'cubicOut');
    ctx.text(X, 'لا تنسَ نصيبك الليلة', 540, 1290, { family: 'body', weight: 700, size: 56, color: '#DCE4FF', align: 'center', alpha: c });
    ctx.text(X, 'شاركها مع من تحب', 540, 1380, { family: 'body', weight: 400, size: 42, color: '#9AA6D6', align: 'center', alpha: c });
  } });
"""
dur = {'s1': 4.2, 's2': 6.0, 's3': 6.2, 's4': 5.4, 's5': 6.0, 's6': 6.2}
for k, v in S.items():
    open(f'{D}/scenes/{k}.js', 'w').write(HELP + v)
bpm = 72; spb = 60 / bpm; total = sum(dur.values())
beats = [round(i * spb, 4) for i in range(int(total / spb) + 1)]
bars = beats[::4]
sc = []; t = 0.0
for k, d in dur.items():
    sc.append({'id': k, 'file': f'scenes/{k}.js', 'start': round(t, 3), 'end': round(t + d, 3), 'lines': [],
               'transition': {'type': 'crossfade' if k != 's1' else 'cut', 'dur': .6}})
    t += d
json.dump({'duration': round(total, 3), 'bpm': bpm, 'beats': beats, 'bars': bars,
           'sections': [{'name': 'intro', 'start': 0, 'end': dur['s1']}, {'name': 'body', 'start': dur['s1'], 'end': total - dur['s6']}, {'name': 'outro', 'start': total - dur['s6'], 'end': total}],
           'scenes': sc, 'vo': []}, open(f'{D}/timeline.json', 'w'), ensure_ascii=False)
print('total', total)
