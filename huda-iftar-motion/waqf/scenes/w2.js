MOTION.scene({ id: 'w2',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, Q = ctx.img('quran');
    FX.kenBurns(ctx, t, { s: 3.6, dur: 7.4, from: [440, 780, 1.18], to: [500, 700, 1.3], draw: Y => HU.plate({ ...ctx, X: Y }, Q, .85, .4) });
    const a = at(lt, .1, .6, 'cubicOut'); X.save(); X.globalAlpha = a; X.translate(540, 900); X.scale(.97 + .03 * a, .97 + .03 * a); X.translate(-540, -900);
    X.fillStyle = 'rgba(13,40,48,.80)'; HU.rr(X, 80, 360, 920, 1080, 36); X.fill(); X.strokeStyle = P.acc; X.lineWidth = 3; HU.rr(X, 80, 360, 920, 1080, 36); X.stroke(); X.restore();
    ctx.text(X, 'قال عليه الصلاة والسلام', 540, 460, { family: 'body', weight: 700, size: 52, color: P.acc, alpha: a });
    FX.scrollReveal(ctx, t, { text: 'إذا مات ابن آدم انقطع عنه عمله إلا من ثلاث', s: 4.2, step: .26, x: 540, y: 650, size: 70, maxWidth: 800, dim: .12 });
    ['صدقة جارية', 'علم ينتفع به', 'ولد صالح يدعو له'].forEach((w, i) => { const s0 = 6.0 + i * .9, k = at(t, s0, s0 + .5, 'expoOut'), y = 960 + i * 130;
      X.save(); X.globalAlpha = k; X.translate(0, 24 * (1 - k)); X.fillStyle = i === 0 ? P.acc : '#173D46'; HU.rr(X, 150, y, 780, 100, 30); X.fill();
      ctx.text(X, w, 540, y + 68, { family: 'display', weight: 800, size: 56, color: i === 0 ? '#0D2830' : P.ink }); X.restore(); });
  } });
