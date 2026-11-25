MOTION.scene({ id: 's2',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, K = ctx.img('kaaba');
    FX.kenBurns(ctx, t, { s: 3.4, dur: 6, from: [540, 880, 1.16], to: [560, 760, 1.28], draw: Y => HU.plate({ ...ctx, X: Y }, K, .82) });
    // بطاقة الحديث
    const a = at(lt, .1, .6, 'cubicOut'); X.save(); X.globalAlpha = a; X.translate(540, 960); X.scale(.97 + .03 * a, .97 + .03 * a); X.translate(-540, -960);
    X.fillStyle = 'rgba(13,40,48,.78)'; HU.rr(X, 90, 440, 900, 900, 36); X.fill(); X.strokeStyle = P.acc; X.lineWidth = 3; HU.rr(X, 90, 440, 900, 900, 36); X.stroke(); X.restore();
    ctx.text(X, 'قال عليه الصلاة والسلام', 540, 540, { family: 'body', weight: 700, size: 54, color: P.acc, alpha: a });
    FX.scrollReveal(ctx, t, { text: 'من فطّر صائمًا كان له مثل أجره، غير أنه لا ينقص من أجر الصائم شيئًا', s: 4.1, step: .27, x: 540, y: 760, size: 74, maxWidth: 780, dim: .12, accent: [1, 2, 3, 4] });
  } });
