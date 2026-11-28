import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Api, Conversation, Me, Platform, Status } from '../api';
import { PLATFORMS, STATUS_LABEL, timeLabel, useTheme } from '../theme';
import { Chip, PlatformBadge } from '../ui';

type Filters = { platform: Platform | ''; type: 'dm' | 'cm' | ''; client: string; status: Status | ''; mine: boolean; q: string };

export default function Inbox({ api, me, overdueIds, onOpen }: { api: Api; me: Me; overdueIds: Set<number>; onOpen: (id: number) => void }) {
  const t = useTheme();
  const [f, setF] = useState<Filters>({ platform: '', type: '', client: '', status: '', mine: false, q: '' });
  const [rows, setRows] = useState<Conversation[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const q: Record<string, string> = {};
      if (f.platform) q.platform = f.platform;
      if (f.type) q.type = f.type;
      if (f.client) q.client = f.client;
      if (f.status) q.status = f.status;
      if (f.mine) q.assignee = me.name;
      if (f.q) q.q = f.q;
      setRows(await api.list(q)); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'تعذّر التحميل'); }
    setBusy(false);
  }, [api, f, me.name]);

  useEffect(() => { load(); const h = setInterval(load, 10_000); return () => clearInterval(h); }, [load]);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF(p => ({ ...p, [k]: p[k] === v ? ('' as Filters[K]) : v }));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderColor: t.line, paddingTop: 8 }}>
        <TextInput value={f.q} onChangeText={q => setF(p => ({ ...p, q }))} placeholder="ابحث في الاسم أو النص" placeholderTextColor={t.muted}
          accessibilityLabel="بحث" style={{ marginHorizontal: 12, marginBottom: 8, padding: 9, borderWidth: 1, borderColor: t.line, borderRadius: 10, color: t.fg, backgroundColor: t.bg }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Chip label="مسندة لي" on={f.mine} onPress={() => setF(p => ({ ...p, mine: !p.mine }))} />
          {(Object.keys(PLATFORMS) as Platform[]).map(p => <Chip key={p} label={PLATFORMS[p].name} on={f.platform === p} onPress={() => set('platform', p)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}>
          <Chip label="رسائل" on={f.type === 'dm'} onPress={() => set('type', 'dm')} />
          <Chip label="تعليقات" on={f.type === 'cm'} onPress={() => set('type', 'cm')} />
          {(Object.keys(STATUS_LABEL) as Status[]).map(s => <Chip key={s} label={STATUS_LABEL[s]} on={f.status === s} onPress={() => set('status', s)} />)}
          {me.clients.map(c => <Chip key={c.id} label={c.name} on={f.client === String(c.id)} onPress={() => set('client', String(c.id))} />)}
        </ScrollView>
      </View>
      {!!err && <Text style={{ color: t.bad, padding: 12 }}>{err}</Text>}
      <FlatList data={rows} keyExtractor={r => String(r.id)} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}
        ListEmptyComponent={<Text style={{ color: t.muted, textAlign: 'center', padding: 40 }}>لا توجد محادثات بهذا الفلتر</Text>}
        renderItem={({ item: c }) => (
          <Pressable onPress={() => onOpen(c.id)} accessibilityRole="button"
            style={{ flexDirection: 'row', gap: 10, padding: 12, backgroundColor: t.surface, borderBottomWidth: 1, borderColor: t.line }}>
            <PlatformBadge p={c.platform} size={34} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: t.fg, fontWeight: '700' }} numberOfLines={1}>{c.contact_name}</Text>
                <Text style={{ color: c.type === 'cm' ? t.warn : t.muted, fontSize: 11 }}>{c.type === 'cm' ? 'تعليق' : 'رسالة'}</Text>
                {overdueIds.has(c.id) && <Text style={{ color: t.bad, fontSize: 11, fontWeight: '700' }}>متأخر</Text>}
              </View>
              <Text style={{ color: t.muted }} numberOfLines={1}>{c.preview}</Text>
              <Text style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{c.client_name}{c.assignee ? ` · ${c.assignee}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ color: t.muted, fontSize: 11 }}>{timeLabel(c.last_at)}</Text>
              {c.unread > 0 && <Text style={{ backgroundColor: t.accent, color: t.accentFg, borderRadius: 9, paddingHorizontal: 6, fontSize: 11, overflow: 'hidden' }}>{c.unread}</Text>}
            </View>
          </Pressable>
        )} />
    </View>
  );
}
