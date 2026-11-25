/* مشاهد فيلم إفطار صائم — صور حقيقية من منشور الجمعية + نص عربي. حركات البنك: كين بيرنز · كشف بالقراءة · مسحة · لمعة */
window.HU = {
  bg(ctx) { const { X, P } = ctx; X.fillStyle = P.bg; X.fillRect(0, 0, 1080, 1920); },
  cover(X, im, x, y, w, h, fx = .5, fy = .5) { const s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; X.drawImage(im, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh); },
  rr(X, x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); },
  shade(X, a0 = .55, a1 = .85) { const g = X.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, `rgba(8,28,34,${a0})`); g.addColorStop(.5, `rgba(8,28,34,${a0 * .6})`); g.addColorStop(1, `rgba(8,28,34,${a1})`); X.fillStyle = g; X.fillRect(0, 0, 1080, 1920); },
  /* لوحة تصوير: الصورة تملأ الشاشة (مطفّاة) */
  plate(ctx, im, a = .55, fx = .5) { const { X } = ctx; HU.bg(ctx); X.save(); X.globalAlpha = 1; HU.cover(X, im, 0, 0, 1080, 1920, fx, .5); X.restore(); HU.shade(X, a, .9); }
};
MOTION.scene({ id: 's1',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, K = ctx.img('kaaba');
    FX.kenBurns(ctx, t, { s: 0, dur: 3.6, from: [540, 1000, 1.0], to: [540, 880, 1.16], draw: Y => HU.plate({ ...ctx, X: Y }, K, .5) });
    // خط ذهبي رفيع يُرسم
    const k = at(lt, .15, .9, 'cubicOut'); X.fillStyle = P.acc; X.fillRect(540 - 90 * k, 520, 180 * k, 5);
    FX.scrollReveal(ctx, t, { text: 'فطّر صائمًا', s: .25, step: .3, x: 540, y: 760, size: 150, dim: .0, accent: [1], maxWidth: 900 });
    FX.scrollReveal(ctx, t, { text: 'ولك مثل أجره', s: 1.2, step: .3, x: 540, y: 1010, size: 110, dim: .0, color: P.ink, maxWidth: 900 });
    ctx.text(X, 'جمعية هدى', 540, 1340, { family: 'body', weight: 700, size: 48, color: P.hi, alpha: at(lt, 2.0, 2.5, 'cubicOut') });
  } });
