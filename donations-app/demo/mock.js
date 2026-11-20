/* خادم تجريبي داخل المتصفح: يحاكي واجهة الخادم الحقيقي ليعمل التطبيق نفسه هنا */
(function () {
  const PRI_AR = { urgent: 'عاجل جداً', important: 'مهم', normal: 'عادي' };
  const ST_AR = { new: 'جديد', in_progress: 'قيد التنفيذ', received: 'تم الاستلام', failed: 'تعذر الاستلام', postponed: 'مؤجل' };
  const ACTIVE = ['new', 'in_progress', 'postponed'];
  const USERS = [
    { id: 1, username: 'admin', name: 'مشرف الجمعية', role: 'employee', can_delete: true, can_manage: true, active: 1 },
    { id: 2, username: 'driver', name: 'عبدالله السائق', role: 'driver', can_delete: false, can_manage: false, active: 1 },
  ];
  const M = (window.MOCK = { uid: 1, reqs: [], logs: [], notifs: [], nextId: 1007, nid: 1, nlog: 1, ES: [] });
  const now = Date.now(), H = 3600e3, D = 24 * H;
  const pk = (ms) => { const d = new Date(ms); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const mk = (id, o) => M.reqs.push({ id, created_at: now - 2 * D, updated_at: now, created_by: 1, created_by_name: 'مشرف الجمعية', address: '', map_url: '', notes: '', items: '', est_value: 0, status: 'new', priority: 'normal', deleted: 0, driver_id: null, driver_name: null, started_at: null, received_at: null, failed_at: null, fail_reason: null, postponed_at: null, postpone_note: null, receive_notes: null, ...o });
  mk(1001, { donor_name: 'محمد العتيبي', donor_phone: '0551234567', district: 'حي النرجس', address: 'شارع الأمير سلطان، عمارة 12', donation_type: 'أثاث', items: 'كنب 3 مقاعد، ثلاجة صغيرة، 4 أكياس ملابس', priority: 'urgent', est_value: 2500, pickup_at: pk(now + 3 * H), notes: 'الاتصال قبل الوصول بنصف ساعة', created_at: now - 2 * H });
  mk(1002, { donor_name: 'نورة القحطاني', donor_phone: '0507654321', district: 'حي الياسمين', address: 'فيلا 7 خلف الحديقة', donation_type: 'ملابس', items: '6 أكياس ملابس نسائية وأطفال', priority: 'important', est_value: 600, pickup_at: pk(now + D), created_at: now - 5 * H });
  mk(1003, { donor_name: 'خالد الدوسري', donor_phone: '0533001122', district: 'حي الملقا', donation_type: 'أجهزة كهربائية', items: 'غسالة، مايكرويف', priority: 'normal', est_value: 1200, pickup_at: pk(now + 2 * D), created_at: now - 8 * H });
  mk(1004, { donor_name: 'سارة المطيري', donor_phone: '0561112233', district: 'حي العليا', donation_type: 'كتب', items: 'صندوقان كتب', priority: 'normal', est_value: 150, status: 'received', driver_id: 2, driver_name: 'عبدالله السائق', started_at: now - 26 * H, received_at: now - 25 * H, created_at: now - 2 * D });
  mk(1005, { donor_name: 'فهد الشمري', donor_phone: '0599887766', district: 'حي الصحافة', donation_type: 'ألعاب ومستلزمات أطفال', items: 'سرير أطفال وألعاب', priority: 'important', est_value: 800, status: 'failed', driver_id: 2, driver_name: 'عبدالله السائق', failed_at: now - 20 * H, fail_reason: 'المتبرع لا يرد على الاتصال', created_at: now - 2 * D });
  mk(1006, { donor_name: 'ريم الحربي', donor_phone: '0544556677', district: 'حي الرحمانية', donation_type: 'أدوات منزلية', items: 'أطقم أواني وصحون', priority: 'normal', est_value: 300, status: 'postponed', postponed_at: now - 6 * H, postpone_note: 'المتبرعة مسافرة حتى نهاية الأسبوع', pickup_at: pk(now + 3 * D), created_at: now - 3 * D });
  const log = (rid, uid, action, details, at) => M.logs.push({ id: M.nlog++, request_id: rid, user_name: uid === 2 ? 'عبدالله السائق' : 'مشرف الجمعية', action, details: details || null, at: at || Date.now() });
  M.reqs.forEach((r) => log(r.id, 1, 'إضافة الطلب', 'الأولوية: ' + PRI_AR[r.priority], r.created_at));
  log(1004, 2, 'بدء الاستلام', null, now - 26 * H); log(1004, 2, 'تم الاستلام', null, now - 25 * H);
  log(1005, 2, 'تعذر الاستلام', 'السبب: المتبرع لا يرد على الاتصال', now - 20 * H);
  log(1006, 2, 'تأجيل الاستلام', 'ملاحظة: المتبرعة مسافرة', now - 6 * H);

  class FakeES {
    constructor() { this.l = {}; this.uid = M.uid; M.ES.push(this); }
    addEventListener(t, f) { (this.l[t] = this.l[t] || []).push(f); }
    close() { M.ES = M.ES.filter((x) => x !== this); }
  }
  window.EventSource = FakeES;
  const emit = (uid, ev, data) => M.ES.filter((e) => e.uid === uid).forEach((e) => setTimeout(() => (e.l[ev] || []).forEach((f) => f({ data: JSON.stringify(data) })), 30));
  const changed = () => USERS.forEach((u) => emit(u.id, 'changed', {}));
  const notify = (role, rid, kind, message) => USERS.filter((u) => u.role === role).forEach((u) => {
    const n = { id: M.nid++, user_id: u.id, request_id: rid, kind, message, created_at: Date.now(), is_read: 0 };
    M.notifs.push(n); emit(u.id, 'notify', n); window.MOCK_onNotify && window.MOCK_onNotify();
  });
  const cur = () => USERS.find((u) => u.id === M.uid);
  const view = (r, role) => { const o = { ...r }; delete o.deleted; if (role === 'driver') { delete o.est_value; delete o.created_by; delete o.created_by_name; } return o; };
  const rank = (p) => ({ urgent: 0, important: 1, normal: 2 }[p]);
  const live = () => M.reqs.filter((r) => !r.deleted);
  const err = (status, error) => ({ status, body: { error } });
  const dayStart = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

  function handle(path, q, method, b) {
    const u = cur();
    let m;
    if (path === '/me') return { body: { user: u } };
    if (path === '/notifications' && method === 'GET') { const items = M.notifs.filter((n) => n.user_id === u.id).slice().reverse(); return { body: { items, unread: items.filter((n) => !n.is_read).length } }; }
    if (path === '/notifications/read') { M.notifs.forEach((n) => { if (n.user_id === u.id) n.is_read = 1; }); return { body: { ok: true } }; }
    if (path === '/districts') return { body: { items: [...new Set(live().map((r) => r.district))] } };
    if (path === '/stats') {
      const c = (f) => live().filter(f).length;
      return { body: { total: live().length, new: c((r) => r.status === 'new'), urgent: c((r) => r.priority === 'urgent' && ACTIVE.includes(r.status)), in_progress: c((r) => r.status === 'in_progress'), received: c((r) => r.status === 'received'), failed: c((r) => r.status === 'failed'), postponed: c((r) => r.status === 'postponed') } };
    }
    if (path === '/requests' && method === 'GET') {
      let rows = live();
      if (u.role === 'driver') {
        const tab = q.get('tab') || 'active';
        rows = rows.filter((r) => tab === 'active' ? ACTIVE.includes(r.status) && (r.driver_id === null || r.driver_id === u.id) : tab === 'done' ? r.status === 'received' && r.driver_id === u.id : r.status === 'failed' && r.driver_id === u.id);
        rows.sort((a, b) => rank(a.priority) - rank(b.priority) || (a.pickup_at || '9').localeCompare(b.pickup_at || '9'));
      } else {
        if (q.get('status')) rows = rows.filter((r) => r.status === q.get('status'));
        if (q.get('active') === '1') rows = rows.filter((r) => ACTIVE.includes(r.status));
        if (q.get('priority')) rows = rows.filter((r) => r.priority === q.get('priority'));
        if (q.get('district')) rows = rows.filter((r) => r.district.includes(q.get('district')));
        if (q.get('from')) rows = rows.filter((r) => r.created_at >= dayStart(q.get('from')));
        if (q.get('to')) rows = rows.filter((r) => r.created_at < dayStart(q.get('to')) + D);
        if (q.get('q')) { const t = q.get('q'); rows = rows.filter((r) => [r.donor_name, r.donor_phone, String(r.id), r.district, r.address].some((x) => (x || '').includes(t))); }
        const s = q.get('sort');
        rows.sort(s === 'value' ? (a, b) => b.est_value - a.est_value : s === 'priority' ? (a, b) => rank(a.priority) - rank(b.priority) || b.est_value - a.est_value : s === 'pickup' ? (a, b) => (a.pickup_at || '9').localeCompare(b.pickup_at || '9') : (a, b) => b.id - a.id);
      }
      return { body: { items: rows.map((r) => view(r, u.role)) } };
    }
    if (path === '/requests' && method === 'POST') {
      if (!b.donor_name || !b.donor_phone || !b.district) return err(400, 'أكمل الحقول المطلوبة: الاسم والجوال والحي');
      const id = M.nextId++;
      mk(id, { created_at: Date.now(), donor_name: b.donor_name, donor_phone: b.donor_phone, district: b.district, address: b.address, map_url: b.map_url, donation_type: b.donation_type, items: b.items, notes: b.notes, pickup_at: b.pickup_at, priority: b.priority, est_value: Number(b.est_value || 0) });
      log(id, 1, 'إضافة الطلب', 'الأولوية: ' + PRI_AR[b.priority]);
      const urgent = b.priority === 'urgent';
      notify('driver', id, urgent ? 'urgent' : 'new', `${urgent ? '🚨 طلب عاجل جداً' : 'طلب جديد'} #${id} — حي ${b.district} — ${b.donation_type}${urgent ? ' (يجب استلامه اليوم)' : ''}`);
      changed(); return { status: 201, body: { item: view(M.reqs.find((r) => r.id === id), 'employee') } };
    }
    if ((m = path.match(/^\/requests\/(\d+)(\/(\w+))?$/))) {
      const r = live().find((x) => x.id === Number(m[1]));
      if (!r) return err(404, 'الطلب غير موجود');
      const sub = m[3];
      if (!sub && method === 'GET') return { body: u.role === 'driver' ? { item: view(r, 'driver') } : { item: view(r, 'employee'), logs: M.logs.filter((l) => l.request_id === r.id) } };
      if (!sub && method === 'PUT') {
        const old = r.priority; Object.assign(r, { donor_name: b.donor_name, donor_phone: b.donor_phone, district: b.district, address: b.address, map_url: b.map_url, donation_type: b.donation_type, items: b.items, notes: b.notes, pickup_at: b.pickup_at, priority: b.priority, est_value: Number(b.est_value || 0) });
        log(r.id, 1, 'تعديل بيانات الطلب'); if (old !== r.priority) log(r.id, 1, 'تغيير الأولوية', `من «${PRI_AR[old]}» إلى «${PRI_AR[r.priority]}»`);
        changed(); return { body: { item: view(r, 'employee') } };
      }
      if (!sub && method === 'DELETE') {
        if (r.status === 'received') return err(400, 'لا يمكن حذف طلب تم استلامه');
        r.deleted = 1; log(r.id, 1, 'حذف الطلب'); changed(); return { body: { ok: true } };
      }
      if (sub === 'priority') {
        const old = r.priority; r.priority = b.priority; log(r.id, 1, 'تغيير الأولوية', `من «${PRI_AR[old]}» إلى «${PRI_AR[r.priority]}»`);
        if (r.priority === 'urgent' && ACTIVE.includes(r.status)) notify('driver', r.id, 'urgent', `🚨 أصبح الطلب #${r.id} عاجلاً جداً (يجب استلامه اليوم)`);
        changed(); return { body: { item: view(r, 'employee') } };
      }
      if (sub === 'action') {
        if (u.role === 'employee') {
          r.status = 'new'; r.driver_id = null; r.driver_name = null; log(r.id, 1, 'إعادة فتح الطلب'); notify('driver', r.id, 'new', `أُعيد فتح الطلب #${r.id} — حي ${r.district}`); changed(); return { body: { item: view(r, 'employee') } };
        }
        if (!ACTIVE.includes(r.status)) return err(400, 'هذا الطلب مغلق ولا يمكن تغيير حالته');
        const t = Date.now(); r.driver_id = u.id; r.driver_name = u.name; r.updated_at = t; r.started_at = r.started_at || t;
        if (b.action === 'start') { r.status = 'in_progress'; log(r.id, 2, 'بدء الاستلام', 'بدأ السائق التوجه لاستلام الطلب'); }
        else if (b.action === 'done') { r.status = 'received'; r.received_at = t; r.receive_notes = b.notes || null; log(r.id, 2, 'تم الاستلام', b.notes); notify('employee', r.id, 'done', `✅ استلم ${u.name} الطلب #${r.id} من ${r.donor_name} (حي ${r.district})`); }
        else if (b.action === 'fail') {
          if (!(b.reason || '').trim()) return err(400, 'اكتب سبب تعذر الاستلام');
          r.status = 'failed'; r.failed_at = t; r.fail_reason = b.reason; log(r.id, 2, 'تعذر الاستلام', 'السبب: ' + b.reason); notify('employee', r.id, 'failed', `⚠️ تعذر استلام الطلب #${r.id} (${r.donor_name}) — السبب: ${b.reason}`);
        } else if (b.action === 'postpone') {
          if (!b.new_date) return err(400, 'حدّد الموعد الجديد');
          Object.assign(r, { status: 'postponed', pickup_at: b.new_date, postponed_at: t, postpone_note: b.notes || null, driver_id: null, driver_name: null, started_at: null });
          log(r.id, 2, 'تأجيل الاستلام', 'الموعد الجديد: ' + b.new_date.replace('T', ' ')); notify('employee', r.id, 'postponed', `⏰ أجّل ${u.name} الطلب #${r.id} (${r.donor_name}) إلى ${b.new_date.replace('T', ' ')}`);
        }
        changed(); return { body: { item: view(r, 'driver') } };
      }
    }
    if (path === '/reports') {
      const base = q.get('date') ? new Date(dayStart(q.get('date'))) : new Date(new Date().setHours(0, 0, 0, 0));
      const period = q.get('period'); let from, to;
      if (period === 'month') { from = new Date(base.getFullYear(), base.getMonth(), 1); to = new Date(base.getFullYear(), base.getMonth() + 1, 1); }
      else if (period === 'week') { from = new Date(base.getFullYear(), base.getMonth(), base.getDate() - ((base.getDay() + 1) % 7)); to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7); }
      else { from = base; to = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1); }
      const inr = (x) => x && x >= from.getTime() && x < to.getTime();
      const rec = live().filter((r) => r.status === 'received' && inr(r.received_at));
      const by = {}; rec.forEach((r) => { (by[r.driver_name] = by[r.driver_name] || { name: r.driver_name, count: 0, value: 0 }); by[r.driver_name].count++; by[r.driver_name].value += r.est_value; });
      const label = (period === 'month' ? 'شهر ' : period === 'week' ? 'أسبوع ' : 'يوم ') + from.toLocaleDateString('ar-u-ca-gregory-nu-latn', { dateStyle: 'medium' });
      return { body: { period, label, metrics: { received_requests: live().filter((r) => inr(r.created_at)).length, picked_up: rec.length, remaining: live().filter((r) => ACTIVE.includes(r.status)).length, failed: live().filter((r) => r.status === 'failed' && inr(r.failed_at)).length, postponed: live().filter((r) => r.status === 'postponed' && inr(r.postponed_at)).length, total_value: rec.reduce((s, r) => s + r.est_value, 0) }, drivers: Object.values(by), rows: [] } };
    }
    if (path === '/users' && method === 'GET') return { body: { items: USERS } };
    if (path === '/users') return { body: { ok: true } };
    if (path === '/password' || path === '/logout' || path === '/login') return { body: { ok: true, user: u } };
    return err(404, 'غير موجود في النسخة التجريبية');
  }
  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = async (url, opts = {}) => {
    const u = new URL(url, location.href);
    if (!u.pathname.startsWith('/api/')) return realFetch ? realFetch(url, opts) : Promise.reject(new Error('offline'));
    const out = handle(u.pathname.slice(4), u.searchParams, (opts.method || 'GET').toUpperCase(), opts.body ? JSON.parse(opts.body) : {});
    return new Response(JSON.stringify(out.body), { status: out.status || 200, headers: { 'Content-Type': 'application/json' } });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="/api/"]');
    if (a) { e.preventDefault(); toast('تصدير Excel يعمل في النسخة الكاملة المنشورة على خادم'); }
  }, true);
})();
