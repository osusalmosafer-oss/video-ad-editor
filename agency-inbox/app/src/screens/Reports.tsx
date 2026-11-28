import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Api, Report } from '../api';
import { PLATFORMS, useTheme } from '../theme';
import { Chip } from '../ui';

export default function Reports({ api, overdueCount }: { api: Api; overdueCount: number }) {
  const t = useTheme();
  const [days, setDays] = useState(7);
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.report(days).then(x => { setR(x); setErr(''); }).catch(e => setErr(e instanceof Error ? e.message : 'تعذّر التحميل')); }, [api, days]);

  const card = { backgroundColor: t.surface, borderRadius: 12, borderWidth: 1, borderColor: t.line, padding: 14, gap: 6 } as const;
  const Row = ({ a, b }: { a: string; b: string | number }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: t.fg }}>{a}</Text><Text style={{ color: t.fg, fontWeight: '700' }}>{b}</Text></View>);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row' }}>{[7, 30].map(n => <Chip key={n} label={`آخر ${n} يوم`} on={days === n} onPress={() => setDays(n)} />)}</View>
      {!!err && <Text style={{ color: t.bad }}>{err}</Text>}
      {r && (<>
        <View style={card}>
          <Row a="محادثات جديدة" b={r.total} />
          <Row a="تم الرد عليها" b={r.answered} />
          <Row a="مفتوحة الآن" b={r.open} />
          <Row a="متوسط زمن أول رد" b={r.avg_first_response_minutes == null ? '—' : `${r.avg_first_response_minutes} دقيقة`} />
          <Row a="تنتظر رداً متأخراً" b={overdueCount} />
        </View>
        <View style={card}><Text style={{ color: t.muted, fontSize: 12 }}>حسب المنصة</Text>
          {r.byPlatform.map(p => <Row key={p.platform} a={PLATFORMS[p.platform].name} b={p.n} />)}</View>
        <View style={card}><Text style={{ color: t.muted, fontSize: 12 }}>حسب العميل</Text>
          {r.byClient.map(c => <Row key={c.client_name} a={c.client_name} b={c.n} />)}</View>
        <View style={card}><Text style={{ color: t.muted, fontSize: 12 }}>الردود حسب عضو الفريق</Text>
          {r.byMember.length ? r.byMember.map(m => <Row key={m.author} a={m.author} b={m.n} />) : <Text style={{ color: t.muted }}>لا توجد ردود بعد</Text>}</View>
      </>)}
    </ScrollView>
  );
}
