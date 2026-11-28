import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { PLATFORMS, useTheme } from './theme';
import type { Platform } from './api';

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={[s.chip, { borderColor: t.line, backgroundColor: on ? t.accentSoft : t.surface }]}>
      <Text style={{ color: t.fg, fontWeight: on ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
}

export function PlatformBadge({ p, size = 18 }: { p: Platform; size?: number }) {
  const { color, letter } = PLATFORMS[p];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.5, fontWeight: '700' }}>{letter}</Text>
    </View>
  );
}

export function Button({ label, onPress, kind = 'plain', disabled }: { label: string; onPress: () => void; kind?: 'plain' | 'primary'; disabled?: boolean }) {
  const t = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={[s.btn, { borderColor: primary ? t.accent : t.line, backgroundColor: primary ? t.accent : t.surface, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={{ color: primary ? t.accentFg : t.fg, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, marginEnd: 6 },
  btn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
});
