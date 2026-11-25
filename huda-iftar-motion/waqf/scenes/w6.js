MOTION.scene({ id: 'w6',
  draw(t, lt, ctx) {
    const { X, P, FX, at } = ctx, L = ctx.img('logo');
    HU.bg(ctx);
    const k0 = at(lt, 0, .6, 'cubicOut');
    X.save(); X.globalAlpha = k0; X.fillStyle = '#F1ECE0'; HU.rr(X, 340, 200, 400, 420, 36); X.fill(); X.drawImage(L, 400, 225, 280, 370); X.restore();
    ctx.text(X, 'جمعية هدى لتعليم القرآن وعلومه', 540, 700, { family: 'body', weight: 700, size: 46, color: P.mut, alpha: k0, maxWidth: 940 });
    ctx.text(X, 'بشرق مكة المكرمة · ترخيص رقم 2311', 540, 765, { family: 'body', weight: 400, size: 40, color: P.mut, alpha: k0 });
    const k1 = at(lt, .8, 1.4, 'expoOut');
    ctx.text(X, 'ساهم في صدقة جارية', 540, 930 + 30 * (1 - k1), { family: 'display', weight: 900, size: 112, color: P.acc, alpha: k1, maxWidth: 940 });
    const k2 = at(lt, 1.8, 2.4, 'expoOut');
    X.save(); X.globalAlpha = k2; X.translate(0, 30 * (1 - k2)); X.fillStyle = '#173D46'; HU.rr(X, 70, 1060, 940, 330, 40); X.fill(); X.strokeStyle = P.acc; X.lineWidth = 2; HU.rr(X, 70, 1060, 940, 330, 40); X.stroke();
    ctx.text(X, 'تحويل من كافة البنوك', 540, 1135, { family: 'body', weight: 700, size: 44, color: P.hi });
    ctx.text(X, 'SA82 8000 0103 6080 1097 0024', 540, 1235, { family: 'num', weight: 800, size: 58, color: P.ink, dir: 'ltr' });
    ctx.text(X, 'واتساب 0555012537', 540, 1330, { family: 'body', weight: 700, size: 52, color: P.ink }); X.restore();
    const k3 = at(lt, 3.0, 3.6, 'cubicOut');
    ctx.text(X, '@hudaamkkah', 540, 1470, { family: 'num', weight: 700, size: 46, color: P.mut, alpha: k3, dir: 'ltr' });
    ctx.text(X, 'قرآن يتلى .. وأثر يبقى في مكة', 540, 1560, { family: 'body', weight: 700, size: 48, color: P.hi, alpha: at(lt, 3.6, 4.2, 'cubicOut') });
  } });
