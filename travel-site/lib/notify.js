'use strict';
/**
 * إشعارات الحجز: بريد (SMTP) + واتساب (Meta WhatsApp Cloud API).
 * تعمل في الخلفية ولا تعطّل الحجز إن فشلت. تُفعَّل بمتغيرات البيئة (انظر .env.example).
 */
const { setting } = require('./db');
const { esc, sarText, fmtD, STATUS_AR, baseUrl } = require('./views');

const env = (k) => (process.env[k] || '').trim();
let transporter;
function mailer() {
  if (transporter !== undefined) return transporter;
  transporter = null;
  if (env('SMTP_HOST')) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({ host: env('SMTP_HOST'), port: Number(env('SMTP_PORT')) || 587, secure: env('SMTP_PORT') === '465', auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined });
  }
  return transporter;
}
const staffEmail = () => env('NOTIFY_EMAIL') || setting('email');
const staffWhatsapp = () => (env('NOTIFY_WHATSAPP') || setting('whatsapp')).replace(/\D/g, '');

const TITLES = { request: 'طلب حجز جديد بانتظار تأكيد التوفر', new: 'حجز جديد', paid: 'تم الدفع وتأكيد الحجز', cancelled: 'إلغاء حجز', transfer: 'حجز بانتظار الحوالة', later: 'حجز بانتظار الدفع لاحقًا', link_paid: 'تم سداد رابط دفع' };

function lines(b) {
  return [`رقم الحجز: ${b.ref}`, `الحالة: ${STATUS_AR[b.status] || b.status}`, `الفندق: ${b.hotel_name} — ${b.room_name} × ${b.rooms}`,
    `الوصول: ${fmtD(b.check_in)} | المغادرة: ${fmtD(b.check_out)} (${b.nights} ليلة)`, `النزلاء: ${b.guests}`, `الإجمالي: ${sarText(b.total)} (شامل الضريبة)`,
    `النزيل: ${b.guest_name} — ${b.phone}${b.email ? ' — ' + b.email : ''}`, b.notes ? `ملاحظات: ${b.notes}` : ''].filter(Boolean);
}

async function sendEmail(to, subject, textLines, htmlExtra = '') {
  const t = mailer(); if (!t || !to) return;
  const from = env('MAIL_FROM') || env('SMTP_USER');
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9"><h2>${esc(subject)}</h2>${textLines.map((l) => `<div>${esc(l)}</div>`).join('')}${htmlExtra}</div>`;
  await t.sendMail({ from, to, subject, text: textLines.join('\n'), html });
}

async function sendWhatsapp(to, text, params) {
  const token = env('WHATSAPP_TOKEN'), pid = env('WHATSAPP_PHONE_ID');
  if (!token || !pid || !to) return;
  // رسائل المنشأة خارج نافذة 24 ساعة تتطلب قالبًا معتمدًا من Meta (WHATSAPP_TEMPLATE). بدونه تصل الرسالة النصية فقط إن كانت المحادثة مفتوحة.
  const tpl = env('WHATSAPP_TEMPLATE');
  const body = tpl
    ? { messaging_product: 'whatsapp', to, type: 'template', template: { name: tpl, language: { code: env('WHATSAPP_TEMPLATE_LANG') || 'ar' }, components: [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: String(p).slice(0, 200) })) }] } }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } };
  const r = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pid)}/messages`, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('whatsapp ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

// يُستدعى بدون await؛ لا يرمي أخطاء
function bookingEvent(b, type) {
  (async () => {
    const title = TITLES[type] || type; const L = lines(b);
    const link = `${baseUrl()}/admin/bookings/${b.id}`;
    const jobs = [];
    jobs.push(sendEmail(staffEmail(), `${title} — ${b.ref}`, [...L, baseUrl() ? 'لوحة الإدارة: ' + link : '']));
    const waText = `*${title}*\n${L.join('\n')}`;
    jobs.push(sendWhatsapp(staffWhatsapp(), waText, [b.ref, b.hotel_name, `${b.check_in} → ${b.check_out}`, sarText(b.total), b.guest_name]));
    if (type === 'paid' && b.email) {
      jobs.push(sendEmail(b.email, `تأكيد حجزك ${b.ref} — ${setting('agency_name')}`, ['شكرًا لاختيارك ' + setting('agency_name'), ...L, baseUrl() ? 'قسيمة الحجز: ' + baseUrl() + '/booking-lookup' : '']));
    }
    for (const r of await Promise.allSettled(jobs)) if (r.status === 'rejected') console.error('notify failed:', r.reason && r.reason.message);
  })().catch((e) => console.error('notify error', e.message));
}
function linkPaid(l) {
  const L = [`رابط دفع: ${l.code}`, `المبلغ: ${sarText(l.amount)}`, `البيان: ${l.description}`, l.customer_name ? `العميل: ${l.customer_name}` : '', l.booking_ref ? `الحجز: ${l.booking_ref}` : ''].filter(Boolean);
  Promise.allSettled([sendEmail(staffEmail(), `${TITLES.link_paid} — ${l.code}`, L), sendWhatsapp(staffWhatsapp(), `*${TITLES.link_paid}*\n${L.join('\n')}`, [l.code, l.description, '', sarText(l.amount), l.customer_name || ''])]).then((rs) => rs.forEach((r) => r.status === 'rejected' && console.error('notify failed:', r.reason.message)));
}
const status = () => ({ email: !!(mailer() && staffEmail()), whatsapp: !!(env('WHATSAPP_TOKEN') && env('WHATSAPP_PHONE_ID') && staffWhatsapp()), template: !!env('WHATSAPP_TEMPLATE') });
module.exports = { bookingEvent, linkPaid, status };
