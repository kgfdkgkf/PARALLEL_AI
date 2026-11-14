import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { accents, type AccentKey, font, palette, radius, shadow, space, text } from '../theme';
import { Icon, type IconName } from './Icon';

/** Появление с задержкой — базовый ритм экранов. */
export function Reveal({
  children,
  delay = 0,
  offset = 14,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  hitSlop,
  label,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  label?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Glass({
  children,
  style,
  accent,
  border = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: AccentKey;
  border?: boolean;
}) {
  return (
    <View
      style={[
        styles.glass,
        border && styles.glassBorder,
        accent ? { borderColor: accents[accent].core + '44' } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Overline({ children, color, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[text.overline, color ? { color } : null, style]}>{children}</Text>;
}

export function Pill({
  children,
  accent = 'violet',
  soft = true,
}: {
  children: React.ReactNode;
  accent?: AccentKey;
  soft?: boolean;
}) {
  const scheme = accents[accent];
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: soft ? scheme.core + '1F' : scheme.core,
          borderColor: scheme.core + (soft ? '3A' : 'FF'),
        },
      ]}
    >
      <Text
        style={{
          fontFamily: font.bodySemi,
          fontSize: 12,
          letterSpacing: 1.4,
          color: soft ? scheme.text : palette.ink,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  accent = 'violet',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  accent?: AccentKey;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scheme = accents[accent];
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading}>
      <LinearGradient
        colors={[scheme.hi, scheme.core]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primary, (disabled || loading) && { opacity: 0.5 }, shadow.glow(scheme.core)]}
      >
        <Text numberOfLines={1} style={styles.primaryLabel}>
          {loading ? 'ПРОЕКТИРУЕМ…' : title}
        </Text>
        {icon && <Icon name={icon} size={16} color={palette.ink} strokeWidth={1.8} />}
      </LinearGradient>
    </PressableScale>
  );
}

export function GhostButton({
  title,
  onPress,
  icon,
  accent = 'violet',
  compact,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  accent?: AccentKey;
  compact?: boolean;
}) {
  const scheme = accents[accent];
  return (
    <PressableScale onPress={onPress}>
      <View
        style={[
          styles.ghost,
          compact && { paddingVertical: 9, paddingHorizontal: 14 },
          { borderColor: scheme.core + '3D' },
        ]}
      >
        {icon && <Icon name={icon} size={15} color={scheme.text} strokeWidth={1.6} />}
        <Text style={[styles.ghostLabel, { color: scheme.text }]}>{title}</Text>
      </View>
    </PressableScale>
  );
}

export function IconButton({
  name,
  onPress,
  accent = 'violet',
  size = 40,
  bordered = true,
  label,
}: {
  name: IconName;
  onPress: () => void;
  accent?: AccentKey;
  size?: number;
  bordered?: boolean;
  label?: string;
}) {
  return (
    <PressableScale onPress={onPress} hitSlop={8} label={label ?? name}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bordered ? 'rgba(255,255,255,0.05)' : 'transparent',
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: accents[accent].core + '40',
        }}
      >
        <Icon name={name} size={size * 0.44} color={palette.text} strokeWidth={1.6} />
      </View>
    </PressableScale>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  accent = 'violet',
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  accent?: AccentKey;
}) {
  return (
    <View style={styles.header}>
      {onBack ? <IconButton name="back" onPress={onBack} accent={accent} size={38} /> : <View style={{ width: 38 }} />}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      <View style={{ width: 38, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function SectionLabel({ children, accent = 'violet', action, onAction }: { children: string; accent?: AccentKey; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionDash, { backgroundColor: accents[accent].core }]} />
      <Text style={[text.overline, { color: accents[accent].text }]}>{children}</Text>
      <View style={styles.sectionLine} />
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[text.overline, { color: palette.textSoft, letterSpacing: 1.2 }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: palette.lineSoft }, style]} />;
}

export function ModeBadge({ mode }: { mode: 'demo' | 'ai' }) {
  return (
    <View style={styles.modeBadge}>
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: mode === 'ai' ? palette.green : palette.gold,
        }}
      />
      <Text style={[text.mono, { color: mode === 'ai' ? palette.green : palette.gold, fontSize: 12 }]}>
        {mode === 'ai' ? 'AI CORE' : 'DEMO CORE'}
      </Text>
    </View>
  );
}

export function Mono({ children, color, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[text.mono, color ? { color } : null, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(18,15,36,0.56)',
    borderRadius: radius.lg,
    padding: space.md,
    overflow: 'hidden',
  },
  glassBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  primary: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: space.lg,
  },
  primaryLabel: {
    fontFamily: font.displayBold,
    fontSize: 13,
    letterSpacing: 1.5,
    color: palette.ink,
  },
  ghost: {
    height: 46,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: space.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ghostLabel: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    gap: 8,
  },
  headerTitle: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    letterSpacing: 2,
    color: palette.text,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontFamily: font.body,
    fontSize: 12.5,
    letterSpacing: 0.6,
    color: palette.faint,
    marginTop: 3,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: space.sm,
  },
  sectionDash: {
    width: 14,
    height: 1.5,
    borderRadius: 2,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.lineSoft,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
});
