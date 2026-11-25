MOTION.scene({ id: 's3',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, K = ctx.img('kaaba'), S = ctx.img('seal');
    FX.kenBurns(ctx, t, { s: 9.2, dur: 5, from: [540, 700, 1.0], to: [540, 900, 1.14], draw: Y => HU.plate({ ...ctx, X: Y }, K, .55) });
    const k1 = at(lt, .1, .7, 'expoOut'), k2 = at(lt, .45, 1.05, 'expoOut');
    ctx.text(X, 'إفطار صائم', 540, 620 + 40 * (1 - k1), { family: 'display', weight: 800, size: 150, color: P.acc, alpha: k1 });
    ctx.text(X, 'في ساحات الحرم', 540, 810 + 40 * (1 - k2), { family: 'display', weight: 900, size: 138, color: P.ink, alpha: k2, maxWidth: 940 });
    // ختم "الحسنة في مكة بمئة ألف حسنة" (من الشعار الحقيقي)
    const ks = at(lt, 1.5, 2.2, 'cubicOut'), z = .94 + .06 * ks;
    X.save(); X.globalAlpha = ks; X.translate(540, 1220); X.scale(z * 1.0, z); X.rotate(-0.05 * (1 - ks)); X.drawImage(S, -190, -190, 380, 380); X.restore();
    ctx.text(X, 'الحسنة في مكة بمئة ألف حسنة', 540, 1470, { family: 'body', weight: 700, size: 50, color: P.hi, alpha: at(lt, 2.1, 2.6, 'cubicOut') });
  } });
