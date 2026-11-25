MOTION.scene({ id: 'w3',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, Hd = ctx.img('header');
    HU.bg(ctx);
    const k1 = at(lt, .1, .7, 'expoOut'), k2 = at(lt, .45, 1.05, 'expoOut');
    ctx.text(X, 'مبنى الصدقات الجارية', 540, 330 + 40 * (1 - k1), { family: 'display', weight: 900, size: 118, color: P.acc, alpha: k1, maxWidth: 960 });
    ctx.text(X, 'بمكة المكرمة', 540, 470 + 40 * (1 - k2), { family: 'display', weight: 700, size: 84, color: P.ink, alpha: k2 });
    // نافذة صورة المبنى والحرم — حركة بانوراما (كين بيرنز) داخل إطار
    const ka = at(lt, .6, 1.2, 'cubicOut');
    X.save(); X.globalAlpha = ka; HU.rr(X, 60, 620, 960, 820, 28); X.clip();
    const sc = 820 / Hd.height, w = Hd.width * sc, p = ctx.at(lt, .4, 5.6, 'sineInOut');   // بانوراما من الصورة كاملة
    X.drawImage(Hd, 60 - (w - 960) * (1 - p) * 0 - (w - 960) * p, 620, w, 820);
    X.fillStyle = 'rgba(13,40,48,.12)'; X.fillRect(60, 620, 960, 820);
    X.restore();
    X.save(); X.globalAlpha = ka; X.strokeStyle = P.acc; X.lineWidth = 3; HU.rr(X, 60, 620, 960, 820, 28); X.stroke(); X.restore();
  } });
