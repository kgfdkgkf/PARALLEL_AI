import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Atmosphere, Halo } from '../components/Atmosphere';
import { Icon } from '../components/Icon';
import { Mono, Overline } from '../components/ui';
import { detectTheme } from '../engine/themes';
import { accents, font, palette } from '../theme';
import type { ParallelStore } from '../state/useParallel';

const STAGES = [
  { title: 'Формулируем закон', detail: 'извлекаем правило из гипотезы' },
  { title: 'Пишем шестьдесят лет', detail: 'четыре эпохи и точка сдвига' },
  { title: 'Собираем жителей', detail: 'цели, страхи, тайны' },
  { title: 'Проверяем память мира', detail: 'связываем законы и последствия' },
];

export function ForgeScreen({ store }: { store: ParallelStore }) {
  const pack = useMemo(() => detectTheme(store.forgeQuestion || 'новая реальность'), [store.forgeQuestion]);
  const accent = pack.accent;
  const scheme = accents[accent];
  const spinA = useRef(new Animated.Value(0)).current;
  const spinB = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(Animated.timing(spinA, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(
        Animated.timing(spinB, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [breathe, spinA, spinB]);

  const progress = Math.min(1, store.forgeStage / STAGES.length);
  const percent = Math.round(progress * 100);

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={accent} starCount={90} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }} edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Overline color={scheme.text}>сборка реальности</Overline>
          <Text style={styles.counter}>{String(percent).padStart(2, '0')}%</Text>
        </View>

        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Halo size={280} color={scheme.core + '26'} />
          <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ rotate: spinA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
              ]}
            >
              <Svg width={240} height={240}>
                <Circle cx={120} cy={120} r={112} stroke={scheme.core + '66'} strokeWidth={1} strokeDasharray="40 210" fill="none" />
                <Circle cx={120} cy={120} r={112} stroke={palette.cyan + '44'} strokeWidth={1} strokeDasharray="3 40" fill="none" />
              </Svg>
            </Animated.View>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ rotate: spinB.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }] },
              ]}
            >
              <Svg width={240} height={240}>
                <Circle cx={120} cy={120} r={92} stroke={scheme.hi + '55'} strokeWidth={1} strokeDasharray="90 300" fill="none" />
              </Svg>
            </Animated.View>
            <Animated.View
              style={{
                width: 128,
                height: 128,
                borderRadius: 128,
                transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.03] }) }],
                opacity: 0.96,
              }}
            >
              <Svg width={128} height={128}>
                <Defs>
                  <RadialGradient id="forge-core" cx="38%" cy="32%" r="72%">
                    <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.95" />
                    <Stop offset="48%" stopColor={scheme.core} stopOpacity="0.7" />
                    <Stop offset="100%" stopColor={palette.ink} stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                <Circle cx={64} cy={64} r={62} fill="url(#forge-core)" stroke={scheme.hi + '88'} strokeWidth={1} />
              </Svg>
            </Animated.View>
          </View>

          <Text style={styles.question}>«{store.forgeQuestion}»</Text>
        </View>

        <View style={{ paddingBottom: 12 }}>
          {STAGES.map((stage, index) => {
            const done = store.forgeStage > index;
            const current = store.forgeStage === index;
            return (
              <View key={stage.title} style={styles.stageRow}>
                <View style={[styles.stageDot, { borderColor: done || current ? scheme.core : palette.line }]}>
                  {done ? (
                    <Icon name="check" size={10} color={scheme.hi} strokeWidth={2} />
                  ) : (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 4,
                        backgroundColor: current ? scheme.hi : palette.faint,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stageTitle, { color: done || current ? palette.text : palette.faint }]}>
                    {stage.title}
                  </Text>
                  <Mono style={{ marginTop: 2, opacity: done || current ? 0.9 : 0.45 }}>{stage.detail}</Mono>
                </View>
                {current ? <Mono color={scheme.text}>идет…</Mono> : done ? <Mono>готово</Mono> : null}
              </View>
            );
          })}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(4, percent)}%`, backgroundColor: scheme.core }]} />
          </View>
          <Text style={styles.note}>
            Мир держится на одном правиле. Дальше всё зависит от решений — и от того, что этот мир запомнит.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { fontFamily: font.display, fontSize: 32, lineHeight: 42, letterSpacing: -0.6, color: palette.text, marginTop: 6 },
  question: {
    marginTop: 26,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 22,
    color: palette.textSoft,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontStyle: 'italic',
  },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  stageDot: { width: 18, height: 18, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stageTitle: { fontFamily: font.bodySemi, fontSize: 13, letterSpacing: 0.2 },
  progressTrack: {
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 2, borderRadius: 2 },
  note: { fontFamily: font.body, fontSize: 12, lineHeight: 17, color: palette.faint, marginTop: 14 },
});
