// اختبار شامل لواجهة البرمجة: الصلاحيات، تدفق الحالات، السجل، التقارير
const os = require('os'), path = require('path'), fs = require('fs'), assert = require('assert');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'don-'));
process.env.SEED_DEMO = '1';
const app = require('./server');
const srv = app.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const mk = () => { let cookie = ''; return async (p, method = 'GET', body) => {
    const r = await fetch(base + '/api' + p, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, data: ct.includes('json') ? await r.json() : await r.arrayBuffer() };
  }; };
  const emp = mk(), drv = mk(), anon = mk(), sup = mk();
  let n = 0; const ok = (name) => console.log('✓', name, ++n);
  try {
    assert.equal((await anon('/requests')).status, 401); ok('منع غير المسجّل');
    assert.equal((await anon('/login', 'POST', { username: 'employee', password: 'bad' })).status, 401); ok('رفض كلمة مرور خاطئة');
    assert.equal((await emp('/login', 'POST', { username: 'employee', password: 'employee123' })).status, 200);
    assert.equal((await drv('/login', 'POST', { username: 'driver', password: 'driver123' })).status, 200);
    assert.equal((await sup('/login', 'POST', { username: 'admin', password: 'admin123' })).status, 200); ok('تسجيل دخول الحسابات');

    const base1 = { donor_name: 'أحمد', donor_phone: '0555123456', district: 'النرجس', donation_type: 'أثاث', priority: 'urgent', est_value: 1500, map_url: 'https://maps.google.com/?q=1,1', items: 'كنب' };
    assert.equal((await emp('/requests', 'POST', { ...base1, map_url: 'javascript:alert(1)' })).status, 400); ok('رفض رابط خطير');
    assert.equal((await emp('/requests', 'POST', { ...base1, donor_phone: 'abc' })).status, 400); ok('تحقق الجوال');
    const c = await emp('/requests', 'POST', base1); assert.equal(c.status, 201); const id = c.data.item.id; assert.equal(id, 1001); ok('إنشاء طلب برقم تلقائي 1001');
    const c2 = await emp('/requests', 'POST', { ...base1, priority: 'normal', donor_name: 'سعد', est_value: 200 });
    const c3 = await emp('/requests', 'POST', { ...base1, priority: 'important', donor_name: 'خالد', est_value: 900 });

    const dl = (await drv('/requests')).data.items;
    assert.deepEqual(dl.map((x) => x.priority), ['urgent', 'important', 'normal']); ok('ترتيب قائمة السائق حسب الأولوية');
    assert.ok(!('est_value' in dl[0])); ok('إخفاء القيمة التقديرية عن السائق');
    const dn = (await drv('/notifications')).data; assert.ok(dn.items.some((x) => x.kind === 'urgent')); ok('إشعار عاجل للسائق');

    assert.equal((await drv('/requests', 'POST', base1)).status, 403);
    assert.equal((await drv(`/requests/${id}`, 'PUT', base1)).status, 403);
    assert.equal((await drv(`/requests/${id}`, 'DELETE')).status, 403);
    assert.equal((await drv('/stats')).status, 403);
    assert.equal((await drv('/reports?period=day')).status, 403); ok('السائق لا يعدّل/يحذف/يرى التقارير');
    assert.equal((await emp(`/requests/${id}`, 'DELETE')).status, 403); ok('الموظف العادي لا يحذف');

    assert.equal((await drv(`/requests/${id}/action`, 'POST', { action: 'fail' })).status, 400); ok('سبب التعذر إلزامي');
    assert.equal((await drv(`/requests/${id}/action`, 'POST', { action: 'start' })).status, 200);
    assert.equal((await emp(`/requests/${id}`)).data.item.status, 'in_progress'); ok('بدء الاستلام يظهر عند الموظف');
    assert.equal((await drv(`/requests/${id}/action`, 'POST', { action: 'done', notes: 'تم' })).status, 200);
    const done = (await emp(`/requests/${id}`)).data;
    assert.equal(done.item.status, 'received'); assert.ok(done.item.received_at); assert.equal(done.item.driver_name, 'السائق'); ok('تم الاستلام: الحالة والوقت والسائق');
    assert.ok(!(await drv('/requests')).data.items.some((x) => x.id === id)); assert.ok((await drv('/requests?tab=done')).data.items.some((x) => x.id === id)); ok('انتقال للمكتملة');
    assert.equal((await drv(`/requests/${id}/action`, 'POST', { action: 'fail', reason: 'x' })).status, 400); ok('لا تغيير لطلب مغلق');
    assert.equal((await sup(`/requests/${id}`, 'DELETE')).status, 400); ok('لا حذف لطلب مستلم');

    const id2 = c2.data.item.id, id3 = c3.data.item.id;
    assert.equal((await drv(`/requests/${id2}/action`, 'POST', { action: 'fail', reason: 'لا يرد' })).status, 200);
    assert.equal((await drv(`/requests/${id3}/action`, 'POST', { action: 'postpone', new_date: '2030-01-01T10:00', notes: 'سفر' })).status, 200);
    const en = (await emp('/notifications')).data.items.map((x) => x.kind); assert.ok(['done', 'failed', 'postponed'].every((k) => en.includes(k))); ok('إشعارات الموظف (استلام/تعذر/تأجيل)');
    assert.equal((await emp(`/requests/${id3}`)).data.item.pickup_at, '2030-01-01T10:00'); ok('الموعد الجديد بعد التأجيل');
    assert.equal((await emp(`/requests/${id2}/action`, 'POST', { action: 'reopen' })).status, 200); ok('إعادة فتح المتعذر');
    assert.equal((await emp(`/requests/${id2}/priority`, 'POST', { priority: 'urgent' })).status, 200); ok('تغيير الأولوية');

    const logs = (await emp(`/requests/${id}`)).data.logs.map((l) => l.action);
    assert.deepEqual(logs, ['إضافة الطلب', 'بدء الاستلام', 'تم الاستلام']); ok('سجل العمليات');

    const st = (await emp('/stats')).data; assert.equal(st.total, 3); assert.equal(st.received, 1); ok('إحصائيات اللوحة');
    assert.equal((await emp('/requests?q=خالد')).data.items.length, 1);
    assert.equal((await emp('/requests?q=1002')).data.items.length, 1);
    assert.equal((await emp('/requests?status=received')).data.items.length, 1);
    assert.equal((await emp('/requests?sort=value')).data.items[0].est_value, 1500); ok('البحث والتصفية والترتيب بالقيمة');
    const rep = (await emp('/reports?period=month')).data; assert.equal(rep.metrics.received_requests, 3); assert.equal(rep.metrics.picked_up, 1); assert.equal(rep.metrics.total_value, 1500); ok('التقرير الشهري');
    const x = await emp('/reports/export.xlsx?period=week'); assert.equal(x.status, 200); assert.equal(Buffer.from(x.data).slice(0, 2).toString(), 'PK'); ok('تصدير Excel');

    assert.equal((await sup(`/requests/${id3}`, 'DELETE')).status, 200); assert.equal((await emp(`/requests/${id3}`)).status, 404); ok('حذف المشرف (ناعم) ويبقى في السجل');
    assert.equal((await emp('/users')).status, 403);
    assert.equal((await sup('/users', 'POST', { name: 'سائق ٢', username: 'driver2', password: 'secret1', role: 'driver' })).status, 201); ok('إضافة سائق جديد (مشرف)');
    console.log('\nنجحت جميع الاختبارات ✅');
  } catch (e) { console.error('✗ فشل:', e); process.exitCode = 1; }
  srv.close(); process.exit();
});
