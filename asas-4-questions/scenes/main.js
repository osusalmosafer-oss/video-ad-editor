/* «4 أسئلة اسألها قبل ما تحجز فندقك في مكة» — أسس المسافر. موشن جرافيك خالص، صامت.
   هوك ← 4 أسئلة (أيقونة تُرسم + السؤال + سطر إرشاد) ← قائمة تلخيص بصح ← ختام. كل شي من t بس. */
const W = 1080, H = 1920;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

/* أيقونات [مسار، 'i' أبيض | 'a' أزرق، تأخير] مركزها (0,0) */
const ICONS = {
  walk: [   // بوصلة + سهم اتجاه + نقاط مسار
    [circ(0, 0, 150), 'i', 0], ['M0 -150 L0 -118', 'i', 1], ['M0 150 L0 118', 'i', 1], ['M-150 0 L-118 0', 'i', 1], ['M150 0 L118 0', 'i', 1],
    ['M-55 60 L55 -60', 'a', 2], ['M5 -62 L57 -62 L57 -10', 'a', 3], [circ(-70, 75, 12), 'a', 4]],
  bus: [
    [rr(-160, -95, 320, 170, 30), 'i', 0], ['M-160 -20 L160 -20', 'i', 1], ['M-110 -62 L-55 -62 M-25 -62 L30 -62 M60 -62 L115 -62', 'a', 2],
    [circ(-95, 95, 26), 'i', 3], [circ(95, 95, 26), 'i', 3], ['M0 150 L0 190 M-20 170 L0 190 L20 170', 'a', 4]],
  breakfast: [  // فنجان + بخار + صحن
    ['M-100 -20 L100 -20 L80 110 C75 130 -75 130 -80 110 Z', 'i', 0], ['M100 10 C160 10 160 80 92 80', 'i', 1],
    ['M-50 -50 C-70 -80 -30 -100 -50 -130', 'a', 2], ['M0 -50 C-20 -80 20 -100 0 -130', 'a', 2], ['M50 -50 C30 -80 70 -100 50 -130', 'a', 2],
    ['M-150 150 L150 150', 'i', 3]],
  kids: [   // طفل + قلب
    [circ(-40, -90, 42), 'i', 0], ['M-40 -48 L-40 40 M-40 -10 L-95 20 M-40 -10 L15 20 M-40 40 L-80 120 M-40 40 L0 120', 'i', 1],
    ['M90 -30 C90 -75 150 -75 150 -30 C150 5 120 25 120 45 C120 25 90 5 90 -30', 'a', 2]],
};
const QS = [
  { icon: 'walk', l1: 'كم دقيقة مشي', l2: 'أو إلى أي باب؟', hint: null, short: 'المشي والاتجاه' },
  { icon: 'bus', l1: 'هل في باص؟', l2: 'ووين ينزل؟', hint: 'واسأل عن موقف الباص ومحطة النزول', short: 'الباص والنزول' },
  { icon: 'breakfast', l1: 'هل الغرفة', l2: 'شامل الإفطار؟', hint: null, short: 'الإفطار' },
  { icon: 'kids', l1: 'هل إقامة الأطفال', l2: 'مجانية؟', hint: 'واسأل عن عمر الطفل المسموح', short: 'إقامة الأطفال' },
];

const T_HOOK = 3.6, T_Q = 4.6, T_REC = 4.2, T_CTA = 5;
const segStart = i => i === 0 ? 0 : (i <= 4 ? T_HOOK + T_Q * (i - 1) : (i === 5 ? T_HOOK + T_Q * 4 : T_HOOK + T_Q * 4 + T_REC));

MOTION.scene({
  id: 'main', start: 0, end: 31.2,
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const cfg = (ctx.project && ctx.project.q) || {};
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');
    const bg = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };
    const panel = (Y, cx, cy, s, k) => { Y.save(); Y.translate(cx, cy); Y.scale(0.95 + 0.05 * k, 0.95 + 0.05 * k); Y.globalAlpha = k; Y.fillStyle = 'rgba(255,255,255,0.06)'; Y.strokeStyle = 'rgba(255,255,255,0.18)'; Y.lineWidth = 3; const p = new Path2D(rr(-s / 2, -s / 2, s, s, 64)); Y.fill(p); Y.stroke(p); Y.restore(); };
    const icon = (Y, id, u, cx, cy, S) => { const fl = Math.sin(u * 1.3) * 5; Y.save(); Y.translate(cx, cy + fl); Y.scale(S, S); ICONS[id].forEach(([d, c, dl]) => ctx.drawPath(Y, d, ease(u, 0.3 + dl * 0.14, 0.3 + dl * 0.14 + 0.6, 'cubicOut'), { width: 14, color: c === 'a' ? P.acc : P.ink })); Y.restore(); };

    /* هوك */
    const hook = (Y, u) => {
      bg(Y);
      const a1 = ease(u, 0.1, 0.7), a2 = ease(u, 0.8, 1.4), a3 = ease(u, 1.5, 2.1);
      // علامة استفهام كبيرة مرسومة
      ctx.drawPath(Y, 'M400 520 C400 330 700 330 700 520 C700 640 540 650 540 780', Math.max(0.08, ease(u, 0.0, 1.0, 'cubicOut')), { width: 30, color: P.acc });
      Y.save(); Y.globalAlpha = Math.max(0.5, ease(u, 0.8, 1.2)); Y.fillStyle = P.acc; Y.beginPath(); Y.arc(540, 900, 24, 0, 6.2832); Y.fill(); Y.restore();
      ctx.text(Y, 'جاي تحجز فندق في مكة؟', 540, 1160 + 30 * (1 - a1), { family: 'display', weight: 900, size: 104, color: P.ink, alpha: a1, maxWidth: 820 });
      ctx.text(Y, 'اسأل 4 أسئلة قبل ما تدفع', 540, 1290 + 24 * (1 - a2), { family: 'body', weight: 700, size: 58, color: P.acc, alpha: a2, maxWidth: 820 });
    };

    /* سؤال */
    const question = (Y, u, i) => {
      const q = QS[i]; bg(Y);
      const a0 = ease(u, 0.1, 0.6);
      ctx.text(Y, (i + 1) + ' / 4', 540, 270, { family: 'num', weight: 800, size: 64, color: P.ink, dir: 'ltr', alpha: a0 });
      for (let j = 0; j < 4; j++) { Y.fillStyle = j <= i ? P.acc : 'rgba(255,255,255,0.2)'; Y.globalAlpha = a0; Y.fillRect(540 - 1.5 * 70 + j * 70 - 27, 310, 54, 8); } Y.globalAlpha = 1;
      panel(Y, 540, 720, 560, ease(u, 0.05, 0.6, 'cubicOut'));
      icon(Y, q.icon, u, 540, 720, 0.95);
      const k1 = ease(u, 0.6, 1.2), k2 = ease(u, 0.85, 1.45), k3 = ease(u, 1.3, 1.9);
      ctx.text(Y, q.l1, 540, 1140 + 36 * (1 - k1), { family: 'display', weight: 900, size: 84, color: P.ink, alpha: k1, maxWidth: 780 });
      ctx.text(Y, q.l2, 540, 1255 + 36 * (1 - k2), { family: 'display', weight: 900, size: 84, color: P.acc, alpha: k2, maxWidth: 780 });
      if (q.hint) ctx.text(Y, q.hint, 540, 1380 + 24 * (1 - k3), { family: 'body', weight: 700, size: 44, color: P.mut, alpha: k3, maxWidth: 780 });
    };

    /* تلخيص: قائمة بصح */
    const recap = (Y, u) => {
      bg(Y);
      ctx.text(Y, 'قبل ما تحجز', 540, 320, { family: 'display', weight: 900, size: 100, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 820 });
      QS.forEach((q, i) => {
        const T0 = 0.7 + i * 0.6, y = 640 + i * 190, x = 880, R = 44;
        const k = ease(u, T0, T0 + 0.3, 'backOut'), ck = ease(u, T0 + 0.1, T0 + 0.45, 'cubicOut'), tx = ease(u, T0 + 0.05, T0 + 0.5);
        Y.save(); Y.strokeStyle = P.mut; Y.lineWidth = 6; Y.globalAlpha = ease(u, 0.4, 0.8); Y.beginPath(); Y.arc(x, y, R, 0, 6.2832); Y.stroke(); Y.restore();
        if (k > 0.02) { Y.save(); Y.translate(x, y); Y.scale(k, k); Y.fillStyle = P.acc; Y.beginPath(); Y.arc(0, 0, R + 2, 0, 6.2832); Y.fill(); Y.restore(); if (ck > 0) ctx.drawPath(Y, [[x - 19, y + 2], [x - 5, y + 16], [x + 20, y - 14]], ck, { width: 9, color: P.onAcc, smooth: false }); }
        ctx.text(Y, q.short, x - 80 + 40 * (1 - tx), y + 22, { family: 'body', weight: 700, size: 66, align: 'right', color: P.ink, alpha: tx, maxWidth: 700 });
      });
    };

    /* ختام */
    const outro = (Y, u) => {
      bg(Y);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (ctx.img('logo')) { const im = ctx.img('logo'), w = 520, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 300 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3), a3 = ease(u, 2.3, 2.9);
      ctx.text(Y, 'الرابط في البايو', 540, 1230 + 30 * (1 - a1), { family: 'display', weight: 900, size: 80, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1280], [540, 1288], [750, 1278]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      ctx.text(Y, cfg.phone || '+966566403938', 540, 1400 + 20 * (1 - a2), { family: 'num', weight: 800, size: 68, color: P.acc, alpha: a2, dir: 'ltr', maxWidth: 800 });
    };

    const T_TR = 0.8, N = 7;
    const drawSeg = (Y, i) => { const u = t - (segStart(i) - (i > 0 ? T_TR : 0)); if (i === 0) hook(Y, u); else if (i <= 4) question(Y, u, i - 1); else if (i === 5) recap(Y, u); else outro(Y, u); };
    let idx = 0; for (let i = 0; i < N; i++) if (t >= segStart(i)) idx = i;
    const nx = idx + 1, tr0 = nx < N ? segStart(nx) - T_TR : Infinity;
    if (t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
  },
});
