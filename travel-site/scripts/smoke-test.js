'use strict';
// اختبار شامل: يشغّل الخادم على قاعدة مؤقتة ويجرّب الرحلة كاملة + فحوص أمنية
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asas-'));
const PORT = 3999; const base = `http://127.0.0.1:${PORT}`;
const env = { ...process.env, PORT, DATA_DIR: dir, ADMIN_PASSWORD: 'test-password-123', SESSION_SECRET: 'x'.repeat(32), MOCK_PAYMENTS: '1', NODE_ENV: 'test', BASE_URL: '' };
let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++; };
const jar = {}; const enHtml = new Map();
const f = async (url, o = {}) => {
  const r = await fetch(base + url, { redirect: 'manual', ...o, headers: { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '), ...(o.headers || {}) } });
  if (/^\/en(\/|\?|$)/.test(url) && (r.headers.get('content-type') || '').includes('html') && (!o.method || o.method === 'GET')) { const t = await r.clone().text(); enHtml.set(url, t); }
  for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); }
  return r;
};
const csrf = (html) => /name="_csrf" value="([^"]+)"/.exec(html)[1];
const form = (o) => ({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(o).toString() });
(async () => {
  const seed = spawn('node', ['scripts/seed-demo.js'], { env, stdio: 'inherit' }); await new Promise((r) => seed.on('exit', r));
  const srv = spawn('node', ['server.js'], { env, stdio: 'inherit' });
  await new Promise((r) => setTimeout(r, 1500));
  try {
    ok((await f('/healthz')).status === 200, 'healthz');
    const adminHome0 = 1; const home = await (await f('/')).text(); ok(home.includes('dir="rtl"') && home.includes('فندق تجريبي'), 'الرئيسية عربية وفيها الفنادق');
    const r0 = await f('/'); ok(r0.headers.get('content-security-policy')?.includes("default-src 'self'"), 'CSP مفعّل');
    const today = new Date(Date.now() + 3 * 3600000 + 86400000 * 10).toISOString().slice(0, 10);
    const out = new Date(Date.now() + 3 * 3600000 + 86400000 * 13).toISOString().slice(0, 10);
    const qs = `in=${today}&out=${out}&rooms=1&guests=2`;
    const hp = await (await f('/hotels/demo-hotel-1?' + qs)).text(); ok(hp.includes('300') , 'سعر 3 ليالٍ × 100 = 300');
    const bf = await (await f(`/book?${qs}&room=1`)).text(); const tok = csrf(bf);
    const bad = await f('/book', form({ _csrf: 'wrong', room: 1, in: today, out, rooms: 1, guests: 2, name: 'x' })); ok(bad.status === 403, 'CSRF خاطئ يُرفض');
    const nb = await f('/book', form({ _csrf: tok, room: 1, in: today, out, rooms: 1, guests: 2, name: 'محمد أحمد', phone: '0501234567', agree: '1' }));
    ok(nb.status === 303, 'إنشاء حجز'); const refUrl = nb.headers.get('location'); const ref = refUrl.split('/')[2];
    const payPage = await (await f(refUrl)).text(); ok(payPage.includes('دفع تجريبي'), 'صفحة الدفع تعرض البوابة'); const t2 = csrf(payPage);
    const start = await f(`/booking/${ref}/pay`, form({ _csrf: t2, method: 'mock' })); const sh = await start.text(); ok(sh.includes('http-equiv="refresh"'), 'تحويل لبوابة الدفع');
    const ret = await f(`/pay/return/${ref}?mock=1`); ok(ret.status === 303, 'عودة من البوابة');
    const v = await (await f(`/booking/${ref}`)).text(); ok(v.includes('مؤكد') && v.includes(ref), 'الحجز مؤكد بعد الدفع');
    ok(v.includes('45') || v.includes('39'), 'ضريبة 15% ظاهرة (300 → 39)');
    // التوفر: غرفة رباعية 3 فقط — احجز 3 ثم الرابع يفشل
    const j2 = {}; let rr = await (await f(`/book?in=${today}&out=${out}&rooms=4&guests=8&room=2`)).text(); ok(!rr.includes('بيانات النزيل'), 'لا حجز أكثر من المتاح');
    // لا وصول لحجز بلا كوكي
    const saved = { ...jar }; for (const k of Object.keys(jar)) if (k.startsWith('b_')) delete jar[k];
    ok((await f(`/booking/${ref}`)).status === 302, 'حجز الغير محمي');
    const lk = await f('/booking-lookup', form({ _csrf: csrf(await (await f('/booking-lookup')).text()), ref, phone: '+966501234567' })); ok(lk.status === 303, 'التتبع برقم الجوال');
    // الإدارة
    ok((await f('/admin')).status === 302, 'الإدارة تتطلب دخولًا');
    const lp = await (await f('/admin/login')).text();
    ok((await f('/admin/login', form({ _csrf: csrf(lp), password: 'bad' }))).status === 401, 'كلمة مرور خاطئة تُرفض');
    ok((await f('/admin/login', form({ _csrf: csrf(lp), password: env.ADMIN_PASSWORD }))).status === 303, 'دخول الإدارة');
    const adm = await (await f('/admin')).text(); ok(adm.includes(ref), 'الحجز يظهر في لوحة الإدارة');
    ok((await (await f('/admin/compliance')).text()).includes('ترخيص وزارة السياحة'), 'صفحة الامتثال');
    const st = await f('/admin/settings', form({ _csrf: csrf(await (await f('/admin/settings')).text()), tourism_license: '73100000', cr_number: '4030000000', vat_number: '300000000000003', agency_name: 'أسس المسافر' }));
    ok(st.status === 303, 'حفظ الإعدادات');
    const ft = await (await f('/')).text(); ok(ft.includes('73100000') && ft.includes('4030000000') && ft.includes('300000000000003'), 'التراخيص تظهر في التذييل');
    // روابط الدفع
    const lt = csrf(await (await f('/admin/links')).text());
    ok((await f('/admin/links', form({ _csrf: lt, amount: 250, description: 'دفعة اختبار', customer_name: 'عميل', phone: '0555555555', hours: 24 }))).status === 303, 'إنشاء رابط دفع');
    const lp2 = await (await f('/admin/links')).text(); const tok2 = /\/pay\/l\/([\w-]+)"/.exec(lp2)[1];
    for (const k of Object.keys(jar)) if (k === '_a') delete jar[k];
    const lpage = await (await f('/pay/l/' + tok2)).text(); ok(lpage.includes('250') && lpage.includes('دفع تجريبي'), 'صفحة رابط الدفع العامة');
    ok((await (await f('/pay/l/' + tok2, form({ _csrf: csrf(lpage), method: 'mock' }))).text()).includes('http-equiv="refresh"'), 'بدء دفع الرابط');
    await f('/pay/lr/' + tok2); ok((await (await f('/pay/l/' + tok2)).text()).includes('تم السداد'), 'الرابط يصبح مدفوعًا');
    ok((await f('/pay/l/badtoken')).status === 404, 'رابط غير صالح');
    ok(ft.includes('مدى') && ft.includes('VISA'), 'شارات مدى وفيزا');
    ok((await (await f('/robots.txt')).text()).includes('Disallow: /admin'), 'robots');
    ok((await (await f('/sitemap.xml')).text()).includes('demo-hotel-1'), 'sitemap');
    const xss = await (await f('/hotels/demo-hotel-1?in=%22%3E%3Cscript%3E&out=x')).text(); ok(!xss.includes('<script>alert') && !/value=""><script/.test(xss), 'لا XSS في معاملات البحث');
    // ---------- النسخة الإنجليزية ----------
    const e0 = await f('/en'); const eh = await e0.text(); ok(eh.includes('<html lang="en" dir="ltr">') && eh.includes('hreflang="ar"'), 'الصفحة الإنجليزية LTR مع hreflang');
    ok(eh.includes('href="/en/hotels"') && !eh.includes('href="/hotels"'), 'روابط /en مسبوقة بالبادئة');
    await f('/en/hotels/demo-hotel-1?' + qs); await f('/en/hotels'); await f('/en/terms'); await f('/en/privacy'); await f('/en/cancellation'); await f('/en/about'); await f('/en/booking-lookup'); await f('/en/nope');
    await f('/en/hotels/demo-hotel-1?in=2020-01-01&out=2020-01-03'); await f('/en/hotels/demo-hotel-1?in=' + today + '&out=' + today);
    const ebf = await (await f(`/en/book?${qs}&room=1`)).text(); ok(ebf.includes('Guest details') || ebf.includes('Guest'), 'صفحة الحجز بالإنجليزية');
    const eb = await f('/en/book', form({ _csrf: csrf(ebf), room: 1, in: today, out, rooms: 1, guests: 2, name: 'x', phone: '1', agree: '1' })); const ebt = await eb.text(); enHtml.set('/en/book#err', ebt);
    const eb2 = await f('/en/book', form({ _csrf: csrf(ebf), room: 1, in: today, out, rooms: 1, guests: 2, name: 'John Smith', phone: '0501234568', agree: '1' }));
    ok(eb2.status === 303 && eb2.headers.get('location').startsWith('/en/booking/'), 'إعادة التوجيه تحافظ على /en');
    const eref = eb2.headers.get('location'); const epay = await (await f(eref)).text(); await f(eref.replace('/pay', ''));
    await f('/en/booking-lookup', form({ _csrf: csrf(await (await f('/en/booking-lookup')).text()), ref: 'AS-NOPE', phone: '1' }));
    await f(eref, form({ _csrf: csrf(epay), method: 'mock' })); // مسار الدفع
    const estart = await f(eref.replace('/en', '/en') , form({ _csrf: csrf(epay), method: 'mock' })); enHtml.set('/en/pay#start', await estart.text());
    await f('/pay/return/' + eref.split('/')[3]); // العودة تُبقي الإنجليزية عبر الكوكي
    const ev = await f('/en/booking/' + eref.split('/')[3]); enHtml.set('/en/voucher', await ev.text());
    ok((await f('/pay/return/' + eref.split('/')[3])).headers.get('location')?.startsWith('/en/booking/'), 'عودة البوابة تحافظ على الإنجليزية');
    ok(/Confirmed/.test(enHtml.get('/en/voucher')), 'القسيمة بالإنجليزية مؤكدة');
    const left = new Map();
    for (const [u, h] of enHtml) { const t = h.replace(/<script[\s\S]*?<\/script>/g, ''); for (const m of t.matchAll(/>([^<>]*[\u0600-\u06FF][^<>]*)(?=<)/g)) left.set(m[1].replace(/\s+/g, ' ').trim(), u); for (const m of t.matchAll(/(?:content|placeholder|alt|title)="([^"]*[\u0600-\u06FF][^"]*)"/g)) left.set(m[1], u + ' (attr)'); }
    const untr = [...left].filter(([k]) => !/^العربية$/.test(k));
    if (untr.length) { console.log('نصوص عربية غير مترجمة في النسخة الإنجليزية:'); for (const [k, u] of untr) console.log('  ' + JSON.stringify(k) + '   @ ' + u); }
    ok(untr.length === 0, 'لا نصوص عربية متبقية في صفحات English');
  } catch (e) { console.error(e); fail++; }
  srv.kill(); fs.rmSync(dir, { recursive: true, force: true });
  console.log(fail ? `\n${fail} فشل` : '\nنجحت كل الفحوص'); process.exit(fail ? 1 : 0);
})();
