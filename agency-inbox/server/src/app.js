import express from 'express';
import { handleMetaPayload, verifySignature } from './meta.js';
import { recordOutbound } from './db.js';
import { sendReply, ReplyError } from './adapters.js';

const STATUSES = ['new', 'follow', 'done'];

export function parseTeam(str = '') {
  const map = new Map();
  for (const part of str.split(',')) {
    const i = part.lastIndexOf(':');
    if (i > 0) map.set(part.slice(i + 1).trim(), part.slice(0, i).trim());
  }
  return map;
}

export function createApp({ db, clients, team, env = process.env }) {
  const app = express();
  const overdueMin = Number(env.OVERDUE_MINUTES || 30);

  // ---- الويب هوك: يجب قراءة الجسم الخام للتحقق من التوقيع
  app.get('/webhooks/meta', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === env.META_VERIFY_TOKEN)
      return res.status(200).send(req.query['hub.challenge']);
    res.sendStatus(403);
  });
  app.post('/webhooks/meta', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
    if (!verifySignature(req.body, req.get('x-hub-signature-256'), env.META_APP_SECRET)) return res.sendStatus(401);
    try { handleMetaPayload(db, clients(), JSON.parse(req.body.toString('utf8'))); }
    catch (e) { console.error('webhook', e); }
    res.sendStatus(200); // نرد 200 دائماً حتى لا تعيد Meta الإرسال
  });

  // ---- واجهة التطبيق
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', (req, res, next) => {
    const token = (req.get('authorization') || '').replace(/^Bearer /, '');
    const user = team.get(token);
    if (!user) return res.status(401).json({ error: 'غير مصرّح' });
    req.user = user; next();
  });

  const clientName = id => clients().find(c => c.id === id)?.name ?? `عميل ${id}`;
  const shape = c => ({ ...c, client_name: clientName(c.client_id) });

  app.get('/api/me', (req, res) => res.json({ name: req.user, team: [...team.values()], clients: clients().map(({ id, name }) => ({ id, name })) }));

  app.get('/api/conversations', (req, res) => {
    const { platform, type, client, status, assignee, q } = req.query;
    const where = [], args = [];
    if (platform) { where.push('c.platform=?'); args.push(platform); }
    if (type) { where.push('c.type=?'); args.push(type); }
    if (client) { where.push('c.client_id=?'); args.push(Number(client)); }
    if (status) { where.push('c.status=?'); args.push(status); }
    if (assignee) { where.push('c.assignee=?'); args.push(assignee); }
    if (q) { where.push('(c.contact_name LIKE ? OR EXISTS(SELECT 1 FROM messages m WHERE m.conv_id=c.id AND m.text LIKE ?))'); args.push(`%${q}%`, `%${q}%`); }
    const rows = db.prepare(`SELECT c.*, (SELECT text FROM messages WHERE conv_id=c.id ORDER BY at DESC, id DESC LIMIT 1) AS preview
      FROM conversations c ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.last_at DESC LIMIT 200`).all(...args);
    res.json(rows.map(shape));
  });

  app.get('/api/conversations/:id', (req, res) => {
    const c = db.prepare('SELECT * FROM conversations WHERE id=?').get(Number(req.params.id));
    if (!c) return res.sendStatus(404);
    db.prepare('UPDATE conversations SET unread=0 WHERE id=?').run(c.id);
    res.json({
      ...shape({ ...c, unread: 0 }),
      messages: db.prepare('SELECT * FROM messages WHERE conv_id=? ORDER BY at, id').all(c.id),
      notes: db.prepare('SELECT * FROM notes WHERE conv_id=? ORDER BY at, id').all(c.id),
    });
  });

  app.patch('/api/conversations/:id', (req, res) => {
    const id = Number(req.params.id), { status, assignee } = req.body ?? {};
    if (!db.prepare('SELECT 1 FROM conversations WHERE id=?').get(id)) return res.sendStatus(404);
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
      db.prepare('UPDATE conversations SET status=? WHERE id=?').run(status, id);
    }
    if (assignee !== undefined) {
      if (assignee !== null && !new Set(team.values()).has(assignee)) return res.status(400).json({ error: 'عضو غير موجود' });
      db.prepare('UPDATE conversations SET assignee=? WHERE id=?').run(assignee, id);
    }
    res.json({ ok: true });
  });

  app.post('/api/conversations/:id/reply', async (req, res) => {
    const text = String(req.body?.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'النص فارغ' });
    const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(Number(req.params.id));
    if (!conv) return res.sendStatus(404);
    try {
      const client = clients().find(c => c.id === conv.client_id);
      const r = await sendReply({ conv, client, text });
      recordOutbound(db, conv.id, text, req.user, r.externalId);
      res.json({ ok: true, dry: !!r.dry });
    } catch (e) {
      if (e instanceof ReplyError) return res.status(e.status).json({ error: e.message });
      console.error(e); res.status(500).json({ error: 'خطأ غير متوقع' });
    }
  });

  app.post('/api/conversations/:id/notes', (req, res) => {
    const text = String(req.body?.text ?? '').trim();
    const id = Number(req.params.id);
    if (!text) return res.status(400).json({ error: 'النص فارغ' });
    if (!db.prepare('SELECT 1 FROM conversations WHERE id=?').get(id)) return res.sendStatus(404);
    db.prepare('INSERT INTO notes(conv_id,author,text,at) VALUES(?,?,?,?)').run(id, req.user, text, Date.now());
    res.json({ ok: true });
  });

  // المحادثات التي ينتظر فيها العميل ردنا أكثر من المدة المسموحة
  app.get('/api/alerts/overdue', (req, res) => {
    const cutoff = Date.now() - overdueMin * 60_000;
    const rows = db.prepare(`SELECT * FROM conversations WHERE status!='done' AND last_direction='in' AND last_inbound_at<? ORDER BY last_inbound_at`).all(cutoff);
    res.json({ minutes: overdueMin, items: rows.map(shape) });
  });

  app.get('/api/reports/summary', (req, res) => {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = Date.now() - days * 86_400_000;
    const q = (sql, ...a) => db.prepare(sql).all(...a);
    const byPlatform = q('SELECT platform, COUNT(*) n FROM conversations WHERE first_inbound_at>=? GROUP BY platform', since);
    const byClient = q('SELECT client_id, COUNT(*) n FROM conversations WHERE first_inbound_at>=? GROUP BY client_id', since)
      .map(r => ({ ...r, client_name: clientName(r.client_id) }));
    const resp = db.prepare('SELECT AVG(first_reply_at-first_inbound_at) ms, COUNT(*) n FROM conversations WHERE first_inbound_at>=? AND first_reply_at IS NOT NULL').get(since);
    const total = db.prepare('SELECT COUNT(*) n FROM conversations WHERE first_inbound_at>=?').get(since).n;
    const open = db.prepare("SELECT COUNT(*) n FROM conversations WHERE status!='done'").get().n;
    const byMember = q("SELECT author, COUNT(*) n FROM messages WHERE direction='out' AND at>=? AND author IS NOT NULL GROUP BY author", since);
    res.json({ days, total, open, answered: resp.n, avg_first_response_minutes: resp.ms == null ? null : Math.round(resp.ms / 60000), byPlatform, byClient, byMember });
  });

  app.get('/health', (_, res) => res.json({ ok: true }));
  return app;
}
