import * as SecureStore from 'expo-secure-store';

export type Platform = 'wa' | 'ig' | 'fb' | 'yt' | 'tt';
export type Status = 'new' | 'follow' | 'done';

export interface Conversation {
  id: number; platform: Platform; type: 'dm' | 'cm'; client_id: number; client_name: string;
  contact_name: string; post_title: string | null; status: Status; assignee: string | null;
  unread: number; last_at: number; last_direction: 'in' | 'out'; preview?: string;
}
export interface Message { id: number; direction: 'in' | 'out'; text: string; at: number; author: string | null }
export interface Note { id: number; author: string; text: string; at: number }
export interface Detail extends Conversation { messages: Message[]; notes: Note[] }
export interface Me { name: string; team: string[]; clients: { id: number; name: string }[] }
export interface Report {
  days: number; total: number; open: number; answered: number; avg_first_response_minutes: number | null;
  byPlatform: { platform: Platform; n: number }[]; byClient: { client_name: string; n: number }[];
  byMember: { author: string; n: number }[];
}

export interface Session { url: string; token: string }
const KEY = 'session';

export async function loadSession(): Promise<Session | null> {
  try { const s = await SecureStore.getItemAsync(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export const saveSession = (s: Session) => SecureStore.setItemAsync(KEY, JSON.stringify(s));
export const clearSession = () => SecureStore.deleteItemAsync(KEY);

export class Api {
  constructor(private s: Session) {}
  private async call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const r = await fetch(this.s.url.replace(/\/$/, '') + path, {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${this.s.token}`, 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j as { error?: string }).error || `خطأ ${r.status}`);
    return j as T;
  }
  me = () => this.call<Me>('/api/me');
  list = (f: Record<string, string>) => this.call<Conversation[]>('/api/conversations?' + new URLSearchParams(f));
  detail = (id: number) => this.call<Detail>(`/api/conversations/${id}`);
  reply = (id: number, text: string) => this.call<{ ok: true; dry: boolean }>(`/api/conversations/${id}/reply`, { method: 'POST', body: { text } });
  note = (id: number, text: string) => this.call(`/api/conversations/${id}/notes`, { method: 'POST', body: { text } });
  patch = (id: number, body: { status?: Status; assignee?: string | null }) => this.call(`/api/conversations/${id}`, { method: 'PATCH', body });
  overdue = () => this.call<{ minutes: number; items: Conversation[] }>('/api/alerts/overdue');
  report = (days: number) => this.call<Report>(`/api/reports/summary?days=${days}`);
}
