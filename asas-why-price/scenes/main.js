/* «ليش السعر يختلف من فترة لفترة؟» — أسس المسافر. موشن جرافيك خالص.
   هوك (بطاقة سعر) ← السبب: تاريخ الوصول ← 3 فترات (موسم العمرة · الإجازات · وسط الأسبوع) بمؤشر «مستوى السعر عادةً»
   ← منحنى يجمعها ← النصيحة (تاريخك + عدد الأشخاص + نوع الغرفة) ← ختام. بلا أي رقم ريال. كل شي من t بس. */
const W = 1080, H = 1920;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

const ICONS = {
  tag: [['M-150 -60 L30 -60 L150 40 L30 140 L-150 140 Z', 'i', 0], [circ(-95, 40, 20), 'a', 1], ['M-60 40 L60 40', 'a', 2]],
  cal: [[rr(-150, -120, 300, 270, 32), 'i', 0], ['M-150 -50 L150 -50', 'i', 1], ['M-80 -150 L-80 -100', 'i', 1], ['M80 -150 L80 -100', 'i', 1],
        [rr(-100, 0, 60, 60, 10), 'a', 2], ['M-10 30 L110 30', 'i', 2], ['M-100 100 L110 100', 'i', 3]],
  kaaba: [[rr(-100, -90, 200, 200, 10), 'i', 0], ['M-100 -30 L100 -30', 'a', 1], ['M-15 -30 L-15 40 L40 40 L40 -30', 'a', 2], ['M-170 150 L170 150', 'i', 3]],
  bag: [['M-55 -75 L-55 -125 C-55 -135 -45 -140 -35 -140 L35 -140 C45 -140 55 -135 55 -125 L55 -75', 'i', 0], [rr(-130, -75, 260, 200, 34), 'i', 1],
        ['M-60 -75 L-60 125', 'i', 2], ['M60 -75 L60 125', 'i', 2], ['M-30 25 L0 55 L50 -10', 'a', 3]],
  week: [[rr(-170, -90, 340, 200, 26), 'i', 0], ['M-170 -30 L170 -30', 'i', 1], ['M-100 -120 L-100 -70', 'i', 1], ['M100 -120 L100 -70', 'i', 1],
         [rr(-60, 10, 60, 60, 10), 'a', 2], [rr(10, 10, 60, 60, 10), 'a', 2], [rr(-130, 10, 60, 60, 10), 'i', 3], [rr(80, 10, 60, 60, 10), 'i', 3]],
};
const PERIODS = [
  { icon: 'kaaba', name: 'موسم العمرة', level: 0.86 },
  { icon: 'bag', name: 'الإجازات', level: 0.8 },
  { icon: 'week', name: 'وسط الأسبوع', level: 0.22 },
];
// seg: hook, why, p0, p1, p2, chart, tip, cta
const DUR = [3.6, 3.6, 4.2, 4.2, 4.2, 4.6, 4.2, 5];
const START = DUR.reduce((a, d, i) => (a.push(i ? a[i - 1] + DUR[i - 1] : 0), a), []);
const T_TR = 0.8;

MOTION.scene({
  id: 'main', start: 0, end: 33.6,
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const cfg = (ctx.project && ctx.project.p) || {};
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');
    const bg = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };
    const panel = (Y, cx, cy, s, k) => { Y.save(); Y.translate(cx, cy); Y.scale(0.95 + 0.05 * k, 0.95 + 0.05 * k); Y.globalAlpha = k; Y.fillStyle = 'rgba(255,255,255,0.06)'; Y.strokeStyle = 'rgba(255,255,255,0.18)'; Y.lineWidth = 3; const p = new Path2D(rr(-s / 2, -s / 2, s, s, 64)); Y.fill(p); Y.stroke(p); Y.restore(); };
    const icon = (Y, id, u, cx, cy, S, rot, minK) => { const fl = Math.sin(u * 1.3) * 5; Y.save(); Y.translate(cx, cy + fl); if (rot) Y.rotate(rot); Y.scale(S, S); ICONS[id].forEach(([d, c, dl]) => ctx.drawPath(Y, d, Math.max(minK || 0, ease(u, 0.3 + dl * 0.14, 0.3 + dl * 0.14 + 0.6, 'cubicOut')), { width: 14, color: c === 'a' ? P.acc : P.ink })); Y.restore(); };
    const T = (Y, s, x, y, o) => ctx.text(Y, s, x, y, o);

    /* 1) هوك */
    const hook = (Y, u) => {
      bg(Y);
      panel(Y, 540, 640, 560, Math.max(0.5, ease(u, 0, 0.5, 'cubicOut')));
      icon(Y, 'tag', u, 540, 640, 1.0, Math.sin(u * 2.2) * 0.12, 0.25);
      const a1 = ease(u, 0.2, 0.8), a2 = ease(u, 1.0, 1.6);
      T(Y, 'ليش السعر يختلف', 540, 1110 + 36 * (1 - a1), { family: 'display', weight: 900, size: 96, color: P.ink, alpha: a1, maxWidth: 780 });
      T(Y, 'من فترة لفترة؟', 540, 1225 + 36 * (1 - a2), { family: 'display', weight: 900, size: 96, color: P.acc, alpha: a2, maxWidth: 780 });
    };

    /* 2) السبب: تاريخ الوصول */
    const why = (Y, u) => {
      bg(Y);
      panel(Y, 540, 640, 560, ease(u, 0.05, 0.6, 'cubicOut'));
      icon(Y, 'cal', u, 540, 640, 1.0);
      const a1 = ease(u, 0.6, 1.2), a2 = ease(u, 0.9, 1.5);
      T(Y, 'السبب الأول', 540, 1090 + 30 * (1 - a1), { family: 'body', weight: 700, size: 54, color: P.mut, alpha: a1, maxWidth: 780 });
      T(Y, 'تاريخ الوصول', 540, 1220 + 36 * (1 - a2), { family: 'display', weight: 900, size: 112, color: P.ink, alpha: a2, maxWidth: 780 });
    };

    /* 3-5) فترة + مؤشر مستوى السعر عادةً */
    const period = (Y, u, i) => {
      const p = PERIODS[i]; bg(Y);
      const a0 = ease(u, 0.1, 0.6);
      for (let j = 0; j < 3; j++) { Y.fillStyle = j === i ? P.acc : 'rgba(255,255,255,0.2)'; Y.globalAlpha = a0; Y.fillRect(540 - 70 + j * 70 - 27, 290, 54, 8); } Y.globalAlpha = 1;
      panel(Y, 540, 640, 520, ease(u, 0.05, 0.6, 'cubicOut'));
      icon(Y, p.icon, u, 540, 640, 0.95);
      const k1 = ease(u, 0.5, 1.1);
      T(Y, p.name, 540, 1090 + 36 * (1 - k1), { family: 'display', weight: 900, size: 104, color: P.ink, alpha: k1, maxWidth: 780 });
      // المؤشر
      const k2 = ease(u, 1.0, 1.6), x0 = 240, x1 = 840, y = 1330, m = ease(u, 1.4, 2.6, 'cubicInOut');
      T(Y, 'مستوى السعر عادةً', 540, 1250, { family: 'body', weight: 700, size: 42, color: P.mut, alpha: k2, maxWidth: 780 });
      Y.save(); Y.globalAlpha = k2; Y.strokeStyle = 'rgba(255,255,255,0.25)'; Y.lineWidth = 16; Y.lineCap = 'round'; Y.beginPath(); Y.moveTo(x0, y); Y.lineTo(x1, y); Y.stroke(); Y.restore();
      const pos = x0 + (x1 - x0) * (0.5 + (p.level - 0.5) * m);
      Y.save(); Y.globalAlpha = k2; Y.strokeStyle = P.acc; Y.lineWidth = 16; Y.lineCap = 'round'; Y.beginPath(); Y.moveTo(x0, y); Y.lineTo(pos, y); Y.stroke(); Y.fillStyle = P.ink; Y.beginPath(); Y.arc(pos, y, 24, 0, 6.2832); Y.fill(); Y.restore();
      T(Y, 'أقل', x0, y + 85, { family: 'body', weight: 700, size: 38, color: P.mut, alpha: k2, maxWidth: 200 });
      T(Y, 'أعلى', x1, y + 85, { family: 'body', weight: 700, size: 38, color: P.mut, alpha: k2, maxWidth: 200 });
    };

    /* 6) منحنى يجمع الفترات (توضيحي) */
    const chart = (Y, u) => {
      bg(Y);
      T(Y, 'السعر يتغير مع التاريخ', 540, 330, { family: 'display', weight: 900, size: 84, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 800 });
      const base = 1260;
      Y.save(); Y.globalAlpha = ease(u, 0.2, 0.7); Y.strokeStyle = 'rgba(255,255,255,0.3)'; Y.lineWidth = 5; Y.beginPath(); Y.moveTo(110, base); Y.lineTo(960, base); Y.stroke(); Y.restore();
      const pts = [[130, 900], [250, 640], [390, 700], [540, 660], [690, 820], [830, 1010], [940, 990]];
      const k = ease(u, 0.5, 2.6, 'cubicInOut');
      ctx.drawPath(Y, pts, k, { width: 14, color: P.acc, tip: { r: 17, color: P.ink } });
      const marks = [[250, 640, 0.9], [540, 660, 1.5], [830, 1010, 2.2]];
      PERIODS.forEach((p, i) => {
        const [x, y, tt] = marks[i], mk = ease(u, tt, tt + 0.4, 'cubicOut'); if (mk <= 0) return;
        Y.save(); Y.globalAlpha = mk; Y.fillStyle = P.ink; Y.beginPath(); Y.arc(x, y, 16, 0, 6.2832); Y.fill(); Y.setLineDash([8, 10]); Y.strokeStyle = 'rgba(255,255,255,0.35)'; Y.lineWidth = 3; Y.beginPath(); Y.moveTo(x, y + 20); Y.lineTo(x, base); Y.stroke(); Y.restore();
        T(Y, p.name, x, base + 70, { family: 'body', weight: 700, size: 38, color: P.ink, alpha: mk, maxWidth: 240 });
      });
      T(Y, 'الشكل توضيحي', 540, 1450, { family: 'body', weight: 500, size: 36, color: P.mut, alpha: ease(u, 2.6, 3.2), maxWidth: 780 });
    };

    /* 7) النصيحة */
    const tip = (Y, u) => {
      bg(Y);
      const a0 = ease(u, 0.1, 0.7);
      T(Y, 'عشان تعرف سعرك', 540, 330 + 30 * (1 - a0), { family: 'display', weight: 900, size: 92, color: P.ink, alpha: a0, maxWidth: 800 });
      T(Y, 'راسلنا بـ:', 540, 440, { family: 'body', weight: 700, size: 56, color: P.mut, alpha: ease(u, 0.5, 1.0), maxWidth: 780 });
      ['تاريخ وصولك', 'عدد الأشخاص', 'نوع الغرفة'].forEach((s, i) => {
        const T0 = 0.9 + i * 0.5, y = 700 + i * 190, x = 880, R = 44;
        const k = ease(u, T0, T0 + 0.3, 'backOut'), ck = ease(u, T0 + 0.1, T0 + 0.45, 'cubicOut'), tx = ease(u, T0 + 0.05, T0 + 0.5);
        Y.save(); Y.strokeStyle = P.mut; Y.lineWidth = 6; Y.globalAlpha = ease(u, 0.6, 1.0); Y.beginPath(); Y.arc(x, y, R, 0, 6.2832); Y.stroke(); Y.restore();
        if (k > 0.02) { Y.save(); Y.translate(x, y); Y.scale(k, k); Y.fillStyle = P.acc; Y.beginPath(); Y.arc(0, 0, R + 2, 0, 6.2832); Y.fill(); Y.restore(); if (ck > 0) ctx.drawPath(Y, [[x - 19, y + 2], [x - 5, y + 16], [x + 20, y - 14]], ck, { width: 9, color: P.onAcc, smooth: false }); }
        T(Y, s, x - 80 + 40 * (1 - tx), y + 22, { family: 'body', weight: 700, size: 66, align: 'right', color: P.ink, alpha: tx, maxWidth: 700 });
      });
    };

    /* 8) ختام */
    const outro = (Y, u) => {
      bg(Y);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (ctx.img('logo')) { const im = ctx.img('logo'), w = 520, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 300 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3);
      T(Y, 'الرابط في البايو', 540, 1230 + 30 * (1 - a1), { family: 'display', weight: 900, size: 80, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1280], [540, 1288], [750, 1278]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      T(Y, cfg.phone || '+966566403938', 540, 1400 + 20 * (1 - a2), { family: 'num', weight: 800, size: 68, color: P.acc, alpha: a2, dir: 'ltr', maxWidth: 800 });
    };

    const N = DUR.length;
    const drawSeg = (Y, i) => { const u = t - (START[i] - (i > 0 ? T_TR : 0)); if (i === 0) hook(Y, u); else if (i === 1) why(Y, u); else if (i <= 4) period(Y, u, i - 2); else if (i === 5) chart(Y, u); else if (i === 6) tip(Y, u); else outro(Y, u); };
    let idx = 0; for (let i = 0; i < N; i++) if (t >= START[i]) idx = i;
    const nx = idx + 1, tr0 = nx < N ? START[nx] - T_TR : Infinity;
    if (t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
  },
});
