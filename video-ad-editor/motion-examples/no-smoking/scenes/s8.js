
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
const T8 = {"i1": 1.45, "i2": 3.22, "i3": 4.72, "q": 6.35};

MOTION.scene({ id: 's8',
  draw(t, lt, ctx) { ctx.X.save(); NG.cam(ctx, lt); this.draw0(t, lt, ctx); ctx.X.restore(); },
  draw0(t, lt, ctx) {
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
