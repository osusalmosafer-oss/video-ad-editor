#!/usr/bin/env node
// مولّد ملفات حجز الفنادق — وكالة أسس المسافر
// الاستخدام:  node make_voucher.mjs data.json [out.pdf]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ---------- أدوات ----------
const esc = (s = '') =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const parseDate = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s).trim());
  if (!m) throw new Error(`تاريخ غير صالح "${s}" — الصيغة المطلوبة DD/MM/YYYY`);
  return Date.UTC(+m[3], +m[2] - 1, +m[1]);
};
const nightsBetween = (a, b) => {
  const n = Math.round((parseDate(b) - parseDate(a)) / 86400000);
  if (!(n > 0)) throw new Error(`تاريخ المغادرة (${b}) يجب أن يكون بعد تاريخ الدخول (${a})`);
  return n;
};
// المبالغ تُحسب بالهللات (أعداد صحيحة) لتفادي أخطاء الفاصلة العشرية
const toCents = (v) => Math.round(Number(v) * 100);
const fmt = (c) =>
  (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// ---------- ترقيم الحجوزات التلقائي ----------
function nextBookingNo(prefix) {
  const f = path.join(here, 'counter.json');
  let n = 0;
  try { n = JSON.parse(fs.readFileSync(f, 'utf8')).last || 0; } catch {}
  n += 1;
  fs.writeFileSync(f, JSON.stringify({ last: n }) + '\n');
  return `${prefix}${String(n).padStart(5, '0')}`;
}

// ---------- الحسابات ----------
export function compute(data) {
  const fin = data.financial || {};
  const vatRate = fin.vatRate ?? 15; // نسبة ضريبة القيمة المضافة في السعودية
  const vatMode = fin.vatMode || 'exclusive'; // exclusive: السعر قبل الضريبة | inclusive: شامل | none
  const rooms = data.stays.map((s) => {
    const nights = nightsBetween(s.checkIn, s.checkOut);
    const qty = s.rooms ?? 1;
    const rate = toCents(s.ratePerNight ?? 0);
    return { ...s, nights, qty, rate, lineTotal: rate * nights * qty };
  });
  let subtotal = rooms.reduce((a, r) => a + r.lineTotal, 0);
  const discount = toCents(fin.discount ?? 0);
  let net = subtotal - discount;
  let vat = 0, total = net;
  if (vatMode === 'exclusive') {
    vat = Math.round((net * vatRate) / 100);
    total = net + vat;
  } else if (vatMode === 'inclusive') {
    vat = Math.round((net * vatRate) / (100 + vatRate));
    net = net - vat;
    subtotal = subtotal - 0; // الإجمالي شامل؛ تُعرض الضريبة المستخرجة فقط
  }
  const payments = (fin.payments || []).map((p) => ({ ...p, amount: toCents(p.amount) }));
  const paid = payments.reduce((a, p) => a + p.amount, 0);
  const balance = total - paid;
  return { rooms, subtotal, discount, net, vat, vatRate, vatMode, total, payments, paid, balance };
}

// ---------- القالب ----------
function render(data, c) {
  const ag = data.agency;
  const cl = data.client;
  const show = data.showPrices !== false;
  const cur = data.financial?.currency || 'SAR';
  const terms = data.terms || JSON.parse(fs.readFileSync(path.join(here, 'terms.json'), 'utf8'));
  const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'assets/logo.jpg')).toString('base64');
  const font = (file) => pathToFileURL(path.join(here, 'fonts', file)).href;

  const balState =
    c.balance <= 0 ? ['مسدد بالكامل', 'ok'] : c.paid > 0 ? ['مسدد جزئيًا', 'warn'] : ['غير مسدد', 'due'];

  const staysRows = c.rooms
    .map(
      (r) => `<tr>
      <td class="b">${esc(r.hotel)}${r.city ? `<small>${esc(r.city)}</small>` : ''}</td>
      <td>${esc(r.roomType || '—')}</td>
      <td>${esc(r.meals || '—')}</td>
      <td class="num">${esc(r.checkIn)}</td>
      <td class="num">${esc(r.checkOut)}</td>
      <td class="num">${r.nights}</td>
      <td class="num">${r.qty}</td></tr>`
    )
    .join('');

  const finRows = c.rooms
    .map(
      (r) => `<tr><td class="b">${esc(r.hotel)}<small>${esc(r.roomType || '')}</small></td>
      <td class="num">${fmt(r.rate)}</td><td class="num">${r.nights}</td><td class="num">${r.qty}</td>
      <td class="num b">${fmt(r.lineTotal)}</td></tr>`
    )
    .join('');

  const sumLine = (label, val, cls = '') =>
    `<div class="sl ${cls}"><span>${label}</span><span class="num">${fmt(val)} ${cur}</span></div>`;

  const payRows = c.payments.length
    ? c.payments
        .map(
          (p) => `<tr><td class="num">${esc(p.date || '')}</td><td>${esc(p.method || '')}</td>
          <td>${esc(p.ref || '')}</td><td class="num b">${fmt(p.amount)}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="muted">لا توجد دفعات مسجلة</td></tr>`;

  const guests = (cl.guests || []).length
    ? `<div class="guests"><b>أسماء النزلاء:</b> ${cl.guests.map((g, i) => `${i + 1}. ${esc(g)}`).join(' &nbsp;·&nbsp; ')}</div>`
    : '';

  const financialBlock = show
    ? `<section class="fin">
    <h3>التفاصيل المالية</h3>
    <div class="fin-grid">
      <div>
        <table class="grid">
          <thead><tr><th>البيان</th><th>سعر الليلة</th><th>الليالي</th><th>الوحدات</th><th>الإجمالي</th></tr></thead>
          <tbody>${finRows}</tbody>
        </table>
        <table class="grid pay">
          <thead><tr><th>تاريخ الدفعة</th><th>الطريقة</th><th>المرجع</th><th>المبلغ</th></tr></thead>
          <tbody>${payRows}</tbody>
        </table>
      </div>
      <div class="summary">
        ${c.vatMode === 'inclusive' ? '' : sumLine('المجموع', c.subtotal)}
        ${c.discount ? sumLine('الخصم', -c.discount) : ''}
        ${c.vatMode === 'none' ? '' : sumLine(`ضريبة القيمة المضافة ${c.vatRate}%${c.vatMode === 'inclusive' ? ' (مشمولة)' : ''}`, c.vat)}
        ${sumLine('الإجمالي المستحق', c.total, 'total')}
        ${sumLine('المدفوع', c.paid)}
        ${sumLine('المتبقي', Math.max(c.balance, 0), 'bal ' + balState[1])}
        <div class="chip ${balState[1]}">${balState[0]}</div>
      </div>
    </div>
  </section>`
    : '';

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
@font-face{font-family:T;font-weight:400;src:url(${font('tajawal-arabic-400-normal.woff2')});unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F}
@font-face{font-family:T;font-weight:500;src:url(${font('tajawal-arabic-500-normal.woff2')});unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F}
@font-face{font-family:T;font-weight:700;src:url(${font('tajawal-arabic-700-normal.woff2')});unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F}
@font-face{font-family:T;font-weight:800;src:url(${font('tajawal-arabic-800-normal.woff2')});unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F}
@font-face{font-family:T;font-weight:400;src:url(${font('tajawal-latin-400-normal.woff2')});unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:T;font-weight:500;src:url(${font('tajawal-latin-400-normal.woff2')});unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:T;font-weight:700;src:url(${font('tajawal-latin-700-normal.woff2')});unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:T;font-weight:800;src:url(${font('tajawal-latin-700-normal.woff2')});unicode-range:U+0000-00FF,U+2000-206F}
:root{--navy:#0d2257;--blue:#2f86ef;--ink:#1b2438;--mute:#6b7488;--line:#d9deea;--bg:#f4f7fc}
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
body{font-family:T,sans-serif;color:var(--ink);font-size:10pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;min-height:297mm;padding:11mm 13mm 16mm;position:relative}
.num{direction:ltr;unicode-bidi:isolate;text-align:center;font-variant-numeric:tabular-nums}
.b{font-weight:700}.muted{color:var(--mute);text-align:center}
small{display:block;color:var(--mute);font-weight:400;font-size:8pt}
header{display:flex;align-items:stretch;gap:12mm;padding-bottom:5mm;border-bottom:3px solid var(--navy);position:relative}
header::after{content:"";position:absolute;inset-inline:0;bottom:-6px;height:3px;background:var(--blue)}
.logo{width:34mm;display:flex;align-items:center}
.logo img{width:100%}
.head{flex:1}
.head h1{font-size:23pt;font-weight:800;color:var(--navy);line-height:1.2;letter-spacing:.2px}
.head .agency{font-weight:700;color:var(--blue);font-size:12pt;margin-top:1mm}
.head .addr{color:var(--mute);font-size:9pt}
.meta{width:60mm;background:var(--bg);border:1px solid var(--line);border-radius:3mm;padding:3mm 4mm;align-self:center}
.meta div{display:flex;justify-content:space-between;gap:3mm;font-size:9.5pt;padding:.6mm 0}
.meta span:first-child{color:var(--mute)}
.meta .no{font-weight:800;color:var(--navy);font-size:12pt}
.badge{display:inline-block;padding:0 3mm;border-radius:10mm;background:#e3f6ea;color:#14753a;font-weight:700;font-size:9pt}
.greet{margin:8mm 0 4mm}.greet b{color:var(--navy)}
h3{font-size:11pt;font-weight:800;color:#fff;background:var(--navy);padding:1.2mm 4mm;border-radius:1.5mm 1.5mm 0 0;display:inline-block}
.box{border:1px solid var(--line);border-radius:0 2mm 2mm 2mm;padding:3mm 4mm;margin-bottom:5mm}
.kv{display:grid;grid-template-columns:repeat(3,1fr);gap:2.2mm 6mm}
.kv div{display:flex;flex-direction:column;border-bottom:1px dotted var(--line);padding-bottom:1mm}
.kv span{font-size:8pt;color:var(--mute)}.kv b{font-size:10pt;min-height:5mm}
.guests{margin-top:2.5mm;font-size:9pt}
table{width:100%;border-collapse:collapse}
table.grid{margin-bottom:3mm}
table.grid th{background:var(--navy);color:#fff;font-weight:700;font-size:9pt;padding:2mm;border:1px solid var(--navy)}
table.grid td{border:1px solid var(--line);padding:2mm;font-size:9.5pt;vertical-align:middle;text-align:center}
table.grid td:first-child{text-align:right}
table.grid tbody tr:nth-child(even){background:var(--bg)}
.fin-grid{display:grid;grid-template-columns:1fr 74mm;gap:5mm;align-items:start}
.fin h3{margin-top:0}.fin{margin-bottom:5mm}
.fin-grid{border:1px solid var(--line);border-radius:0 2mm 2mm 2mm;padding:3mm}
.pay th{background:var(--blue);border-color:var(--blue)}
.summary{background:var(--bg);border:1px solid var(--line);border-radius:2mm;padding:2.5mm 3.5mm}
.sl span:last-child{white-space:nowrap}.sl{display:flex;justify-content:space-between;gap:2mm;padding:1.4mm 0;border-bottom:1px dotted var(--line);font-size:9.5pt}
.sl.total{font-weight:800;color:var(--navy);font-size:11pt;border-bottom:2px solid var(--navy)}
.sl.bal{font-weight:800;font-size:11pt;border:none}
.sl.bal.due{color:#b3261e}.sl.bal.ok{color:#14753a}.sl.bal.warn{color:#b26a00}
.chip{margin-top:1.5mm;text-align:center;padding:1mm;border-radius:2mm;font-weight:700;font-size:9pt}
.chip.ok{background:#e3f6ea;color:#14753a}.chip.warn{background:#fff1d9;color:#b26a00}.chip.due{background:#fde6e4;color:#b3261e}
.notes{background:#fffbea;border:1px solid #f1e2a3;border-radius:2mm;padding:2.5mm 4mm;margin-bottom:5mm;font-size:9.5pt}
.rule{height:3px;background:var(--navy);position:relative;margin:2mm 0 5mm}
.rule::after{content:"";position:absolute;inset-inline:0;top:5px;height:3px;background:var(--blue)}
.terms h2{font-size:11.5pt;font-weight:800;color:var(--navy);margin-bottom:1.5mm}
.terms li{list-style:none;margin-bottom:3mm;font-size:9.5pt;line-height:1.55;break-inside:avoid}
.terms li b{display:block;font-weight:700;font-size:10.5pt}
.terms li p{color:#3d465a;text-align:justify}
.sign{display:flex;justify-content:space-between;margin-top:6mm;font-size:9pt;color:var(--mute)}
.sign div{width:55mm;border-top:1px solid var(--line);padding-top:1.5mm;text-align:center}
footer{position:fixed;bottom:6mm;inset-inline:13mm;border-top:1px solid var(--line);padding-top:2mm;display:flex;justify-content:space-between;font-size:8pt;color:var(--mute)}
</style></head><body><div class="page">
<header>
  <div class="logo"><img src="${logo}"></div>
  <div class="head">
    <h1>تأكيد حجز الفندق</h1>
    <div class="agency">${esc(ag.name)}</div>
    <div class="addr">${esc(ag.address)}${ag.phone ? ` &nbsp;|&nbsp; <span class="num" style="display:inline">${esc(ag.phone)}</span>` : ''}${ag.crNo ? ` &nbsp;|&nbsp; س.ت: <span class="num" style="display:inline">${esc(ag.crNo)}</span>` : ''}${ag.vatNo ? ` &nbsp;|&nbsp; الرقم الضريبي: <span class="num" style="display:inline">${esc(ag.vatNo)}</span>` : ''}</div>
  </div>
  <div class="meta">
    <div><span>رقم الحجز</span><span class="no num">${esc(data.bookingNo)}</span></div>
    <div><span>تاريخ الإصدار</span><b class="num">${esc(data.issueDate)}</b></div>
    <div><span>حالة الحجز</span><span class="badge">${esc(data.status || 'مؤكد')}</span></div>
  </div>
</header>

<div class="greet"><b>السادة الكرام،</b><br>يسعدنا الترحيب بكم في ${esc(ag.name)}، ونتشرف بتأكيد الحجز التالي على أساس قطعي.</div>

<h3>بيانات العميل</h3>
<div class="box"><div class="kv">
  <div><span>اسم العميل</span><b>${esc(cl.name)}</b></div>
  <div><span>رقم الهوية / جواز السفر</span><b class="num" style="text-align:right">${esc(cl.idNo || '—')}</b></div>
  <div><span>رقم التأكيد (الفندق)</span><b class="num" style="text-align:right">${esc(data.confirmationNo || 'قيد الإرسال')}</b></div>
  <div><span>عدد البالغين</span><b>${esc(cl.adults ?? '')}</b></div>
  <div><span>عدد الأطفال</span><b>${esc(cl.children ?? 0)}</b></div>
  <div><span>الجوال</span><b class="num" style="text-align:right">${esc(cl.phone || '—')}</b></div>
  ${cl.email ? `<div><span>البريد الإلكتروني</span><b class="num" style="text-align:right">${esc(cl.email)}</b></div>` : ''}
</div>${guests}</div>

<h3>تفاصيل الإقامة</h3>
<div class="box" style="padding:0;border:none"><table class="grid">
  <thead><tr><th>فندق الإقامة</th><th>نوع الغرفة</th><th>الوجبات</th><th>تاريخ الدخول</th><th>تاريخ المغادرة</th><th>عدد الليالي</th><th>عدد الغرف</th></tr></thead>
  <tbody>${staysRows}</tbody></table></div>

${data.notes ? `<div class="notes"><b>ملاحظات:</b> ${nl2br(data.notes)}</div>` : ''}
${financialBlock}

<div style="break-before:page;padding-top:2mm"></div><div class="rule"></div>
<section class="terms"><h2>الشروط والأحكام</h2><ol>
${terms.map((t, i) => `<li><b>${i + 1}. ${esc(t.title)}</b><p>${esc(t.text)}</p></li>`).join('')}
</ol></section>
<div class="sign"><div>ختم الوكالة</div><div>توقيع المسؤول</div></div>
<footer><span>${esc(ag.name)}</span><span>هذا المستند صادر إلكترونيًا · ${esc(data.bookingNo)}</span></footer>
</div></body></html>`;
}

// ---------- التنفيذ ----------
async function main() {
  const [, , inFile, outArg] = process.argv;
  if (!inFile) {
    console.error('الاستخدام: node make_voucher.mjs data.json [out.pdf]');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  const defaults = JSON.parse(fs.readFileSync(path.join(here, 'agency.json'), 'utf8'));
  data.agency = { ...defaults, ...(data.agency || {}) };
  data.issueDate = data.issueDate || today();
  data.bookingNo = data.bookingNo || nextBookingNo(data.agency.bookingPrefix || 'WO');
  const c = compute(data);
  const html = render(data, c);

  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/node-tools/node_modules/playwright')); }
  const exe = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage();
  const tmp = path.join(here, `.tmp-${process.pid}.html`);
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  const out = path.resolve(outArg || `${data.bookingNo}-confirmation.pdf`);
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  fs.unlinkSync(tmp);
  console.log(`تم إنشاء الملف: ${out}`);
  const sc = data.supplierCost; // تكلفة الوكالة المورّدة — داخلي فقط ولا يظهر في الملف
  if (sc) {
    const costNet = toCents(sc.net), costVat = toCents(sc.vat ?? 0);
    const profit = c.net - costNet; // الربح = صافي البيع − صافي التكلفة (الضريبة خارج الربح)
    console.log(`[داخلي] المورّد ${sc.name || ''}: صافي ${fmt(costNet)} + ضريبة ${fmt(costVat)} = ${fmt(costNet + costVat)}`);
    console.log(`[داخلي] صافي البيع ${fmt(c.net)} − صافي التكلفة ${fmt(costNet)} = الربح ${fmt(profit)} (${c.net ? ((profit / c.net) * 100).toFixed(1) : 0}%)`);
  }
  if (data.showPrices !== false)
    console.log(`الإجمالي ${fmt(c.total)} | المدفوع ${fmt(c.paid)} | المتبقي ${fmt(c.balance)} ${data.financial?.currency || 'SAR'}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
