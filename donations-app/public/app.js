/* نظام إدارة ومتابعة طلبات استلام التبرعات — واجهة المستخدم (عربي RTL) */
'use strict';

const PRI = { urgent: 'عاجل جداً', important: 'مهم', normal: 'عادي' };
const STATUS = { new: 'جديد', in_progress: 'قيد التنفيذ', received: 'تم الاستلام', failed: 'تعذر الاستلام', postponed: 'مؤجل' };
const TYPES = ['ملابس', 'أثاث', 'أجهزة كهربائية', 'أجهزة إلكترونية', 'أدوات منزلية', 'ألعاب ومستلزمات أطفال', 'كتب', 'متنوعة', 'أخرى'];
const LOCALE = 'ar-u-ca-gregory-nu-latn';

let me = null;
let es = null;
let unread = 0;
let renderToken = 0;
const $app = document.getElementById('app');

/* ---------- أدوات ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return el;
}
const $ = (sel, root = document) => root.querySelector(sel);
const fmt = (ms) => (ms ? new Date(ms).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtPick = (s) => {
  if (!s) return 'غير محدد';
  const d = new Date(s);
  return s.length > 10 ? d.toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : d.toLocaleDateString(LOCALE, { dateStyle: 'medium' });
};
const money = (n) => Number(n || 0).toLocaleString(LOCALE) + ' ريال';
const todayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  let data = {};
  try { data = await res.json(); } catch { /* ليس JSON */ }
  if (res.status === 401 && path !== '/login') { me = null; closeStream(); showLogin(data.error); throw new Error(data.error || 'انتهت الجلسة'); }
  if (!res.ok) throw new Error(data.error || 'تعذر تنفيذ العملية');
  return data;
}

function toast(msg, kind = '', ms = 6000) {
  const t = h('div', { class: 'toast ' + kind }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), ms);
  t.addEventListener('click', () => t.remove());
}

function modal(title, bodyNodes, buttons) {
  const bg = h('div', { class: 'modal-bg' });
  const close = () => bg.remove();
  const box = h('div', { class: 'modal', role: 'dialog', 'aria-label': title },
    h('h3', {}, title), bodyNodes,
    h('div', { class: 'grid2', style: 'margin-top:1rem' }, buttons.map((b) => h('button', {
      class: 'btn ' + (b.cls || ''), type: 'button',
      onclick: async (e) => { e.target.disabled = true; try { if ((await b.run(close)) !== false) close(); else e.target.disabled = false; } catch (err) { e.target.disabled = false; toast(err.message, 'failed'); } },
    }, b.label))));
  bg.append(box);
  bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
  document.body.append(bg);
  const first = box.querySelector('input,textarea,select'); if (first) first.focus();
  return close;
}
const anyModal = () => !!document.querySelector('.modal-bg');

function beep(urgent) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const seq = urgent ? [880, 660, 880, 660, 880] : [740, 990];
    seq.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.22; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.start(t); o.stop(t + 0.21);
    });
  } catch { /* الصوت غير متاح */ }
}

/* ---------- الشارات ---------- */
const priBadge = (p) => h('span', { class: 'badge b-' + p }, PRI[p]);
const stBadge = (s) => h('span', { class: 'badge s-' + s }, STATUS[s]);
const isActive = (s) => ['new', 'in_progress', 'postponed'].includes(s);

/* ---------- الاتصال الفوري والإشعارات ---------- */
function openStream() {
  closeStream();
  es = new EventSource('/api/stream');
  let t;
  es.addEventListener('changed', () => { clearTimeout(t); t = setTimeout(() => { if (!anyModal()) rerenderIfLive(); }, 250); });
  es.addEventListener('notify', (e) => {
    const n = JSON.parse(e.data);
    unread++; updateBell();
    const kind = n.kind === 'urgent' ? 'urgent' : n.kind === 'done' ? 'done' : n.kind === 'failed' ? 'failed' : '';
    toast(n.message, kind, n.kind === 'urgent' ? 12000 : 7000);
    beep(n.kind === 'urgent');
    if (navigator.vibrate) navigator.vibrate(n.kind === 'urgent' ? [300, 120, 300, 120, 500] : [200]);
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try { navigator.serviceWorker.ready.then((r) => r.showNotification('استلام التبرعات', { body: n.message, icon: '/icons/icon-192.png', tag: 'n' + n.id, dir: 'rtl', lang: 'ar', vibrate: [200, 100, 200] })); } catch { /* */ }
    }
  });
}
function closeStream() { if (es) { es.close(); es = null; } }
function updateBell() { const d = $('#bell .dot'); if (d) { d.textContent = unread > 99 ? '99+' : unread; d.classList.toggle('hidden', !unread); } }
async function refreshUnread() { try { unread = (await api('/notifications')).unread; updateBell(); } catch { /* */ } }

function enableAlerts() {
  if (!('Notification' in window)) return toast('المتصفح لا يدعم إشعارات النظام');
  Notification.requestPermission().then((p) => { toast(p === 'granted' ? 'تم تفعيل إشعارات الجهاز' : 'لم يتم السماح بالإشعارات من إعدادات المتصفح'); beep(false); });
}
async function showNotifications() {
  const { items } = await api('/notifications');
  const list = h('div', {}, items.length ? items.map((n) => h('div', { class: 'notif' + (n.is_read ? '' : ' unread'), onclick: () => { document.querySelector('.modal-bg')?.remove(); if (me.role === 'employee' && n.request_id) location.hash = '#/request/' + n.request_id; } },
    n.message, h('div', { class: 'muted' }, fmt(n.created_at)))) : h('div', { class: 'empty' }, 'لا توجد إشعارات'));
  await api('/notifications/read', { method: 'POST', body: {} });
  unread = 0; updateBell();
  const btns = [{ label: 'إغلاق', run: () => true }];
  if ('Notification' in window && Notification.permission !== 'granted') btns.unshift({ label: 'تفعيل إشعارات الجهاز', cls: 'primary', run: () => { enableAlerts(); return true; } });
  modal('الإشعارات', list, btns);
}

/* ---------- الإطار العام ---------- */
function shell(title, content) {
  const nav = me.role === 'employee' ? [['#/dashboard', '📊', 'الرئيسية'], ['#/requests', '📋', 'الطلبات'], ['#/new', '➕', 'طلب جديد'], ['#/reports', '📈', 'التقارير'], ['#/more', '☰', 'المزيد']]
    : [['#/', '🚚', 'الطلبات'], ['#/more', '☰', 'حسابي']];
  const cur = location.hash || (me.role === 'employee' ? '#/dashboard' : '#/');
  $app.replaceChildren(
    h('header', { class: 'topbar' },
      h('h1', {}, title, h('div', { class: 'who' }, me.name + (me.role === 'driver' ? ' — سائق' : ' — موظف'))),
      h('button', { class: 'iconbtn', id: 'bell', 'aria-label': 'الإشعارات', onclick: () => showNotifications().catch((e) => toast(e.message)) }, '🔔', h('span', { class: 'dot hidden' }))),
    h('main', {}, content),
    h('nav', { class: 'nav' }, nav.map(([href, ic, lb]) => h('a', { href, class: cur.split('?')[0] === href || (href !== '#/' && cur.startsWith(href + '/')) ? 'on' : '' }, h('b', {}, ic), lb))));
  updateBell();
}

/* ---------- تسجيل الدخول ---------- */
function showLogin(msg) {
  closeStream();
  const err = h('div', { class: 'err hidden', id: 'lerr' });
  if (msg) { err.textContent = msg; err.classList.remove('hidden'); }
  const user = h('input', { id: 'u', autocomplete: 'username', autocapitalize: 'none', required: true });
  const pass = h('input', { id: 'p', type: 'password', autocomplete: 'current-password', required: true });
  const form = h('form', { class: 'login', onsubmit: async (e) => {
    e.preventDefault();
    try { await api('/login', { method: 'POST', body: { username: user.value, password: pass.value } }); await boot(); }
    catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  } },
  h('img', { class: 'logo', src: '/icons/icon.svg', alt: '' }),
  h('h1', {}, 'نظام إدارة ومتابعة طلبات استلام التبرعات'),
  err, h('label', { for: 'u' }, 'اسم المستخدم'), user, h('label', { for: 'p' }, 'كلمة المرور'), pass,
  h('button', { class: 'btn primary block', style: 'margin-top:1.2rem', type: 'submit' }, 'تسجيل الدخول'));
  $app.replaceChildren(form);
}

/* ---------- التوجيه ---------- */
function parseHash() {
  const raw = (location.hash || '').slice(1) || (me.role === 'employee' ? '/dashboard' : '/');
  const [p, qs] = raw.split('?');
  return { parts: p.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(qs || '')) };
}
const LIVE = new Set(['dashboard', 'requests', 'request', '']);
function rerenderIfLive() {
  if (!me) return;
  const { parts } = parseHash();
  if (LIVE.has(parts[0] || '')) route(true);
}
async function route() {
  if (!me) return;
  const token = ++renderToken;
  const { parts, q } = parseHash();
  try {
    let view;
    if (me.role === 'driver') view = parts[0] === 'more' ? await viewAccount() : await viewDriver(q);
    else {
      const p = parts[0] || 'dashboard';
      if (p === 'dashboard') view = await viewDashboard();
      else if (p === 'requests') view = await viewList(q);
      else if (p === 'request') view = await viewDetail(parts[1]);
      else if (p === 'new') view = await viewForm();
      else if (p === 'edit') view = await viewForm(parts[1]);
      else if (p === 'reports') view = await viewReports(q);
      else if (p === 'users') view = await viewUsers();
      else if (p === 'more') view = await viewMore();
      else view = await viewDashboard();
    }
    if (token === renderToken) { shell(view.title, view.node); if (view.after) view.after(); }
  } catch (e) { if (me) toast(e.message, 'failed'); }
}
window.addEventListener('hashchange', () => route());

/* ---------- لوحة تحكم الموظف ---------- */
async function viewDashboard() {
  const s = await api('/stats');
  const card = (cls, n, label, href, wide) => h('button', { class: 'stat ' + cls + (wide ? ' wide' : ''), onclick: () => { location.hash = href; } }, h('span', { class: 'n' }, n), label);
  return { title: 'لوحة التحكم', node: h('div', {},
    s.urgent ? h('div', { class: 'alertbar' }, `🚨 يوجد ${s.urgent} طلب عاجل جداً بانتظار الاستلام`) : null,
    h('div', { class: 'stats' },
      card('c-total', s.total, 'إجمالي الطلبات', '#/requests', true),
      card('c-new', s.new, 'الطلبات الجديدة', '#/requests?status=new'),
      card('c-urgent', s.urgent, 'الطلبات العاجلة', '#/requests?priority=urgent&active=1'),
      card('c-prog', s.in_progress, 'قيد التنفيذ', '#/requests?status=in_progress'),
      card('c-done', s.received, 'تم استلامها', '#/requests?status=received'),
      card('', s.failed, 'تعذر استلامها', '#/requests?status=failed'),
      card('c-post', s.postponed, 'المؤجلة', '#/requests?status=postponed')),
    h('div', { style: 'margin-top:1rem' }, h('a', { class: 'btn primary block', href: '#/new' }, '➕ إضافة طلب جديد'))) };
}

/* ---------- قائمة الطلبات (الموظف) ---------- */
function requestCardEmp(r) {
  return h('a', { class: 'card p-' + r.priority, href: '#/request/' + r.id, style: 'display:block;text-decoration:none;color:inherit' },
    h('div', { class: 'row spread' }, h('span', { class: 'num' }, '#' + r.id), h('span', { class: 'row' }, priBadge(r.priority), stBadge(r.status))),
    h('div', { style: 'font-weight:700;margin-top:.3rem' }, r.donor_name),
    h('div', { class: 'muted' }, `حي ${r.district} — ${r.donation_type}`),
    h('div', { class: 'row spread muted', style: 'margin-top:.2rem' }, h('span', {}, 'الاستلام: ' + fmtPick(r.pickup_at)), h('span', {}, r.est_value ? money(r.est_value) : '')),
    r.driver_name ? h('div', { class: 'muted' }, '🚚 ' + r.driver_name) : null);
}
let lastFilters = {};
async function viewList(q) {
  const f = { ...q };
  lastFilters = f;
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const [{ items }, { items: dists }] = await Promise.all([api('/requests?' + qs), api('/districts')]);
  const go = () => {
    const nq = {};
    for (const id of ['q', 'status', 'priority', 'district', 'from', 'to', 'sort']) { const v = $('#f_' + id).value; if (v) nq[id] = v; }
    if (f.active === '1' && !nq.status) nq.active = '1';
    location.hash = '#/requests' + (Object.keys(nq).length ? '?' + new URLSearchParams(nq) : '');
  };
  const sel = (id, opts, val) => h('select', { id: 'f_' + id, onchange: go }, opts.map(([v, l]) => h('option', { value: v, selected: v === (val || '') }, l)));
  const filters = h('div', { class: 'card plain' }, h('div', { class: 'filters' },
    h('input', { id: 'f_q', class: 'full', type: 'search', placeholder: '🔍 بحث: اسم المتبرع / الجوال / رقم الطلب / الحي', value: f.q || '', onkeydown: (e) => { if (e.key === 'Enter') go(); } }),
    sel('status', [['', 'كل الحالات'], ...Object.entries(STATUS)], f.status),
    sel('priority', [['', 'كل الأولويات'], ...Object.entries(PRI)], f.priority),
    h('input', { id: 'f_district', placeholder: 'الحي', list: 'dl', value: f.district || '', onchange: go }),
    sel('sort', [['', 'الأحدث أولاً'], ['priority', 'حسب الأولوية'], ['value', 'حسب القيمة التقديرية'], ['pickup', 'حسب موعد الاستلام']], f.sort),
    h('div', {}, h('label', { for: 'f_from', style: 'margin:0' }, 'من تاريخ'), h('input', { id: 'f_from', type: 'date', value: f.from || '', onchange: go })),
    h('div', {}, h('label', { for: 'f_to', style: 'margin:0' }, 'إلى تاريخ'), h('input', { id: 'f_to', type: 'date', value: f.to || '', onchange: go })),
    h('button', { class: 'btn primary full', onclick: go }, 'بحث'),
    h('datalist', { id: 'dl' }, dists.map((d) => h('option', { value: d })))));
  const hasF = Object.keys(f).length > 0;
  return { title: 'الطلبات', node: h('div', {}, filters,
    h('div', { class: 'row spread', style: 'margin-bottom:.5rem' }, h('span', { class: 'muted' }, `عدد النتائج: ${items.length}`), hasF ? h('a', { href: '#/requests', class: 'btn small' }, 'مسح التصفية') : null),
    items.length ? items.map(requestCardEmp) : h('div', { class: 'empty' }, 'لا توجد طلبات مطابقة')) };
}

/* ---------- تفاصيل الطلب (الموظف) ---------- */
async function viewDetail(id) {
  const { item: r, logs } = await api('/requests/' + id);
  const kv = (k, v) => [h('dt', {}, k), h('dd', {}, v || '—')];
  const prio = h('div', { class: 'seg' }, Object.entries(PRI).map(([k, v]) => h('button', { type: 'button', class: k + (r.priority === k ? ' on' : ''),
    onclick: async () => { try { await api(`/requests/${r.id}/priority`, { method: 'POST', body: { priority: k } }); toast('تم تغيير الأولوية'); route(); } catch (e) { toast(e.message, 'failed'); } } }, v)));
  const mapBtn = mapLink(r);
  const node = h('div', {},
    h('a', { href: '#/requests', class: 'muted' }, '→ رجوع للطلبات'),
    h('div', { class: 'card p-' + r.priority },
      h('div', { class: 'row spread' }, h('h2', { style: 'margin:0' }, 'طلب #' + r.id), h('span', { class: 'row' }, priBadge(r.priority), stBadge(r.status))),
      isActive(r.status) && r.priority === 'urgent' ? h('span', { class: 'today' }, 'يجب استلامه اليوم') : null,
      h('dl', { class: 'kv' },
        kv('تاريخ التسجيل', fmt(r.created_at)), kv('المتبرع', r.donor_name),
        kv('الجوال', h('a', { href: 'tel:' + r.donor_phone, dir: 'ltr' }, r.donor_phone)),
        kv('الحي', r.district), kv('العنوان', r.address), kv('الموقع', mapBtn ? h('a', { href: mapBtn, target: '_blank', rel: 'noopener' }, 'فتح على خرائط Google') : ''),
        kv('نوع التبرع', r.donation_type), kv('تفاصيل الأغراض', r.items), kv('ملاحظات', r.notes),
        kv('موعد الاستلام', fmtPick(r.pickup_at)), kv('القيمة التقديرية', r.est_value ? money(r.est_value) : ''),
        kv('السائق', r.driver_name), kv('تاريخ الاستلام', r.received_at ? fmt(r.received_at) : ''),
        r.fail_reason ? kv('سبب التعذر', r.fail_reason) : null, r.postpone_note ? kv('ملاحظة التأجيل', r.postpone_note) : null,
        r.receive_notes ? kv('ملاحظات الاستلام', r.receive_notes) : null)),
    h('div', { class: 'card plain' }, h('b', {}, 'تغيير الأولوية'), prio),
    h('div', { class: 'grid2' },
      h('a', { class: 'btn', href: '#/edit/' + r.id }, '✏️ تعديل البيانات'),
      ['failed', 'postponed'].includes(r.status) ? h('button', { class: 'btn primary', onclick: async () => { try { await api(`/requests/${r.id}/action`, { method: 'POST', body: { action: 'reopen' } }); toast('أُعيد الطلب للقائمة الجديدة'); route(); } catch (e) { toast(e.message, 'failed'); } } }, '↩️ إعادة فتح الطلب') : null,
      me.can_delete && r.status !== 'received' ? h('button', { class: 'btn red', onclick: () => confirmDelete(r) }, '🗑️ حذف الطلب') : null),
    h('h3', {}, 'سجل العمليات'),
    h('ul', { class: 'timeline' }, logs.map((l) => h('li', {}, h('b', {}, l.action), h('span', {}, `${l.user_name} — ${fmt(l.at)}`), l.details ? h('div', { class: 'muted' }, l.details) : null))));
  return { title: 'تفاصيل الطلب', node };
}
function confirmDelete(r) {
  modal('حذف الطلب #' + r.id, h('p', {}, 'سيُحذف الطلب من القوائم، ويبقى أثر الحذف في سجل العمليات. هل أنت متأكد؟'), [
    { label: 'تراجع', run: () => true },
    { label: 'نعم، احذف', cls: 'red', run: async () => { await api('/requests/' + r.id, { method: 'DELETE' }); toast('تم حذف الطلب'); location.hash = '#/requests'; } },
  ]);
}
function mapLink(r) {
  if (r.map_url) return r.map_url;
  const addr = [r.address, r.district].filter(Boolean).join(' ');
  return addr ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr) : '';
}

/* ---------- نموذج إضافة/تعديل طلب ---------- */
async function viewForm(id) {
  let r = { priority: 'normal', donation_type: TYPES[0], est_value: '' };
  if (id) r = (await api('/requests/' + id)).item;
  const { items: dists } = await api('/districts');
  const v = { ...r };
  const inp = (name, label, o = {}) => [h('label', { for: name }, label, o.required ? h('span', { class: 'req' }, ' *') : null),
    (o.tag === 'textarea' ? h('textarea', { id: name, maxlength: o.max }, v[name] || '') : h('input', { id: name, type: o.type || 'text', value: v[name] ?? '', required: o.required, list: o.list, inputmode: o.mode, dir: o.dir, placeholder: o.ph, maxlength: o.max, min: o.min }))];
  const typeSel = h('select', { id: 'donation_type' }, [...new Set([...TYPES, v.donation_type])].map((t) => h('option', { value: t, selected: t === v.donation_type }, t)));
  const segs = h('div', { class: 'seg' }, Object.entries(PRI).map(([k, l]) => h('button', { type: 'button', class: k + (v.priority === k ? ' on' : ''), 'data-k': k,
    onclick: (e) => { v.priority = k; segs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.k === k)); } }, l)));
  const err = h('div', { class: 'err hidden' });
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const body = { priority: v.priority, donation_type: typeSel.value };
    for (const n of ['donor_name', 'donor_phone', 'district', 'address', 'map_url', 'items', 'notes', 'pickup_at', 'est_value']) body[n] = $('#' + n, form).value;
    try {
      const res = await api(id ? '/requests/' + id : '/requests', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'تم حفظ التعديلات' : `تم تسجيل الطلب رقم ${res.item.id} وظهر عند السائق`);
      location.hash = '#/request/' + res.item.id;
    } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); window.scrollTo(0, 0); }
  } },
  h('h2', {}, id ? 'تعديل الطلب #' + id : 'إضافة طلب جديد'),
  !id ? h('div', { class: 'muted' }, 'رقم الطلب وتاريخ التسجيل يُنشآن تلقائياً.') : null, err,
  inp('donor_name', 'اسم المتبرع', { required: true, max: 120 }), inp('donor_phone', 'رقم جوال المتبرع', { required: true, type: 'tel', mode: 'tel', dir: 'ltr', ph: '05xxxxxxxx' }),
  inp('district', 'الحي', { required: true, list: 'dists', max: 80 }), h('datalist', { id: 'dists' }, dists.map((d) => h('option', { value: d }))),
  inp('address', 'العنوان', { tag: 'textarea', max: 400 }),
  inp('map_url', 'رابط الموقع على خرائط Google', { type: 'url', dir: 'ltr', ph: 'https://maps.google.com/…' }),
  h('label', { for: 'donation_type' }, 'نوع التبرع', h('span', { class: 'req' }, ' *')), typeSel,
  inp('items', 'تفاصيل الأغراض الموجودة', { tag: 'textarea', max: 3000 }), inp('notes', 'ملاحظات إضافية', { tag: 'textarea', max: 2000 }),
  inp('pickup_at', 'موعد الاستلام المطلوب', { type: 'datetime-local' }),
  h('label', {}, 'أولوية الطلب'), segs,
  inp('est_value', 'القيمة التقديرية للأغراض (ريال)', { type: 'number', mode: 'decimal', min: 0 }),
  h('div', { class: 'grid2', style: 'margin-top:1.2rem' }, h('a', { class: 'btn', href: id ? '#/request/' + id : '#/dashboard' }, 'إلغاء'), h('button', { class: 'btn primary', type: 'submit' }, id ? 'حفظ التعديلات' : 'تسجيل الطلب')));
  return { title: id ? 'تعديل طلب' : 'طلب جديد', node: form };
}

/* ---------- واجهة السائق ---------- */
let driverTab = 'active';
async function viewDriver() {
  const { items } = await api('/requests?tab=' + driverTab);
  const urgentN = driverTab === 'active' ? items.filter((r) => r.priority === 'urgent').length : 0;
  const tabs = h('div', { class: 'tabs' }, [['active', 'المطلوب استلامه'], ['done', 'المستلمة'], ['failed', 'المتعذرة']].map(([k, l]) =>
    h('button', { class: driverTab === k ? 'on' : '', onclick: () => { driverTab = k; route(); } }, l)));
  const node = h('div', {},
    urgentN ? h('div', { class: 'alertbar' }, `🚨 لديك ${urgentN} طلب عاجل جداً — يجب استلامه اليوم`) : null, tabs,
    items.length ? items.map(driverCard) : h('div', { class: 'empty' }, driverTab === 'active' ? '🎉 لا توجد طلبات مطلوبة حالياً' : 'لا توجد طلبات'));
  return { title: 'طلبات الاستلام', node };
}
function driverCard(r) {
  const kv = (k, v) => [h('dt', {}, k), h('dd', {}, v || '—')];
  const active = isActive(r.status);
  const map = mapLink(r);
  return h('div', { class: 'card p-' + r.priority },
    h('div', { class: 'row spread' }, h('span', { class: 'num' }, 'طلب #' + r.id), h('span', { class: 'row' }, priBadge(r.priority), stBadge(r.status))),
    active && r.priority === 'urgent' ? h('span', { class: 'today' }, 'يجب استلامه اليوم') : null,
    h('dl', { class: 'kv' }, kv('المتبرع', r.donor_name), kv('الهاتف', h('span', { dir: 'ltr' }, r.donor_phone)), kv('الحي', r.district), kv('العنوان', r.address),
      kv('نوع التبرع', r.donation_type), kv('الأغراض', r.items), kv('ملاحظات الموظف', r.notes), kv('موعد الاستلام', fmtPick(r.pickup_at)),
      r.status === 'postponed' && r.postpone_note ? kv('سبب التأجيل', r.postpone_note) : null,
      r.status === 'failed' ? kv('سبب التعذر', r.fail_reason) : null, r.status === 'received' ? kv('تم الاستلام', fmt(r.received_at)) : null),
    active ? h('div', {},
      h('div', { class: 'grid2' },
        h('a', { class: 'btn blue', href: 'tel:' + r.donor_phone }, '📞 اتصال بالمتبرع'),
        h('a', { class: 'btn', href: map || '#', target: '_blank', rel: 'noopener', onclick: (e) => { if (!map) { e.preventDefault(); toast('لا يوجد موقع لهذا الطلب'); } } }, '📍 فتح الموقع')),
      h('div', { class: 'grid2', style: 'margin-top:.5rem' },
        r.status === 'in_progress' ? h('button', { class: 'btn', disabled: true }, '🚗 جارٍ الاستلام…') : h('button', { class: 'btn primary', onclick: () => doAction(r, 'start') }, '🚗 بدء الاستلام'),
        h('button', { class: 'btn green', onclick: () => askDone(r) }, '✅ تم الاستلام'),
        h('button', { class: 'btn red', onclick: () => askFail(r) }, '❌ تعذر الاستلام'),
        h('button', { class: 'btn orange', onclick: () => askPostpone(r) }, '⏰ تأجيل الاستلام'))) : null);
}
async function doAction(r, action, extra = {}) {
  await api(`/requests/${r.id}/action`, { method: 'POST', body: { action, ...extra } });
  route();
}
function askDone(r) {
  const notes = h('textarea', { placeholder: 'ملاحظات (اختياري)', maxlength: 1000 });
  modal('تأكيد استلام الطلب #' + r.id, h('div', {}, h('p', {}, 'هل تم استلام التبرعات من ' + r.donor_name + '؟'), notes), [
    { label: 'رجوع', run: () => true },
    { label: 'نعم، تم الاستلام', cls: 'green', run: async () => { await doAction(r, 'done', { notes: notes.value }); toast('تم تسجيل الاستلام وانتقل الطلب للمكتملة', 'done'); } },
  ]);
}
function askFail(r) {
  const reason = h('textarea', { placeholder: 'اكتب سبب عدم الاستلام (مثال: المتبرع لا يرد، العنوان غير صحيح…)', maxlength: 1000, required: true });
  modal('سبب تعذر استلام الطلب #' + r.id, reason, [
    { label: 'رجوع', run: () => true },
    { label: 'تسجيل التعذر', cls: 'red', run: async () => { if (!reason.value.trim()) { toast('سبب التعذر مطلوب', 'failed'); return false; } await doAction(r, 'fail', { reason: reason.value }); } },
  ]);
}
function askPostpone(r) {
  const d = new Date(Date.now() + 86400000); d.setMinutes(0);
  const when = h('input', { type: 'datetime-local', value: `${todayStr(d)}T${String(d.getHours()).padStart(2, '0')}:00` });
  const notes = h('textarea', { placeholder: 'ملاحظات / سبب التأجيل', maxlength: 1000 });
  modal('تأجيل الطلب #' + r.id, h('div', {}, h('label', {}, 'الموعد الجديد'), when, h('label', {}, 'الملاحظات'), notes), [
    { label: 'رجوع', run: () => true },
    { label: 'تأجيل', cls: 'orange', run: async () => { if (!when.value) { toast('حدّد الموعد الجديد', 'failed'); return false; } await doAction(r, 'postpone', { new_date: when.value, notes: notes.value }); toast('تم تأجيل الطلب'); } },
  ]);
}

/* ---------- التقارير ---------- */
async function viewReports(q) {
  const period = ['day', 'week', 'month'].includes(q.period) ? q.period : 'day';
  const date = q.date || todayStr();
  const rep = await api(`/reports?period=${period}&date=${date}`);
  const m = rep.metrics;
  const go = (p, d) => { location.hash = `#/reports?period=${p}&date=${d}`; };
  const tabs = h('div', { class: 'tabs no-print' }, [['day', 'يومي'], ['week', 'أسبوعي'], ['month', 'شهري']].map(([k, l]) => h('button', { class: period === k ? 'on' : '', onclick: () => go(k, date) }, l)));
  const stat = (n, l, c) => h('div', { class: 'stat ' + (c || ''), style: 'cursor:default' }, h('span', { class: 'n' }, n), l);
  const node = h('div', {},
    h('h2', {}, 'التقارير والإحصائيات'), tabs,
    h('div', { class: 'no-print' }, h('label', { for: 'rd', style: 'margin-top:0' }, 'التاريخ'), h('input', { id: 'rd', type: 'date', value: date, onchange: (e) => go(period, e.target.value) })),
    h('div', { class: 'card plain', style: 'margin-top:.8rem' }, h('b', {}, rep.label)),
    h('div', { class: 'stats' },
      stat(m.received_requests, 'الطلبات المستقبلة', 'c-new'), stat(m.picked_up, 'الطلبات المستلمة', 'c-done'),
      stat(m.remaining, 'المتبقية حالياً', 'c-prog'), stat(m.failed, 'المتعذر استلامها', 'c-urgent'),
      stat(m.postponed, 'المؤجلة', 'c-post'), stat(Number(m.total_value).toLocaleString(LOCALE), 'القيمة التقديرية المستلمة (ريال)', 'c-total')),
    h('h3', {}, 'إنجاز السائقين'),
    rep.drivers.length ? h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'السائق'), h('th', {}, 'الطلبات المنجزة'), h('th', {}, 'القيمة التقديرية'))),
      h('tbody', {}, rep.drivers.map((d) => h('tr', {}, h('td', {}, d.name), h('td', {}, d.count), h('td', {}, money(d.value)))))) : h('div', { class: 'muted' }, 'لا توجد استلامات في هذه الفترة'),
    h('div', { class: 'grid2 no-print', style: 'margin-top:1.2rem' },
      h('a', { class: 'btn primary', href: `/api/reports/export.xlsx?period=${period}&date=${date}` }, '📥 تصدير Excel'),
      h('button', { class: 'btn', onclick: () => window.print() }, '🖨️ تصدير PDF / طباعة')),
    h('p', { class: 'muted no-print' }, 'لتصدير PDF: اختر «حفظ كملف PDF» من نافذة الطباعة.'));
  return { title: 'التقارير', node };
}

/* ---------- المزيد / الحساب / المستخدمون ---------- */
async function viewMore() {
  return { title: 'المزيد', node: h('div', {}, h('h2', {}, 'المزيد'),
    me.can_manage ? h('a', { class: 'btn block', href: '#/users', style: 'margin-bottom:.6rem' }, '👥 إدارة المستخدمين والسائقين') : null,
    (await viewAccount()).node) };
}
async function viewAccount() {
  const old = h('input', { type: 'password', autocomplete: 'current-password' }), nw = h('input', { type: 'password', autocomplete: 'new-password' });
  return { title: 'حسابي', node: h('div', {},
    h('div', { class: 'card plain' }, h('b', {}, me.name), h('div', { class: 'muted' }, 'اسم المستخدم: ' + me.username)),
    h('button', { class: 'btn block', style: 'margin-bottom:.6rem', onclick: enableAlerts }, '🔔 تفعيل إشعارات الجهاز والصوت'),
    h('div', { class: 'card plain' }, h('b', {}, 'تغيير كلمة المرور'), h('label', {}, 'كلمة المرور الحالية'), old, h('label', {}, 'كلمة المرور الجديدة (6 أحرف على الأقل)'), nw,
      h('button', { class: 'btn primary block', style: 'margin-top:.8rem', onclick: async () => {
        try { await api('/password', { method: 'POST', body: { old_password: old.value, new_password: nw.value } }); toast('تم تغيير كلمة المرور'); old.value = nw.value = ''; } catch (e) { toast(e.message, 'failed'); } } }, 'حفظ')),
    h('button', { class: 'btn red block', onclick: async () => { await api('/logout', { method: 'POST', body: {} }); me = null; closeStream(); showLogin(); } }, 'تسجيل الخروج')) };
}
async function viewUsers() {
  const { items } = await api('/users');
  const add = () => {
    const f = { name: h('input'), username: h('input', { dir: 'ltr', autocapitalize: 'none' }), password: h('input', { type: 'password' }),
      role: h('select', {}, h('option', { value: 'driver' }, 'سائق'), h('option', { value: 'employee' }, 'موظف')), can_delete: h('select', {}, h('option', { value: '' }, 'بدون صلاحية حذف'), h('option', { value: '1' }, 'مع صلاحية حذف الطلبات')) };
    modal('إضافة مستخدم', h('div', {}, h('label', {}, 'الاسم'), f.name, h('label', {}, 'اسم المستخدم (إنجليزي)'), f.username, h('label', {}, 'كلمة المرور'), f.password, h('label', {}, 'نوع الحساب'), f.role, h('label', {}, 'الصلاحية (للموظف)'), f.can_delete), [
      { label: 'إلغاء', run: () => true },
      { label: 'إضافة', cls: 'primary', run: async () => { await api('/users', { method: 'POST', body: { name: f.name.value, username: f.username.value, password: f.password.value, role: f.role.value, can_delete: !!f.can_delete.value } }); toast('تمت الإضافة'); route(); } }]);
  };
  const resetPw = (u) => {
    const pw = h('input', { type: 'password' });
    modal('كلمة مرور جديدة: ' + u.name, pw, [{ label: 'إلغاء', run: () => true }, { label: 'حفظ', cls: 'primary', run: async () => { await api('/users/' + u.id, { method: 'PUT', body: { password: pw.value } }); toast('تم تغيير كلمة المرور'); } }]);
  };
  return { title: 'المستخدمون', node: h('div', {}, h('a', { href: '#/more', class: 'muted' }, '→ رجوع'), h('div', { class: 'row spread' }, h('h2', {}, 'إدارة المستخدمين'), h('button', { class: 'btn primary small', onclick: add }, '➕ إضافة')),
    items.map((u) => h('div', { class: 'card plain' + (u.active ? '' : ' muted') }, h('div', { class: 'row spread' }, h('b', {}, u.name), h('span', { class: 'badge ' + (u.role === 'driver' ? 's-in_progress' : 's-new') }, u.role === 'driver' ? 'سائق' : u.can_manage ? 'مشرف' : 'موظف')),
      h('div', { class: 'muted', dir: 'ltr', style: 'text-align:right' }, u.username + (u.active ? '' : ' (موقوف)')),
      h('div', { class: 'row', style: 'margin-top:.5rem' }, h('button', { class: 'btn small', onclick: () => resetPw(u) }, 'كلمة مرور جديدة'),
        u.id !== me.id ? h('button', { class: 'btn small ' + (u.active ? 'red' : ''), onclick: async () => { try { await api('/users/' + u.id, { method: 'PUT', body: { active: !u.active } }); route(); } catch (e) { toast(e.message, 'failed'); } } }, u.active ? 'إيقاف الحساب' : 'تفعيل الحساب') : null)))) };
}

/* ---------- الإقلاع ---------- */
async function boot() {
  try { me = (await api('/me')).user; } catch { return showLogin(); }
  if (!location.hash || (me.role === 'driver' && location.hash.startsWith('#/dashboard'))) location.hash = me.role === 'employee' ? '#/dashboard' : '#/';
  openStream(); refreshUnread(); route();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && me) { refreshUnread(); rerenderIfLive(); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
boot();
