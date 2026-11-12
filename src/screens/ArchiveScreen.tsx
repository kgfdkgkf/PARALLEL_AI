import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere } from '../components/Atmosphere';
import { BottomNav } from '../components/BottomNav';
import { BrandMark } from '../components/Cover';
import { METRIC_META } from '../components/Metrics';
import { Divider, GhostButton, Icon, IconButton, Mono, Overline, Pill, PressableScale, PrimaryButton, Reveal, SectionLabel } from '../components';
import type { Universe } from '../engine/types';
import { accents, covers, font, palette, radius, space } from '../theme';
import type { ParallelStore } from '../state/useParallel';

export function ArchiveScreen({ store }: { store: ParallelStore }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent="cyan" intensity="soft" starCount={40} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          <Reveal>
            <View style={styles.topRow}>
              <BrandMark size={32} accent="cyan" />
              <Mono>личный архив</Mono>
            </View>
            <Text style={styles.title}>Твои{'\n'}реальности</Text>
            <Text style={styles.subtitle}>
              {store.archive.length === 0
                ? 'Пока пусто. Одна гипотеза — и здесь появится первая вселенная.'
                : `${store.archive.length} ${plural(store.archive.length, ['вселенная', 'вселенные', 'вселенных'])} · ${store.stats.decisions} ${plural(store.stats.decisions, ['решение', 'решения', 'решений'])}`}
            </Text>
          </Reveal>

          {store.archive.length === 0 ? (
            <Reveal delay={120} style={{ marginTop: 30 }}>
              <View style={styles.empty}>
                <View style={styles.emptyOrb}>
                  <BrandMark size={54} accent="violet" />
                </View>
                <Text style={styles.emptyTitle}>Здесь хранятся миры</Text>
                <Text style={styles.emptyText}>
                  Каждая вселенная помнит свои законы, жителей и решения. Вернись к любой из них в любой момент.
                </Text>
                <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
                  <PrimaryButton title="СОЗДАТЬ ВСЕЛЕННУЮ" icon="spark" onPress={() => store.go('create')} />
                </View>
              </View>
            </Reveal>
          ) : (
            <View style={{ marginTop: 22, gap: 12 }}>
              <SectionLabel accent="violet">сохранённые вселенные</SectionLabel>
              {store.archive.map((world, index) => (
                <Reveal key={world.id} delay={80 + index * 50}>
                  <ArchiveCard
                    world={world}
                    confirming={confirmId === world.id}
                    onOpen={() => store.openWorld(world)}
                    onDeleteRequest={() => setConfirmId(world.id)}
                    onDelete={() => {
                      store.deleteWorld(world.id);
                      setConfirmId(null);
                    }}
                    onCancel={() => setConfirmId(null)}
                  />
                </Reveal>
              ))}
            </View>
          )}

          <Reveal delay={200} style={{ marginTop: 18 }}>
            <GhostButton title="Создать ещё одну" icon="plus" onPress={() => store.go('create')} />
          </Reveal>
        </ScrollView>
        <BottomNav active={store.tab} onChange={(tab) => store.go(tab)} />
      </SafeAreaView>
    </View>
  );
}

function ArchiveCard({
  world,
  confirming,
  onOpen,
  onDeleteRequest,
  onDelete,
  onCancel,
}: {
  world: Universe;
  confirming: boolean;
  onOpen: () => void;
  onDeleteRequest: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const scheme = accents[world.accent];
  const ending = world.state.ending;
  return (
    <PressableScale onPress={onOpen} onLongPress={onDeleteRequest}>
      <View style={[styles.card, { borderColor: scheme.core + '26' }]}>
        <Image source={covers[world.cover]} resizeMode="cover" style={styles.cardCover} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={[styles.cardCode, { color: scheme.text }]}>{world.codename}</Text>
            {ending ? <Pill accent={ending.accent}>финал</Pill> : <Pill accent="cyan">в процессе</Pill>}
          </View>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {world.title}
          </Text>
          <Mono style={{ marginTop: 2 }}>
            {world.state.turn}/6 решений · {world.state.laws.length} законов · {world.era}
          </Mono>
          <Text numberOfLines={1} style={styles.cardMetrics}>
            {METRIC_LINE(world.state.metrics)}
          </Text>
        </View>
        <View style={styles.cardSide}>
          <IconButton name="chevron" onPress={onOpen} accent={world.accent} size={30} bordered={false} />
          <PressableScale onPress={onDeleteRequest} hitSlop={10}>
            <View style={styles.trash}>
              <Icon name="close" size={12} color={palette.faint} />
            </View>
          </PressableScale>
        </View>
        {confirming ? (
          <View style={styles.confirm}>
            <Text style={styles.confirmText}>Удалить вселенную и её память?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PressableScale onPress={onCancel}>
                <View style={styles.confirmGhost}>
                  <Text style={styles.confirmGhostText}>Нет</Text>
                </View>
              </PressableScale>
              <PressableScale onPress={onDelete}>
                <View style={[styles.confirmDanger, { backgroundColor: palette.rose }]}>
                  <Text style={styles.confirmDangerText}>Удалить</Text>
                </View>
              </PressableScale>
            </View>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

function METRIC_LINE(metrics: { [key: string]: number }) {
  return METRIC_META.map((meta) => `${meta.short} ${metrics[meta.key]}`).join(' · ');
}

function plural(count: number, forms: [string, string, string]) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 37, letterSpacing: -0.9, color: palette.text, marginTop: 18 },
  subtitle: { fontFamily: font.body, fontSize: 13.5, lineHeight: 21, color: palette.muted, marginTop: 10 },
  empty: {
    alignItems: 'center',
    padding: 22,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  emptyOrb: { width: 96, height: 96, borderRadius: 96, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,108,255,0.08)' },
  emptyTitle: { fontFamily: font.bodySemi, fontSize: 15, color: palette.text, marginTop: 10 },
  emptyText: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: palette.muted, textAlign: 'center', marginTop: 8 },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(18,15,36,0.58)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardCover: { width: 76, height: 108, borderRadius: 14 },
  cardMetrics: { fontFamily: font.bodySemi, fontSize: 10.5, letterSpacing: 0.4, color: palette.muted, marginTop: 2 },
  cardCode: { fontFamily: font.bodySemi, fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase' },
  cardTitle: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: palette.text },
  cardSide: { justifyContent: 'space-between', alignItems: 'flex-end' },
  trash: {
    width: 26,
    height: 26,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  confirm: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(10,8,20,0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.rose + '55',
    gap: 10,
  },
  confirmText: { fontFamily: font.body, fontSize: 13, color: palette.textSoft },
  confirmGhost: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.06)' },
  confirmGhostText: { fontFamily: font.bodySemi, fontSize: 12, color: palette.textSoft },
  confirmDanger: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
  confirmDangerText: { fontFamily: font.bodySemi, fontSize: 12, color: palette.ink },
});
