import fs from 'node:fs';

// إعدادات العملاء وحساباتهم على المنصات. تُقرأ من clients.json (غير مرفوع إلى git).
export function loadClients(file = process.env.CLIENTS_FILE || 'clients.json') {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// يجد العميل صاحب الحساب الذي وصلت عليه الرسالة
export function findClient(clients, platform, accountId) {
  const key = { wa: 'phone_number_id', ig: 'account_id', fb: 'page_id' }[platform];
  return clients.find(c => c.accounts?.[platform]?.[key] === accountId);
}
