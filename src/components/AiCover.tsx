import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import { worldArtUrl } from '../engine/art';
import type { Universe } from '../engine/types';
import { fillImage } from '../theme';

/**
 * AI-обложка мира: плавно проявляется поверх локальной картинки.
 * Если генерация недоступна (лимит, сеть), компонент просто не рисуется.
 */
export function AiCover({ universe, style }: { universe: Universe; style?: StyleProp<ImageStyle> }) {
  const uri = useMemo(() => worldArtUrl(universe), [universe]);
  const opacity = useRef(new Animated.Value(0)).current;
  const [failed, setFailed] = useState(false);

  if (!uri || failed) return null;

  return (
    <Animated.Image
      source={{ uri }}
      resizeMode="cover"
      onLoad={() => {
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
      }}
      onError={() => setFailed(true)}
      style={[fillImage, styles.base, style, { opacity }]}
      pointerEvents="none"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: 'transparent' },
});
