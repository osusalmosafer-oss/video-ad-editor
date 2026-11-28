// الإرسال إلى كل منصة. مع DRY_RUN=1 لا يُرسل شيء فعلياً.
const GRAPH = 'https://graph.facebook.com/v21.0';
const DAY = 24 * 60 * 60 * 1000;

export class ReplyError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

async function post(url, token, body) {
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ReplyError(j.error?.message || `فشل الإرسال (${r.status})`, 502);
  return j;
}

export async function sendReply({ conv, client, text, lastInboundExternalId }) {
  const acc = client?.accounts?.[conv.platform];
  const dry = process.env.DRY_RUN === '1';

  if (conv.platform === 'wa' && Date.now() - (conv.last_inbound_at ?? 0) > DAY)
    throw new ReplyError('انتهت نافذة الـ 24 ساعة. يلزم قالب رسالة معتمد من واتساب.', 409);
  if (conv.platform === 'tt') throw new ReplyError('الرد على تيك توك غير مربوط بعد.', 501);
  if (conv.platform === 'yt') throw new ReplyError('الرد على يوتيوب غير مربوط بعد.', 501);
  if (dry) return { externalId: null, dry: true };
  if (!acc?.token) throw new ReplyError('لم تُضبط بيانات هذا الحساب في clients.json', 500);

  if (conv.platform === 'wa') {
    const j = await post(`${GRAPH}/${acc.phone_number_id}/messages`, acc.token,
      { messaging_product: 'whatsapp', to: conv.external_id, type: 'text', text: { body: text } });
    return { externalId: j.messages?.[0]?.id ?? null };
  }
  if (conv.type === 'dm') { // ماسنجر وإنستجرام
    const j = await post(`${GRAPH}/me/messages`, acc.token,
      { recipient: { id: conv.external_id }, messaging_type: 'RESPONSE', message: { text } });
    return { externalId: j.message_id ?? null };
  }
  // تعليق: رد على التعليق نفسه
  const path = conv.platform === 'ig' ? 'replies' : 'comments';
  const j = await post(`${GRAPH}/${conv.external_id}/${path}`, acc.token, { message: text });
  return { externalId: j.id ?? null };
}
