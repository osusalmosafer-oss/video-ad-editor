import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform as RNPlatform, ScrollView, Text, TextInput, View } from 'react-native';
import { Api, Detail, Me, Status } from '../api';
import { PLATFORMS, STATUS_LABEL, timeLabel, useTheme } from '../theme';
import { Button, Chip, PlatformBadge } from '../ui';

const QUICK = ['أهلاً بك، كيف نخدمك؟', 'شكراً لتواصلك، نرد عليك خلال دقائق', 'أرسل لنا رقم جوالك ونتواصل معك', 'تم، وسعدنا بخدمتك'];

export default function Thread({ api, me, id, onBack }: { api: Api; me: Me; id: number; onBack: () => void }) {
  const t = useTheme();
  const [d, setD] = useState<Detail | null>(null);
  const [text, setText] = useState('');
  const [noteMode, setNoteMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList>(null);

  const load = useCallback(async () => { try { setD(await api.detail(id)); } catch (e) { Alert.alert('تعذّر التحميل', e instanceof Error ? e.message : ''); } }, [api, id]);
  useEffect(() => { load(); const h = setInterval(load, 8000); return () => clearInterval(h); }, [load]);

  async function send() {
    const v = text.trim(); if (!v || !d) return;
    setBusy(true);
    try {
      if (noteMode) await api.note(d.id, v); else await api.reply(d.id, v);
      setText(''); await load();
    } catch (e) { Alert.alert(noteMode ? 'تعذّر حفظ الملاحظة' : 'تعذّر الإرسال', e instanceof Error ? e.message : ''); }
    setBusy(false);
  }
  async function patch(b: { status?: Status; assignee?: string | null }) {
    if (!d) return;
    try { await api.patch(d.id, b); await load(); } catch (e) { Alert.alert('تعذّر الحفظ', e instanceof Error ? e.message : ''); }
  }
  if (!d) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const items = [...d.messages.map(m => ({ k: `m${m.id}`, at: m.at, kind: m.direction as 'in' | 'out', text: m.text, by: m.author })),
    ...d.notes.map(n => ({ k: `n${n.id}`, at: n.at, kind: 'note' as const, text: n.text, by: n.author }))].sort((a, b) => a.at - b.at);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderColor: t.line, padding: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Button label="رجوع" onPress={onBack} />
          <PlatformBadge p={d.platform} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.fg, fontWeight: '700' }} numberOfLines={1}>{d.contact_name}</Text>
            <Text style={{ color: t.muted, fontSize: 12 }}>{PLATFORMS[d.platform].name} · {d.type === 'cm' ? 'تعليق' : 'رسالة'} · {d.client_name}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(Object.keys(STATUS_LABEL) as Status[]).map(s => <Chip key={s} label={STATUS_LABEL[s]} on={d.status === s} onPress={() => patch({ status: s })} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="بدون مسؤول" on={!d.assignee} onPress={() => patch({ assignee: null })} />
          {me.team.map(n => <Chip key={n} label={n} on={d.assignee === n} onPress={() => patch({ assignee: n })} />)}
        </ScrollView>
        {d.post_title && <Text style={{ color: t.muted, fontSize: 12 }}>على: {d.post_title}</Text>}
      </View>

      <FlatList ref={list} data={items} keyExtractor={i => i.k} contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: i }) => i.kind === 'note' ? (
          <View style={{ alignSelf: 'center', backgroundColor: t.warnSoft, borderRadius: 10, padding: 8, maxWidth: '90%' }}>
            <Text style={{ color: t.warn, fontSize: 11 }}>ملاحظة داخلية من {i.by} (لا يراها العميل)</Text>
            <Text style={{ color: t.warn }}>{i.text}</Text>
          </View>
        ) : (
          <View style={{ alignSelf: i.kind === 'out' ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: 9, borderRadius: 14,
            backgroundColor: i.kind === 'out' ? t.me : t.surface2 }}>
            <Text style={{ color: i.kind === 'out' ? '#fff' : t.fg }}>{i.text}</Text>
            <Text style={{ color: i.kind === 'out' ? '#ffffffb3' : t.muted, fontSize: 10, marginTop: 2 }}>{timeLabel(i.at)}{i.by ? ` · ${i.by}` : ''}</Text>
          </View>
        )} />

      <View style={{ backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.line, padding: 10, gap: 8 }}>
        {d.platform === 'wa' && !noteMode && <Text style={{ color: t.warn, fontSize: 11 }}>الرد الحر متاح خلال 24 ساعة من آخر رسالة للعميل</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label={noteMode ? 'وضع الملاحظة' : 'وضع الرد'} on={noteMode} onPress={() => setNoteMode(m => !m)} />
          {!noteMode && QUICK.map(q => <Chip key={q} label={q} on={false} onPress={() => setText(q)} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <TextInput value={text} onChangeText={setText} multiline placeholder={noteMode ? 'اكتب ملاحظة للفريق' : d.type === 'cm' ? 'اكتب الرد على التعليق' : 'اكتب ردك'}
            placeholderTextColor={t.muted} accessibilityLabel="النص"
            style={{ flex: 1, maxHeight: 110, borderWidth: 1, borderColor: t.line, borderRadius: 10, padding: 9, color: t.fg, backgroundColor: t.bg }} />
          <Button kind="primary" label={noteMode ? 'حفظ' : 'إرسال'} onPress={send} disabled={busy || !text.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
