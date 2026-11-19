
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
