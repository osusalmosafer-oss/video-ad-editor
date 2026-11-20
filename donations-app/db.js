// قاعدة البيانات الدائمة (SQLite) — ملف واحد داخل مجلد data
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'donations.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee','driver')),
  salt TEXT NOT NULL,
  hash TEXT NOT NULL,
  can_delete INTEGER NOT NULL DEFAULT 0,
  can_manage INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_by_name TEXT,
  donor_name TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  map_url TEXT,
  donation_type TEXT NOT NULL,
  items TEXT,
  notes TEXT,
  pickup_at TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','important','normal')),
  est_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','received','failed','postponed')),
  driver_id INTEGER REFERENCES users(id),
  driver_name TEXT,
  started_at INTEGER,
  received_at INTEGER,
  receive_notes TEXT,
  failed_at INTEGER,
  fail_reason TEXT,
  postponed_at INTEGER,
  postpone_note TEXT,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_req_status ON requests(status, deleted);
CREATE INDEX IF NOT EXISTS idx_req_created ON requests(created_at);
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  user_id INTEGER,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_req ON logs(request_id, at);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, id);
`);

// أول رقم طلب = 1001
if (!db.prepare('SELECT 1 FROM sqlite_sequence WHERE name = ?').get('requests')) {
  db.exec("INSERT INTO sqlite_sequence(name, seq) VALUES ('requests', 1000)");
}

function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { db, tx, DATA_DIR };
