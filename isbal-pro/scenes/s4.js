/* s4 — الحديث: خط الرقعة، كلمة كلمة، «النار» بالأحمر، المصدر */
MOTION.scene({
  id: 's4',
  draw(t, lt, ctx) {
    const { X, P, at, E } = ctx, ISB = window.ISB;
    const w7 = ctx.wordTime('l6', -1), punch = Math.max(0, 1 - Math.abs(t - w7.s - 0.1) / 0.4) * 0.03;
    const push = 1 + 0.045 * at(lt, 0, 6, 'sineInOut') + punch;
    ISB.bg(ctx, t, { light: 1.1, dust: 1.2 });
    X.save(); X.translate(540, 900); X.scale(push, push); X.translate(-540, -900);
    // علامة اقتباس ضخمة خفيفة
    X.save(); X.globalAlpha = 0.07 * at(lt, 0, 1.2); ctx.text(X, '“', 540, 760, { family: 'ruqaa', weight: 700, size: 900, color: P.acc, align: 'center' }); X.restore();
    // إطار خطوط رفيعة بزوايا
    const fk = at(lt, 0, 1.1, 'expoOut'); X.save(); X.strokeStyle = P.acc; X.lineWidth = 2; X.globalAlpha = 0.9;
    const x0 = 120, x1 = 960, y0 = 400, y1 = 1360, L = 70 * fk;
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { X.lineWidth = 4; X.beginPath(); X.moveTo(x, y + sy * L); X.lineTo(x, y); X.lineTo(x + sx * L, y); X.stroke(); });
    X.lineWidth = 1.5; X.globalAlpha = 0.35; X.strokeRect(x0 + 24, y0 + 24, x1 - x0 - 48, y1 - y0 - 48); X.restore();
    // الحديث
    const text = ctx.lineSpan('l6').text;
    const Lo = ctx.text.layout(X, text, { family: 'ruqaa', weight: 700, size: 112, maxWidth: 740, lineHeight: 1.6 });
    ctx.text.drawLayout(X, Lo, 540, 740, { align: 'center', color: P.ink, perWord: (i) => {
      const t0 = ctx.wordTime('l6', i).s, k = at(t, t0 - 0.06, t0 + 0.55, 'expoOut'), last = i === 7;
      return { alpha: k, dy: (1 - k) * 36, scale: 0.94 + 0.06 * k, color: last ? '#E8545E' : P.ink };
    } });
    // خط تحت «النار»
    const uk = at(t, w7.s + 0.1, w7.s + 0.7, 'expoOut');
    if (uk > 0) ctx.drawPath(X, [[400, 1148], [680, 1148]], uk, { width: 6, color: P.red, cap: 'round', smooth: false });
    // المصدر
    const s7 = ctx.lineSpan('l7'), sk = at(t, s7.s - 0.05, s7.s + 0.6, 'expoOut');
    if (sk > 0.01) { X.save(); X.globalAlpha = sk; X.translate(0, 24 * (1 - sk));
      X.strokeStyle = P.acc; X.lineWidth = 2; X.beginPath(); X.moveTo(200, 1262); X.lineTo(400, 1262); X.moveTo(680, 1262); X.lineTo(880, 1262); X.stroke();
      ctx.text(X, 'رواه البخاري', 540, 1280, { family: 'body', weight: 700, size: 48, color: P.acc, align: 'center' }); X.restore(); }
    X.restore();
    ISB.hud(ctx, t, lt, 4, 'حديث شريف');
  }
});
