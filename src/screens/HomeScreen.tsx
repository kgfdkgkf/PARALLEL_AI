import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Atmosphere } from '../components/Atmosphere';
import { BottomNav } from '../components/BottomNav';
import { BrandMark, CoverCaption } from '../components/Cover';
import { Icon } from '../components/Icon';
import { MetricChips, describeMetrics } from '../components/Metrics';
import { GhostButton, ModeBadge, Mono, Overline, Pill, PressableScale, PrimaryButton, Reveal, SectionLabel } from '../components/ui';
import { createUniverse } from '../engine/generate';
import { accents, covers, fillImage, font, palette, radius, space } from '../theme';
import type { ParallelStore } from '../state/useParallel';

const PROMPTS = [
  'Что, если бы время можно было покупать?',
  'Что, если бы люди помнили все прошлые жизни?',
  'Что, если бы ИИ появился двести лет назад?',
  'Что, если бы никто не умел бояться?',
  'Что, если бы у каждого было две жизни?',
  'Что, если бы никто никогда не мог лгать?',
];

export function HomeScreen({ store }: { store: ParallelStore }) {
  const { width } = useWindowDimensions();
  const featured = useMemo(() => createUniverse('Что, если бы люди никогда не умели лгать?'), []);
  const entrance = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 16000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 16000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, entrance]);

  const scheme = accents.violet;
  const lastWorld = store.archive[0];

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent="violet" starCount={70} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 132 }} showsVerticalScrollIndicator={false}>
          <View style={{ height: 420, marginTop: 4 }}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1] }) },
                    { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [6, -10] }) },
                  ],
                  opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.92] }),
                },
              ]}
            >
              <Image source={covers.crossroads} resizeMode="cover" style={fillImage} />
            </Animated.View>
            <LinearGradient
              colors={['rgba(5,5,12,0.92)', 'rgba(5,5,12,0.28)', 'rgba(5,5,12,0.86)', palette.ink]}
              locations={[0, 0.32, 0.72, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <Reveal delay={80}>
                <View style={styles.brandRow}>
                  <BrandMark size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brandName}>ПАРАЛЛЕЛЬ</Text>
                    <Mono style={{ marginTop: 3, fontSize: 9.5 }}>лаборатория реальностей</Mono>
                  </View>
                  <ModeBadge mode={store.engineMode} />
                </View>
              </Reveal>

              <Reveal delay={200} style={{ marginTop: 44 }}>
                <Overline color={scheme.text}>один вопрос · одна вселенная</Overline>
                <Text style={styles.heroTitle}>Одна мысль.</Text>
                <Text style={[styles.heroTitle, { color: scheme.hi }]}>Бесконечность</Text>
                <Text style={styles.heroTitle}>реальностей.</Text>
                <Text style={styles.heroSub}>
                  Ты меняешь одно правило нашего мира — и искусственный интеллект строит вселенную, в которой оно уже стало
                  реальностью.
                </Text>
                <View style={styles.heroFlow}>
                  {['гипотеза', 'вселенная', 'последствия'].map((step, index) => (
                    <React.Fragment key={step}>
                      <View style={styles.heroFlowItem}>
                        <Text style={styles.heroFlowIndex}>0{index + 1}</Text>
                        <Text style={styles.heroFlowLabel}>{step}</Text>
                      </View>
                      {index < 2 ? <View style={styles.heroFlowLine} /> : null}
                    </React.Fragment>
                  ))}
                </View>
              </Reveal>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 2 }}>
            <Reveal delay={340}>
              <PrimaryButton title="СОЗДАТЬ ВСЕЛЕННУЮ" icon="spark" onPress={() => store.go('create')} />
              <View style={styles.quickRow}>
                <Mono>6 решений</Mono>
                <View style={styles.dotDivider} />
                <Mono>3 жителя</Mono>
                <View style={styles.dotDivider} />
                <Mono>5 финалов</Mono>
              </View>
            </Reveal>

            {lastWorld ? (
              <Reveal delay={400} style={{ marginTop: space.xl }}>
                <SectionLabel accent="cyan" action="Продолжить" onAction={() => store.openWorld(lastWorld)}>
                  последняя вселенная
                </SectionLabel>
                <PressableScale onPress={() => store.openWorld(lastWorld)}>
                  <View style={styles.continueCard}>
                    <Image source={covers[lastWorld.cover]} resizeMode="cover" style={styles.continueCover} />
                    <View style={styles.continueBody}>
                      <Text numberOfLines={2} style={styles.continueTitle}>
                        {lastWorld.title}
                      </Text>
                      <Mono style={{ marginTop: 4 }}>
                        {lastWorld.state.turn}/6 решений · {lastWorld.state.ending ? 'финал' : 'в процессе'}
                      </Mono>
                    </View>
                    <Icon name="chevron" size={16} color={palette.faint} />
                  </View>
                </PressableScale>
              </Reveal>
            ) : null}

            <Reveal delay={460} style={{ marginTop: space.xl }}>
              <SectionLabel accent="violet">мир недели</SectionLabel>
              <PressableScale onPress={() => store.openWorld(featured)}>
                <View style={styles.feature}>
                  <Image source={covers[featured.cover]} resizeMode="cover" style={fillImage} />
                  <LinearGradient
                    colors={['rgba(8,6,20,0.1)', 'rgba(8,6,20,0.72)', 'rgba(5,5,12,0.96)']}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.featureTop}>
                    <Pill accent="violet">открыт для входа</Pill>
                    <CoverCaption index="REALITY / 001" codename={featured.codename} accent="violet" />
                  </View>
                  <View style={styles.featureBottom}>
                    <Text style={styles.featureTitle}>{featured.title}</Text>
                    <Text numberOfLines={2} style={styles.featurePremise}>
                      {featured.state.laws[0].text}
                    </Text>
                    <View style={{ marginTop: 12 }}>
                      <MetricChips metrics={featured.state.metrics} />
                    </View>
                    <View style={styles.featureFoot}>
                      <Text style={styles.featureHint}>{describeMetrics(featured.state.metrics)}</Text>
                      <View style={styles.featureArrow}>
                        <Icon name="chevron" size={16} color={palette.text} />
                      </View>
                    </View>
                  </View>
                </View>
              </PressableScale>
            </Reveal>

            <Reveal delay={540} style={{ marginTop: space.xl }}>
              <SectionLabel accent="gold" action="Все вопросы" onAction={() => store.go('create')}>
                с чего начать
              </SectionLabel>
            </Reveal>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 4 }}>
            {PROMPTS.map((prompt, index) => (
              <PressableScale
                key={prompt}
                onPress={() => {
                  store.setDraftQuestion(prompt);
                  store.go('create');
                }}
              >
                <View style={[styles.promptCard, { width: Math.min(width * 0.66, 268) }]}>
                  <Text style={styles.promptIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.promptText}>{prompt}</Text>
                  <View style={styles.promptFoot}>
                    <Mono>открыть гипотезу</Mono>
                    <Icon name="chevron" size={13} color={palette.violetHi} />
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>

          <View style={{ paddingHorizontal: 20, marginTop: space.xl }}>
            <Reveal delay={600}>
              <GhostButton title="Как устроена память мира" icon="branch" onPress={() => store.go('branches')} />
            </Reveal>
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Каждая вселенная помнит свои решения. События, законы и жители меняются вместе с ними — и никогда не
                откатываются назад без твоего выбора.
              </Text>
            </View>
          </View>
        </ScrollView>
        <BottomNav active={store.tab} onChange={(tab) => store.go(tab)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  brandName: {
    fontFamily: font.displayBook,
    fontSize: 15,
    letterSpacing: 4.2,
    color: palette.text,
  },
  heroTitle: {
    fontFamily: font.display,
    fontSize: 31,
    lineHeight: 40,
    letterSpacing: -1.1,
    color: palette.text,
  },
  heroSub: {
    marginTop: 14,
    maxWidth: 336,
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: palette.muted,
  },
  heroFlow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 26, maxWidth: 320 },
  heroFlowItem: { gap: 3 },
  heroFlowIndex: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1, color: palette.violetHi },
  heroFlowLabel: { fontFamily: font.bodySemi, fontSize: 11.5, letterSpacing: 0.6, color: palette.textSoft },
  heroFlowLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: palette.lineStrong, minWidth: 14 },
  quickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 },
  dotDivider: { width: 3, height: 3, borderRadius: 3, backgroundColor: palette.faint, opacity: 0.7 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  continueCover: { width: 56, height: 56, borderRadius: 12 },
  continueBody: { flex: 1, gap: 2 },
  continueTitle: { fontFamily: font.bodySemi, fontSize: 14.5, color: palette.text, lineHeight: 19 },
  feature: {
    height: 402,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    justifyContent: 'space-between',
  },
  featureTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  featureBottom: { padding: 18, gap: 8 },
  featureTitle: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: palette.text,
  },
  featurePremise: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: palette.muted },
  featureFoot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  featureHint: { flex: 1, fontFamily: font.body, fontSize: 12.5, lineHeight: 17, color: palette.faint },
  featureArrow: {
    width: 34,
    height: 34,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
  },
  promptCard: {
    padding: 16,
    borderRadius: radius.md,
    minHeight: 152,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20,16,40,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  promptIndex: { fontFamily: font.mono, fontSize: 11, letterSpacing: 1.6, color: palette.violetHi, opacity: 0.8 },
  promptText: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 21, color: palette.text, marginTop: 12 },
  promptFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  footer: { marginTop: space.lg, paddingBottom: space.sm },
  footerText: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: palette.faint },
});
