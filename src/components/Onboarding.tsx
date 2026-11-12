import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Atmosphere } from './Atmosphere';
import { BrandMark } from './Cover';
import { Icon } from './Icon';
import { Mono, Overline, PressableScale, PrimaryButton } from './ui';
import { accents, font, palette, radius } from '../theme';

const SEEN_KEY = 'parallel.onboarded.v2';

const STEPS = [
  {
    overline: 'шаг первый',
    title: 'Одно правило —\nцелый мир',
    text: 'Ты меняешь одно правило нашего мира. Дальше система строит вселенную, которая выросла из этого изменения за шестьдесят лет: законы, историю, культуру и жителей.',
    icon: 'spark' as const,
  },
  {
    overline: 'шаг второй',
    title: 'Мир можно\nисследовать',
    text: 'Карта открывает места, жители отвечают в рамках своих законов, хроника помнит каждое событие. Осматривай локации — они дают небольшие сдвиги и новые факты.',
    icon: 'map' as const,
  },
  {
    overline: 'шаг третий',
    title: 'Решения\nменяют всё',
    text: 'Шесть точек выбора, у каждой три пути. Доверие жителей позволяет позвать союзника. Вернуться к любой точке и выбрать иначе можно в разделе «Ветви» — мир пересчитает последствия.',
    icon: 'branch' as const,
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SEEN_KEY)
      .then((value) => {
        if (cancelled) return;
        if (!value) setVisible(true);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [opacity, visible]);

  const close = () => {
    setVisible(false);
    AsyncStorage.setItem(SEEN_KEY, '1').catch(() => undefined);
  };

  if (!ready || !visible) return null;

  const scheme = accents.violet;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, zIndex: 100 }]}>
      <Atmosphere accent="violet" starCount={70} />
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <BrandMark size={52} />
          <Overline color={scheme.text}>{current.overline}</Overline>
        </View>

        <View style={styles.card}>
          <Icon name={current.icon} size={22} color={scheme.hi} />
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.text}>{current.text}</Text>
        </View>

        <View style={{ gap: 12 }}>
          <View style={styles.dots}>
            {STEPS.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.dot,
                  { backgroundColor: index === step ? scheme.core : 'rgba(255,255,255,0.16)', width: index === step ? 18 : 6 },
                ]}
              />
            ))}
          </View>
          <PrimaryButton
            title={last ? 'НАЧАТЬ' : 'ДАЛЬШЕ'}
            icon={last ? 'spark' : 'chevron'}
            accent="violet"
            onPress={() => (last ? close() : setStep(step + 1))}
          />
          {!last ? (
            <PressableScale onPress={close}>
              <Text style={styles.skip}>Пропустить</Text>
            </PressableScale>
          ) : (
            <Mono style={{ textAlign: 'center' }}>одна мысль · бесконечность реальностей</Mono>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  card: {
    padding: 22,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(18,15,36,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    gap: 14,
  },
  title: {
    fontFamily: font.display,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: palette.text,
  },
  text: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 22,
    color: palette.muted,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 },
  dot: { height: 6, borderRadius: 6 },
  skip: { fontFamily: font.body, fontSize: 12, color: palette.faint, textAlign: 'center', paddingVertical: 6 },
});
