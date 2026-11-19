import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { NarrationButton } from '../components/NarrationButton';
import { Atmosphere, Halo } from '../components/Atmosphere';
import { Signet } from '../components/Avatar';
import { METRIC_META } from '../components/Metrics';
import { Divider, GhostButton, Icon, IconButton, Mono, Overline, Pill, PressableScale, PrimaryButton, Reveal, SectionLabel } from '../components';
import { TOTAL_DECISIONS } from '../engine/events';
import { accents, font, palette, radius, space } from '../theme';
import type { ParallelStore } from '../state/useParallel';

export function OutcomeScreen({ store }: { store: ParallelStore }) {
  const outcome = store.outcome;
  const universe = store.active;
  const insets = useSafeAreaInsets();
  const seal = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(seal, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(line, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [line, seal]);

  if (!outcome || !universe) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.body, color: palette.muted }}>Последствий пока нет.</Text>
      </View>
    );
  }

  const scheme = accents[universe.accent];
  const delta = METRIC_META.map((meta) => ({
    ...meta,
    value: outcome.after[meta.key] - outcome.before[meta.key],
    after: outcome.after[meta.key],
  }));
  const bump = delta.reduce((total, item) => total + Math.abs(item.value), 0);

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={universe.accent} intensity="soft" starCount={60} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <IconButton name="close" onPress={() => store.go('world')} accent={universe.accent} size={36} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Mono>новая линия реальности</Mono>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 208 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <Halo size={220} color={scheme.core + '26'} />
            <Animated.View
              style={{
                opacity: seal,
                transform: [{ scale: seal.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
              }}
            >
              <Svg width={120} height={120}>
                <Defs>
                  <RadialGradient id="outcome-seal" cx="40%" cy="34%" r="70%">
                    <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.9" />
                    <Stop offset="60%" stopColor={scheme.core} stopOpacity="0.32" />
                    <Stop offset="100%" stopColor={palette.ink} stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                <Circle cx={60} cy={60} r={54} fill="url(#outcome-seal)" stroke={scheme.core + '88'} strokeWidth={1} />
                <Circle cx={60} cy={60} r={44} fill="none" stroke={palette.line} strokeDasharray="3 6" strokeWidth={1} />
              </Svg>
            </Animated.View>
            <View style={{ position: 'absolute', top: 44 }}>
              <Icon name="check" size={26} color={palette.text} strokeWidth={1.4} />
            </View>
            <Overline color={scheme.text} style={{ marginTop: 14 }}>
              ветвь отделена · {universe.state.turn}/{TOTAL_DECISIONS}
            </Overline>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
            <Reveal delay={120}>
              <Text style={styles.headline}>{outcome.option.headline}</Text>
              <Text style={styles.explanation}>{outcome.option.explanation}</Text>
              <NarrationButton text={[outcome.option.headline, outcome.option.explanation, ...outcome.option.ripple].join(' ')} label="Озвучить последствия" accent={universe.accent} />
              {outcome.allyName ? (
                <Text style={styles.allyLine}>{outcome.allyName} открыто поддержал это решение.</Text>
              ) : null}
            </Reveal>

            <Reveal delay={220} style={{ marginTop: space.xl }}>
              <SectionLabel accent={universe.accent}>сдвиг мира</SectionLabel>
              <View style={styles.metricRow}>
                {delta.map((item) => {
                  const meta = accents[item.accent];
                  return (
                    <View key={item.key} style={styles.metricCell}>
                      <Text style={[styles.metricValue, { color: item.value === 0 ? palette.muted : item.value > 0 ? palette.green : palette.rose }]}>
                        {item.value > 0 ? '+' : ''}
                        {item.value}
                      </Text>
                      <Text style={styles.metricLabel}>{item.short}</Text>
                      <View style={styles.metricTrack}>
                        <View style={[styles.metricFill, { width: `${item.after}%`, backgroundColor: meta.core }]} />
                      </View>
                      <Text style={[styles.metricAfter, { color: meta.text }]}>{item.after}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.bumpLine}>
                {bump >= 20
                  ? 'Мир сдвинулся сильно: это решение почувствуют даже те, кто его не заметил.'
                  : 'Мир сдвинулся мягко: последствия проявятся в следующих событиях.'}
              </Text>
            </Reveal>

            <Reveal delay={300} style={{ marginTop: space.xl }}>
              <SectionLabel accent="gold">последствия второго порядка</SectionLabel>
              <View style={{ gap: 10 }}>
                {[...outcome.option.ripple, ...(outcome.ending ? [] : [])].map((ripple, index) => (
                  <View key={ripple} style={styles.rippleRow}>
                    <Text style={[styles.rippleIndex, { color: scheme.text }]}>{index + 1}</Text>
                    <Text style={styles.rippleText}>{ripple}</Text>
                  </View>
                ))}
              </View>
            </Reveal>

            <Reveal delay={420} style={{ marginTop: space.lg }}>
              <SectionLabel accent="rose">как это подают в мире</SectionLabel>
              <View style={{ gap: 8 }}>
                {universe.state.news.slice(0, 2).map((item) => (
                  <View key={item.id} style={styles.newsRow}>
                    <Mono>{item.source}</Mono>
                    <Text style={styles.newsHeadline}>{item.headline}</Text>
                  </View>
                ))}
              </View>
            </Reveal>

            <Reveal delay={380} style={{ marginTop: space.lg }}>
              <SectionLabel accent="violet">другие ветви</SectionLabel>
              <View style={{ gap: 8 }}>
                {(outcome.node.snapshot.pending?.options ?? [])
                  .filter((option) => option.id !== outcome.option.id)
                  .map((option) => (
                    <View key={option.id} style={styles.otherBranch}>
                      <Text style={styles.otherTitle}>{option.title}</Text>
                      <Text style={styles.otherHeadline}>→ {option.headline}</Text>
                    </View>
                  ))}
              </View>
              <Text style={styles.otherHint}>Любую из них можно прожить: «Ветви» → вернуться к точке выбора.</Text>
            </Reveal>

            {outcome.option.law ? (
              <Reveal delay={360} style={{ marginTop: space.lg }}>
                <View style={[styles.lawCard, { borderColor: scheme.core + '44' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="spark" size={13} color={scheme.hi} />
                    <Overline color={scheme.text}>новый закон реальности</Overline>
                  </View>
                  <Text style={styles.lawText}>{outcome.option.law}</Text>
                </View>
              </Reveal>
            ) : null}

            <Reveal delay={420} style={{ marginTop: space.lg }}>
              <View style={styles.memoryCard}>
                <Mono>мир запомнит</Mono>
                <Text style={styles.memoryText}>{outcome.option.memory}</Text>
              </View>
            </Reveal>

            <Reveal delay={480} style={{ marginTop: space.xl }}>
              <SectionLabel accent="cyan">жители отреагировали</SectionLabel>
              <View style={{ gap: 10 }}>
                {universe.state.characters.map((character) => {
                  const before = outcome.node.snapshot.characters.find((item) => item.id === character.id);
                  const shift = character.bond - (before?.bond ?? character.bond);
                  return (
                    <PressableScale key={character.id} onPress={() => store.openCharacter(character.id)}>
                      <View style={styles.reactionRow}>
                        <Signet accent={character.accent} stance={character.stance} size={40} bond={character.bond} id={`react-${character.id}`} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reactionName}>{character.name}</Text>
                          <Text style={styles.reactionStatus}>{character.status}</Text>
                        </View>
                        <Text style={[styles.reactionDelta, { color: shift >= 0 ? palette.green : palette.rose }]}>
                          {shift > 0 ? '+' : ''}
                          {shift}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </Reveal>

            {outcome.ending ? (
              <Reveal delay={520} style={{ marginTop: space.xl }}>
                <View style={styles.endingCard}>
                  <Mono>финал достигнут</Mono>
                  <Text style={styles.endingTitle}>{outcome.ending.title}</Text>
                  <Text style={styles.endingEpigraph}>{outcome.ending.epigraph}</Text>
                </View>
              </Reveal>
            ) : (
              <Reveal delay={520} style={{ marginTop: space.xl }}>
                <View style={styles.nextCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="clock" size={13} color={palette.faint} />
                    <Mono>следующая точка выбора</Mono>
                  </View>
                  <Text style={styles.nextText}>
                    {universe.state.pending
                      ? `«${universe.state.pending.title}» — мир уже подготовил следующий вопрос.`
                      : 'Мир ждёт следующего решения.'}
                  </Text>
                </View>
              </Reveal>
            )}

            <Reveal delay={560} style={{ marginTop: space.lg }}>
              <PressableScale onPress={() => store.rewind(outcome.node.id)}>
                <View style={styles.undoRow}>
                  <Icon name="reset" size={13} color={palette.faint} />
                  <Text style={styles.undoText}>Отменить и вернуться к этой точке</Text>
                </View>
              </PressableScale>
            </Reveal>
          </View>
        </ScrollView>

        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <PrimaryButton
            title={outcome.ending ? 'ОТКРЫТЬ ФИНАЛ' : 'ВОЙТИ В НОВУЮ ВЕТВЬ'}
            icon={outcome.ending ? 'eye' : 'chevron'}
            accent={universe.accent}
            onPress={() => store.go(outcome.ending ? 'ending' : 'world')}
          />
          <View style={{ marginTop: 10 }}>
            <GhostButton title="Сравнить ветви" icon="branch" accent={universe.accent} onPress={() => store.go('branches')} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  otherBranch: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 4,
  },
  otherTitle: { fontFamily: font.bodySemi, fontSize: 13, color: palette.text },
  otherHeadline: { fontFamily: font.body, fontSize: 12.5, lineHeight: 20, color: palette.muted },
  otherHint: { fontFamily: font.body, fontSize: 12, lineHeight: 20, color: palette.faint, marginTop: 10 },
  newsRow: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 5,
  },
  newsHeadline: { fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 22, color: palette.textSoft },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6, gap: 10 },
  headline: { fontFamily: font.display, fontSize: 25, lineHeight: 37, letterSpacing: -0.6, color: palette.text, marginTop: 6 },
  explanation: { fontFamily: font.body, fontSize: 15, lineHeight: 25, color: palette.textSoft, marginTop: 12 },
  allyLine: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 22, color: palette.green, marginTop: 10 },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricCell: {
    flex: 1,
    padding: 11,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 4,
  },
  metricValue: { fontFamily: font.displayBook, fontSize: 16, lineHeight: 25, letterSpacing: -0.3 },
  metricLabel: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 0.9, color: palette.faint },
  metricTrack: { height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 4 },
  metricFill: { height: 2, borderRadius: 2 },
  metricAfter: { fontFamily: font.bodySemi, fontSize: 12, opacity: 0.85 },
  bumpLine: { fontFamily: font.body, fontSize: 13, lineHeight: 21, color: palette.faint, marginTop: 12 },
  rippleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rippleIndex: { fontFamily: font.mono, fontSize: 13, marginTop: 3 },
  rippleText: { flex: 1, fontFamily: font.body, fontSize: 14, lineHeight: 23.5, color: palette.textSoft },
  lawCard: {
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  lawText: { fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 24, color: palette.text },
  memoryCard: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 8,
  },
  memoryText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft, fontStyle: 'italic' },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reactionName: { fontFamily: font.bodySemi, fontSize: 13.5, color: palette.text },
  reactionStatus: { fontFamily: font.body, fontSize: 13, color: palette.faint, marginTop: 2 },
  reactionDelta: { fontFamily: font.bodyBold, fontSize: 13.5 },
  endingCard: {
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold + '55',
    gap: 8,
  },
  endingTitle: { fontFamily: font.display, fontSize: 19, letterSpacing: 0.4, color: palette.gold },
  endingEpigraph: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft, fontStyle: 'italic' },
  nextCard: {
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 8,
  },
  nextText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft },
  undoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 8 },
  undoText: { fontFamily: font.body, fontSize: 13, color: palette.faint },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#07060F',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.lineSoft,
  },
});
