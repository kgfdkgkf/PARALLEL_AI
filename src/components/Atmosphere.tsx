import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { accents, type AccentKey, fillImage, grain, palette } from '../theme';
import { mulberry32 } from '../engine/hash';

type Props = {
  accent?: AccentKey;
  intensity?: 'deep' | 'soft' | 'flat';
  starCount?: number;
  children?: React.ReactNode;
};

function Stars({ count, color }: { count: number; color: string }) {
  const stars = useMemo(() => {
    const random = mulberry32(9173);
    return Array.from({ length: count }, (_, index) => ({
      left: `${(random() * 100).toFixed(2)}%`,
      top: `${(random() * 100).toFixed(2)}%`,
      size: random() > 0.92 ? 2.6 : random() > 0.7 ? 1.8 : 1.1,
      opacity: 0.18 + random() * 0.55,
      bright: Platform.OS !== 'web' && index % 11 === 0,
    }));
  }, [count]);

  const twinkles = useRef(stars.filter((star) => star.bright).map(() => new Animated.Value(0.25))).current;

  useEffect(() => {
    const loops = twinkles.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 0.95,
            duration: 1600 + index * 240,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.2,
            duration: 2000 + index * 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [twinkles]);

  let brightIndex = -1;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((star, index) => {
        if (star.bright) {
          brightIndex += 1;
          return (
            <Animated.View
              key={index}
              style={{
                position: 'absolute',
                left: star.left as unknown as number,
                top: star.top as unknown as number,
                width: star.size + 1.4,
                height: star.size + 1.4,
                borderRadius: 99,
                backgroundColor: color,
                opacity: twinkles[brightIndex] ?? 0.6,
              }}
            />
          );
        }
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: star.left as unknown as number,
              top: star.top as unknown as number,
              width: star.size,
              height: star.size,
              borderRadius: 99,
              backgroundColor: color,
              opacity: star.opacity,
            }}
          />
        );
      })}
    </View>
  );
}

export const Atmosphere = React.memo(function Atmosphere({ accent = 'violet', intensity = 'deep', starCount = 54, children }: Props) {
  const scheme = accents[accent];
  const base = intensity === 'flat' ? palette.ink2 : palette.void;
  const strength = intensity === 'deep' ? 1 : intensity === 'soft' ? 0.62 : 0.24;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="nebula-a" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={scheme.core} stopOpacity={0.55 * strength} />
            <Stop offset="62%" stopColor={scheme.core} stopOpacity={0.16 * strength} />
            <Stop offset="100%" stopColor={scheme.core} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="nebula-b" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={palette.cyan} stopOpacity={0.34 * strength} />
            <Stop offset="70%" stopColor={palette.cyan} stopOpacity={0.08 * strength} />
            <Stop offset="100%" stopColor={palette.cyan} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="nebula-c" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={palette.rose} stopOpacity={0.22 * strength} />
            <Stop offset="100%" stopColor={palette.rose} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="800" fill="url(#nebula-a)" />
        <Rect x="-140" y="220" width="360" height="360" fill="url(#nebula-b)" />
        <Rect x="190" y="-90" width="300" height="300" fill="url(#nebula-c)" />
        <Circle cx="330" cy="120" r="2" fill={palette.white} opacity="0.55" />
        <Circle cx="58" cy="640" r="1.6" fill={palette.white} opacity="0.4" />
        <Circle cx="286" cy="700" r="1.2" fill={palette.white} opacity="0.35" />
      </Svg>
      {intensity !== 'flat' && <Stars count={starCount} color={palette.text} />}
      <Image source={grain} resizeMode="repeat" style={[fillImage, { opacity: 0.16 }]} />
      {children}
    </View>
  );
});

/** Медленно дышащий ореол за крупными элементами. */
export function Halo({
  size = 320,
  color = 'rgba(139,108,255,0.28)',
  duration = 5200,
  style,
}: {
  size?: number;
  color?: string;
  duration?: number;
  style?: object;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
        },
        style,
      ]}
    />
  );
}
