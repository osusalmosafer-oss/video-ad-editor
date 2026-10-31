/* أسس المسافر — فيديو تعريفي صامت. هوية: كحلي #1F2449 · أبيض · أزرق #2884FF · خط Cairo.
   هوك سؤال ← 4 مزايا (قرب · إطلالة · أمتعة · حجز) ← ختام بالشعار والحساب. إيقاع هادئ (pace calm). كل شي من t بس. */
const W = 1080, H = 1920;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

/* أيقونات: [مسار، 'i' أبيض | 'a' أزرق، تأخير] — مركزها (0,0) */
const ICONS = {
  near: [   // فندق (يسار) + كعبة (يمين) + طريق قصير بينهم
    [rr(-190, -120, 110, 230, 10), 'i', 0], ['M-165 -85 L-145 -85 M-125 -85 L-105 -85 M-165 -40 L-145 -40 M-125 -40 L-105 -40 M-165 5 L-145 5 M-125 5 L-105 5', 'i', 1],
    [rr(40, -50, 150, 160, 8), 'i', 2], ['M40 -5 L190 -5', 'a', 3], ['M115 -50 L115 -5', 'a', 3],
    ['M-60 150 C-10 90 50 90 100 150', 'a', 4], ['M-190 150 L190 150', 'i', 5]],
  view: [   // نافذة تطل على الكعبة
    [rr(-150, -170, 300, 340, 28), 'i', 0], ['M0 -170 L0 170', 'i', 1], ['M-150 0 L150 0', 'i', 1],
    [rr(-120, 20, 100, 105, 6), 'a', 2], ['M-120 52 L-20 52', 'a', 3], ['M70 -100 C90 -130 120 -130 125 -100', 'i', 3]],
  bag: [    // حقيبة + صح
    ['M-55 -75 L-55 -125 C-55 -135 -45 -140 -35 -140 L35 -140 C45 -140 55 -135 55 -125 L55 -75', 'i', 0],
    [rr(-130, -75, 260, 200, 34), 'i', 1], ['M-60 -75 L-60 125', 'i', 2], ['M60 -75 L60 125', 'i', 2],
    ['M-35 25 L-5 55 L50 -10', 'a', 3], ['M-85 160 L-85 175', 'i', 4], ['M85 160 L85 175', 'i', 4]],
  chat: [   // واتساب: فقاعة + نقاط
    [rr(-150, -130, 300, 220, 50), 'i', 0], ['M-70 90 L-95 150 L-20 90', 'i', 1],
    [circ(-60, -20, 4), 'a', 2], [circ(0, -20, 4), 'a', 2], [circ(60, -20, 4), 'a', 2], ['M-60 30 C-20 55 20 55 60 30', 'a', 3]],
};

const FEATURES = [
  { icon: 'near', title: 'قريب من الحرم', sub: 'تصل وتصلي بدون مشقة' },
  { icon: 'view', title: 'إطلالة على الكعبة', sub: 'في فنادق مختارة' },
  { icon: 'bag', title: 'حفظ الأمتعة مجاني', sub: 'ارتح قبل الدخول وبعد الخروج' },
  { icon: 'chat', title: 'احجز بالواتساب', sub: 'أو من الرابط في البيو' },
];

const T_HOOK = 3.8, T_EACH = 3.1, T_TR = 1.0;
const T_OUT = T_HOOK + T_EACH * FEATURES.length;   // 16.2
const T_END = T_OUT + 5.3;                          // 21.5
const segStart = i => i === 0 ? 0 : (i <= FEATURES.length ? T_HOOK + T_EACH * (i - 1) : T_OUT);

MOTION.scene({
  id: 'main', start: 0, end: T_END,
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');
    const bg = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };
    const panel = (Y, cx, cy, s, k) => {
      Y.save(); Y.translate(cx, cy); Y.scale(0.95 + 0.05 * k, 0.95 + 0.05 * k); Y.globalAlpha = k;
      Y.fillStyle = 'rgba(255,255,255,0.06)'; Y.strokeStyle = 'rgba(255,255,255,0.18)'; Y.lineWidth = 3;
      const p = new Path2D(rr(-s / 2, -s / 2, s, s, 64)); Y.fill(p); Y.stroke(p); Y.restore();
    };
    const icon = (Y, id, u, cx, cy, S) => {
      const float = Math.sin(u * 1.2) * 5;
      Y.save(); Y.translate(cx, cy + float); Y.scale(S, S);
      ICONS[id].forEach(([d, c, dly]) => { const k = ease(u, 0.35 + dly * 0.14, 0.35 + dly * 0.14 + 0.6, 'cubicOut'); ctx.drawPath(Y, d, k, { width: 14, color: c === 'a' ? P.acc : P.ink }); });
      Y.restore();
    };
    const logoImg = () => ctx.img('logo');

    /* هوك: سؤال */
    const hook = (Y, u) => {
      bg(Y);
      FX.highlight(ctx, t, { text: 'تبي فندقك في مكة قريب من الحرم؟', s: 0.15 + (t - u), mark: 4, y: 880, size: 128, markColor: 'rgba(40,132,255,0.85)', color: P.ink });
      const k = ease(u, 0, 0.6, 'cubicOut');
      if (logoImg()) { const im = logoImg(), w = 260, h = w * im.height / im.width; Y.save(); Y.globalAlpha = 0.5 + 0.5 * k; Y.drawImage(im, 540 - w / 2, 330, w, h); Y.restore(); }
    };

    /* ميزة */
    const feat = (Y, u, i) => {
      const f = FEATURES[i];
      bg(Y);
      const a0 = ease(u, 0.2, 0.7);
      for (let j = 0; j < FEATURES.length; j++) { Y.fillStyle = j <= i ? P.acc : 'rgba(255,255,255,0.2)'; Y.globalAlpha = a0; Y.fillRect(540 - 2 * 62 + j * 62 - 22, 270, 44, 8); }
      Y.globalAlpha = 1;
      panel(Y, 540, 760, 620, ease(u, 0.1, 0.7, 'cubicOut'));
      icon(Y, f.icon, u, 540, 760, 1.0);
      const nk = ease(u, 0.6, 1.2), sk = ease(u, 0.95, 1.5);
      ctx.text(Y, f.title, 540, 1215 + 40 * (1 - nk), { family: 'display', weight: 900, size: 96, color: P.ink, alpha: nk, maxWidth: 800 });
      ctx.text(Y, f.sub, 540, 1330 + 24 * (1 - sk), { family: 'body', weight: 500, size: 54, color: P.mut, alpha: sk, maxWidth: 800 });
    };

    /* ختام */
    const outro = (Y, u) => {
      bg(Y);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (logoImg()) { const im = logoImg(), w = 560, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 330 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3), a3 = ease(u, 2.3, 2.9);
      ctx.text(Y, 'حجوزات فنادق المعتمرين في مكة', 540, 1245 + 30 * (1 - a1), { family: 'display', weight: 900, size: 54, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1290], [540, 1298], [750, 1288]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      ctx.text(Y, 'الرابط في البيو  ·  أو راسلنا واتساب', 540, 1385 + 24 * (1 - a2), { family: 'body', weight: 700, size: 44, color: P.ink, alpha: a2, maxWidth: 800 });
      ctx.text(Y, '@osusalmosafer', 540, 1475 + 20 * (1 - a3), { family: 'body', weight: 700, size: 50, color: P.acc, alpha: a3, dir: 'ltr', maxWidth: 800 });
    };

    const nSeg = FEATURES.length + 2;
    const clock = (idx) => segStart(idx) - (idx > 0 ? T_TR : 0);
    const drawSeg = (Y, idx) => { const u = t - clock(idx); if (idx === 0) hook(Y, u); else if (idx <= FEATURES.length) feat(Y, u, idx - 1); else outro(Y, u); };
    let idx = 0; for (let i = 0; i < nSeg; i++) if (t >= segStart(i)) idx = i;
    const nx = idx + 1, tr0 = nx < nSeg ? segStart(nx) - T_TR : Infinity;
    if (t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
  },
});
