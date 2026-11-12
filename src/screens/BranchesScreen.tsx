import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Atmosphere } from '../components/Atmosphere';
import { Divider, GhostButton, Icon, IconButton, Mono, Overline, Pill, PressableScale, PrimaryButton, Reveal, SectionLabel } from '../components';
import { TOTAL_DECISIONS, stanceTitle } from '../engine/events';
import type { BranchNode, Option } from '../engine/types';
import { accents, font, palette, radius, space } from '../theme';
import type { ParallelStore } from '../state/useParallel';

export function BranchesScreen({ store }: { store: ParallelStore }) {
  const universe = store.active;
  const [expanded, setExpanded] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  if (!universe) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: font.body, color: palette.muted, textAlign: 'center' }}>Сначала создай вселенную.</Text>
      </View>
    );
  }

  const scheme = accents[universe.accent];
  const path = universe.path;

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={universe.accent} intensity="soft" starCount={40} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <IconButton name="back" onPress={store.back} accent={universe.accent} size={36} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Mono>память и ветвление</Mono>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <Reveal>
            <Text style={styles.title}>Ветви{'\n'}реальности</Text>
            <Text style={styles.subtitle}>
              Каждое решение — отдельная ветвь с собственным снимком мира. Вернись к любой точке и выбери иначе: ИИ пересчитает
              последствия, но не забудет, что было раньше.
            </Text>
            <View style={styles.chips}>
              <Pill accent={universe.accent}>{path.length}/{TOTAL_DECISIONS} решений</Pill>
              <Pill accent="cyan">{universe.state.memory.length} фактов в памяти</Pill>
              <Pill accent="gold">{universe.state.laws.length} законов</Pill>
            </View>
          </Reveal>

          <Reveal delay={120} style={{ marginTop: 26 }}>
            <SectionLabel accent={universe.accent}>активная линия</SectionLabel>
          </Reveal>

          {path.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyGlyph, { borderColor: scheme.core + '55' }]}>
                <Icon name="branch" size={26} color={scheme.hi} />
              </View>
              <Text style={styles.emptyTitle}>Пока одна линия</Text>
              <Text style={styles.emptyText}>
                Здесь появятся точки, где ты менял ход истории. Чем больше решений — тем больше ветвей можно сравнить.
              </Text>
              <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
                <PrimaryButton title="К ПЕРВОМУ РЕШЕНИЮ" icon="spark" accent={universe.accent} onPress={() => store.go('decision')} />
              </View>
            </View>
          ) : (
            <View style={styles.tree}>
              <View style={styles.treeLine} />
              {path.map((node, index) => (
                <View key={node.id} style={styles.treeItem}>
                  <View style={styles.rail}>
                    <View style={[styles.railDot, { borderColor: scheme.core, backgroundColor: scheme.core }]}>
                      <Text style={styles.railNumber}>{index + 1}</Text>
                    </View>
                    {index === path.length - 1 ? <View style={[styles.railHead, { backgroundColor: scheme.hi }]} /> : null}
                  </View>
                  <PressableScale onPress={() => setExpanded(expanded === node.id ? null : node.id)} style={{ flex: 1 }}>
                    <View style={[styles.node, expanded === node.id && { borderColor: scheme.core + '55', backgroundColor: scheme.core + '12' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Overline color={scheme.text}>{node.decisionTitle}</Overline>
                        <Mono>{universe.era + node.turn * 4}</Mono>
                      </View>
                      <Text style={styles.nodeChoice}>{node.optionTitle}</Text>
                      <Text style={styles.nodeHeadline}>→ {node.headline}</Text>
                      <View style={styles.nodeFoot}>
                        <Mono>точка {String(node.turn).padStart(2, '0')} · {node.createdAt.slice(11, 16)}</Mono>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.nodeAction}>{expanded === node.id ? 'свернуть' : 'развернуть'}</Text>
                          <Icon name="chevron" size={11} color={palette.faint} />
                        </View>
                      </View>
                      {expanded === node.id ? (
                        <>
                          <Divider style={{ marginVertical: 12 }} />
                          <Text style={styles.altsLabel}>БЫЛИ ВАРИАНТЫ</Text>
                          {node.snapshot.pending?.options.map((option: Option) => {
                            const chosen = option.id === node.optionId;
                            return (
                              <View key={option.id} style={styles.altRow}>
                                <View
                                  style={[
                                    styles.altDot,
                                    { borderColor: chosen ? scheme.hi : palette.faint, backgroundColor: chosen ? scheme.hi : 'transparent' },
                                  ]}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.altTitle, chosen && { color: palette.text }]}>{option.title}</Text>
                                  <Text style={styles.altMeta}>
                                    {stanceTitle(option.stance)} · {option.cost}
                                  </Text>
                                </View>
                                {chosen ? <Mono color={scheme.text}>выбрано</Mono> : null}
                              </View>
                            );
                          })}
                          <View style={{ marginTop: 14 }}>
                            <GhostButton
                              title="Вернуться к этой точке"
                              icon="reset"
                              accent={universe.accent}
                              compact
                              onPress={() => store.rewind(node.id)}
                            />
                          </View>
                        </>
                      ) : null}
                    </View>
                  </PressableScale>
                </View>
              ))}
            </View>
          )}

          <Reveal delay={160} style={{ marginTop: space.xl }}>
            <SectionLabel accent="cyan">как это работает</SectionLabel>
            <View style={styles.howCard}>
              {[
                ['01', 'Снимок мира', 'Перед каждым решением сохраняется полное состояние: законы, жители, метрики, хроника.'],
                ['02', 'Транзакция', 'Выбор меняет метрики, добавляет закон, обновляет доверие жителей и пишет факт в память.'],
                ['03', 'Пересчёт', 'Следующие события строятся уже с учётом нового состояния — мир помнит, что ты сделал.'],
                ['04', 'Возврат', 'Вернувшись в точку, ты не «отменяешь» прошлое, а создаёшь новую ветвь от того же снимка.'],
              ].map(([index, title, text]) => (
                <View key={index} style={styles.howRow}>
                  <Text style={[styles.howIndex, { color: scheme.text }]}>{index}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.howTitle}>{title}</Text>
                    <Text style={styles.howText}>{text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Reveal>
        </ScrollView>

        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <PrimaryButton
            title={universe.state.ending ? 'СМОТРЕТЬ ФИНАЛ' : `${store.outcome ? 'ВОЙТИ В МИР' : 'К СЛЕДУЮЩЕМУ РЕШЕНИЮ'}`}
            icon="chevron"
            accent={universe.accent}
            onPress={() => store.go(universe.state.ending ? 'ending' : store.outcome ? 'world' : 'decision')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6, gap: 10 },
  title: { fontFamily: font.display, fontSize: 27, lineHeight: 36, letterSpacing: -0.8, color: palette.text },
  subtitle: { fontFamily: font.body, fontSize: 13.5, lineHeight: 21, color: palette.muted, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  empty: {
    alignItems: 'center',
    padding: 22,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    backgroundColor: 'rgba(255,255,255,0.028)',
  },
  emptyGlyph: { width: 64, height: 64, borderRadius: 64, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: font.bodySemi, fontSize: 15, color: palette.text, marginTop: 14 },
  emptyText: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: palette.muted, textAlign: 'center', marginTop: 8 },
  tree: { paddingLeft: 2 },
  treeLine: { position: 'absolute', left: 15, top: 12, bottom: 40, width: StyleSheet.hairlineWidth, backgroundColor: palette.line },
  treeItem: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rail: { width: 30, alignItems: 'center', paddingTop: 6 },
  railDot: { width: 22, height: 22, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  railNumber: { fontFamily: font.mono, fontSize: 10.5, color: palette.ink },
  railHead: { width: 6, height: 6, borderRadius: 6, marginTop: 6 },
  node: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.028)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 7,
  },
  nodeChoice: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: palette.text },
  nodeHeadline: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: palette.textSoft },
  nodeFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  nodeAction: { fontFamily: font.body, fontSize: 11, color: palette.faint },
  altsLabel: { fontFamily: font.bodySemi, fontSize: 9.5, letterSpacing: 1.6, color: palette.faint, marginBottom: 8 },
  altRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 6 },
  altDot: { width: 8, height: 8, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  altTitle: { fontFamily: font.bodySemi, fontSize: 13, color: palette.muted },
  altMeta: { fontFamily: font.body, fontSize: 11, color: palette.faint, marginTop: 2 },
  howCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 14,
  },
  howRow: { flexDirection: 'row', gap: 12 },
  howIndex: { fontFamily: font.mono, fontSize: 11, marginTop: 2 },
  howTitle: { fontFamily: font.bodySemi, fontSize: 13, color: palette.text },
  howText: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: palette.muted, marginTop: 3 },
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
