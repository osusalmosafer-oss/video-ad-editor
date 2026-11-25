const ROWS = [['سهم الفرد', 'صائم واحد', 15], ['سهم الوالدين', '10 صائمين', 150], ['سهم الأسرة', 'سفرة كاملة · 50 صائم', 750], ['سهم الريان', '10 سفر إفطار · 500 صائم', 7500]];
MOTION.scene({ id: 's5',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx;
    HU.bg(ctx);
    ctx.text(X, 'ساهم بسهمك', 540, 250, { family: 'display', weight: 800, size: 100, color: P.ink, alpha: at(lt, 0, .5, 'cubicOut') });
    ROWS.forEach(([n, sub, v], i) => {
      const s0 = .5 + i * 2.7, k = at(lt, s0, s0 + .55, 'expoOut'), y = 360 + i * 300, last = i === 3;
      if (k <= 0) return;
      X.save(); X.globalAlpha = k; X.translate(0, 40 * (1 - k));
      X.fillStyle = last ? P.acc : '#173D46'; HU.rr(X, 90, y, 900, 250, 44); X.fill();
      if (!last) { X.strokeStyle = 'rgba(204,157,62,.55)'; X.lineWidth = 2; HU.rr(X, 90, y, 900, 250, 44); X.stroke(); }
      const ink = last ? '#0D2830' : P.ink, sec = last ? '#0D2830' : P.mut;
      ctx.text(X, n, 930, y + 110, { family: 'display', weight: 800, size: 66, color: ink, align: 'right' });
      ctx.text(X, sub, 930, y + 188, { family: 'body', weight: 700, size: 42, color: sec, align: 'right', maxWidth: 520 });
      const c = at(lt, s0 + .1, s0 + 1.1, 'expoOut');
      ctx.text(X, ctx.num(Math.round(v * c)), 330, y + 150, { family: 'num', weight: 800, size: 120, color: last ? '#0D2830' : P.hi, dir: 'ltr' });
      ctx.text(X, 'ريال', 330, y + 215, { family: 'body', weight: 700, size: 40, color: sec });
      X.restore();
      // لمعة على سهم الريان
    });
  } });
