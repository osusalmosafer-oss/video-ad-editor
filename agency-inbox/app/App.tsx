import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nManager, Pressable, SafeAreaView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Api, Me, Session, clearSession, loadSession, saveSession } from './src/api';
import { useTheme } from './src/theme';
import Login from './src/screens/Login';
import Inbox from './src/screens/Inbox';
import Thread from './src/screens/Thread';
import Reports from './src/screens/Reports';

// الواجهة عربية من اليمين لليسار. يظهر التغيير بعد إعادة تشغيل التطبيق أول مرة.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function App() {
  const t = useTheme();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<'inbox' | 'reports'>('inbox');
  const [open, setOpen] = useState<number | null>(null);
  const [overdue, setOverdue] = useState<number[]>([]);

  useEffect(() => { loadSession().then(setSession); }, []);
  const api = useMemo(() => (session ? new Api(session) : null), [session]);

  useEffect(() => { if (api) api.me().then(setMe).catch(() => { clearSession(); setSession(null); }); }, [api]);

  const pollOverdue = useCallback(() => { api?.overdue().then(r => setOverdue(r.items.map(i => i.id))).catch(() => {}); }, [api]);
  useEffect(() => { pollOverdue(); const h = setInterval(pollOverdue, 30_000); return () => clearInterval(h); }, [pollOverdue]);

  if (session === undefined) return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  if (!session) return <><StatusBar style="auto" /><Login onDone={async s => { await saveSession(s); setSession(s); }} /></>;
  if (!api || !me) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const Tab = ({ id, label }: { id: 'inbox' | 'reports'; label: string }) => (
    <Pressable onPress={() => { setTab(id); setOpen(null); }} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}
      style={{ flex: 1, padding: 12, alignItems: 'center', borderTopWidth: 2, borderColor: tab === id ? t.accent : 'transparent' }}>
      <Text style={{ color: tab === id ? t.accent : t.muted, fontWeight: '700' }}>{label}{id === 'inbox' && overdue.length ? ` (${overdue.length} متأخر)` : ''}</Text>
    </Pressable>);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.surface }}>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        {open !== null ? <Thread api={api} me={me} id={open} onBack={() => setOpen(null)} />
          : tab === 'inbox' ? <Inbox api={api} me={me} overdueIds={new Set(overdue)} onOpen={setOpen} />
          : <Reports api={api} overdueCount={overdue.length} />}
      </View>
      {open === null && <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: t.line }}><Tab id="inbox" label="الصندوق" /><Tab id="reports" label="التقارير" /></View>}
    </SafeAreaView>
  );
}
