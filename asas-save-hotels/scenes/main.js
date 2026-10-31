/* «وفّر 20–30% على فنادق مكة الفخمة» — أسس المسافر.
   save.mode = 'motion' : موشن جرافيك خالص (أفق مدينة مرسوم).
   save.mode = 'footage': نفس الرسوم، لكن بعض المشاهد فيها لقطات المالك داخل بطاقة (تُركَّب بـ compose.py: هنا الخلفية سوداء فتُمرَّر بالمفتاح).
   كل شي من t بس. الهوية: كحلي/أبيض/أزرق + Cairo. */
const W = 1080, H = 1920;
const rr = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y}`;
const circ = (cx, cy, r) => { const k = 0.5523 * r; return `M${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}`; };

MOTION.scene({
  id: 'main', start: 0, end: 25,
  draw(t, lt, ctx) {
    const { X, P, at, FX } = ctx;
    const cfg = (ctx.project && ctx.project.save) || {};
    const footage = cfg.mode === 'footage';
    const lo = cfg.min || 20, hi = cfg.max || 30;
    const ease = (a, b, c, e) => at(a, b, c, e || 'expoOut');

    /* قائمة المشاهد. f = مشهد فيه لقطة (بطاقة) بنسخة الفيديو */
    const segs = footage
      ? [{ n: 'hook', d: 4, f: 1 }, { n: 'where', d: 4.5, f: 1 }, { n: 'bars', d: 6.5 }, { n: 'pct', d: 5 }, { n: 'sofa', d: 3, f: 1 }, { n: 'cta', d: 5 }]
      : [{ n: 'hook', d: 4 }, { n: 'where', d: 4.5 }, { n: 'bars', d: 6.5 }, { n: 'pct', d: 5 }, { n: 'cta', d: 5 }];
    let a0 = 0; segs.forEach(s => { s.s = a0; a0 += s.d; });
    const T_TR = footage ? 0 : 0.9;

    const baseBg = (Y, hasCard) => { Y.fillStyle = hasCard ? '#000' : P.bg; Y.fillRect(0, 0, W, H); };

    /* أفق مكة مرسوم (موشن): برج الساعة + كتل جبل عمر + مكعب الكعبة، خط أبيض خفيف */
    const skyline = (Y, u, y0, alpha) => {
      Y.save(); Y.globalAlpha = alpha;
      const L = (d, k, c, w) => ctx.drawPath(Y, d, k, { width: w || 8, color: c || 'rgba(255,255,255,0.5)' });
      const k = i => ease(u, 0.1 + i * 0.12, 0.9 + i * 0.12, 'cubicOut');
      // كتل جبل عمر (يسار)
      L(`M80 ${y0} L80 ${y0 - 170} L190 ${y0 - 170} L190 ${y0 - 250} L300 ${y0 - 250} L300 ${y0}`, k(0));
      L(`M300 ${y0} L300 ${y0 - 120} L400 ${y0 - 120} L400 ${y0}`, k(1));
      // برج الساعة (وسط)
      L(`M470 ${y0} L470 ${y0 - 330} L520 ${y0 - 330} L520 ${y0 - 440} L560 ${y0 - 440} L560 ${y0 - 560} L560 ${y0 - 640}`, k(2), P.ink, 9);
      L(`M650 ${y0} L650 ${y0 - 330} L600 ${y0 - 330} L600 ${y0 - 440} L560 ${y0 - 440}`, k(2), P.ink, 9);
      L(circ(560, y0 - 380, 34), k(3), P.acc, 8);
      L(`M560 ${y0 - 640} L560 ${y0 - 700}`, k(3), P.acc, 8);
      // كتل يمين + كعبة
      L(`M650 ${y0} L650 ${y0 - 200} L760 ${y0 - 200} L760 ${y0 - 140} L850 ${y0 - 140} L850 ${y0}`, k(4));
      L(rr(870, y0 - 75, 75, 75, 4), k(5), P.ink, 8);
      L(`M870 ${y0 - 52} L945 ${y0 - 52}`, k(5), P.acc, 6);
      L(`M40 ${y0} L1040 ${y0}`, k(0), 'rgba(255,255,255,0.35)', 6);
      Y.restore();
    };

    const sampleNote = null;

    /* ── 1) هوك ── */
    const hook = (Y, u) => {
      baseBg(Y, footage);
      const a1 = ease(u, 0.1, 0.7), a2 = ease(u, 1.0, 1.6);
      if (footage) {
        ctx.text(Y, 'جاي مكة؟', 540, 290 + 30 * (1 - a1), { family: 'display', weight: 900, size: 130, color: P.ink, alpha: a1, maxWidth: 820 });
        ctx.text(Y, 'والفنادق الفخمة سعرها غالي؟', 540, 1450 + 24 * (1 - a2), { family: 'display', weight: 900, size: 62, color: P.acc, alpha: a2, maxWidth: 820 });
      } else {
        skyline(Y, u, 1400, 1);
        ctx.text(Y, 'جاي مكة؟', 540, 400 + 40 * (1 - a1), { family: 'display', weight: 900, size: 160, color: P.ink, alpha: a1, maxWidth: 820 });
        ctx.text(Y, 'والفنادق الفخمة سعرها غالي؟', 540, 540 + 30 * (1 - a2), { family: 'display', weight: 900, size: 72, color: P.acc, alpha: a2, maxWidth: 820 });
      }
    };

    /* ── 2) وين: جبل عمر · أبراج الساعة · غيرها ── */
    const where = (Y, u) => {
      baseBg(Y, footage);
      const items = ['جبل عمر', 'أبراج الساعة', 'وغيرها'];
      if (footage) ctx.text(Y, 'فنادق الحرم الفخمة', 540, 290, { family: 'display', weight: 900, size: 100, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 820 });
      else { skyline(Y, u, 1400, 0.9); ctx.text(Y, 'فنادق الحرم الفخمة', 540, 380, { family: 'display', weight: 900, size: 110, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 820 }); }
      const y = footage ? 1440 : 560, sz = footage ? 44 : 56;
      const w0 = [260, 330, 230], gap = 22, total = w0.reduce((p, c) => p + c, 0) + gap * 2; let x = 540 + total / 2;
      items.forEach((it, i) => {
        const k = ease(u, 0.6 + i * 0.25, 1.1 + i * 0.25, 'cubicOut'), w = w0[i]; x -= w;
        Y.save(); Y.globalAlpha = k; Y.translate(0, 24 * (1 - k));
        Y.fillStyle = i === 2 ? 'rgba(255,255,255,0.08)' : P.acc; const p = new Path2D(rr(x, y - 58, w, 84, 42)); Y.fill(p);
        ctx.text(Y, it, x + w / 2, y + 2, { family: 'body', weight: 700, size: sz, color: P.ink, maxWidth: w - 24 });
        Y.restore(); x -= gap;
      });
    };

    /* ── 3) مقارنة الأعمدة (توضيحية بلا أرقام ريال) ── */
    const bars = (Y, u) => {
      baseBg(Y, false);
      const base = 1280, H100 = 560, ratio = (100 - (lo + hi) / 2) / 100;   // عمود أسس عند منتصف المجال
      ctx.text(Y, 'قارن السعر', 540, 330, { family: 'display', weight: 900, size: 110, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 820 });
      const kL = ease(u, 0.5, 1.4, 'cubicOut'), kR = ease(u, 1.6, 2.5, 'cubicOut');
      // العمود المرجعي
      Y.fillStyle = 'rgba(255,255,255,0.16)'; Y.fill(new Path2D(rr(150, base - H100 * kL, 250, H100 * kL, 24)));
      ctx.text(Y, 'المواقع العالمية', 275, base + 70, { family: 'body', weight: 700, size: 40, color: P.ink, alpha: kL, maxWidth: 330 });
      ctx.text(Y, 'أو الفندق نفسه', 275, base + 122, { family: 'body', weight: 700, size: 40, color: P.mut, alpha: kL, maxWidth: 330 });
      // عمود أسس: ينزل من مستوى المرجع إلى مستواه
      const hR = H100 * (1 - (1 - ratio) * ease(u, 2.6, 3.6, 'cubicInOut')) * kR;
      Y.fillStyle = P.acc; Y.fill(new Path2D(rr(620, base - hR, 250, hR, 24)));
      ctx.text(Y, 'أسس المسافر', 745, base + 70, { family: 'body', weight: 700, size: 40, color: P.acc, alpha: kR, maxWidth: 330 });
      // خط المرجع المتقطع + قوس التوفير
      const sv = ease(u, 3.5, 4.3, 'cubicOut');
      if (sv > 0) {
        Y.save(); Y.globalAlpha = sv; Y.strokeStyle = P.ink; Y.lineWidth = 4; Y.setLineDash([14, 12]); Y.beginPath(); Y.moveTo(420, base - H100); Y.lineTo(870, base - H100); Y.stroke(); Y.restore();
        ctx.text(Y, 'وفّر', 745, base - H100 - 120 + 20 * (1 - sv), { family: 'display', weight: 900, size: 84, color: P.ink, alpha: sv, maxWidth: 330 });
        ctx.drawPath(Y, [[745, base - H100 - 60], [745, base - hR - 30]], ease(u, 3.6, 4.4, 'cubicOut'), { width: 8, color: P.ink, tip: { r: 11, color: P.ink } });
      }
    };

    /* ── 4) النسبة الكبيرة ── */
    const pct = (Y, u) => {
      baseBg(Y, false);
      const a1 = ease(u, 0.1, 0.6), a2 = ease(u, 2.0, 2.6), a3 = ease(u, 2.6, 3.2);
      ctx.text(Y, 'وفّر', 540, 560 + 30 * (1 - a1), { family: 'display', weight: 900, size: 150, color: P.ink, alpha: a1 });
      const c = ease(u, 0.5, 1.8, 'expoOut'), n1 = Math.round(lo * c), n2 = Math.round(hi * c);
      ctx.text(Y, n1 + '% – ' + n2 + '%', 540, 900, { family: 'num', weight: 900, size: 215, color: P.acc, dir: 'ltr', maxWidth: 940 });
      ctx.drawPath(Y, [[250, 960], [540, 972], [830, 958]], ease(u, 1.6, 2.2, 'cubicInOut'), { width: 12, color: P.ink });
      ctx.text(Y, 'من سعر المواقع العالمية', 540, 1120 + 24 * (1 - a2), { family: 'body', weight: 700, size: 56, color: P.ink, alpha: a2, maxWidth: 820 });
      ctx.text(Y, 'أو الفندق نفسه', 540, 1200 + 24 * (1 - a2), { family: 'body', weight: 700, size: 56, color: P.ink, alpha: a2, maxWidth: 820 });
      ctx.text(Y, 'حسب الفندق والتاريخ', 540, 1320, { family: 'body', weight: 500, size: 38, color: P.mut, alpha: a3, maxWidth: 820 });
    };

    /* ── 5) (فيديو فقط) لقطة الساحات ── */
    const sofa = (Y, u) => {
      baseBg(Y, true);
      ctx.text(Y, 'احجز من أسس المسافر', 540, 290, { family: 'display', weight: 900, size: 100, color: P.ink, alpha: ease(u, 0.1, 0.6), maxWidth: 820 });
      const k2 = ease(u, 0.8, 1.4);
      ctx.text(Y, 'وفّر', 790, 1450, { family: 'display', weight: 900, size: 76, color: P.ink, alpha: k2, maxWidth: 260 });
      ctx.text(Y, lo + '% – ' + hi + '%', 420, 1450, { family: 'num', weight: 900, size: 84, color: P.acc, alpha: k2, dir: 'ltr', maxWidth: 560 });
    };

    /* ── 6) ختام ── */
    const cta = (Y, u) => {
      baseBg(Y, false);
      const k = ease(u, 0.2, 1.0, 'cubicOut');
      if (ctx.img('logo')) { const im = ctx.img('logo'), w = 520, h = w * im.height / im.width; Y.save(); Y.globalAlpha = k; Y.drawImage(im, 540 - w / 2, 300 + 30 * (1 - k), w, h); Y.restore(); }
      const a1 = ease(u, 1.1, 1.7), a2 = ease(u, 1.7, 2.3), a3 = ease(u, 2.3, 2.9);
      ctx.text(Y, 'الرابط في البايو', 540, 1215 + 30 * (1 - a1), { family: 'display', weight: 900, size: 76, color: P.ink, alpha: a1, maxWidth: 800 });
      ctx.drawPath(Y, [[330, 1262], [540, 1270], [750, 1260]], ease(u, 1.5, 2.1, 'cubicInOut'), { width: 10, color: P.acc });
      ctx.text(Y, 'أو للحجز المؤكد واتساب', 540, 1345 + 24 * (1 - a2), { family: 'body', weight: 700, size: 46, color: P.mut, alpha: a2, maxWidth: 800 });
      ctx.text(Y, cfg.phone || '+966566403938', 540, 1430 + 20 * (1 - a3), { family: 'num', weight: 800, size: 60, color: P.acc, alpha: a3, dir: 'ltr', maxWidth: 800 });
    };

    const fn = { hook, where, bars, pct, sofa, cta };
    const clock = i => segs[i].s - (i > 0 ? T_TR : 0);
    const drawSeg = (Y, i) => fn[segs[i].n](Y, t - clock(i));
    let idx = 0; segs.forEach((s, i) => { if (t >= s.s) idx = i; });
    const nx = idx + 1, tr0 = nx < segs.length ? segs[nx].s - T_TR : Infinity;
    if (T_TR > 0 && t >= tr0) FX.softWipe(ctx, t, { s: tr0, dur: T_TR, band: 240, A: Y => drawSeg(Y, idx), B: Y => drawSeg(Y, nx) });
    else drawSeg(X, idx);
  },
});
