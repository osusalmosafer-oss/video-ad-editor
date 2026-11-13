/* s1 — الهوك: خط قرمزي يمسح، «انتبه» بقناع طالع، + أدوات مشتركة (window.ISB) */
const W = 1080, H = 1920;
const ISB = window.ISB = {};
const sm = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };

// خلفية سينمائية: تدرّج + شعاع ضوء من فوق + غبار ذهبي طافي + شبكة خطوط خفيفة
ISB.bg = (ctx, t, o = {}) => {
  const { X, P } = ctx;
  const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1220'); g.addColorStop(0.55, P.bg); g.addColorStop(1, '#020306');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  X.save(); X.globalCompositeOperation = 'screen';
  [[150, 0.10, 0.9], [420, 0.07, 1.3], [-120, 0.05, 0.7]].forEach(([bx, a, sp], i) => {
    const sway = Math.sin(t * 0.25 * sp + i * 2) * 60, x0 = bx + sway;
    const lg = X.createLinearGradient(x0, 0, x0 + 520, 1500); lg.addColorStop(0, `rgba(233,210,160,${a * (o.light == null ? 1 : o.light)})`); lg.addColorStop(1, 'rgba(233,210,160,0)');
    X.fillStyle = lg; X.beginPath(); X.moveTo(x0 - 40, -20); X.lineTo(x0 + 120, -20); X.lineTo(x0 + 900, 1700); X.lineTo(x0 + 380, 1700); X.closePath(); X.fill();
  });
  X.restore();
  if (!ISB._dust) { const r = ctx.seeded(11); ISB._dust = Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, s: r.range(0.6, 2.8), v: r.range(10, 38), ph: r() * 6.28, dx: r.range(-12, 12) })); }
  X.save(); ISB._dust.forEach(d => {
    const y = ((d.y - t * d.v) % H + H) % H, x = d.x + Math.sin(t * 0.4 + d.ph) * 22 + d.dx * Math.sin(t * 0.1);
    X.globalAlpha = (0.12 + 0.28 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.ph))) * (o.dust == null ? 1 : o.dust); X.fillStyle = P.hi; X.beginPath(); X.arc(x, y, d.s, 0, 6.2832); X.fill();
  }); X.restore();
};

// عناصر HUD: ترقيم + خط علوي + عنوان فصل
ISB.hud = (ctx, t, lt, n, label, o = {}) => {
  const { X, P, at } = ctx, k = at(lt, 0.05, 0.7, 'expoOut');
  X.save(); X.globalAlpha = 0.9 * k;
  X.strokeStyle = 'rgba(244,239,228,0.22)'; X.lineWidth = 2; X.beginPath(); X.moveTo(80, 210); X.lineTo(80 + 920 * k, 210); X.stroke();
  ctx.text(X, '0' + n + ' / 05', 80, 190, { family: 'num', weight: 500, size: 28, color: P.acc, align: 'left', dir: 'ltr', letterSpacing: 4 });
  ctx.text(X, label, 1000, 190, { family: 'body', weight: 700, size: 30, color: P.mut, align: 'right' });
  X.restore();
};

// سطر من الصوت يظهر كلمة كلمة ثم يخفت
ISB.line = (ctx, t, id, o) => {
  const sp = ctx.lineSpan(id), fade = 1 - ctx.at(t, sp.e - 0.05, sp.e + 0.2, 'cubicIn');
  if (fade <= 0.01 || t < sp.s - 0.1) return;
  ctx.X.save(); ctx.X.globalAlpha = fade; ctx.FX.scrollReveal(ctx, t, Object.assign({ line: id }, o)); ctx.X.restore();
};

ISB.fog = (ctx) => { const { X, P } = ctx, g = X.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(5,7,13,1)'); g.addColorStop(0.55, 'rgba(5,7,13,0.96)'); g.addColorStop(1, 'rgba(5,7,13,0)'); X.fillStyle = g; X.fillRect(0, 0, 1080, 760); };

// عالم ثلاثي الأبعاد: ساق + ثوب (قماش يتموج) + حلقة الكعبين
ISB.AN_Y = 0;
ISB.world = (ctx) => {
  const { THREE, P } = ctx, w = {};
  w.st = ctx.stage3D({ fov: 24, camera: [0, 1.1, 22], env: 'room', tone: 'neutral', exposure: 1.0 });
  const st = w.st;
  const key = new THREE.DirectionalLight(0xffdca8, 2.6); key.position.set(4, 7, 6); st.add(key);
  const rim = new THREE.DirectionalLight(0x7fa8ff, 1.6); rim.position.set(-6, 3, -5); st.add(rim);
  const skin = new THREE.MeshPhysicalMaterial({ color: '#b98a62', roughness: 0.55, envMapIntensity: 0.4 });
  w.leg = st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 9, 40), skin)); w.leg.position.y = 4.3;
  const shoeM = new THREE.MeshPhysicalMaterial({ color: '#171c26', roughness: 0.45, clearcoat: 0.4 });
  w.shoe = st.add(new THREE.Mesh(new ctx.RoundedBoxGeometry(1.15, 0.55, 2.3, 6, 0.22), shoeM)); w.shoe.position.set(0, -0.5, 0.55);
  w.floor = st.add(new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshStandardMaterial({ color: '#010203', roughness: 0.5, metalness: 0.1, envMapIntensity: 0.08 })));
  w.floor.rotation.x = -Math.PI / 2; w.floor.position.y = -0.78;
  const H = 7, geo = new THREE.CylinderGeometry(0.93, 1.0, H, 72, 70, true);
  w.base = Float32Array.from(geo.attributes.position.array); w.H = H;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
  w.geo = geo;
  w.thobe = st.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.4, side: THREE.DoubleSide, envMapIntensity: 0.7 })));
  w.ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(P.acc) });
  w.ring = st.add(new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.022, 12, 160), w.ringMat)); w.ring.rotation.x = Math.PI / 2;
  w.ring2 = st.add(new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.01, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.acc), transparent: true, opacity: 0.45 }))); w.ring2.rotation.x = Math.PI / 2;
  w.disc = st.add(new THREE.Mesh(new THREE.CircleGeometry(1.75, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.acc), transparent: true, opacity: 0.07, side: THREE.DoubleSide }))); w.disc.rotation.x = Math.PI / 2;
  w.white = new THREE.Color('#f2eee5'); w.red = new THREE.Color(P.red); w.tmp = new THREE.Color();
  w.update = (t, hem, o = {}) => {
    const pos = w.geo.attributes.position, col = w.geo.attributes.color, b = w.base, n = pos.count;
    for (let i = 0; i < n; i++) {
      const x = b[i * 3], by = b[i * 3 + 1], z = b[i * 3 + 2], u = (by + H / 2) / H, ang = Math.atan2(x, z), r0 = Math.hypot(x, z);
      const near = 1 - sm(0, 0.2, u), amp = 0.055 * near, r = r0 * (1 + amp * Math.sin(ang * 6 + t * 2.1) + 0.014 * Math.sin(ang * 11 - t * 0.7) + 0.02 * near * Math.sin(ang * 3 + t * 1.2));
      pos.setXYZ(i, r * Math.sin(ang), by + 0.06 * near * Math.sin(ang * 5 + t * 1.7), r * Math.cos(ang));
      const wy = hem + u * H, bad = (o.crimson == null ? 1 : o.crimson) * sm(0.04, -0.2, wy), shade = 0.82 + 0.18 * Math.cos(ang * 2 - 0.6);
      w.tmp.copy(w.white).lerp(w.red, bad * 0.9).multiplyScalar(shade); col.setXYZ(i, w.tmp.r, w.tmp.g, w.tmp.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true; w.geo.computeVertexNormals();
    w.thobe.position.y = hem + H / 2;
    const pulse = 1 + 0.03 * ctx.beatPulse(t, 7, 1); w.ring.scale.set(pulse, pulse, pulse);
    w.ring2.rotation.z = t * 0.25; w.ringMat.color.set(o.ringColor || ctx.P.acc);
  };
  w.project = (x, y, z) => { const v = new THREE.Vector3(x, y, z); st.camera.updateMatrixWorld(); v.project(st.camera); return [(v.x * 0.5 + 0.5) * 1080, (-v.y * 0.5 + 0.5) * 1920]; };
  return w;
};

MOTION.scene({
  id: 's1',
  draw(t, lt, ctx) {
    const { X, P, at, FX, E } = ctx, red = P.red;
    ISB.bg(ctx, t, { light: 0.6 });
    ISB.hud(ctx, t, lt, 1, 'تنبيه');
    // خط قرمزي يمسح من الوسط
    const lk = at(lt, 0.1, 0.8, 'expoOut'), cy = 880;
    X.save(); X.fillStyle = red; X.fillRect(540 - 460 * lk, cy - 2, 920 * lk, 4);
    X.globalAlpha = 0.5 * (1 - at(lt, 0.8, 1.6)); X.fillRect(540 - 540 * lk, cy - 1, 1080 * lk, 2); X.restore();
    // «انتبه» بقناع يطلع
    const w0 = ctx.wordTime('l1', 0), rk = at(lt, 0.45, 1.05, 'expoOut');
    X.save(); X.beginPath(); X.rect(0, cy - 380 * rk - 6 * (1 - rk), W, 380 * rk); X.clip();
    ctx.text(X, 'انتبه', 540, cy - 56 + 120 * (1 - rk), { family: 'kufi', weight: 900, size: 360, color: P.ink, align: 'center' });
    X.restore();
    // نقطة قرمزية تنبض بجنب الكلمة
    const pk = at(lt, 0.9, 1.2, 'backOut'); if (pk > 0.01) { X.fillStyle = red; X.beginPath(); X.arc(540, cy + 96, 14 * pk * (1 + 0.15 * ctx.beatPulse(t, 8, 1)), 0, 6.2832); X.fill(); }
    // الجملة تحت
    ISB.line(ctx, t, 'l1', { y: 1210, size: 64, maxWidth: 880, step: 0.28, dim: 0.1, accent: [] });
    // قوسين زوايا (إطار شاشة)
    X.save(); X.strokeStyle = 'rgba(244,239,228,0.35)'; X.lineWidth = 3; const a = at(lt, 0, 0.6, 'cubicOut');
    [[80, 250, 1, 1], [1000, 250, -1, 1], [80, 1500, 1, -1], [1000, 1500, -1, -1]].forEach(([x, y, sx, sy]) => { X.beginPath(); X.moveTo(x, y + 60 * sy * a); X.lineTo(x, y); X.lineTo(x + 60 * sx * a, y); X.stroke(); });
    X.restore();
  }
});
