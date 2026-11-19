import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NarrationButton } from '../components/NarrationButton';
import { Atmosphere, Halo } from '../components/Atmosphere';
import { BrandMark } from '../components/Cover';
import { METRIC_META } from '../components/Metrics';
import { Divider, GhostButton, Icon, IconButton, Mono, Pill, PressableScale, PrimaryButton, Reveal, SectionLabel, Signet } from '../components';
import { stanceTitle } from '../engine/events';
import type { MetricKey, Option } from '../engine/types';
import { accents, type AccentKey, covers, fillImage, font, palette, radius } from '../theme';
import type { ParallelStore } from '../state/useParallel';

function tap() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => undefined);
}

export function DecisionScreen({ store }: { store: ParallelStore }) {
  const universe = store.active;
  const decision = universe?.state.pending ?? null;
  const [selected, setSelected] = useState<string | null>(null);
  const [allyId, setAllyId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  if (!universe) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: font.body, color: palette.muted, textAlign: 'center' }}>Сначала создай вселенную.</Text>
      </View>
    );
  }

  if (!decision) {
    const loading = store.decisionLoading;
    return (
      <View style={{ flex: 1 }}>
        <Atmosphere accent={universe.accent} starCount={70} />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <IconButton name="back" onPress={store.back} accent={universe.accent} size={36} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Mono>точка выбора</Mono>
            </View>
            <View style={{ width: 36 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
            <Halo size={280} color={accents[universe.accent].core + '2A'} />
            <BrandMark size={62} accent={universe.accent} />
            <Text style={styles.stateTitle}>{loading ? 'ИИ дописывает следующий поворот' : 'Все решения приняты'}</Text>
            <Text style={styles.stateText}>
              {loading
                ? 'Ядро держит в памяти твои прошлые решения и придумывает событие, которое выросло именно из них. Обычно это занимает несколько секунд.'
                : 'Посмотри финал этой реальности или вернись в одну из ветвей и выбери иначе.'}
            </Text>
            {loading ? (
              <ActivityIndicator color={accents[universe.accent].hi} style={{ marginTop: 22 }} />
            ) : (
              <View style={{ marginTop: 22, alignSelf: 'stretch' }}>
                <GhostButton
                  title={universe.state.ending ? 'Смотреть финал' : 'К ветвям'}
                  icon="branch"
                  accent={universe.accent}
                  onPress={() => store.go(universe.state.ending ? 'ending' : 'branches')}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const scheme = accents[universe.accent];
  const allies = universe.state.characters.filter((character) => character.bond >= 50);

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={universe.accent} intensity="soft" starCount={38} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <IconButton name="back" onPress={store.back} accent={universe.accent} size={36} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Mono>{decision.kicker}</Mono>
          </View>
          <View style={styles.progress}>
            {Array.from({ length: decision.total }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index < decision.index - 1 ? scheme.core : index === decision.index - 1 ? scheme.hi : 'rgba(255,255,255,0.14)',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          {store.aiError && universe.mode === 'ai' ? (
            <View style={styles.aiNotice}>
              <Icon name="spark" size={12} color={palette.gold} />
              <Text style={styles.aiNoticeText}>Модель не ответила — событие собрано локально. {store.aiError}</Text>
            </View>
          ) : null}

          <View style={styles.cover}>
            <Image source={covers[universe.cover]} resizeMode="cover" style={fillImage} />
            <LinearGradient
              colors={['rgba(5,5,12,0.42)', palette.ink]}
              locations={[0, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: 18, justifyContent: 'flex-end', flex: 1 }}>
              <Pill accent={universe.accent}>точка ветвления</Pill>
              <Text style={styles.coverTitle}>{decision.title}</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <Reveal>
              <Text style={styles.context}>{decision.context}</Text>
              <View style={{ marginTop: 12 }}>
                <NarrationButton text={[decision.title, decision.context, decision.question].join('. ')} label="Озвучить событие" accent={universe.accent} />
              </View>
            </Reveal>

            <Reveal delay={80}>
              <View style={styles.questionCard}>
                <Text style={styles.questionLabel}>ВОПРОС</Text>
                <Text style={styles.question}>{decision.question}</Text>
              </View>
            </Reveal>

            <Reveal delay={140}>
              <SectionLabel accent="gold">три пути</SectionLabel>
            </Reveal>

            {decision.options.map((option, index) => (
              <Reveal key={option.id} delay={160 + index * 70}>
                <OptionCard
                  option={option}
                  accent={universe.accent}
                  selected={selected === option.id}
                  onPress={() => {
                    tap();
                    setSelected(option.id);
                  }}
                />
              </Reveal>
            ))}

            {allies.length > 0 ? (
              <Reveal delay={380}>
                <SectionLabel accent="green">союзники</SectionLabel>
                <Text style={styles.allyHint}>
                  Житель с доверием 50%+ поддержит решение: +4 к его метрике и +2 доверия, но потратит часть влияния (−6). Если союзников нет — просто прими решение, доверие вырастет у тех, чью позицию ты выбрал.
                </Text>
                <View style={styles.allyRow}>
                  {allies.map((ally) => {
                    const active = allyId === ally.id;
                    const scheme = accents[ally.accent];
                    return (
                      <PressableScale
                        key={ally.id}
                        onPress={() => {
                          tap();
                          setAllyId(active ? null : ally.id);
                        }}
                      >
                        <View
                          style={[
                            styles.allyChip,
                            active && { borderColor: scheme.hi, backgroundColor: scheme.core + '26' },
                          ]}
                        >
                          <Signet accent={ally.accent} stance={ally.stance} size={28} id={`ally-${ally.id}`} />
                          <View>
                            <Text style={[styles.allyName, active && { color: palette.text }]}>{ally.name.split(' ')[0]}</Text>
                            <Text style={styles.allyBond}>{ally.bond}%</Text>
                          </View>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </Reveal>
            ) : null}

            <Text style={styles.warning}>
              Решение изменит законы, жителей и метрики мира. Вернуться к этой точке можно будет в разделе «Ветви».
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {!selected ? <Text style={styles.actionHint}>Выбери один из трёх путей</Text> : null}
          <PrimaryButton
            title="ИЗМЕНИТЬ РЕАЛЬНОСТЬ"
            icon="spark"
            accent={universe.accent}
            disabled={!selected}
            onPress={() => selected && store.choose(selected, allyId ?? undefined)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function OptionCard({
  option,
  accent,
  selected,
  onPress,
}: {
  option: Option;
  accent: AccentKey;
  selected: boolean;
  onPress: () => void;
}) {
  const scheme = accents[accent];
  const effects = Object.entries(option.effects) as [MetricKey, number][];
  return (
    <PressableScale onPress={onPress}>
      <View
        style={[
          styles.option,
          { borderColor: selected ? scheme.hi : palette.lineSoft, backgroundColor: selected ? scheme.core + '1A' : 'rgba(255,255,255,0.028)' },
        ]}
      >
        <View style={styles.optionTop}>
          <View style={[styles.optionRadio, { borderColor: selected ? scheme.hi : palette.faint }]}>
            {selected ? <View style={[styles.optionRadioDot, { backgroundColor: scheme.hi }]} /> : null}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Pill accent={option.stance === 'control' ? 'gold' : option.stance === 'liberty' ? 'green' : 'cyan'}>
              {stanceTitle(option.stance)}
            </Pill>
          </View>
        </View>

        <Text style={styles.optionDetail}>{option.detail}</Text>

        <Divider style={{ marginVertical: 10 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {effects.map(([key, value]) => {
            const meta = METRIC_META.find((item) => item.key === key);
            return (
              <View key={key} style={styles.effect}>
                <Text style={[styles.effectValue, { color: value > 0 ? palette.green : palette.rose }]}>
                  {value > 0 ? '+' : ''}
                  {value}
                </Text>
                <Text style={styles.effectLabel}>{meta?.short ?? key}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.optionFoot}>
          <Icon name="clock" size={12} color={palette.faint} />
          <Text style={styles.optionCost}>{option.cost}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 10 },
  progress: { flexDirection: 'row', gap: 4, width: 60, justifyContent: 'flex-end' },
  progressDot: { width: 5, height: 5, borderRadius: 5 },
  aiNotice: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,201,139,0.4)',
    backgroundColor: 'rgba(255,201,139,0.08)',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  aiNoticeText: { flex: 1, fontFamily: font.body, fontSize: 12.5, lineHeight: 21, color: palette.textSoft },
  cover: { height: 214, marginHorizontal: 20, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 18 },
  coverTitle: { fontFamily: font.display, fontSize: 24, lineHeight: 37, letterSpacing: -0.5, color: palette.text, marginTop: 8 },
  context: { fontFamily: font.body, fontSize: 15, lineHeight: 25, color: palette.textSoft },
  questionCard: {
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(20,16,40,0.66)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    gap: 8,
  },
  questionLabel: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 2, color: palette.gold },
  question: { fontFamily: font.bodySemi, fontSize: 16, lineHeight: 28, color: palette.text },
  option: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  optionTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  optionRadio: { width: 18, height: 18, borderRadius: 18, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  optionRadioDot: { width: 8, height: 8, borderRadius: 8 },
  optionTitle: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 24, color: palette.text },
  optionDetail: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.muted },
  effect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  effectValue: { fontFamily: font.bodyBold, fontSize: 12.5 },
  effectLabel: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 0.8, color: palette.faint },
  optionFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  optionCost: { fontFamily: font.body, fontSize: 13, color: palette.faint },
  stateTitle: {
    fontFamily: font.display,
    fontSize: 19,
    lineHeight: 31,
    letterSpacing: -0.3,
    color: palette.text,
    textAlign: 'center',
    marginTop: 20,
  },
  stateText: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 24,
    color: palette.muted,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
  },
  allyHint: { fontFamily: font.body, fontSize: 12.5, lineHeight: 21, color: palette.faint, marginBottom: 10 },
  allyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  allyName: { fontFamily: font.bodySemi, fontSize: 13, color: palette.textSoft },
  allyBond: { fontFamily: font.mono, fontSize: 11, color: palette.faint, marginTop: 2 },
  warning: { fontFamily: font.body, fontSize: 13, lineHeight: 20, color: palette.faint, marginTop: 4 },
  actionHint: {
    fontFamily: font.body,
    fontSize: 13,
    color: palette.faint,
    textAlign: 'center',
    marginBottom: 8,
  },
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
