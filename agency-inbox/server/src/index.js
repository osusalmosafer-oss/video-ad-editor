import { openDb } from './db.js';
import { loadClients } from './clients.js';
import { createApp, parseTeam } from './app.js';

const team = parseTeam(process.env.TEAM);
if (team.size === 0) { console.error('اضبط TEAM في ملف .env (انظر .env.example)'); process.exit(1); }
if (!process.env.META_APP_SECRET) console.warn('تنبيه: META_APP_SECRET فارغ، سيُرفض كل طلب على الويب هوك.');
const db = openDb();
const app = createApp({ db, clients: () => loadClients(), team });
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`الخادم يعمل على المنفذ ${port} (DRY_RUN=${process.env.DRY_RUN ?? '0'})`));
