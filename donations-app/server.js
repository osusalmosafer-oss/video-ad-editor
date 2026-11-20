// نظام إدارة ومتابعة طلبات استلام التبرعات — الخادم
process.env.TZ = process.env.TZ || 'Asia/Riyadh';
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { db, tx, DATA_DIR } = require('./db');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
  });
  next();
});

/* ---------------- أدوات مساعدة ---------------- */
const PRIORITIES = ['urgent', 'important', 'normal'];
const PRI_AR = { urgent: 'عاجل جداً', important: 'مهم', normal: 'عادي' };
const STATUS_AR = { new: 'جديد', in_progress: 'قيد التنفيذ', received: 'تم الاستلام', failed: 'تعذر الاستلام', postponed: 'مؤجل' };
const ACTIVE = ['new', 'in_progress', 'postponed'];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const now = () => Date.now();
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
function makeUserHash(pw) { const salt = crypto.randomBytes(16).toString('hex'); return { salt, hash: hashPw(pw, salt) }; }
function checkPw(user, pw) {
  const a = Buffer.from(hashPw(String(pw), user.salt), 'hex');
  const b = Buffer.from(user.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));
const fail = (res, code, msg) => res.status(code).json({ error: msg });
const fmtDT = (ms) => new Date(ms).toLocaleString('ar-u-ca-gregory-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });

/* ---------------- المستخدمون الأوليون ---------------- */
function seedUsers() {
  if (db.prepare('SELECT COUNT(*) c FROM users').get().c > 0) return;
  const demo = process.env.SEED_DEMO === '1';
  const pw = (envName, demoPw) => process.env[envName] || (demo ? demoPw : crypto.randomBytes(5).toString('hex'));
  const accounts = [
    { username: 'admin', name: 'مشرف الجمعية', role: 'employee', can_delete: 1, can_manage: 1, pw: pw('ADMIN_PASSWORD', 'admin123') },
    { username: 'employee', name: 'موظف الاستقبال', role: 'employee', can_delete: 0, can_manage: 0, pw: pw('EMPLOYEE_PASSWORD', 'employee123') },
    { username: 'driver', name: 'السائق', role: 'driver', can_delete: 0, can_manage: 0, pw: pw('DRIVER_PASSWORD', 'driver123') },
  ];
  const ins = db.prepare('INSERT INTO users (username,name,role,salt,hash,can_delete,can_manage,created_at) VALUES (?,?,?,?,?,?,?,?)');
  let txt = 'بيانات الدخول الأولية (غيّر كلمات المرور بعد أول دخول):\n';
  for (const a of accounts) {
    const { salt, hash } = makeUserHash(a.pw);
    ins.run(a.username, a.name, a.role, salt, hash, a.can_delete, a.can_manage, now());
    txt += `${a.role === 'driver' ? 'سائق' : 'موظف'} | المستخدم: ${a.username} | كلمة المرور: ${a.pw}\n`;
  }
  fs.writeFileSync(path.join(DATA_DIR, 'initial-credentials.txt'), txt);
  console.log('\n' + txt);
}
seedUsers();

/* ---------------- الجلسات وتسجيل الدخول ---------------- */
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
function auth(req, res, next) {
  const token = parseCookies(req).sid;
  if (!token) return fail(res, 401, 'يجب تسجيل الدخول');
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`).get(sha(token), now());
  if (!row) return fail(res, 401, 'انتهت الجلسة، سجّل الدخول من جديد');
  req.user = row;
  next();
}
const only = (role) => (req, res, next) => (req.user.role === role ? next() : fail(res, 403, 'غير مصرح لك بهذه العملية'));
const publicUser = (u) => ({ id: u.id, username: u.username, name: u.name, role: u.role, can_delete: !!u.can_delete, can_manage: !!u.can_manage });

const attempts = new Map();
function throttled(key) {
  const a = attempts.get(key);
  return a && a.count >= 8 && now() - a.first < 10 * 60 * 1000;
}
function noteAttempt(key, ok) {
  if (ok) return attempts.delete(key);
  const a = attempts.get(key);
  if (!a || now() - a.first > 10 * 60 * 1000) attempts.set(key, { count: 1, first: now() });
  else a.count++;
}

app.post('/api/login', (req, res) => {
  const username = str(req.body.username, 60);
  const key = req.ip + '|' + username.toLowerCase();
  if (throttled(key)) return fail(res, 429, 'محاولات كثيرة، حاول بعد 10 دقائق');
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  const ok = user && checkPw(user, req.body.password || '');
  noteAttempt(key, !!ok);
  if (!ok) return fail(res, 401, 'اسم المستخدم أو كلمة المرور غير صحيحة');
  const token = crypto.randomBytes(32).toString('hex');
  const ttl = 30 * 24 * 3600 * 1000;
  db.prepare('INSERT INTO sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)').run(sha(token), user.id, now(), now() + ttl);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
  const secure = req.secure ? '; Secure' : '';
  res.set('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${ttl / 1000}${secure}`);
  res.json({ user: publicUser(user) });
});
app.post('/api/logout', (req, res) => {
  const t = parseCookies(req).sid;
  if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
  res.set('Set-Cookie', 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});
app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/password', auth, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!checkPw(req.user, old_password || '')) return fail(res, 400, 'كلمة المرور الحالية غير صحيحة');
  if (String(new_password || '').length < 6) return fail(res, 400, 'كلمة المرور الجديدة قصيرة (6 أحرف على الأقل)');
  const { salt, hash } = makeUserHash(String(new_password));
  db.prepare('UPDATE users SET salt=?, hash=? WHERE id=?').run(salt, hash, req.user.id);
  res.json({ ok: true });
});

/* ---------------- البث الفوري (SSE) ---------------- */
const clients = new Map(); // userId -> Set(res)
function sendTo(userId, event, data) {
  for (const r of clients.get(userId) || []) r.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
function broadcast(event, data) { for (const id of clients.keys()) sendTo(id, event, data); }
app.get('/api/stream', auth, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  if (!clients.has(req.user.id)) clients.set(req.user.id, new Set());
  clients.get(req.user.id).add(res);
  const ka = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ka);
    const set = clients.get(req.user.id);
    if (set) { set.delete(res); if (!set.size) clients.delete(req.user.id); }
  });
});

/* ---------------- السجل والإشعارات ---------------- */
function log(reqId, user, action, details) {
  db.prepare('INSERT INTO logs (request_id,user_id,user_name,action,details,at) VALUES (?,?,?,?,?,?)')
    .run(reqId, user ? user.id : null, user ? user.name : 'النظام', action, details || null, now());
}
function notify(role, requestId, kind, message, exceptUserId) {
  const users = db.prepare('SELECT id FROM users WHERE role = ? AND active = 1').all(role);
  const ins = db.prepare('INSERT INTO notifications (user_id,request_id,kind,message,created_at) VALUES (?,?,?,?,?)');
  for (const u of users) {
    if (u.id === exceptUserId) continue;
    const r = ins.run(u.id, requestId, kind, message, now());
    sendTo(u.id, 'notify', { id: Number(r.lastInsertRowid), request_id: requestId, kind, message, created_at: now() });
  }
}
app.get('/api/notifications', auth, (req, res) => {
  const items = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c;
  res.json({ items, unread });
});
app.post('/api/notifications/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

/* ---------------- الطلبات ---------------- */
const RANK = "CASE priority WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END";
function view(row, role) {
  if (!row) return null;
  const o = { ...row };
  delete o.deleted;
  if (role === 'driver') { delete o.est_value; delete o.created_by; delete o.created_by_name; }
  return o;
}
function validUrl(u) {
  if (!u) return '';
  try { const p = new URL(u); return ['http:', 'https:'].includes(p.protocol) ? p.href.slice(0, 1000) : null; } catch { return null; }
}
function cleanPhone(p) {
  const s = String(p || '').replace(/[\s\-()]/g, '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  return /^\+?\d{7,15}$/.test(s) ? s : null;
}
function validateRequest(b) {
  const d = {
    donor_name: str(b.donor_name, 120), district: str(b.district, 80), address: str(b.address, 400),
    donation_type: str(b.donation_type, 80), items: str(b.items, 3000), notes: str(b.notes, 2000),
    pickup_at: str(b.pickup_at, 16), priority: str(b.priority, 10) || 'normal',
  };
  if (!d.donor_name) return { error: 'اسم المتبرع مطلوب' };
  const ph = cleanPhone(b.donor_phone);
  if (!ph) return { error: 'رقم الجوال غير صحيح' };
  d.donor_phone = ph;
  if (!d.district) return { error: 'الحي مطلوب' };
  if (!d.donation_type) return { error: 'نوع التبرع مطلوب' };
  if (!PRIORITIES.includes(d.priority)) return { error: 'أولوية غير صحيحة' };
  const url = validUrl(str(b.map_url, 1000));
  if (url === null) return { error: 'رابط الموقع غير صحيح (يجب أن يبدأ بـ https://)' };
  d.map_url = url;
  if (d.pickup_at && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(d.pickup_at)) return { error: 'موعد الاستلام غير صحيح' };
  const v = Number(b.est_value || 0);
  if (!Number.isFinite(v) || v < 0 || v > 1e9) return { error: 'القيمة التقديرية غير صحيحة' };
  d.est_value = v;
  return { data: d };
}
const getReq = (id) => db.prepare('SELECT * FROM requests WHERE id = ? AND deleted = 0').get(id);
const dayStart = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

app.get('/api/requests', auth, (req, res) => {
  const q = req.query, u = req.user;
  const where = ['deleted = 0'], args = [];
  if (u.role === 'driver') {
    const tab = q.tab || 'active';
    if (tab === 'active') { where.push(`status IN ('new','in_progress','postponed') AND (driver_id IS NULL OR driver_id = ?)`); args.push(u.id); }
    else if (tab === 'done') { where.push("status = 'received' AND driver_id = ?"); args.push(u.id); }
    else if (tab === 'failed') { where.push("status = 'failed' AND driver_id = ?"); args.push(u.id); }
    else return res.json({ items: [] });
  } else {
    if (q.status && STATUS_AR[q.status]) { where.push('status = ?'); args.push(q.status); }
    if (q.active === '1') where.push("status IN ('new','in_progress','postponed')");
    if (q.priority && PRIORITIES.includes(q.priority)) { where.push('priority = ?'); args.push(q.priority); }
    if (q.district) { where.push('district LIKE ?'); args.push('%' + str(q.district, 80) + '%'); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.from || '')) { where.push('created_at >= ?'); args.push(dayStart(q.from)); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.to || '')) { where.push('created_at < ?'); args.push(dayStart(q.to) + 86400000); }
    if (q.q) {
      const t = '%' + str(q.q, 80).replace(/[%_]/g, '') + '%';
      where.push('(donor_name LIKE ? OR donor_phone LIKE ? OR CAST(id AS TEXT) LIKE ? OR district LIKE ? OR address LIKE ?)');
      args.push(t, t, t, t, t);
    }
  }
  let order;
  if (u.role === 'driver') order = `${RANK}, COALESCE(NULLIF(pickup_at,''),'9999'), id`;
  else if (q.sort === 'value') order = 'est_value DESC, id DESC';
  else if (q.sort === 'priority') order = `${RANK}, est_value DESC, id DESC`;
  else if (q.sort === 'pickup') order = "COALESCE(NULLIF(pickup_at,''),'9999'), id";
  else order = 'id DESC';
  const rows = db.prepare(`SELECT * FROM requests WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 500`).all(...args);
  res.json({ items: rows.map((r) => view(r, u.role)) });
});

app.get('/api/requests/:id', auth, (req, res) => {
  const r = getReq(Number(req.params.id));
  if (!r) return fail(res, 404, 'الطلب غير موجود');
  if (req.user.role === 'driver') {
    const mine = r.driver_id === null || r.driver_id === req.user.id;
    if (!mine) return fail(res, 403, 'غير مصرح لك بالاطلاع على هذا الطلب');
    return res.json({ item: view(r, 'driver') });
  }
  const logs = db.prepare('SELECT * FROM logs WHERE request_id = ? ORDER BY at, id').all(r.id);
  res.json({ item: view(r, 'employee'), logs });
});

app.post('/api/requests', auth, only('employee'), (req, res) => {
  const v = validateRequest(req.body);
  if (v.error) return fail(res, 400, v.error);
  const d = v.data;
  const id = tx(() => {
    const r = db.prepare(`INSERT INTO requests (created_at,updated_at,created_by,created_by_name,donor_name,donor_phone,district,address,map_url,
      donation_type,items,notes,pickup_at,priority,est_value) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(now(), now(), req.user.id, req.user.name, d.donor_name, d.donor_phone, d.district, d.address, d.map_url,
        d.donation_type, d.items, d.notes, d.pickup_at, d.priority, d.est_value);
    const rid = Number(r.lastInsertRowid);
    log(rid, req.user, 'إضافة الطلب', `الأولوية: ${PRI_AR[d.priority]}`);
    return rid;
  });
  const urgent = d.priority === 'urgent';
  notify('driver', id, urgent ? 'urgent' : 'new',
    `${urgent ? '🚨 طلب عاجل جداً' : 'طلب جديد'} #${id} — حي ${d.district} — ${d.donation_type}${urgent ? ' (يجب استلامه اليوم)' : ''}`);
  broadcast('changed', { id });
  res.status(201).json({ item: view(getReq(id), 'employee') });
});

app.put('/api/requests/:id', auth, only('employee'), (req, res) => {
  const r = getReq(Number(req.params.id));
  if (!r) return fail(res, 404, 'الطلب غير موجود');
  const v = validateRequest(req.body);
  if (v.error) return fail(res, 400, v.error);
  const d = v.data;
  const labels = { donor_name: 'اسم المتبرع', donor_phone: 'الجوال', district: 'الحي', address: 'العنوان', map_url: 'رابط الموقع',
    donation_type: 'نوع التبرع', items: 'تفاصيل الأغراض', notes: 'الملاحظات', pickup_at: 'موعد الاستلام', priority: 'الأولوية', est_value: 'القيمة التقديرية' };
  const changed = Object.keys(labels).filter((k) => String(r[k] ?? '') !== String(d[k] ?? ''));
  if (!changed.length) return res.json({ item: view(r, 'employee') });
  tx(() => {
    db.prepare(`UPDATE requests SET donor_name=?,donor_phone=?,district=?,address=?,map_url=?,donation_type=?,items=?,notes=?,pickup_at=?,priority=?,est_value=?,updated_at=? WHERE id=?`)
      .run(d.donor_name, d.donor_phone, d.district, d.address, d.map_url, d.donation_type, d.items, d.notes, d.pickup_at, d.priority, d.est_value, now(), r.id);
    for (const k of changed) {
      if (k === 'priority') log(r.id, req.user, 'تغيير الأولوية', `من «${PRI_AR[r.priority]}» إلى «${PRI_AR[d.priority]}»`);
      else if (k === 'est_value') log(r.id, req.user, 'تعديل بيانات الطلب', `القيمة التقديرية: ${r.est_value} ← ${d.est_value}`);
      else log(r.id, req.user, 'تعديل بيانات الطلب', labels[k]);
    }
  });
  if (changed.includes('priority') && d.priority === 'urgent' && ACTIVE.includes(r.status))
    notify('driver', r.id, 'urgent', `🚨 أصبح الطلب #${r.id} عاجلاً جداً (يجب استلامه اليوم)`);
  else if (changed.some((k) => ['pickup_at', 'address', 'map_url', 'district', 'items', 'notes'].includes(k)) && ACTIVE.includes(r.status))
    notify('driver', r.id, 'info', `تم تعديل بيانات الطلب #${r.id}`);
  broadcast('changed', { id: r.id });
  res.json({ item: view(getReq(r.id), 'employee') });
});

app.post('/api/requests/:id/priority', auth, only('employee'), (req, res) => {
  const r = getReq(Number(req.params.id));
  const p = str(req.body.priority, 10);
  if (!r) return fail(res, 404, 'الطلب غير موجود');
  if (!PRIORITIES.includes(p)) return fail(res, 400, 'أولوية غير صحيحة');
  if (p === r.priority) return res.json({ item: view(r, 'employee') });
  db.prepare('UPDATE requests SET priority=?, updated_at=? WHERE id=?').run(p, now(), r.id);
  log(r.id, req.user, 'تغيير الأولوية', `من «${PRI_AR[r.priority]}» إلى «${PRI_AR[p]}»`);
  if (p === 'urgent' && ACTIVE.includes(r.status)) notify('driver', r.id, 'urgent', `🚨 أصبح الطلب #${r.id} عاجلاً جداً (يجب استلامه اليوم)`);
  broadcast('changed', { id: r.id });
  res.json({ item: view(getReq(r.id), 'employee') });
});

app.delete('/api/requests/:id', auth, only('employee'), (req, res) => {
  if (!req.user.can_delete) return fail(res, 403, 'لا تملك صلاحية حذف الطلبات (للمشرف فقط)');
  const r = getReq(Number(req.params.id));
  if (!r) return fail(res, 404, 'الطلب غير موجود');
  if (r.status === 'received') return fail(res, 400, 'لا يمكن حذف طلب تم استلامه');
  db.prepare('UPDATE requests SET deleted=1, updated_at=? WHERE id=?').run(now(), r.id);
  log(r.id, req.user, 'حذف الطلب', `الحالة وقت الحذف: ${STATUS_AR[r.status]}`);
  broadcast('changed', { id: r.id });
  res.json({ ok: true });
});

// تغيير الحالة (السائق) + إعادة الفتح (الموظف)
app.post('/api/requests/:id/action', auth, (req, res) => {
  const u = req.user;
  const r = getReq(Number(req.params.id));
  if (!r) return fail(res, 404, 'الطلب غير موجود');
  const action = str(req.body.action, 20);

  if (u.role === 'employee') {
    if (action !== 'reopen') return fail(res, 403, 'تغيير حالة الاستلام من اختصاص السائق');
    if (!['failed', 'postponed'].includes(r.status)) return fail(res, 400, 'يمكن إعادة فتح الطلبات المتعذرة أو المؤجلة فقط');
    db.prepare("UPDATE requests SET status='new', driver_id=NULL, driver_name=NULL, started_at=NULL, updated_at=? WHERE id=?").run(now(), r.id);
    log(r.id, u, 'إعادة فتح الطلب', 'أُعيد إلى قائمة الطلبات الجديدة');
    notify('driver', r.id, r.priority === 'urgent' ? 'urgent' : 'new', `أُعيد فتح الطلب #${r.id} — حي ${r.district}`);
    broadcast('changed', { id: r.id });
    return res.json({ item: view(getReq(r.id), 'employee') });
  }

  if (r.driver_id !== null && r.driver_id !== u.id) return fail(res, 403, 'هذا الطلب مسند لسائق آخر');
  if (!ACTIVE.includes(r.status)) return fail(res, 400, 'هذا الطلب مغلق ولا يمكن تغيير حالته');
  const t = now();
  const sets = { driver_id: u.id, driver_name: u.name, updated_at: t };
  if (!r.started_at) sets.started_at = t;

  if (action === 'start') {
    if (r.status === 'in_progress') return fail(res, 400, 'الطلب قيد التنفيذ بالفعل');
    Object.assign(sets, { status: 'in_progress', started_at: t });
    log(r.id, u, 'بدء الاستلام', 'بدأ السائق التوجه لاستلام الطلب');
  } else if (action === 'done') {
    const notes = str(req.body.notes, 1000);
    Object.assign(sets, { status: 'received', received_at: t, receive_notes: notes || null });
    log(r.id, u, 'تم الاستلام', notes || null);
    notify('employee', r.id, 'done', `✅ استلم ${u.name} الطلب #${r.id} من ${r.donor_name} (حي ${r.district})`);
  } else if (action === 'fail') {
    const reason = str(req.body.reason, 1000);
    if (!reason) return fail(res, 400, 'اكتب سبب تعذر الاستلام');
    Object.assign(sets, { status: 'failed', failed_at: t, fail_reason: reason });
    log(r.id, u, 'تعذر الاستلام', `السبب: ${reason}`);
    notify('employee', r.id, 'failed', `⚠️ تعذر استلام الطلب #${r.id} (${r.donor_name}) — السبب: ${reason}`);
  } else if (action === 'postpone') {
    const when = str(req.body.new_date, 16);
    const note = str(req.body.notes, 1000);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) return fail(res, 400, 'حدّد الموعد الجديد (التاريخ والوقت)');
    Object.assign(sets, { status: 'postponed', pickup_at: when, postponed_at: t, postpone_note: note || null, driver_id: null, driver_name: null, started_at: null });
    log(r.id, u, 'تأجيل الاستلام', `الموعد الجديد: ${when.replace('T', ' ')}${note ? ' — ' + note : ''}`);
    notify('employee', r.id, 'postponed', `⏰ أجّل ${u.name} الطلب #${r.id} (${r.donor_name}) إلى ${when.replace('T', ' ')}${note ? ' — ' + note : ''}`);
  } else return fail(res, 400, 'إجراء غير معروف');

  const cols = Object.keys(sets);
  db.prepare(`UPDATE requests SET ${cols.map((c) => c + '=?').join(',')} WHERE id=?`).run(...cols.map((c) => sets[c]), r.id);
  broadcast('changed', { id: r.id });
  res.json({ item: view(getReq(r.id), 'driver') });
});

app.get('/api/stats', auth, only('employee'), (req, res) => {
  const c = (sql) => db.prepare(sql).get().c;
  res.json({
    total: c('SELECT COUNT(*) c FROM requests WHERE deleted=0'),
    new: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status='new'"),
    urgent: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND priority='urgent' AND status IN ('new','in_progress','postponed')"),
    in_progress: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status='in_progress'"),
    received: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status='received'"),
    failed: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status='failed'"),
    postponed: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status='postponed'"),
  });
});
app.get('/api/districts', auth, (req, res) => {
  res.json({ items: db.prepare("SELECT DISTINCT district d FROM requests WHERE deleted=0 AND district <> '' ORDER BY d").all().map((r) => r.d) });
});

/* ---------------- التقارير ---------------- */
function rangeFor(period, dateStr) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(dateStr || '') ? new Date(dayStart(dateStr)) : new Date(new Date().setHours(0, 0, 0, 0));
  let from, to, label;
  if (period === 'month') {
    from = new Date(base.getFullYear(), base.getMonth(), 1); to = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    label = 'شهر ' + from.toLocaleDateString('ar-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });
  } else if (period === 'week') {
    const back = (base.getDay() + 1) % 7; // الأسبوع يبدأ السبت
    from = new Date(base.getFullYear(), base.getMonth(), base.getDate() - back); to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    label = 'أسبوع ' + from.toLocaleDateString('ar-u-ca-gregory-nu-latn', { dateStyle: 'medium' }) + ' — ' + new Date(to - 1).toLocaleDateString('ar-u-ca-gregory-nu-latn', { dateStyle: 'medium' });
  } else {
    from = base; to = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    label = 'يوم ' + from.toLocaleDateString('ar-u-ca-gregory-nu-latn', { dateStyle: 'full' });
  }
  return { from: from.getTime(), to: to.getTime(), label };
}
function buildReport(period, date) {
  const { from, to, label } = rangeFor(period, date);
  const c = (sql, ...a) => db.prepare(sql).get(...a);
  const m = {
    received_requests: c('SELECT COUNT(*) c FROM requests WHERE deleted=0 AND created_at>=? AND created_at<?', from, to).c,
    picked_up: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status='received' AND received_at>=? AND received_at<?", from, to).c,
    remaining: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND status IN ('new','in_progress','postponed')").c,
    failed: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND failed_at>=? AND failed_at<? AND status='failed'", from, to).c,
    postponed: c("SELECT COUNT(*) c FROM requests WHERE deleted=0 AND postponed_at>=? AND postponed_at<? AND status='postponed'", from, to).c,
    total_value: c("SELECT COALESCE(SUM(est_value),0) c FROM requests WHERE deleted=0 AND status='received' AND received_at>=? AND received_at<?", from, to).c,
  };
  const drivers = db.prepare(`SELECT driver_name name, COUNT(*) count, COALESCE(SUM(est_value),0) value FROM requests
    WHERE deleted=0 AND status='received' AND received_at>=? AND received_at<? GROUP BY driver_id ORDER BY count DESC`).all(from, to);
  const rows = db.prepare(`SELECT * FROM requests WHERE deleted=0 AND ((created_at>=? AND created_at<?) OR (received_at>=? AND received_at<?)) ORDER BY id`).all(from, to, from, to);
  return { period, label, from, to, metrics: m, drivers, rows };
}
app.get('/api/reports', auth, only('employee'), (req, res) => {
  const r = buildReport(req.query.period, req.query.date);
  res.json({ ...r, rows: r.rows.map((x) => view(x, 'employee')) });
});
app.get('/api/reports/export.xlsx', auth, only('employee'), async (req, res) => {
  const r = buildReport(req.query.period, req.query.date);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'نظام إدارة ومتابعة طلبات استلام التبرعات';
  const head = (ws) => { ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F7F79' } }; };
  const s1 = wb.addWorksheet('الملخص', { views: [{ rightToLeft: true }] });
  s1.columns = [{ header: 'المؤشر', key: 'k', width: 38 }, { header: 'القيمة', key: 'v', width: 22 }];
  head(s1);
  s1.addRows([
    { k: 'الفترة', v: r.label }, { k: 'عدد الطلبات المستقبلة', v: r.metrics.received_requests }, { k: 'عدد الطلبات المستلمة', v: r.metrics.picked_up },
    { k: 'عدد الطلبات المتبقية حالياً', v: r.metrics.remaining }, { k: 'عدد الطلبات المتعذر استلامها', v: r.metrics.failed },
    { k: 'عدد الطلبات المؤجلة', v: r.metrics.postponed }, { k: 'إجمالي القيمة التقديرية للتبرعات المستلمة', v: r.metrics.total_value },
  ]);
  s1.addRow({}); s1.addRow({ k: 'إنجاز السائقين', v: '' }).font = { bold: true };
  r.drivers.forEach((d) => s1.addRow({ k: d.name, v: `${d.count} طلب — ${d.value} ريال` }));
  const s2 = wb.addWorksheet('الطلبات', { views: [{ rightToLeft: true }] });
  s2.columns = [
    { header: 'رقم الطلب', key: 'id', width: 11 }, { header: 'تاريخ التسجيل', key: 'created', width: 22 }, { header: 'المتبرع', key: 'donor_name', width: 22 },
    { header: 'الجوال', key: 'donor_phone', width: 16 }, { header: 'الحي', key: 'district', width: 16 }, { header: 'العنوان', key: 'address', width: 30 },
    { header: 'نوع التبرع', key: 'donation_type', width: 18 }, { header: 'الأغراض', key: 'items', width: 36 }, { header: 'الأولوية', key: 'pri', width: 12 },
    { header: 'الحالة', key: 'st', width: 14 }, { header: 'القيمة التقديرية', key: 'est_value', width: 16 }, { header: 'السائق', key: 'driver_name', width: 18 },
    { header: 'تاريخ الاستلام', key: 'rec', width: 22 }, { header: 'سبب التعذر', key: 'fail_reason', width: 30 },
  ];
  head(s2);
  r.rows.forEach((x) => s2.addRow({ ...x, created: fmtDT(x.created_at), pri: PRI_AR[x.priority], st: STATUS_AR[x.status], rec: x.received_at ? fmtDT(x.received_at) : '' }));
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="report-${r.period}.xlsx"` });
  await wb.xlsx.write(res);
  res.end();
});

/* ---------------- إدارة المستخدمين (للمشرف) ---------------- */
const manager = (req, res, next) => (req.user.can_manage ? next() : fail(res, 403, 'هذه الصفحة للمشرف فقط'));
app.get('/api/users', auth, only('employee'), manager, (req, res) => {
  res.json({ items: db.prepare('SELECT id,username,name,role,can_delete,can_manage,active FROM users ORDER BY role, id').all() });
});
app.post('/api/users', auth, only('employee'), manager, (req, res) => {
  const username = str(req.body.username, 40), name = str(req.body.name, 80), role = req.body.role, pw = String(req.body.password || '');
  if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username)) return fail(res, 400, 'اسم المستخدم: 3 أحرف إنجليزية/أرقام على الأقل بدون مسافات');
  if (!name) return fail(res, 400, 'الاسم مطلوب');
  if (!['employee', 'driver'].includes(role)) return fail(res, 400, 'نوع الحساب غير صحيح');
  if (pw.length < 6) return fail(res, 400, 'كلمة المرور 6 أحرف على الأقل');
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return fail(res, 400, 'اسم المستخدم مستخدم من قبل');
  const { salt, hash } = makeUserHash(pw);
  db.prepare('INSERT INTO users (username,name,role,salt,hash,can_delete,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(username, name, role, salt, hash, role === 'employee' && req.body.can_delete ? 1 : 0, now());
  res.status(201).json({ ok: true });
});
app.put('/api/users/:id', auth, only('employee'), manager, (req, res) => {
  const t = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!t) return fail(res, 404, 'المستخدم غير موجود');
  if (req.body.password) {
    if (String(req.body.password).length < 6) return fail(res, 400, 'كلمة المرور 6 أحرف على الأقل');
    const { salt, hash } = makeUserHash(String(req.body.password));
    db.prepare('UPDATE users SET salt=?,hash=? WHERE id=?').run(salt, hash, t.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(t.id);
  }
  if (typeof req.body.active === 'boolean') {
    if (t.id === req.user.id) return fail(res, 400, 'لا يمكنك إيقاف حسابك');
    db.prepare('UPDATE users SET active=? WHERE id=?').run(req.body.active ? 1 : 0, t.id);
    if (!req.body.active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(t.id);
  }
  res.json({ ok: true });
});

/* ---------------- الملفات الثابتة ---------------- */
app.get('/healthz', (req, res) => res.send('ok'));
app.use('/api', (req, res) => fail(res, 404, 'غير موجود'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: true }));
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => { // eslint-disable-line
  console.error(err);
  fail(res, 500, 'حدث خطأ غير متوقع');
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`الخادم يعمل على المنفذ ${PORT}`));
module.exports = app;
