import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { openDb } from '../src/db.js';
import { createApp, parseTeam } from '../src/app.js';

const clients = [{ id: 1, name: 'مطعم الديوان', accounts: { wa: { phone_number_id: 'PN1', token: 't' }, ig: { account_id: 'IG1', token: 't' } } }];
const env = { META_APP_SECRET: 'sek', META_VERIFY_TOKEN: 'vt', OVERDUE_MINUTES: '30', DRY_RUN: '1' };

async function boot() {
  process.env.DRY_RUN = '1';
  const db = openDb(':memory:');
  const app = createApp({ db, clients: () => clients, team: parseTeam('سارة:tok-a,خالد:tok-b'), env });
  const server = await new Promise(r => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const api = (path, opts = {}, tok = 'tok-a') => fetch(base + path, { ...opts, headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json' } });
  const hook = (payload, secret = 'sek') => {
    const body = JSON.stringify(payload);
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
    return fetch(base + '/webhooks/meta', { method: 'POST', body, headers: { 'x-hub-signature-256': sig, 'content-type': 'application/json' } });
  };
  return { db, server, base, api, hook };
}

const wa = (id, text, ts) => ({ object: 'whatsapp_business_account', entry: [{ id: 'W', changes: [{ field: 'messages', value: {
  metadata: { phone_number_id: 'PN1' }, contacts: [{ wa_id: '966500000001', profile: { name: 'عبدالله' } }],
  messages: [{ from: '966500000001', id, timestamp: String(ts), type: 'text', text: { body: text } }] } }] }] });

test('webhook verification and signature', async () => {
  const { server, base, hook } = await boot();
  try {
    assert.equal((await fetch(`${base}/webhooks/meta?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=abc`)).status, 200);
    assert.equal((await fetch(`${base}/webhooks/meta?hub.mode=subscribe&hub.verify_token=bad&hub.challenge=abc`)).status, 403);
    assert.equal((await hook(wa('m1', 'x', 1), 'wrong-secret')).status, 401);
  } finally { server.close(); }
});

test('whatsapp message -> conversation -> reply -> report', async () => {
  const { server, api, hook, db } = await boot();
  try {
    const old = Math.floor((Date.now() - 2 * 3600_000) / 1000);
    assert.equal((await hook(wa('m1', 'أبي أحجز طاولة', old))).status, 200);
    await hook(wa('m1', 'أبي أحجز طاولة', old)); // تكرار من المنصة يتجاهل
    const list = await (await api('/api/conversations')).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].unread, 1);
    assert.equal(list[0].client_name, 'مطعم الديوان');

    const overdue = await (await api('/api/alerts/overdue')).json();
    assert.equal(overdue.items.length, 1);

    const id = list[0].id;
    assert.equal((await api(`/api/conversations/${id}/notes`, { method: 'POST', body: JSON.stringify({ text: 'عميل دائم' }) })).status, 200);
    assert.equal((await api(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ assignee: 'خالد' }) })).status, 200);
    assert.equal((await api(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ assignee: 'مجهول' }) })).status, 400);

    // نافذة الـ 24 ساعة سارية، فالرد يمرّ (وضع التجربة)
    const r = await api(`/api/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ text: 'أهلاً، الخميس متاح' }) });
    assert.equal(r.status, 200);
    assert.equal((await (await api('/api/alerts/overdue')).json()).items.length, 0);

    const d = await (await api(`/api/conversations/${id}`)).json();
    assert.equal(d.messages.length, 2);
    assert.equal(d.status, 'follow');
    assert.equal(d.notes[0].author, 'سارة');

    const rep = await (await api('/api/reports/summary')).json();
    assert.equal(rep.total, 1);
    assert.equal(rep.answered, 1);
    assert.ok(rep.avg_first_response_minutes >= 0);
    assert.deepEqual(rep.byMember, [{ author: 'سارة', n: 1 }]);

    // بعد 24 ساعة من آخر رسالة للعميل يُرفض الرد الحر
    db.prepare('UPDATE conversations SET last_inbound_at=?').run(Date.now() - 25 * 3600_000);
    const late = await api(`/api/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ text: 'متأخر' }) });
    assert.equal(late.status, 409);
  } finally { server.close(); }
});

test('api requires a team token', async () => {
  const { server, api } = await boot();
  try { assert.equal((await api('/api/conversations', {}, 'nope')).status, 401); } finally { server.close(); }
});

test('instagram comment and dm', async () => {
  const { server, api, hook } = await boot();
  try {
    await hook({ object: 'instagram', entry: [{ id: 'IG1',
      messaging: [{ sender: { id: 'u1' }, timestamp: Date.now(), message: { mid: 'mid1', text: 'مرحبا' } }],
      changes: [{ field: 'comments', value: { id: 'c1', text: 'كم السعر؟', from: { username: 'noura_k' }, media: { id: 'M1' } } }] }] });
    const list = await (await api('/api/conversations?platform=ig')).json();
    assert.deepEqual(list.map(c => c.type).sort(), ['cm', 'dm']);
  } finally { server.close(); }
});
