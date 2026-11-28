import crypto from 'node:crypto';
import { findClient } from './clients.js';
import { recordInbound } from './db.js';

export function verifySignature(rawBody, header, secret) {
  if (!secret) return true; // بيئة التجربة فقط
  if (!header?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

// يحوّل حمولة Meta (واتساب، إنستجرام، فيسبوك) إلى رسائل موحّدة ويحفظها
export function handleMetaPayload(db, clients, body) {
  let saved = 0;
  const save = (m) => { recordInbound(db, m); saved++; };

  for (const entry of body.entry ?? []) {
    if (body.object === 'whatsapp_business_account') {
      for (const ch of entry.changes ?? []) {
        const v = ch.value ?? {};
        const client = findClient(clients, 'wa', v.metadata?.phone_number_id);
        if (!client) continue;
        for (const msg of v.messages ?? []) {
          const name = v.contacts?.find(c => c.wa_id === msg.from)?.profile?.name || msg.from;
          save({ platform: 'wa', type: 'dm', clientId: client.id, externalId: msg.from, contactName: name,
            text: msg.text?.body ?? `[${msg.type}]`, messageId: msg.id, at: Number(msg.timestamp) * 1000 });
        }
      }
    } else if (body.object === 'instagram' || body.object === 'page') {
      const platform = body.object === 'instagram' ? 'ig' : 'fb';
      const client = findClient(clients, platform, entry.id);
      if (!client) continue;
      for (const ev of entry.messaging ?? []) {
        if (ev.message?.is_echo || !ev.message?.text) continue; // رسائلنا نحن أو مرفقات
        save({ platform, type: 'dm', clientId: client.id, externalId: ev.sender.id, contactName: ev.sender.id,
          text: ev.message.text, messageId: ev.message.mid, at: ev.timestamp });
      }
      for (const ch of entry.changes ?? []) {
        const v = ch.value ?? {};
        if (platform === 'ig' && ch.field === 'comments') {
          save({ platform, type: 'cm', clientId: client.id, externalId: v.parent_id || v.id, contactName: v.from?.username || 'مستخدم',
            postTitle: v.media?.id ? `منشور ${v.media.id}` : null, text: v.text, messageId: v.id, at: Date.now() });
        } else if (platform === 'fb' && ch.field === 'feed' && v.item === 'comment' && v.verb === 'add' && v.from?.id !== entry.id) {
          save({ platform, type: 'cm', clientId: client.id, externalId: v.parent_id || v.comment_id, contactName: v.from?.name || 'مستخدم',
            postTitle: v.post_id ? `منشور ${v.post_id}` : null, text: v.message, messageId: v.comment_id, at: (v.created_time ?? 0) * 1000 || Date.now() });
        }
      }
    }
  }
  return saved;
}
