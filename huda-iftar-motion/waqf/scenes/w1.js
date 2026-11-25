/* مشاهد فيلم إفطار صائم — صور حقيقية من منشور الجمعية + نص عربي. حركات البنك: كين بيرنز · كشف بالقراءة · مسحة · لمعة */
window.HU = {
  bg(ctx) { const { X, P } = ctx; X.fillStyle = P.bg; X.fillRect(0, 0, 1080, 1920); },
  cover(X, im, x, y, w, h, fx = .5, fy = .5) { const s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; X.drawImage(im, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh); },
  rr(X, x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); },
  shade(X, a0 = .55, a1 = .85) { const g = X.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, `rgba(8,28,34,${a0})`); g.addColorStop(.5, `rgba(8,28,34,${a0 * .6})`); g.addColorStop(1, `rgba(8,28,34,${a1})`); X.fillStyle = g; X.fillRect(0, 0, 1080, 1920); },
  /* لوحة تصوير: الصورة تملأ الشاشة (مطفّاة) */
  plate(ctx, im, a = .55, fx = .5) { const { X } = ctx; HU.bg(ctx); X.save(); X.globalAlpha = 1; HU.cover(X, im, 0, 0, 1080, 1920, fx, .5); X.restore(); HU.shade(X, a, .9); }
};
MOTION.scene({ id: 'w1',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, Q = ctx.img('quran');
    FX.kenBurns(ctx, t, { s: 0, dur: 3.8, from: [500, 900, 1.0], to: [440, 780, 1.18], draw: Y => HU.plate({ ...ctx, X: Y }, Q, .5, .4) });
    const k = at(lt, .15, .9, 'cubicOut'); X.fillStyle = P.acc; X.fillRect(540 - 90 * k, 520, 180 * k, 5);
    FX.scrollReveal(ctx, t, { text: 'ثلاثة أعمال', s: .25, step: .3, x: 540, y: 760, size: 150, dim: 0, accent: [1], maxWidth: 900 });
    FX.scrollReveal(ctx, t, { text: 'لا تنقطع بعد موتك', s: 1.2, step: .28, x: 540, y: 1010, size: 104, dim: 0, maxWidth: 900 });
    ctx.text(X, 'جمعية هدى', 540, 1340, { family: 'body', weight: 700, size: 48, color: P.hi, alpha: at(lt, 2.2, 2.7, 'cubicOut') });
  } });
