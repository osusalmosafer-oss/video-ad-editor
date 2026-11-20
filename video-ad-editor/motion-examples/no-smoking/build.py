#!/usr/bin/env python3
# يولّد scenes/*.js + timeline.json — موشن «أدلة تحريم الدخان والشيشة وأضرارهما»
import json, os
D = os.path.dirname(os.path.abspath(__file__))
HELP = r"""
const NG = (window.__NG = window.__NG || {});
NG.cam = function (ctx, lt, sc) {
  const X = ctx.X, d = Math.max(1, (sc && sc.scene && sc.scene.dur) || (ctx.scene && ctx.scene.dur) || 8), k = Math.max(0, Math.min(1, lt / d));
  const z = 1.03 + .05 * k + .006 * ctx.beatPulse(ctx.scene.start + lt, 7);
  X.translate(540 + 14 * Math.sin(lt * .5), 960 + 10 * Math.cos(lt * .4)); X.scale(z, z); X.translate(-540, -960);
};
NG.dust = function (ctx, t, col) {
  const X = ctx.X; for (let i = 0; i < 34; i++) {
    const ph = (t * (.02 + (i % 5) * .006) + i * .137) % 1, x = (i * 331 % 1080) + 40 * Math.sin(t * .4 + i), y = 1980 - ph * 2100;
    X.globalAlpha = .18 * Math.sin(ph * 3.1416) * (.4 + (i % 4) * .2); X.fillStyle = col || '#FFD9A0'; X.beginPath(); X.arc(x, y, 1.5 + (i % 3), 0, 6.283); X.fill();
  } X.globalAlpha = 1;
};
NG.bg = function (ctx, t, o = {}) {
  const { X, W, H } = ctx; const c = o.col || '229,72,59';
  const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#0A0B0F'); g.addColorStop(1, o.bot || '#1A1C24');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  const gl = X.createRadialGradient(W / 2, o.gy || 900, 0, W / 2, o.gy || 900, 950);
  gl.addColorStop(0, 'rgba(' + c + ',' + (o.glow == null ? .14 : o.glow) + ')'); gl.addColorStop(1, 'rgba(' + c + ',0)');
  X.fillStyle = gl; X.fillRect(0, 0, W, H);
  NG.dust(ctx, t, o.dust);
};
NG.words = function (ctx, str, y, lt, t0, step, size, color, o = {}) {
  const { X } = ctx;
  const L = ctx.text.layout(X, str, { family: o.family || 'display', weight: o.weight || 700, size, maxWidth: o.maxW || 900, lineHeight: o.lh || 1.45 });
  ctx.text.drawLayout(X, L, 540, y, { align: 'center', color, perWord: (i) => {
    const k = ctx.at(lt, t0 + i * step, t0 + i * step + .45, 'expoOut');
    return { alpha: k, dy: (1 - k) * 60, shadow: { blur: 26, y: 0, color: o.glow || 'rgba(229,72,59,.35)' } };
  } });
  return L;
};
NG.vwords = function (ctx, words, au, y, size, sl, color, o = {}) {
  const X = ctx.X, str = words.map(w => w[0]).join(' ');
  const L = ctx.text.layout(X, str, { family: 'body', weight: 700, size, maxWidth: o.maxW || 900, lineHeight: o.lh || 1.7 });
  const k = ctx.at(sl, 0, .5, 'expoOut');
  ctx.text.drawLayout(X, L, 540, y, { align: 'center', color: color || '#F2EFE9', perWord: (i) => {
    const w0 = words[i][1], w1 = i + 1 < words.length ? words[i + 1][1] : w0 + 1.2, cur = au >= w0 && au < w1, past = au >= w1;
    return { alpha: k * (past || cur ? 1 : .3), color: cur ? (o.hi || '#FFD27A') : (color || '#F2EFE9'), scale: cur ? 1.08 : 1, shadow: cur ? { blur: 30, y: 0, color: 'rgba(255,200,90,.8)' } : undefined };
  } });
};
NG.label = function (ctx, str, lt, col) {
  const k = ctx.at(lt, 0, .5, 'expoOut');
  ctx.text(ctx.X, str, 540, 270 + (1 - k) * 30, { family: 'display', size: 96, color: col || '#E5483B', align: 'center', alpha: k });
  const X = ctx.X; X.globalAlpha = k; X.fillStyle = col || '#E5483B'; X.fillRect(540 - 90 * k, 300, 180 * k, 6); X.globalAlpha = 1;
};
NG.src = function (ctx, str, y, lt, t0, col) {
  const k = ctx.at(lt, t0, t0 + .5, 'cubicOut');
  ctx.text(ctx.X, str, 540, y, { family: 'body', weight: 400, size: 40, color: col || '#9A968F', align: 'center', alpha: k });
};
NG.smoke = function (ctx, t, x, y, o = {}) {
  const X = ctx.X, n = o.n || 26, h = o.h || 700, sp = o.spread || 160, al = o.alpha == null ? 1 : o.alpha;
  for (let i = 0; i < n; i++) {
    const ph = (t * (o.speed || .3) + i / n) % 1;
    const xx = x + ctx.noise1(i * 3.7 + ph * 2.2, 11) * sp * ph * 2 + Math.sin(ph * 6 + i) * 18 * ph;
    const yy = y - ph * h, r = 24 + ph * (o.r || 110);
    const a = Math.min(1, ph * 6) * (1 - ph) * .34 * al;
    const g = X.createRadialGradient(xx, yy, 0, xx, yy, r);
    g.addColorStop(0, 'rgba(' + (o.c || '190,190,196') + ',' + a + ')'); g.addColorStop(1, 'rgba(' + (o.c || '190,190,196') + ',0)');
    X.fillStyle = g; X.beginPath(); X.arc(xx, yy, r, 0, 6.283); X.fill();
  }
};
NG.cig = function (ctx, x, y, len, rot, burn, t, ember) {
  const X = ctx.X, w = 46; X.save(); X.translate(x, y); X.rotate(rot);
  const L = len, ash = 36 * (ember == null ? 1 : ember), paperTop = -L / 2 + L * burn;
  X.fillStyle = '#D98E4A'; X.fillRect(-w / 2, L / 2 - L * .26, w, L * .26);
  X.fillStyle = '#B9712F'; for (let i = 0; i < 6; i++) X.fillRect(-w / 2, L / 2 - L * .26 + i * 14, w, 3);
  X.fillStyle = '#EFEAE0'; X.fillRect(-w / 2, paperTop, w, L / 2 - L * .26 - paperTop);
  X.fillStyle = '#6E6A64'; X.fillRect(-w / 2, paperTop - ash, w, ash);
  if (ember) { const p = .75 + .25 * Math.sin(t * 9); X.shadowColor = 'rgba(255,90,40,' + p + ')'; X.shadowBlur = 50 * p; X.fillStyle = '#FF5A28'; X.beginPath(); X.ellipse(0, paperTop, w / 2, 10, 0, 0, 6.283); X.fill(); }
  X.restore();
};
"""
S = {}
# ---- s1 hook
S['s1'] = r"""
MOTION.scene({ id: 's1',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 800, glow: .16 });
    const k = at(lt, 0, 1.2, 'expoOut');
    NG.smoke(ctx, lt + 3, 540, 820, { h: 760, n: 30, alpha: k });
    NG.cig(ctx, 540, 1000 + (1 - k) * 200, 480, 0, .02 + lt * .01, lt, 1);
    const a = at(lt, .25, .9, 'expoOut');
    ctx.text(X, 'التدخين والشيشة', 540, 1330 + (1 - a) * 50, { family: 'display', size: 128, color: '#F2EFE9', align: 'center', alpha: a, maxWidth: 940 });
    const b = at(lt, 1.7, 2.4, 'expoOut');
    ctx.text(X, 'حكمهما… وأضرارهما', 540, 1470 + (1 - b) * 40, { family: 'display', size: 84, color: '#E5483B', align: 'center', alpha: b, shadow: { blur: 40, y: 0, color: 'rgba(229,72,59,.6)' } });
  } });
"""
def quote(id, label, segs, dur):
    seg = dur / len(segs)
    js = "MOTION.scene({ id: '%s',\n  draw(t, lt, ctx) {\n    const { X, at } = ctx;\n    NG.bg(ctx, t, { gy: 900, glow: .13 });\n    NG.label(ctx, %s, lt);\n" % (id, json.dumps(label, ensure_ascii=False))
    js += "    const SEG = %s, N = %d, SD = %.3f;\n    const i = Math.max(0, Math.min(N - 1, Math.floor(lt / SD))), sl = lt - i * SD, s = SEG[i];\n" % (json.dumps(segs, ensure_ascii=False), len(segs), seg)
    js += """    for (let q = 0; q < 3; q++) { X.globalAlpha = .06; X.strokeStyle = '#E5483B'; X.lineWidth = 2; X.save(); X.translate(540, 940); X.rotate(lt * .05 * (q % 2 ? -1 : 1) + q); X.strokeRect(-420 + q * 60, -420 + q * 60, 840 - q * 120, 840 - q * 120); X.restore(); }
    X.globalAlpha = 1;
    const vs = s.t.indexOf('﴿') >= 0;
    NG.words(ctx, s.t, 640, sl, .3, .26, vs ? 92 : (s.size || 96), '#F2EFE9', vs ? { family: 'body', lh: 1.7 } : {});
    NG.src(ctx, s.s, 1330, sl, 2.2 + (s.t.split(' ').length) * .1);
    const f = 1 - at(sl, 0, .28, 'cubicOut'); if (f > 0) { X.fillStyle = 'rgba(229,72,59,' + (f * .5) + ')'; X.fillRect(0, 0, ctx.W, ctx.H); }
  } });
"""
    return js

# ---- s2 الأدلة من القرآن بصوت القارئ (make_verses.py)
VS = json.load(open(f'{D}/verses.json', encoding='utf8'))
VO = json.load(open(f'{D}/voice.json', encoding='utf8'))
RECITER = 'تلاوة القارئ محمد اللحيدان'
AUDIO = []   # (scene, local_t, wav, gain)
VC = [dict(v=k, **VS[k]) for k in ['v195', 'v29', 'v157']]
t2 = 0.0
for c in VC:
    c['start'] = round(t2, 2); c['audio_at'] = round(t2 + 0.04, 2); c['cd'] = round(0.04 + c['dur'] - 0.10, 2); t2 += c['cd']; AUDIO.append(('s2', c['audio_at'], c['wav'], 1.0))
S2_DUR = round(t2, 2)
S['s2'] = "const VC = " + json.dumps(VC, ensure_ascii=False) + r"""
;
MOTION.scene({ id: 's2',
  draw(t, lt, ctx) {
    const { X, at } = ctx; let ci = 0; VC.forEach((c, i) => { if (lt >= c.start) ci = i; });
    const c = VC[ci], sl = lt - c.start, au = sl - 0.04;
    NG.bg(ctx, t, { gy: 900, glow: .13 });
    NG.label(ctx, 'من القرآن الكريم', lt);
    for (let q = 0; q < 3; q++) { X.globalAlpha = .06; X.strokeStyle = '#E5483B'; X.lineWidth = 2; X.save(); X.translate(540, 900); X.rotate(lt * .05 * (q % 2 ? -1 : 1) + q); X.strokeRect(-420 + q * 60, -420 + q * 60, 840 - q * 120, 840 - q * 120); X.restore(); }
    X.globalAlpha = 1;
    NG.vwords(ctx, c.words, au, 620, 104, sl);
    NG.src(ctx, c.ref, 1240, sl, .5);
    ctx.text(X, '__REC__', 540, 1320, { family: 'body', weight: 400, size: 34, color: '#7A766F', align: 'center', alpha: at(sl, .3, .8) });
    const f = 1 - at(sl, 0, .25, 'cubicOut'); if (f > 0 && ci > 0) { X.fillStyle = 'rgba(229,72,59,' + f * .4 + ')'; X.fillRect(0, 0, ctx.W, ctx.H); }
  } });
""".replace("__REC__", RECITER)

S['s4'] = r"""
MOTION.scene({ id: 's4',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 960, glow: .2 });
    NG.words(ctx, 'ومن هذه الأدلة أفتى العلماءُ بتحريمهما', 420, lt, .25, .26, 92, '#F2EFE9');
    const k = at(lt, 2.3, 2.65, 'backOut');
    if (k > 0) {
      X.save(); X.translate(540, 1100); X.rotate(-.12); const s = 2 - k;
      X.scale(s, s); X.globalAlpha = k; X.strokeStyle = '#E5483B'; X.lineWidth = 14; X.strokeRect(-330, -130, 660, 260); X.lineWidth = 4; X.strokeRect(-312, -112, 624, 224);
      X.shadowColor = 'rgba(229,72,59,.8)'; X.shadowBlur = 40;
      ctx.text(X, 'مُحَرَّم', 0, 70, { family: 'display', size: 210, color: '#E5483B', align: 'center' }); X.restore();
      const sh = Math.max(0, 1 - (lt - 2.3) * 6); X.save(); X.translate((ctx.noise1(lt * 40, 2) - .5) * 30 * sh, (ctx.noise1(lt * 40, 3) - .5) * 30 * sh); X.restore();
    }
  } });
"""

# ---- s4b أقوال العلماء: مقتطفات صوتية قصيرة بصوت الشيخين (من make_excerpts.py)
EX = json.load(open(f'{D}/excerpts.json', encoding='utf8'))
LEAD, TAILC = 0.04, -0.10
CARDS = [
  {'n': 'الشيخ محمد بن صالح العثيمين', 'ph': 'p_uth', 'k': 'uth', 'pre': 'التدخين الذي هو شرب الدخان أو التبغ', 's': 'موقع الشيخ ابن عثيمين — «حكم شرب الدخان»'},
  {'n': 'الشيخ عبدالعزيز بن باز', 'ph': 'p_baz', 'k': 'baz', 'pre': 'التدخين…', 's': 'موقع الشيخ ابن باز — «التدخين والسهر من أسباب الطلاق»'},
]
t0 = 0.0
for c in CARDS:
    e = EX[c['k']]; c['start'] = round(t0, 2); c['dur'] = round(LEAD + e['dur'] + TAILC, 2); c['audio_at'] = round(t0 + LEAD, 2)
    c['words'] = e['words']; t0 += c['dur']
S4B_DUR = round(t0, 2)
S['s4b'] = "const CARDS = " + json.dumps(CARDS, ensure_ascii=False) + r"""
;
MOTION.scene({ id: 's4b',
  draw(t, lt, ctx) {
    const { X, at } = ctx; let ci = 0; CARDS.forEach((c, i) => { if (lt >= c.start) ci = i; });
    const c = CARDS[ci], sl = lt - c.start, au = sl - 0.04;
    NG.bg(ctx, t, { gy: 800, glow: .14 });
    NG.label(ctx, 'من أقوال العلماء', lt, '#E8C46A');
    const k = at(sl, 0, .7, 'expoOut'), cx = 540, cy = 640, R = 150;
    // نبض الحلقة مع الصوت: يرتفع بين الكلمات
    let pulse = 0; c.words.forEach(w => { const d = au - w[1]; if (d >= 0 && d < .5) pulse = Math.max(pulse, 1 - d / .5); });
    X.save(); X.globalAlpha = k; X.strokeStyle = '#E8C46A'; X.lineWidth = 6; X.beginPath(); X.arc(cx, cy, R + 12 + 14 * pulse, 0, 6.283); X.stroke();
    X.globalAlpha = k * .35 * pulse; X.lineWidth = 3; X.beginPath(); X.arc(cx, cy, R + 34 + 30 * pulse, 0, 6.283); X.stroke(); X.globalAlpha = k;
    X.beginPath(); X.arc(cx, cy, R, 0, 6.283); X.clip();
    const img = ctx.images && ctx.images[c.ph] && ctx.img(c.ph);
    if (img) { const s = (R * 2.1 * (1 + .03 * pulse)) / Math.min(img.width, img.height); X.drawImage(img, cx - img.width * s / 2, cy - img.height * s / 2, img.width * s, img.height * s); }
    else { X.fillStyle = '#2A2420'; X.fillRect(cx - R, cy - R, R * 2, R * 2); }
    X.restore();
    ctx.text(X, c.n, 540, 880, { family: 'display', size: 64, color: '#F2EFE9', align: 'center', alpha: k, maxWidth: 960 });
    ctx.text(X, 'رحمه الله', 540, 950, { family: 'body', weight: 400, size: 38, color: '#E8C46A', align: 'center', alpha: k });
    ctx.text(X, c.pre, 540, 1040, { family: 'body', weight: 400, size: 40, color: '#9A968F', align: 'center', alpha: k, maxWidth: 940 });
    const str = c.words.map(w => w[0]).join(' ');
    const L = ctx.text.layout(X, str, { family: 'body', weight: 700, size: 68, maxWidth: 900, lineHeight: 1.6 });
    ctx.text.drawLayout(X, L, 540, 1110, { align: 'center', color: '#F2EFE9', perWord: (i) => {
      const w0 = c.words[i][1], w1 = i + 1 < c.words.length ? c.words[i + 1][1] : w0 + .9;
      const cur = au >= w0 && au < w1, past = au >= w1;
      return { alpha: k * (past || cur ? 1 : .3), color: cur ? '#F3DDA0' : '#F2EFE9', scale: cur ? 1.1 : 1, shadow: cur ? { blur: 30, y: 0, color: 'rgba(232,196,106,.8)' } : undefined };
    } });
    NG.src(ctx, c.s, 1500, sl, .6);
    const f = 1 - at(sl, 0, .25, 'cubicOut'); if (f > 0 && ci > 0) { X.fillStyle = 'rgba(232,196,106,' + f * .35 + ')'; X.fillRect(0, 0, ctx.W, ctx.H); }
  } });
"""

LEAD0, OV = 0.04, 0.10   # بداية الصوت داخل المشهد · تراكب بسيط بين المقاطع (بلا صمت)
def tw(k, word, off=0.0, lead=LEAD0):
    for w, t in VO[k]['words']:
        if w.startswith(word): return round(lead + t + off, 2)
    raise SystemExit('word not found: ' + word)
T5 = {'i1': tw('m3', 'سرطان', -.2), 'i2': tw('m3', 'وأمراض', -.12), 'i3': tw('m3', 'وضيغ', -.12), 'i4': tw('m3', 'وتلف', -.12), 'who': round(LEAD0 + VO['m3']['dur'] - 2.1, 2)}
T6 = {'a': tw('m4', 'ليست', -.25), 'i1': tw('m4', 'جلسة', -.12), 'i2': tw('m4', 'وفحمها', -.12), 'end': round(LEAD0 + VO['m4']['dur'], 2)}
T7 = {'burn': tw('m5', 'يحترق', -.5), 'yom': tw('m5', 'يومي', -.15), 'verse': round(LEAD0 + VO['m5']['dur'] - OV, 2)}
T8 = {'i1': tw('m6', 'معصية', -.25), 'i2': tw('m6', 'وتبذير', -.2), 'i3': tw('m6', 'وسؤال', -.2), 'q': round(LEAD0 + VO['m6']['dur'] - 2.4, 2)}
T9 = {'w1': tw('m7', 'الإقلاع', -.05), 'w2': tw('m7', 'ممكن', -.05), 'w3': tw('m7', 'إبدأ', -.05), 'w4': tw('m7', 'اليوم', -.05), 'verse': round(LEAD0 + VO['m7']['dur'] - OV, 2)}
# ---- s5 health
S['s5'] = "const T5 = " + json.dumps(T5) + ";\n" + r"""
MOTION.scene({ id: 's5',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 700, glow: .14 });
    NG.label(ctx, 'أضرار صحية', lt);
    const dark = at(lt, T5.i1 - .4, T5.i4 + 1.2, 'sineInOut');
    const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; };
    const bre = 1 + .025 * Math.sin(lt * 2.6) * (1 - dark * .6);
    X.save(); X.translate(540, 700); X.scale(bre, bre);
    const lung = (sg) => { X.save(); X.scale(sg, 1); X.beginPath(); X.moveTo(-14, -90); X.bezierCurveTo(-40, -100, -170, -90, -200, 30); X.bezierCurveTo(-225, 150, -150, 215, -80, 190); X.bezierCurveTo(-28, 170, -12, 110, -14, 20); X.closePath(); X.fillStyle = mix('#E58A8A', '#2A2321', dark); X.fill(); X.strokeStyle = 'rgba(255,255,255,.12)'; X.lineWidth = 3; X.stroke();
      X.strokeStyle = 'rgba(0,0,0,.28)'; X.lineWidth = 4; X.beginPath(); X.moveTo(-18, -20); X.lineTo(-80, 30); X.moveTo(-50, 10); X.lineTo(-90, 90); X.moveTo(-40, 20); X.lineTo(-40, 120); X.stroke(); X.restore(); };
    lung(1); lung(-1);
    X.strokeStyle = mix('#E8C0B8', '#4A403B', dark); X.lineWidth = 26; X.lineCap = 'round'; X.beginPath(); X.moveTo(0, -190); X.lineTo(0, -40); X.stroke();
    X.restore();
    NG.smoke(ctx, lt, 540, 960, { n: 16, h: 220, alpha: dark * .8, r: 60, spread: 220 });
    const items = [['سرطان الرئة والفم', T5.i1], ['أمراض القلب والجلطات', T5.i2], ['ضيق التنفس المزمن', T5.i3], ['تلف الأسنان واللثة', T5.i4]];
    items.forEach(([s, t0], i) => { const k = at(lt, t0, t0 + .5, 'expoOut'); const y = 1090 + i * 118;
      X.globalAlpha = k; X.fillStyle = '#E5483B'; X.fillRect(540 + 340 * (1 - k * .0) , y - 52, 8, 64); X.globalAlpha = 1;
      ctx.text(X, s, 540 - (1 - k) * 80 - 10, y, { family: 'display', size: 76, color: i % 2 ? '#F2EFE9' : '#FFB4A8', align: 'center', alpha: k, maxWidth: 640 }); });
    const w = at(lt, T5.who, T5.who + .6, 'cubicOut'), cnt = Math.round(8 * at(lt, T5.who, T5.who + 1.3, 'expoOut'));
    ctx.text(X, 'أكثر من', 770, 1545, { family: 'body', weight: 700, size: 40, color: '#F2EFE9', align: 'center', alpha: w });
    ctx.text(X, ctx.num(cnt), 540, 1555, { family: 'num', weight: 900, size: 150, color: '#E5483B', align: 'center', alpha: w, dir: 'ltr', shadow: { blur: 40, y: 0, color: 'rgba(229,72,59,.6)' } });
    ctx.text(X, 'ملايين وفاة كل سنة', 300, 1545, { family: 'body', weight: 700, size: 40, color: '#F2EFE9', align: 'center', alpha: w });
    ctx.text(X, 'التبغ — منظمة الصحة العالمية', 540, 1610, { family: 'body', weight: 400, size: 30, color: '#9A968F', align: 'center', alpha: w });
  } });
"""
# ---- s6 shisha
S['s6'] = "const T6 = " + json.dumps(T6) + ";\n" + r"""
MOTION.scene({ id: 's6',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 800, glow: .12 });
    NG.label(ctx, 'وهم الشيشة', lt);
    const k = at(lt, .2, 1.2, 'expoOut');
    X.save(); X.translate(300, 930 + (1 - k) * 160); X.scale(.85, .85); X.globalAlpha = k;
    X.fillStyle = 'rgba(120,170,200,.22)'; X.strokeStyle = '#8FB4CC'; X.lineWidth = 6;
    X.beginPath(); X.moveTo(-40, 80); X.bezierCurveTo(-200, 160, -190, 360, -120, 400); X.lineTo(120, 400); X.bezierCurveTo(190, 360, 200, 160, 40, 80); X.closePath(); X.fill(); X.stroke();
    X.fillStyle = 'rgba(90,150,190,.4)'; X.beginPath(); X.moveTo(-170, 280); X.quadraticCurveTo(0, 262 + 8 * Math.sin(lt * 3), 170, 280); X.lineTo(150, 380); X.lineTo(-150, 380); X.closePath(); X.fill();
    for (let i = 0; i < 9; i++) { const ph = (lt * .5 + i * .13) % 1; X.fillStyle = 'rgba(255,255,255,.5)'; X.beginPath(); X.arc(-80 + (i * 37) % 150 + Math.sin(lt * 3 + i) * 8, 370 - ph * 110, 5 + (i % 3) * 3, 0, 6.283); X.fill(); }
    X.fillStyle = '#9A968F'; X.fillRect(-18, -170, 36, 260); X.fillStyle = '#B8B3AA'; X.beginPath(); X.ellipse(0, -60, 90, 16, 0, 0, 6.283); X.fill();
    X.fillStyle = '#8A5A3A'; X.beginPath(); X.moveTo(-80, -170); X.lineTo(80, -170); X.lineTo(55, -260); X.lineTo(-55, -260); X.closePath(); X.fill();
    for (let i = 0; i < 5; i++) { const p = .7 + .3 * Math.sin(lt * 7 + i * 2); X.shadowColor = 'rgba(255,80,30,.9)'; X.shadowBlur = 24; X.fillStyle = 'rgba(255,' + (70 + 40 * p) + ',30,1)'; X.beginPath(); X.arc(-36 + i * 18, -268, 10, 0, 6.283); X.fill(); } X.shadowBlur = 0;
    X.restore();
    NG.smoke(ctx, lt, 300, 690, { n: 24, h: 330, alpha: k, r: 100, spread: 140 });
    X.save(); X.globalAlpha = k; X.strokeStyle = '#6E6A64'; X.lineWidth = 22; X.lineCap = 'round'; X.beginPath(); X.moveTo(318, 850); X.bezierCurveTo(520, 810, 700, 1010, 830, 1110); X.stroke(); X.strokeStyle = '#B8B3AA'; X.lineWidth = 34; X.beginPath(); X.moveTo(822, 1102); X.lineTo(850, 1128); X.stroke(); X.restore();
    const a = at(lt, T6.a, T6.a + .55, 'backOut');
    ctx.text(X, 'ليست أخفَّ!', 540, 480 + (1 - a) * 40, { family: 'display', size: 150, color: '#F2EFE9', align: 'center', alpha: a, shadow: { blur: 30, y: 0, color: 'rgba(229,72,59,.5)' } });
    const items = [['جلسة واحدة: دخان كثير قد يفوق عدة سجائر', T6.i1], ['الفحم يطلق غاز أول أكسيد الكربون', T6.i2]];
    items.forEach(([s, t0], i) => { const q = at(lt, t0, t0 + .5, 'expoOut'); ctx.text(X, s, 540, 1420 + i * 100 + (1 - q) * 30, { family: 'body', weight: 700, size: 50, color: i == 1 ? '#FFB4A8' : '#F2EFE9', align: 'center', alpha: q, maxWidth: 940 }); });
  } });
"""
# ---- s7 money
S['s7'] = "const V7 = " + json.dumps(VS['v27'], ensure_ascii=False) + ";\nconst T7 = " + json.dumps(T7) + ";\n" + r"""
MOTION.scene({ id: 's7',
  setup(ctx) { const r = ctx.rng('coins'); this.c = []; for (let i = 0; i < 26; i++) this.c.push({ x: 540 + r.range(-300, 300), y: 1040 + r.range(-40, 150) - Math.abs(r.range(-300, 300)) * .35, rr: r.range(46, 62), d: T7.burn + i * .1 }); },
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 1000, glow: .15, col: '255,150,40' });
    NG.label(ctx, 'أضرار مادية', lt, '#F0B04A');
    NG.words(ctx, 'مالٌ يتحوّل إلى رماد', 380, lt, .3, .3, 100, '#F2EFE9', { glow: 'rgba(240,176,74,.4)' });
    const cs = this.c.slice().sort((a, b) => a.y - b.y);
    cs.forEach((c, i) => {
      const k = at(lt, c.d, c.d + 1.4, 'sineInOut'), drop = at(lt, 0.5 + i * .03, 1.1 + i * .03, 'bounceOut');
      const y = c.y - 600 * (1 - drop) - k * 90, a = 1 - k;
      if (a <= 0) return; X.globalAlpha = a;
      const col = k < .45 ? '#F0B04A' : '#5C5852'; X.fillStyle = col; X.strokeStyle = k < .45 ? '#B07A22' : '#3A3733'; X.lineWidth = 5;
      X.beginPath(); X.ellipse(c.x, y, c.rr * (1 - k * .3), c.rr * (1 - k * .3), 0, 0, 6.283); X.fill(); X.stroke();
      X.globalAlpha = a * .7; X.fillStyle = 'rgba(255,255,255,.35)'; X.font = 'bold ' + c.rr + 'px Inter'; X.textAlign = 'center'; X.fillText('$', c.x, y + c.rr * .35);
      X.globalAlpha = 1;
    });
    NG.smoke(ctx, lt + 1, 540, 1150, { n: 20, h: 520, alpha: at(lt, T7.burn, T7.burn + 1.5, 'sineOut'), c: '120,116,110', r: 80, spread: 280 });
    const b = at(lt, T7.yom, T7.yom + .6, 'expoOut');
    ctx.text(X, 'يوميًا، شهريًا، سنةً بعد سنة…', 540, 1290, { family: 'body', weight: 700, size: 54, color: '#F2EFE9', align: 'center', alpha: b });
    NG.vwords(ctx, V7.words, lt - T7.verse, 1400, 56, lt - T7.verse + .2, '#F0B04A', { hi: '#FFE0A0', maxW: 940, lh: 1.5 });
    NG.src(ctx, V7.ref + ' — ' + 'تلاوة محمد اللحيدان', 1585, lt, T7.verse + .6);
  } });
"""
# ---- s8 religious
S['s8'] = "const T8 = " + json.dumps(T8) + ";\n" + r"""
MOTION.scene({ id: 's8',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    NG.bg(ctx, t, { gy: 900, glow: .13 });
    NG.label(ctx, 'أضرار دينية', lt);
    const items = [['معصيةٌ تتكرّر كل يوم', T8.i1], ['تبذيرٌ للمال، وإيذاءٌ لمن حولك', T8.i2], ['وسؤالٌ بين يدي الله عن المال والجسد', T8.i3]];
    items.forEach(([s, t0], i) => { const k = at(lt, t0, t0 + .6, 'expoOut'); const y = 620 + i * 250;
      X.save(); X.globalAlpha = k; X.strokeStyle = 'rgba(229,72,59,.55)'; X.lineWidth = 3; X.strokeRect(540 - 450 * k, y - 100, 900 * k, 190); X.restore();
      ctx.text(X, String(i + 1), 540 + 380, y + 28, { family: 'num', weight: 900, size: 76, color: '#E5483B', align: 'center', alpha: k });
      ctx.text(X, s, 540 - 30, y + 12 + (1 - k) * 30, { family: 'display', size: 70, color: '#F2EFE9', align: 'center', alpha: k, maxWidth: 740 }); });
    const q = at(lt, T8.q, T8.q + .7, 'expoOut');
    ctx.text(X, '«لا تزولُ قدما عبدٍ يومَ القيامة حتى يُسأل…', 540, 1420, { family: 'body', weight: 700, size: 44, color: '#FFB4A8', align: 'center', alpha: q, maxWidth: 940 });
    ctx.text(X, 'وعن مالِه من أين اكتسبه وفيمَ أنفقه، وعن جسمِه فيمَ أبلاه»', 540, 1500, { family: 'body', weight: 700, size: 44, color: '#FFB4A8', align: 'center', alpha: q, maxWidth: 940 });
    NG.src(ctx, 'رواه الترمذي', 1580, lt, T8.q + .9);
  } });
"""
# ---- s9 hope
S['s9'] = "const V9 = " + json.dumps(VS['v65'], ensure_ascii=False) + ";\nconst T9 = " + json.dumps(T9) + ";\n" + r"""
MOTION.scene({ id: 's9',
  draw(t, lt, ctx) {
    const { X, at } = ctx;
    const g = at(lt, 1.2, 4, 'sineInOut');
    NG.bg(ctx, t, { top: '#0A1210', bot: '#12301F', gy: 1000, glow: .1 + .22 * g, col: '79,191,139' });
    const k = at(lt, .2, 1.2, 'expoOut'), br = at(lt, T9.w3 - .2, T9.w3 + 1.0, 'expoOut');
    NG.smoke(ctx, lt, 540, 700, { h: 400, n: 18, alpha: (1 - at(lt, .8, 1.8)) });
    X.save(); X.translate(540, 760); X.scale(1.3, 1.3); X.globalAlpha = 1 - at(lt, T9.w4 + .9, T9.w4 + 1.9);
    X.save(); X.translate(-120 * br, 40 * br * br); X.rotate(-.5 * br + 1.2); X.translate(0, -120); NG.cig(ctx, 0, 0, 260, 0, .05, lt, 0); X.restore();
    X.save(); X.translate(120 * br, 40 * br * br); X.rotate(.5 * br + 1.9); X.translate(0, 120); NG.cig(ctx, 0, 0, 260, 0, 0, lt, 0); X.restore();
    X.restore();
    NG.vwords(ctx, [['الإقلاع', T9.w1], ['ممكن…', T9.w2], ['ابدأ', T9.w3], ['اليوم', T9.w4]].map(w => ['\u200F' + w[0], w[1]]), lt, 1120, 92, lt, '#F2EFE9', { hi: '#C8FFE2', maxW: 940, lh: 1.4 });
    NG.vwords(ctx, V9.words, lt - T9.verse, 1380, 58, lt - T9.verse + .2, '#7FE0B0', { hi: '#C8FFE2', maxW: 940, lh: 1.5 });
    NG.src(ctx, V9.ref + ' — تلاوة محمد اللحيدان', 1540, lt, T9.verse + .6, '#8FB9A4');
    NG.src(ctx, 'واستعن بالله ثم بطبيب مختص', 1600, lt, T9.verse + 1.0, '#8FB9A4');
  } });
"""
S5_DUR = round(LEAD0 + VO['m3']['dur'] - OV, 2); S6_DUR = round(T6['end'] - OV, 2)
S7_DUR = round(T7['verse'] + VS['v27']['dur'] - OV, 2); S8_DUR = round(LEAD0 + VO['m6']['dur'] - OV, 2); S9_DUR = round(T9['verse'] + VS['v65']['dur'] + 0.6, 2)
dur = {'s1': round(LEAD0 + VO['m1']['dur'] - OV, 2), 's2': S2_DUR, 's4': round(LEAD0 + VO['m2']['dur'] - OV, 2), 's4b': S4B_DUR, 's5': S5_DUR, 's6': S6_DUR, 's7': S7_DUR, 's8': S8_DUR, 's9': S9_DUR}
for k, v in S.items():
    v = v.replace("draw(t, lt, ctx) {", "draw(t, lt, ctx) { ctx.X.save(); NG.cam(ctx, lt); this.draw0(t, lt, ctx); ctx.X.restore(); },\n  draw0(t, lt, ctx) {", 1)
    open(f'{D}/scenes/{k}.js', 'w').write(HELP + v)
bpm = 72; spb = 60 / bpm; total = round(sum(dur.values()), 3)
beats = [round(i * spb, 4) for i in range(int(total / spb) + 1)]
TRANS = {k: {'type': 'crossfade', 'dur': .28} for k in ['s1','s2','s4','s4b','s5','s6','s7','s8','s9']}
TRANS['s1'] = {'type': 'cut', 'dur': .2}; TRANS['s4'] = {'type': 'flash', 'dur': .22}
sc = []; t = 0.0
for k, d in dur.items():
    sc.append({'id': k, 'file': f'scenes/{k}.js', 'start': round(t, 3), 'end': round(t + d, 3), 'lines': [], 'transition': TRANS[k]}); t += d
json.dump({'duration': total, 'bpm': bpm, 'beats': beats, 'bars': beats[::4], 'sections': [{'name': 'intro', 'start': 0, 'end': total}], 'scenes': sc, 'vo': []}, open(f'{D}/timeline.json', 'w'), ensure_ascii=False)
json.dump({'name': 'أدلة تحريم الدخان والشيشة وأضرارهما', 'fps': 60, 'width': 1080, 'height': 1920, 'bpm': bpm, 'beatsPerBar': 4, 'beatOffset': 0,
  'palette': {'bg': '#0A0B0F', 'ink': '#F2EFE9', 'acc': '#E5483B', 'clay': '#C4372B', 'hi': '#FFB4A8', 'mut': '#9A968F'},
  'fonts': {'display': 'Lalezar', 'body': 'IBM Plex Sans Arabic', 'num': 'Inter'}, 'images': {k: f'assets/{f}' for k, f in {'p_baz': 'baz.jpg', 'p_uth': 'uth.jpg'}.items() if os.path.exists(f'{D}/assets/{f}')}, 'post': {'grain': 0.04, 'vignette': 0.4},
  'scenes': [{'id': k, 'file': f'scenes/{k}.js', 'minDur': d} for k, d in dur.items()]}, open(f'{D}/project.json', 'w'), ensure_ascii=False, indent=1)
sfx = [{'type': 'impact', 'at': 'scene:s4+2.3', 'gain': .9}, {'type': 'riser', 'at': 'scene:s4+2.3', 'gain': .5}]
for k in ['s2', 's4b', 's5', 's6', 's7', 's8', 's9']: sfx.append({'type': 'swoosh-pass', 'at': f'scene:{k}', 'gain': .22})
sfx += [{'type': 'tick', 'at': 'scene:s2+0.3', 'gain': .3}]
for t0 in [T5['i1'], T5['i2'], T5['i3'], T5['i4']]: sfx.append({'type': 'pop', 'at': f'scene:s5+{t0}', 'gain': .45})
sfx.append({'type': 'shimmer', 'at': f"scene:s5+{T5['who']}", 'gain': .5})
for t0 in [T6['i1'], T6['i2']]: sfx.append({'type': 'pop', 'at': f'scene:s6+{t0}', 'gain': .45})
for t0 in [T8['i1'], T8['i2'], T8['i3']]: sfx.append({'type': 'pop', 'at': f'scene:s8+{t0}', 'gain': .45})
sfx += [{'type': 'shimmer', 'at': f"scene:s9+{T9['w3']}", 'gain': .8}]
json.dump(sfx, open(f'{D}/sfx.json', 'w'))
AUDIO += [('s7', T7['verse'], VS['v27']['wav'], 1.0), ('s9', T9['verse'], VS['v65']['wav'], 1.0)]
AUDIO += [(sc_, LEAD0, VO[m_]['wav'], 1.5) for sc_, m_ in [('s1', 'm1'), ('s4', 'm2'), ('s5', 'm3'), ('s6', 'm4'), ('s7', 'm5'), ('s8', 'm6'), ('s9', 'm7')]]
for c in CARDS: AUDIO.append(('s4b', c['audio_at'], EX[c['k']]['wav'], 1.5))
json.dump([{'scene': a, 'at': b, 'wav': c, 'gain': g} for a, b, c, g in AUDIO], open(f'{D}/audio_cues.json', 'w'), ensure_ascii=False, indent=1)
print('total', total)
