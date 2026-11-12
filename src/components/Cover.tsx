import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { accents, type AccentKey, type CoverId, covers, fillImage, font, palette, radius, shadow } from '../theme';

export function WorldCover({
  cover,
  accent = 'violet',
  style,
  children,
  dim = 0.28,
  rounded = true,
}: {
  cover: CoverId;
  accent?: AccentKey;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  dim?: number;
  rounded?: boolean;
}) {
  const scheme = accents[accent];
  return (
    <View style={[styles.wrap, rounded && { borderRadius: radius.lg }, style]}>
      <Image source={covers[cover]} resizeMode="cover" style={[fillImage, { opacity: 0.92 }]} />
      <LinearGradient
        colors={[scheme.tint[0], 'rgba(5,5,12,0.15)', 'rgba(5,5,12,0.92)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(4,4,10,${dim})` }]} />
      <LinearGradient
        colors={['rgba(4,4,10,0.55)', 'rgba(4,4,10,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: '45%' }]}
      />
      {children}
    </View>
  );
}

export function CoverCaption({
  index,
  codename,
  accent = 'violet',
}: {
  index: string;
  codename: string;
  accent?: AccentKey;
}) {
  return (
    <View style={styles.caption}>
      <Text style={[styles.captionIndex, { color: accents[accent].text }]}>{index}</Text>
      <View style={[styles.captionDot, { backgroundColor: accents[accent].core }]} />
      <Text style={styles.captionName}>{codename}</Text>
    </View>
  );
}

export function BrandMark({ size = 46, accent = 'violet' }: { size?: number; accent?: AccentKey }) {
  const scheme = accents[accent];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size * 1.02,
          height: size * 0.4,
          borderRadius: size,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: scheme.core + 'AA',
          transform: [{ rotate: '-26deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.86,
          height: size * 0.3,
          borderRadius: size,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: palette.cyan + '66',
          transform: [{ rotate: '34deg' }],
        }}
      />
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size,
          backgroundColor: scheme.core,
          ...shadow.glow(scheme.core),
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size,
          backgroundColor: palette.gold,
          top: size * 0.1,
          right: size * 0.04,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: palette.panelSolid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captionIndex: {
    fontFamily: font.bodySemi,
    fontSize: 10.5,
    letterSpacing: 1.6,
  },
  captionDot: {
    width: 3,
    height: 3,
    borderRadius: 3,
  },
  captionName: {
    fontFamily: font.bodySemi,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: palette.muted,
    textTransform: 'uppercase',
  },
});
