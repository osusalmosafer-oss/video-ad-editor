import { useColorScheme } from 'react-native';
import type { Platform, Status } from './api';

const light = { bg: '#f3f5f4', surface: '#ffffff', surface2: '#eaeeec', line: '#d9dfdc', fg: '#16211d', muted: '#5d6b66',
  accent: '#0f6b57', accentFg: '#ffffff', accentSoft: '#dcefe9', me: '#0f6b57', warn: '#a35a00', warnSoft: '#fbead0', bad: '#b3261e' };
const dark: typeof light = { bg: '#0f1513', surface: '#161e1b', surface2: '#1f2925', line: '#2b3732', fg: '#e7eeeb', muted: '#93a39d',
  accent: '#3fc2a1', accentFg: '#06211a', accentSoft: '#17352d', me: '#1d7a64', warn: '#f0b35a', warnSoft: '#3a2b12', bad: '#ff8a80' };

export const useTheme = () => (useColorScheme() === 'dark' ? dark : light);
export type Theme = typeof light;

export const PLATFORMS: Record<Platform, { name: string; letter: string; color: string }> = {
  wa: { name: 'واتساب', letter: 'W', color: '#1f9d55' },
  ig: { name: 'إنستجرام', letter: 'I', color: '#c13584' },
  fb: { name: 'فيسبوك', letter: 'F', color: '#1877f2' },
  tt: { name: 'تيك توك', letter: 'T', color: '#444444' },
  yt: { name: 'يوتيوب', letter: 'Y', color: '#d62828' },
};
export const STATUS_LABEL: Record<Status, string> = { new: 'جديد', follow: 'قيد المتابعة', done: 'منتهي' };

export function timeLabel(ms: number) {
  const d = new Date(ms), now = new Date();
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === now.toDateString() ? hm : `${d.getDate()}/${d.getMonth() + 1}`;
}
