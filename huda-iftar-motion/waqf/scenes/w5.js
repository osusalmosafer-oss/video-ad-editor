const ROWS = [['سهم العطاء', 100], ['سهم البر', 500], ['سهم الكرم', 1000], ['سهم الإحسان', 10000]];
MOTION.scene({ id: 'w5',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx; HU.bg(ctx);
    ctx.text(X, 'ساهم بأعظم الصدقات', 540, 300, { family: 'display', weight: 800, size: 84, color: P.ink, alpha: at(lt, 0, .5, 'cubicOut') });
    ctx.text(X, 'في خير البقاع', 540, 395, { family: 'display', weight: 700, size: 60, color: P.acc, alpha: at(lt, .15, .65, 'cubicOut') });
    ROWS.forEach(([n, v], i) => {
      const s0 = .8 + i * 2.6, k = at(lt, s0, s0 + .55, 'expoOut'), y = 480 + i * 285, last = i === 3; if (k <= 0) return;
      X.save(); X.globalAlpha = k; X.translate(0, 40 * (1 - k)); X.fillStyle = last ? P.acc : '#173D46'; HU.rr(X, 90, y, 900, 240, 44); X.fill();
      if (!last) { X.strokeStyle = 'rgba(204,157,62,.55)'; X.lineWidth = 2; HU.rr(X, 90, y, 900, 240, 44); X.stroke(); }
      const ink = last ? '#0D2830' : P.ink, sec = last ? '#0D2830' : P.mut, c = at(lt, s0 + .1, s0 + 1.1, 'expoOut');
      ctx.text(X, n, 930, y + 148, { family: 'display', weight: 800, size: 66, color: ink, align: 'right' });
      ctx.text(X, ctx.num(Math.round(v * c)), 330, y + 138, { family: 'num', weight: 800, size: 104, color: last ? '#0D2830' : P.hi, dir: 'ltr' });
      ctx.text(X, 'ريال', 330, y + 205, { family: 'body', weight: 700, size: 40, color: sec }); X.restore(); });
  } });
