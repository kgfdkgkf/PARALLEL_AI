import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accents, type AccentKey, font, palette, radius } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './ui';

export type NavTab = 'home' | 'create' | 'archive' | 'profile';

const ITEMS: { id: NavTab; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'create', icon: 'spark', label: 'Создать' },
  { id: 'archive', icon: 'archive', label: 'Архив' },
  { id: 'profile', icon: 'profile', label: 'Профиль' },
];

export function BottomNav({ active, onChange }: { active: NavTab; onChange: (tab: NavTab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const selected = item.id === active;
          const accent: AccentKey = 'violet';
          const scheme = accents[accent];
          return (
            <View key={item.id} style={{ flex: 1 }}>
              <PressableScale onPress={() => onChange(item.id)}>
                <View style={styles.item}>
                  <Icon
                    name={item.icon}
                    size={21}
                    color={selected ? scheme.hi : palette.faint}
                    strokeWidth={selected ? 1.8 : 1.4}
                    filled={selected && item.icon === 'spark'}
                  />
                  <Text style={[styles.label, selected && { color: palette.text }]}>{item.label}</Text>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: selected ? scheme.core : 'transparent' },
                    ]}
                  />
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
    fontSize: 10.5,
    letterSpacing: 0.9,
    color: palette.faint,
  },
  dot: { width: 3, height: 3, borderRadius: 3, marginTop: 1 },
});
