/* main — «11 إضافات مجانية من أنثروبيك». مشهد واحد يدير الفيلم كله بالتتابع:
   مقدمة (عدّاد 11) ← 11 مشهد إضافة (أيقونة تنرسم بخط اليد + اسم + سطر شرح) ← ختام (شبكة الأيقونات + أمر التركيب).
   الانتقالات: FX.slices (شرائح)، واللمعة FX.shine على الأيقونة. كل شي من t بس. */
const W = 1080, H = 1920;

/* ── مسارات SVG بسيطة (M/L/C فقط) ── */
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const ell = (cx, cy, rx, ry) => { const kx = 0.5523 * rx, ky = 0.5523 * ry; return `M${cx + rx} ${cy} C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry} C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy} C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry} C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}`; };

/* ── الأيقونات: كل ضربة [مسار، لون('i' حبر | 'a' تمييز)، تأخير] — مركزها (0,0) داخل مربع ~400 ── */
const ICONS = {
  marketing: [
    ['M-120 -40 L60 -140 L60 100 L-120 20 Z', 'i', 0], [rr(-175, -50, 55, 80, 14), 'i', 1], ['M-110 22 L-92 125 L-42 125 L-52 44', 'i', 2],
    ['M105 -70 C145 -30 145 10 105 50', 'a', 3], ['M140 -115 C210 -50 210 30 140 95', 'a', 4]],
  sales: [
    [rr(-150, 40, 70, 110, 12), 'i', 0], [rr(-35, -20, 70, 170, 12), 'i', 1], [rr(80, -90, 70, 240, 12), 'i', 2],
    ['M-175 -30 L-70 -115 L-10 -70 L115 -175', 'a', 3], ['M62 -178 L120 -175 L113 -118', 'a', 4]],
  finance: [
    [circ(0, 20, 125), 'a', 0], ['M45 -15 C45 -50 -45 -50 -45 -10 C-45 25 45 15 45 55 C45 95 -45 95 -45 62', 'i', 1], ['M0 -60 L0 -45', 'i', 2], ['M0 90 L0 105', 'i', 2],
    ['M-175 150 L175 150', 'i', 3]],
  data: [
    [ell(0, -105, 130, 42), 'a', 0], ['M-130 -105 L-130 105', 'i', 1], ['M130 -105 L130 105', 'i', 1], ['M-130 -10 C-130 30 130 30 130 -10', 'i', 2],
    ['M-130 105 C-130 145 130 145 130 105', 'i', 3], ['M-130 -10 C-130 -50 130 -50 130 -10', 'i', 2]],
  legal: [
    ['M0 -150 L0 140', 'i', 0], ['M-85 150 L85 150', 'i', 1], ['M-145 -90 L145 -90', 'i', 2],
    ['M-145 -90 L-195 25 M-145 -90 L-95 25', 'i', 3], ['M-205 25 C-195 80 -95 80 -85 25 Z', 'a', 4],
    ['M145 -90 L95 25 M145 -90 L195 25', 'i', 3], ['M85 25 C95 80 195 80 205 25 Z', 'a', 4], [circ(0, -150, 16), 'a', 5]],
  'customer-support': [
    ['M-135 25 C-135 -145 135 -145 135 25', 'i', 0], [rr(-165, 10, 52, 105, 20), 'i', 1], [rr(113, 10, 52, 105, 20), 'i', 1],
    ['M140 115 C140 165 85 170 30 158', 'i', 2], [rr(-62, -42, 124, 84, 28), 'a', 3], ['M-14 42 L-30 78 L12 42', 'a', 4]],
  productivity: [
    [rr(-150, -110, 300, 265, 32), 'i', 0], ['M-150 -40 L150 -40', 'i', 1], ['M-80 -145 L-80 -95', 'i', 1], ['M80 -145 L80 -95', 'i', 1],
    ['M-105 15 L-85 38 L-52 -2', 'a', 2], ['M-15 18 L105 18', 'i', 2], ['M-105 95 L-85 118 L-52 78', 'a', 3], ['M-15 98 L105 98', 'i', 3]],
  'product-management': [
    [rr(-175, -135, 105, 270, 18), 'i', 0], [rr(-52, -135, 105, 270, 18), 'i', 0], [rr(70, -135, 105, 270, 18), 'i', 0],
    [rr(-160, -105, 75, 50, 10), 'a', 1], [rr(-160, -35, 75, 50, 10), 'i', 2], [rr(-37, -105, 75, 50, 10), 'i', 2], [rr(83, -105, 75, 50, 10), 'i', 3], [rr(83, -35, 75, 50, 10), 'a', 4]],
  'enterprise-search': [
    [rr(-140, -155, 215, 280, 24), 'i', 0], ['M-95 -95 L35 -95', 'i', 1], ['M-95 -50 L35 -50', 'i', 1], ['M-95 -5 L-15 -5', 'i', 2],
    [circ(55, 55, 72), 'a', 3], ['M108 108 L170 170', 'a', 4]],
  'bio-research': 'dna',
  'cowork-plugin-management': [
    ['M-60 -165 L-60 -80', 'i', 0], ['M60 -165 L60 -80', 'i', 0], [rr(-115, -80, 230, 135, 36), 'i', 1], ['M0 55 C0 110 0 130 0 175', 'i', 2],
    ['M150 -120 L150 -70 M125 -95 L175 -95', 'a', 3], ['M-150 110 L-150 150 M-170 130 L-130 130', 'a', 4]],
};

const PLUGINS = [
  { id: 'marketing', ar: 'التسويق', en: 'Marketing', line: 'محتوى وحملات وتقارير أداء' },
  { id: 'sales', ar: 'المبيعات', en: 'Sales', line: 'تحضير المكالمات ومتابعة الصفقات' },
  { id: 'finance', ar: 'المالية', en: 'Finance', line: 'قيود وتسويات وإقفال الشهر' },
  { id: 'data', ar: 'البيانات', en: 'Data', line: 'استعلامات SQL ولوحات ورسوم' },
  { id: 'legal', ar: 'القانون', en: 'Legal', line: 'مراجعة العقود واتفاقيات السرية' },
  { id: 'customer-support', ar: 'دعم العملاء', en: 'Customer Support', line: 'فرز التذاكر وصياغة الردود' },
  { id: 'productivity', ar: 'الإنتاجية', en: 'Productivity', line: 'مهامك ويومك منظّم' },
  { id: 'product-management', ar: 'إدارة المنتج', en: 'Product Management', line: 'مواصفات وخرائط طريق' },
  { id: 'enterprise-search', ar: 'البحث المؤسسي', en: 'Enterprise Search', line: 'ابحث بكل أدواتك من مكان واحد' },
  { id: 'bio-research', ar: 'الأبحاث الحيوية', en: 'Bio Research', line: 'بحث علمي وتحليل جينات' },
  { id: 'cowork-plugin-management', ar: 'إدارة الإضافات', en: 'Plugin Management', line: 'أنشئ إضافاتك وخصّصها' },
];

/* ── توقيت الفيلم (ثواني) ── */
const T_INTRO = 4.2, T_EACH = 3.0, T_TRANS = 0.7;
const T_OUTRO = T_INTRO + T_EACH * PLUGINS.length;      // 37.2
const T_END = T_OUTRO + 5.5;                             // 42.7
const segStart = i => i === 0 ? 0 : (i <= PLUGINS.length ? T_INTRO + T_EACH * (i - 1) : T_OUTRO);   // 0 intro · 1..11 plugins · 12 outro

MOTION.scene({
  id: 'main', start: 0, end: T_END,
  draw(t, lt, ctx) {
    const { X, P, E, at, prog, FX } = ctx;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');

    const bgFill = Y => { Y.fillStyle = P.bg; Y.fillRect(0, 0, W, H); };
    const tile = (Y, cx, cy, s, k) => {      // لوحة خلف الأيقونة
      Y.save(); Y.translate(cx, cy); Y.scale(0.94 + 0.06 * k, 0.94 + 0.06 * k); Y.globalAlpha = k;
      Y.fillStyle = '#1A212B'; Y.strokeStyle = '#2B3543'; Y.lineWidth = 3;
      Y.fill(new Path2D(rr(-s / 2, -s / 2, s, s, 64))); Y.stroke(new Path2D(rr(-s / 2, -s / 2, s, s, 64))); Y.restore();
    };
    const dna = (Y, u, cx, cy, S, k) => {
      const s1 = [], s2 = [];
      for (let y = -170; y <= 170; y += 12) { const x = 78 * Math.sin(y * 0.033 + u * 1.3); s1.push([x, y]); s2.push([-x, y]); }
      Y.save(); Y.translate(cx, cy); Y.scale(S, S);
      for (let y = -150; y <= 150; y += 30) { const x = 78 * Math.sin(y * 0.033 + u * 1.3), kk = clamp((k * 1.4) - (y + 170) / 520, 0, 1); if (kk > 0) ctx.drawPath(Y, `M${-x} ${y} L${x} ${y}`, kk, { width: 9, color: P.acc, smooth: false }); }
      ctx.drawPath(Y, s1, k, { width: 15, color: P.ink }); ctx.drawPath(Y, s2, k, { width: 15, color: P.ink });
      Y.restore();
    };
    const icon = (Y, id, u, cx, cy, S) => {      // u = زمن محلي للمشهد
      const spec = ICONS[id], float = Math.sin(u * 1.6) * 6;
      if (spec === 'dna') { dna(Y, u, cx, cy + float, S, ease(u, 0.3, 1.4, 'cubicOut')); return; }
      Y.save(); Y.translate(cx, cy + float); Y.scale(S, S);
      spec.forEach(([d, c, dly]) => { const k = ease(u, 0.3 + dly * 0.14, 0.3 + dly * 0.14 + 0.55, 'cubicOut'); ctx.drawPath(Y, d, k, { width: 15, color: c === 'a' ? P.acc : P.ink }); });
      Y.restore();
    };

    /* ── المقدمة: عدّاد 11 ── */
    const intro = (Y, u) => {
      bgFill(Y);
      const n = Math.round(11 * ease(u, 0, 0.9, 'expoOut')), pop = ease(u, 0, 0.5, 'cubicOut');
      Y.save(); Y.translate(540, 760); Y.scale(0.93 + 0.07 * pop, 0.93 + 0.07 * pop); Y.translate(-540, -760);
      ctx.text(Y, String(n), 540, 860, { family: 'num', weight: 900, size: 600, color: P.acc, dir: 'ltr', alpha: 0.35 + 0.65 * pop });
      Y.restore();
      const a1 = ease(u, 0.7, 1.2), a2 = ease(u, 1.5, 2.0), a3 = ease(u, 2.2, 2.7);
      ctx.text(Y, 'إضافات مجانية', 540, 1150 + 40 * (1 - a1), { family: 'display', size: 170, color: P.ink, alpha: a1, maxWidth: 780 });
      ctx.drawPath(Y, [[260, 1215], [540, 1228], [820, 1212]], ease(u, 1.2, 1.8, 'cubicInOut'), { width: 14, color: P.acc });
      ctx.text(Y, 'من Anthropic', 540, 1345 + 30 * (1 - a2), { family: 'display', size: 100, color: P.mut, alpha: a2, maxWidth: 780 });
      ctx.text(Y, 'لكل فريق عمل عندك', 540, 1455 + 24 * (1 - a3), { family: 'body', weight: 700, size: 58, color: P.acc, alpha: a3, maxWidth: 780 });
    };

    /* ── مشهد إضافة ── */
    const plug = (Y, u, i) => {
      const p = PLUGINS[i];
      bgFill(Y);
      const num = String(i + 1).padStart(2, '0');
      const a0 = ease(u, 0.1, 0.5);
      ctx.text(Y, num, 540, 262, { family: 'num', weight: 800, size: 70, color: P.ink, dir: 'ltr', alpha: a0 });
      for (let j = 0; j < 11; j++) { const x = 540 - 5 * 46 + j * 46; Y.fillStyle = j <= i ? P.acc : '#2B3543'; Y.globalAlpha = a0; Y.fillRect(x - 15, 300, 30, 8); }
      Y.globalAlpha = 1;
      const tk = ease(u, 0.05, 0.55, 'cubicOut');
      tile(Y, 540, 760, 640, tk);
      FX.shine(ctx, t, { s: segStart(i + 1) + 1.1, period: 1.9, draw: Z => icon(Z, p.id, u, 540, 760, 1.05) });
      const nk = ease(u, 0.5, 1.0), ek = ease(u, 0.8, 1.3), lk = ease(u, 1.05, 1.55);
      ctx.text(Y, p.ar, 540, 1198 + 44 * (1 - nk), { family: 'display', size: 190, color: P.ink, alpha: nk, maxWidth: 820 });
      ctx.text(Y, p.en.toUpperCase(), 540, 1322, { family: 'num', weight: 700, size: 40, color: P.acc, alpha: ek, dir: 'ltr', letterSpacing: 8, maxWidth: 820 });
      ctx.text(Y, p.line, 540, 1415 + 28 * (1 - lk), { family: 'body', weight: 700, size: 54, color: P.ink, alpha: lk * 0.9, maxWidth: 800 });
    };

    /* ── الختام: شبكة الأيقونات + أمر التركيب ── */
    const outro = (Y, u) => {
      bgFill(Y);
      const a0 = ease(u, 0.1, 0.6);
      ctx.text(Y, 'ركّبها على Claude', 540, 330 + 30 * (1 - a0), { family: 'display', size: 128, color: P.ink, alpha: a0, maxWidth: 880 });
      const cols = 4, size = 188, gap = 36, x0 = 540 - (cols * size + (cols - 1) * gap) / 2, y0 = 480;
      PLUGINS.forEach((p, i) => {
        const r = Math.floor(i / cols), c = i % cols, rowN = r === 2 ? 3 : cols, off = r === 2 ? (cols - 3) * (size + gap) / 2 : 0;
        const cx = x0 + off + c * (size + gap) + size / 2, cy = y0 + r * (size + gap) + size / 2, k = ease(u, 0.5 + i * 0.09, 1.0 + i * 0.09, 'cubicOut');
        if (k <= 0) return;
        Y.save(); Y.translate(cx, cy); Y.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); Y.globalAlpha = k;
        Y.fillStyle = '#1A212B'; Y.strokeStyle = '#2B3543'; Y.lineWidth = 3; Y.fill(new Path2D(rr(-size / 2, -size / 2, size, size, 40))); Y.stroke(new Path2D(rr(-size / 2, -size / 2, size, size, 40)));
        Y.restore();
        Y.save(); Y.globalAlpha = k;
        if (ICONS[p.id] === 'dna') dna(Y, 99, cx, cy, 0.4, 1);
        else { Y.translate(cx, cy); Y.scale(0.4, 0.4); ICONS[p.id].forEach(([d, c2]) => ctx.drawPath(Y, d, 1, { width: 17, color: c2 === 'a' ? P.acc : P.ink })); }
        Y.restore();
        const ck = ease(u, 1.2 + i * 0.09, 1.5 + i * 0.09, 'backOut');
        if (ck > 0) { Y.save(); Y.translate(cx + size / 2 - 18, cy - size / 2 + 18); Y.scale(ck, ck); Y.fillStyle = P.acc; Y.beginPath(); Y.arc(0, 0, 22, 0, 6.2832); Y.fill();
          ctx.drawPath(Y, [[-9, 1], [-2, 8], [10, -7]], ease(u, 1.3 + i * 0.09, 1.55 + i * 0.09, 'cubicOut'), { width: 5, color: P.onAcc, smooth: false }); Y.restore(); }
      });
      const bk = ease(u, 2.4, 3.0, 'cubicOut');
      Y.save(); Y.globalAlpha = bk; Y.translate(0, 28 * (1 - bk));
      Y.fillStyle = '#1A212B'; Y.strokeStyle = P.acc; Y.lineWidth = 4; const bx = 90, by = 1235, bw = 900, bh = 215;
      Y.fill(new Path2D(rr(bx, by, bw, bh, 36))); Y.stroke(new Path2D(rr(bx, by, bw, bh, 36)));
      ctx.text(Y, '/plugin marketplace add', 540, by + 88, { family: 'num', weight: 700, size: 54, color: P.acc, dir: 'ltr', maxWidth: 840 });
      ctx.text(Y, 'anthropics/knowledge-work-plugins', 540, by + 168, { family: 'num', weight: 600, size: 40, color: P.ink, dir: 'ltr', maxWidth: 840 });
      Y.restore();
      const ck2 = ease(u, 3.1, 3.7);
      ctx.text(Y, 'مجانًا من المستودع الرسمي', 540, 1495 + 20 * (1 - ck2), { family: 'body', weight: 700, size: 46, color: P.mut, alpha: ck2, maxWidth: 800 });
    };

    /* ── المُجدول: مشهد حالي + شرائح للتالي ── */
    const drawSeg = (Y, idx, tt) => {
      const u = tt - (segStart(idx) - (idx > 0 ? T_TRANS : 0));   // ساعة المشهد تبدأ من بداية انتقاله، فما فيه قفزة
      if (idx === 0) intro(Y, u); else if (idx <= PLUGINS.length) plug(Y, u, idx - 1); else outro(Y, u);
    };
    let idx = 0; const nSeg = PLUGINS.length + 2;
    for (let i = 0; i < nSeg; i++) if (t >= segStart(i)) idx = i;
    const nextIdx = idx + 1;
    const tr0 = nextIdx < nSeg ? segStart(nextIdx) - T_TRANS : Infinity;
    if (t >= tr0) {
      FX.slices(ctx, t, { s: tr0, dur: T_TRANS, count: 7, soft: 0.45, A: Y => drawSeg(Y, idx, t), B: Y => drawSeg(Y, nextIdx, t) });
    } else drawSeg(X, idx, t);
  },
});
