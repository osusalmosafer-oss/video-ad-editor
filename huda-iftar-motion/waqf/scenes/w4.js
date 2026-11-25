MOTION.scene({ id: 'w4',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, S = ctx.img('seal');
    HU.bg(ctx); const g = X.createRadialGradient(540, 860, 60, 540, 860, 800); g.addColorStop(0, '#22565F'); g.addColorStop(1, P.bg); X.fillStyle = g; X.fillRect(0, 0, 1080, 1920);
    ctx.text(X, 'الحسنة في مكة', 540, 330, { family: 'display', weight: 800, size: 100, color: P.ink, alpha: at(lt, .05, .55, 'cubicOut') });
    FX.kenBurns(ctx, t, { s: 17, dur: 4.2, from: [540, 960, 1.0], to: [540, 960, 1.08], clamp: false, draw: Y => { const k = at(lt, .25, 1.0, 'expoOut');
      Y.save(); Y.globalAlpha = k; Y.translate(540, 860); Y.rotate(-.06 * (1 - k)); Y.scale(.94 + .06 * k, .94 + .06 * k);
      Y.fillStyle = 'rgba(0,0,0,.35)'; Y.beginPath(); Y.ellipse(0, 410, 330, 30, 0, 0, 6.283); Y.fill(); Y.drawImage(S, -400, -400, 800, 800); Y.restore(); } });
    ctx.text(X, 'بمئة ألف حسنة', 540, 1380, { family: 'display', weight: 900, size: 104, color: P.acc, alpha: at(lt, 1.2, 1.8, 'expoOut') });
  } });
