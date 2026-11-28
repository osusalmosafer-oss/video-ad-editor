import { DatabaseSync } from 'node:sqlite';

export function openDb(file = process.env.DB_FILE || 'data.db') {
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,            -- wa | ig | fb | yt | tt
      type TEXT NOT NULL,                -- dm | cm
      client_id INTEGER NOT NULL,
      external_id TEXT NOT NULL,         -- معرّف المحادثة أو التعليق عند المنصة
      contact_name TEXT NOT NULL,
      post_title TEXT,
      status TEXT NOT NULL DEFAULT 'new',-- new | follow | done
      assignee TEXT,
      unread INTEGER NOT NULL DEFAULT 0,
      last_at INTEGER NOT NULL,
      last_inbound_at INTEGER,
      last_direction TEXT,
      first_inbound_at INTEGER,
      first_reply_at INTEGER,
      UNIQUE(platform, external_id)
    );
    CREATE TABLE IF NOT EXISTS messages(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conv_id INTEGER NOT NULL REFERENCES conversations(id),
      direction TEXT NOT NULL,           -- in | out
      text TEXT NOT NULL,
      at INTEGER NOT NULL,
      external_id TEXT,
      author TEXT,
      UNIQUE(conv_id, external_id)
    );
    CREATE TABLE IF NOT EXISTS notes(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conv_id INTEGER NOT NULL REFERENCES conversations(id),
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      at INTEGER NOT NULL
    );
  `);
  return db;
}

// إضافة رسالة واردة وإنشاء المحادثة إن لم تكن موجودة
export function recordInbound(db, m) {
  const now = m.at ?? Date.now();
  let conv = db.prepare('SELECT * FROM conversations WHERE platform=? AND external_id=?').get(m.platform, m.externalId);
  if (!conv) {
    const r = db.prepare(`INSERT INTO conversations(platform,type,client_id,external_id,contact_name,post_title,last_at,last_inbound_at,first_inbound_at,last_direction,unread)
      VALUES(?,?,?,?,?,?,?,?,?, 'in', 0)`).run(m.platform, m.type, m.clientId, m.externalId, m.contactName || 'غير معروف', m.postTitle || null, now, now, now);
    conv = { id: Number(r.lastInsertRowid) };
  }
  const ins = db.prepare('INSERT OR IGNORE INTO messages(conv_id,direction,text,at,external_id) VALUES(?,?,?,?,?)')
    .run(conv.id, 'in', m.text, now, m.messageId ?? null);
  if (ins.changes === 0) return conv.id; // وصلت مرتين من المنصة
  db.prepare(`UPDATE conversations SET last_at=?, last_inbound_at=?, last_direction='in', unread=unread+1,
      status=CASE WHEN status='done' THEN 'new' ELSE status END WHERE id=?`).run(now, now, conv.id);
  return conv.id;
}

export function recordOutbound(db, convId, text, author, externalId = null) {
  const now = Date.now();
  db.prepare('INSERT INTO messages(conv_id,direction,text,at,author,external_id) VALUES(?,?,?,?,?,?)').run(convId, 'out', text, now, author, externalId);
  db.prepare(`UPDATE conversations SET last_at=?, last_direction='out', unread=0,
      first_reply_at=COALESCE(first_reply_at, ?), status=CASE WHEN status='new' THEN 'follow' ELSE status END WHERE id=?`).run(now, now, convId);
}
