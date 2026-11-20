import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accents, type AccentKey, font, palette, radius } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './ui';
import { BrandMark } from './Cover';
import { useDesktopWeb } from './useDesktopWeb';

export type NavTab = 'home' | 'create' | 'archive' | 'profile';

const ITEMS: { id: NavTab; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'create', icon: 'spark', label: 'Создать' },
  { id: 'archive', icon: 'archive', label: 'Архив' },
  { id: 'profile', icon: 'profile', label: 'Профиль' },
];

export function BottomNav({ active, onChange, sidebar = false }: {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  sidebar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const desktop = useDesktopWeb();
  if (desktop !== sidebar) return null;
  return (
    <View style={sidebar ? styles.sidebar : [styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="navigation">
      {sidebar ? (
        <View style={styles.brand}>
          <BrandMark size={32} />
          <Text style={styles.brandText}>ПАРАЛЛЕЛЬ</Text>
        </View>
      ) : null}
      <View style={sidebar ? styles.sidebarLinks : styles.bar}>
        {ITEMS.map((item) => {
          const selected = item.id === active;
          const accent: AccentKey = 'violet';
          const scheme = accents[accent];
          return (
            <View key={item.id} style={sidebar ? undefined : styles.mobileSlot}>
              <PressableScale label={item.label} selected={selected} onPress={() => onChange(item.id)}>
                <View style={sidebar ? [styles.sidebarItem, selected && styles.sidebarSelected] : styles.item}>
                  <Icon
                    name={item.icon}
                    size={21}
                    color={selected ? scheme.hi : palette.faint}
                    strokeWidth={selected ? 1.8 : 1.4}
                    filled={selected && item.icon === 'spark'}
                  />
                  <Text style={[styles.label, selected && { color: palette.text }]}>{item.label}</Text>
                  {!sidebar ? <View
                    style={[
                      styles.dot,
                      { backgroundColor: selected ? scheme.core : 'transparent' },
                    ]}
                  /> : null}
                </View>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 206, padding: 18, gap: 36, backgroundColor: '#0B0A18',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: palette.line,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  brandText: { color: palette.text, fontFamily: font.display, fontSize: 12, letterSpacing: 1 },
  sidebarLinks: { gap: 8 },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48,
    paddingHorizontal: 12, borderRadius: radius.md,
  },
  sidebarSelected: { backgroundColor: 'rgba(155,124,255,0.16)' },
  mobileSlot: { flex: 1 },
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#0B0A18',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  item: { alignItems: 'center', gap: 5, paddingVertical: 2 },
  label: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    letterSpacing: 0.9,
    color: palette.faint,
  },
  dot: { width: 3, height: 3, borderRadius: 3, marginTop: 1 },
});
