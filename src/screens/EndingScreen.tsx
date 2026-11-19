import React from 'react';
import { Share } from 'react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NarrationButton } from '../components/NarrationButton';
import { Atmosphere } from '../components/Atmosphere';
import { MetricBars, MetricRadar } from '../components/Metrics';
import { Divider, GhostButton, Icon, IconButton, Mono, Overline, Pill, PrimaryButton, Reveal, SectionLabel } from '../components';
import { accents, covers, fillImage, font, palette, radius } from '../theme';
import type { ParallelStore } from '../state/useParallel';

export function EndingScreen({ store }: { store: ParallelStore }) {
  const universe = store.active;
  const ending = universe?.state.ending ?? null;
  const insets = useSafeAreaInsets();

  if (!universe || !ending) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: font.body, color: palette.muted, textAlign: 'center' }}>
          Финал ещё не наступил. Прими все решения, чтобы увидеть, чем закончится эта реальность.
        </Text>
      </View>
    );
  }

  const scheme = accents[ending.accent];
  const objectiveMet = universe.objective
    ? universe.state.metrics[universe.objective.metric] >= universe.objective.target
    : false;

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={ending.accent} starCount={80} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Image source={covers[universe.cover]} resizeMode="cover" style={fillImage} />
            <LinearGradient
              colors={['rgba(4,4,10,0.5)', 'rgba(4,4,10,0.82)', palette.ink]}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[scheme.tint[0], 'rgba(4,4,10,0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroTop}>
              <IconButton name="back" onPress={store.back} accent={ending.accent} size={36} />
              <Pill accent={ending.accent}>финал · {universe.state.turn}/6</Pill>
            </View>
            <View style={styles.heroBody}>
              <Overline color={scheme.text}>чем закончилась реальность</Overline>
              <Text style={styles.title}>{ending.title}</Text>
              <Text style={styles.epigraph}>{ending.epigraph}</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <NarrationButton text={[ending.title, ending.epigraph, ...ending.body].join(' ')} label="Озвучить финал" accent={ending.accent} />
            {ending.body.map((paragraph, index) => (
              <Reveal key={index} delay={120 + index * 90}>
                <Text style={styles.paragraph}>{paragraph}</Text>
              </Reveal>
            ))}

            {universe.objective ? (
              <Reveal delay={340} style={{ marginTop: 22 }}>
                <View
                  style={[
                    styles.objectiveCard,
                    { borderColor: objectiveMet ? palette.green + '66' : palette.rose + '66' },
                  ]}
                >
                  <Mono>{objectiveMet ? 'цель партии выполнена' : 'цель партии не выполнена'}</Mono>
                  <Text style={styles.objectiveTitle}>{universe.objective.title}</Text>
                  <Text style={styles.objectiveMeta}>
                    {universe.objective.description} Сейчас: {universe.state.metrics[universe.objective.metric]} из {universe.objective.target}.
                  </Text>
                </View>
              </Reveal>
            ) : null}

            <Reveal delay={380} style={{ marginTop: 28 }}>
              <SectionLabel accent={ending.accent}>состояние мира на финале</SectionLabel>
              <View style={styles.metricsCard}>
                <MetricRadar metrics={universe.state.metrics} accent={ending.accent} size={140} />
                <View style={{ flex: 1 }}>
                  <MetricBars metrics={universe.state.metrics} accent={ending.accent} compact />
                </View>
              </View>
            </Reveal>

            <Reveal delay={440} style={{ marginTop: 24 }}>
              <SectionLabel accent="gold">путь</SectionLabel>
              <View style={styles.pathList}>
                {universe.path.map((node, index) => (
                  <View key={node.id} style={styles.pathRow}>
                    <Text style={styles.pathIndex}>{String(index + 1).padStart(2, '0')}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pathChoice}>{node.optionTitle}</Text>
                      <Mono style={{ marginTop: 2 }}>{node.headline}</Mono>
                    </View>
                  </View>
                ))}
              </View>
            </Reveal>

            <Reveal delay={500} style={{ marginTop: 24 }}>
              <View style={styles.closingCard}>
                <Icon name="spark" size={16} color={scheme.hi} />
                <Text style={styles.closingText}>
                  {universe.title} запомнил каждое твоё решение. В любой момент можно вернуться к точке ветвления и увидеть,
                  как выглядел бы другой финал.
                </Text>
              </View>
            </Reveal>

            <Reveal delay={560} style={{ marginTop: 20 }}>
              <View style={{ gap: 10 }}>
                <GhostButton
                  title="Поделиться финалом"
                  icon="send"
                  accent={ending.accent}
                  onPress={() => {
                    Share.share({
                      message: [
                        '«' + universe.title + '» — моя вселенная в ПАРАЛЛЕЛЬ.',
                        'Гипотеза: ' + universe.question,
                        'Финал: ' + ending.title + ' — ' + ending.epigraph,
                        'Решений: ' + universe.state.turn + '/6, законов: ' + universe.state.laws.length + '.',
                      ].join('\n'),
                    }).catch(() => undefined);
                  }}
                />
                <GhostButton title="Сравнить ветви" icon="branch" accent={ending.accent} onPress={() => store.go('branches')} />
                <GhostButton title="Вернуться в мир" icon="compass" accent={ending.accent} onPress={() => store.go('world')} />
              </View>
            </Reveal>
          </View>
        </ScrollView>

        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <PrimaryButton
            title="НОВАЯ ВСЕЛЕННАЯ"
            icon="spark"
            accent={ending.accent}
            onPress={() => {
              store.setDraftQuestion('');
              store.go('create');
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 404, justifyContent: 'flex-end' },
  heroTop: {
    position: 'absolute',
    top: 6,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBody: { padding: 20, paddingBottom: 24 },
  title: { fontFamily: font.display, fontSize: 30, lineHeight: 42, letterSpacing: -0.8, color: palette.text, marginTop: 10 },
  epigraph: {
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 25,
    color: palette.textSoft,
    fontStyle: 'italic',
    marginTop: 10,
  },
  paragraph: { fontFamily: font.body, fontSize: 15, lineHeight: 26, color: palette.textSoft, marginTop: 16 },
  objectiveCard: {
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 6,
  },
  objectiveTitle: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 25, color: palette.text },
  objectiveMeta: { fontFamily: font.body, fontSize: 13, lineHeight: 22, color: palette.muted },
  metricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  pathList: { gap: 10 },
  pathRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  pathIndex: { fontFamily: font.mono, fontSize: 12, color: palette.faint, marginTop: 3 },
  pathChoice: { fontFamily: font.bodySemi, fontSize: 13.5, color: palette.text },
  closingCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  closingText: { flex: 1, fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.muted },
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
