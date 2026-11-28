import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Api, Session } from '../api';
import { useTheme } from '../theme';
import { Button } from '../ui';

export default function Login({ onDone }: { onDone: (s: Session) => void }) {
  const t = useTheme();
  const [url, setUrl] = useState('https://');
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setErr('');
    try { const s = { url: url.trim(), token: token.trim() }; await new Api(s).me(); onDone(s); }
    catch (e) { setErr(e instanceof Error ? `تعذّر الدخول: ${e.message}` : 'تعذّر الدخول'); }
    setBusy(false);
  }
  const input = { borderWidth: 1, borderColor: t.line, borderRadius: 10, padding: 12, color: t.fg, backgroundColor: t.surface, marginBottom: 12, textAlign: 'left' as const };
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: t.bg }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: t.fg, marginBottom: 4 }}>صندوق الوكالة</Text>
      <Text style={{ color: t.muted, marginBottom: 24 }}>أدخل عنوان الخادم ورمز الدخول الخاص بك.</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="عنوان الخادم" placeholderTextColor={t.muted} style={input} accessibilityLabel="عنوان الخادم" />
      <TextInput value={token} onChangeText={setToken} autoCapitalize="none" secureTextEntry placeholder="رمز الدخول" placeholderTextColor={t.muted} style={input} accessibilityLabel="رمز الدخول" />
      {!!err && <Text style={{ color: t.bad, marginBottom: 12 }}>{err}</Text>}
      <Button kind="primary" label={busy ? 'جارٍ الدخول…' : 'دخول'} onPress={go} disabled={busy || !token} />
    </View>
  );
}
