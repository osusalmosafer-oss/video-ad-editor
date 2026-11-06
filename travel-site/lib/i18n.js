'use strict';
// اللغة الحالية للطلب (AsyncLocalStorage) + ترجمة مخرجات HTML العامة إلى الإنجليزية
const { AsyncLocalStorage } = require('node:async_hooks');
const als = new AsyncLocalStorage();
const store = () => als.getStore() || { lang: 'ar', url: '/' };
const lang = () => store().lang;
const isEn = () => store().lang === 'en';
const L = (o, k) => (isEn() && o && o[k + '_en'] ? o[k + '_en'] : o && o[k]);

const { EXACT, PATTERNS } = require('./dictionary');
const norm = (t) => t.replace(/\s+/g, ' ').trim();
const AR = /[؀-ۿ]/;

function trCore(k, depth) {
  if (EXACT[k] !== undefined) return EXACT[k];
  for (const [re, fn] of PATTERNS) { const m = k.match(re); if (m) { const r = fn(...m.slice(1)); return AR.test(r) && r !== k && depth < 3 ? trCore(r, depth + 1) : r; } }
  for (const sep of [' · ', ' | ', ' — ', '، ']) { // نص مركّب: نترجم كل جزء
    if (k.includes(sep)) { const parts = k.split(sep).map((p) => (AR.test(p) ? trCore(norm(p), depth + 1) : p)); const out = parts.join(sep === '، ' ? ', ' : sep); if (out !== k) return out; }
  }
  return k;
}
function trText(raw) {
  if (!AR.test(raw)) return raw;
  const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
  const out = trCore(norm(raw), 0);
  return lead + out + trail;
}
const ATTRS = /\b(content|placeholder|alt|data-confirm|title)="([^"]*[؀-ۿ][^"]*)"/g;

function translateHtml(html) {
  const scripts = [];
  html = html.replace(/<script\b[\s\S]*?<\/script>/g, (m) => { scripts.push(m); return `\u0000S${scripts.length - 1}\u0000`; });
  html = html.replace(ATTRS, (m, a, v) => `${a}="${trText(v.replace(/&#39;/g, "'").replace(/&quot;/g, '"')).replace(/"/g, '&quot;')}"`);
  html = html.replace(/>([^<>]+)(?=<)/g, (m, t) => '>' + trText(t));
  html = html.replace(/\u0000S(\d+)\u0000/g, (m, i) => scripts[i]);
  return html;
}
module.exports = { als, store, lang, isEn, L, translateHtml, trText, AR, norm };
