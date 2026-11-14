import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { accents, font, palette, type AccentKey } from '../theme';

/**
 * Ваш персонаж в мире — бог этой вселенной.
 *
 * Живёт поверх интерфейса: пульсирует, отвечает на нажатие и открывает
 * вкладку «Бог». Никуда не исчезает, чтобы игрок всё время помнил,
 * чья это вселенная.
 */
export function DeityOrb({
  accent = 'violet',
  onPress,
  hint = 'воззвать',
  name,
}: {
  accent?: AccentKey;
  onPress: () => void;
  hint?: string;
  name?: string;
}) {
  const scheme = accents[accent];
  const pulse = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const halo = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] });

  return (
    <View style={styles.wrap} accessible accessibilityLabel={name ? `бог ${name}` : 'бог'}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View onStartShouldSetResponder={() => true} onResponderRelease={onPress}>
          <Animated.View
            style={[
              styles.halo,
              { backgroundColor: scheme.core, opacity: halo },
            ]}
          />
          <Animated.View
            style={[
              styles.orb,
              { borderColor: scheme.core + '80', shadowColor: scheme.core },
            ]}
            onLayout={() => undefined}
          >
            <Svg width={44} height={44}>
              <Defs>
                <RadialGradient id="orbCore" cx="50%" cy="40%" r="60%">
                  <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.95" />
                  <Stop offset="100%" stopColor={scheme.core} stopOpacity="0.55" />
                </RadialGradient>
              </Defs>
              <Circle cx={22} cy={22} r={15} fill="url(#orbCore)" />
              <Circle cx={22} cy={22} r={19} fill="none" stroke={scheme.hi} strokeOpacity={0.5} strokeWidth={1} />
              <Circle cx={22} cy={22} r={11} fill="none" stroke={palette.ink} strokeOpacity={0.5} strokeWidth={1} />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
      <Text style={[styles.hint, { color: scheme.text }]}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  halo: {
    position: 'absolute',
    left: -14,
    top: -14,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  orb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(10,8,22,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  hint: { fontFamily: font.mono, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
});
