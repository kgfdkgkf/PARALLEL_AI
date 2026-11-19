import React, { useMemo, useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Illustration, illustrationBrief } from '../components/Illustration';
import { WorldJournal } from './WorldJournal';
import { NarrationButton } from '../components/NarrationButton';
import { Atmosphere } from '../components/Atmosphere';
import { Signet } from '../components/Avatar';
import { CharacterPortrait, LocationArt } from '../components/Portraits';
import { MapSheet, WorldMap } from '../components/WorldMap';
import { DeityOrb } from '../components/DeityOrb';
import { MetricBars, MetricRadar, describeMetrics } from '../components/Metrics';
import { Divider, GhostButton, Glass, Icon, IconButton, ModeBadge, Mono, Overline, Pill, PressableScale, PrimaryButton, Reveal, SectionLabel } from '../components';
import { TOTAL_DECISIONS } from '../engine/events';
import {
  DIVINE_BLESS_COST,
  DIVINE_CURSE_COST,
  deityOf,
  divineJournal,
  divineKindAccent,
  divineKindLabel,
  faithOf,
  pendingDivine,
  POWERS,
  powerTargets,
  usedPower,
} from '../engine/divine';
import type { DivinePower, Location, Universe } from '../engine/types';
import { accents, covers, fillImage, font, palette, radius, space } from '../theme';
import type { ParallelStore } from '../state/useParallel';

type TabKey = 'overview' | 'map' | 'people' | 'god' | 'journal' | 'chronicle';

const TABS: { id: TabKey; label: string; icon: 'compass' | 'map' | 'people' | 'timeline' | 'spark' | 'eye' }[] = [
  { id: 'overview', label: 'Обзор', icon: 'compass' },
  { id: 'map', label: 'Карта', icon: 'map' },
  { id: 'people', label: 'Жители', icon: 'people' },
  { id: 'god', label: 'Бог', icon: 'spark' },
  { id: 'journal', label: 'Дневник', icon: 'eye' },
  { id: 'chronicle', label: 'Хроника', icon: 'timeline' },
];

export function WorldScreen({ store }: { store: ParallelStore }) {
  const [tab, setTab] = useState<TabKey>('overview');
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const wrapTabs = width < 410 || fontScale > 1.15;
  const universe = store.active;
  if (!universe) {
    return (
      <View style={{ flex: 1 }}>
        <Atmosphere accent="violet" />
        <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: font.body, color: palette.muted }}>Вселенная ещё не создана.</Text>
        </SafeAreaView>
      </View>
    );
  }

  const scheme = accents[universe.accent];
  const { state } = universe;
  const ending = state.ending;
  const activeLocationId = store.selectedLocation?.id ?? null;

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={universe.accent} intensity="soft" starCount={46} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <IconButton name="back" onPress={store.back} accent={universe.accent} size={36} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Mono>{universe.codename} · {universe.era}</Mono>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              name="send"
              label="share"
              onPress={() => {
                Share.share({
                  message:
                    '«' + universe.title + '» — вселенная в ПАРАЛЛЕЛЬ.\n' +
                    'Гипотеза: ' + universe.question + '\n' +
                    'Правило: ' + universe.rule + '\n' +
                    'Решений: ' + universe.state.turn + '/6, жителей: ' + universe.state.characters.length + '.',
                }).catch(() => undefined);
              }}
              accent={universe.accent}
              size={36}
            />
            <IconButton name="branch" onPress={() => store.go('branches')} accent={universe.accent} size={36} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
          <Reveal>
            <View style={styles.hero}>
              <Image source={covers[universe.cover]} resizeMode="cover" style={fillImage} />
              <LinearGradient
                colors={['rgba(5,5,12,0.62)', 'rgba(5,5,12,0.66)', palette.ink]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[scheme.tint[0], 'rgba(5,5,12,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroBody}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Pill accent={universe.accent}>{universe.genre}</Pill>
                  <ModeBadge mode={universe.mode} />
                  <Mono>{universe.state.turn}/{TOTAL_DECISIONS} решений</Mono>
                </View>
                <Text style={styles.heroTitle}>{universe.title}</Text>
                <Text style={styles.heroQuestion}>«{universe.question}»</Text>
                {universe.fork ? <Pill accent={universe.accent}>ветвь с точки {universe.fork.turn}</Pill> : null}
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: scheme.text }]}>{state.laws.length}</Text>
                    <Mono>законов</Mono>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: scheme.text }]}>{state.characters.length}</Text>
                    <Mono>жителя</Mono>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: scheme.text }]}>{state.locations.filter((item) => item.unlocked).length}</Text>
                    <Mono>мест</Mono>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: scheme.text }]}>{state.memory.length}</Text>
                    <Mono>фактов</Mono>
                  </View>
                </View>
              </View>
            </View>
          </Reveal>

          <View style={[styles.tabs, wrapTabs && styles.tabsWrapped]}>
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <View key={item.id} style={wrapTabs ? styles.tabThird : styles.tabFlexible}>
                  <PressableScale onPress={() => setTab(item.id)}>
                    <View style={styles.tab}>
                      <Icon name={item.icon} size={17} color={active ? scheme.hi : palette.faint} strokeWidth={1.6} />
                      <Text style={[styles.tabLabel, active && { color: palette.text }]}>{item.label}</Text>
                      <View style={[styles.tabMark, { backgroundColor: active ? scheme.core : 'transparent' }]} />
                    </View>
                  </PressableScale>
                </View>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
            {tab === 'overview' && universe.mode === 'demo' && store.engineMode === 'ai' && store.aiError ? (
              <Text accessibilityLiveRegion="polite" style={styles.mapHint}>Мир собран локально. {store.aiError}</Text>
            ) : null}
            {tab === 'overview' ? <Overview universe={universe} store={store} onOpenMap={() => setTab('map')} /> : null}
            {tab === 'map' ? <MapTab universe={universe} store={store} /> : null}
            {tab === 'people' ? <PeopleTab universe={universe} store={store} /> : null}
            {tab === 'god' ? <GodTab universe={universe} store={store} /> : null}
            {tab === 'chronicle' ? <ChronicleTab universe={universe} /> : null}
            {tab === 'journal' ? <WorldJournal universe={universe} onObserve={store.observeDay} /> : null}
          </View>
        </ScrollView>

        {tab === 'overview' ? (
          <View style={styles.orbFloat} pointerEvents="box-none">
            <DeityOrb
              accent={universe.accent}
              name={deityOf(universe)}
              hint="воззвать"
              onPress={() => setTab('god')}
            />
          </View>
        ) : null}

        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {ending ? (
            <PrimaryButton title="СМОТРЕТЬ ФИНАЛ" icon="eye" accent={ending.accent} onPress={() => store.go('ending')} />
          ) : (
            <PrimaryButton
              title={`ВМЕШАТЬСЯ В ИСТОРИЮ`}
              icon="spark"
              accent={universe.accent}
              onPress={() => store.go('decision')}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Overview({ universe, store, onOpenMap }: { universe: Universe; store: ParallelStore; onOpenMap: () => void }) {
  const scheme = accents[universe.accent];
  const { state } = universe;
  return (
    <View style={{ gap: space.xl }}>
      <View>
        <SectionLabel accent={universe.accent}>правило мира</SectionLabel>
        <View style={[styles.ruleCard, { borderColor: scheme.core + '33' }]}>
          <Text style={[styles.ruleMark, { color: scheme.core }]}>§</Text>
          <Text style={styles.ruleText}>{universe.rule}</Text>
        </View>
        <Text style={styles.premise}>{universe.premise}</Text>
        <View style={{ marginTop: 12 }}>
          <NarrationButton text={[universe.title, universe.rule, universe.premise].join('. ')} label="Слушать мир" accent={universe.accent} />
        </View>
        {universe.signature ? (
          <View style={[styles.signatureCard, { borderColor: scheme.core + '40' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="spark" size={13} color={scheme.hi} />
              <Overline color={scheme.text}>уникальное в этой вселенной</Overline>
            </View>
            <Text style={styles.signatureTitle}>{universe.signature.title}</Text>
            <Text style={styles.signatureText}>{universe.signature.text}</Text>
          </View>
        ) : null}
        <View style={styles.roleRow}>
          <View style={{ flex: 1 }}>
            <Overline color={palette.violetHi}>ваша роль</Overline>
            <Text style={styles.roleText}>{universe.playerRole ?? 'Странник из мира без правил'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Overline color={palette.gold}>цель партии</Overline>
            <Text style={styles.roleText}>{universe.objective?.title ?? 'Дойти до финала'}</Text>
            <Text style={styles.roleHint}>{universe.objective?.description ?? ''}</Text>
          </View>
        </View>
      </View>

      <View>
        <SectionLabel accent="cyan">состояние цивилизации</SectionLabel>
        <Glass>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <MetricRadar metrics={state.metrics} accent={universe.accent} size={152} />
            <View style={{ flex: 1 }}>
              <Text style={styles.metricsLine}>{describeMetrics(state.metrics)}</Text>
              <View style={{ marginTop: 10 }}>
                <Mono>меняется решениями</Mono>
              </View>
            </View>
          </View>
          <Divider style={{ marginVertical: 16 }} />
          <MetricBars metrics={state.metrics} accent={universe.accent} compact />
        </Glass>
      </View>

      <View>
        <SectionLabel accent="rose">сводка мира</SectionLabel>
        {state.news.length ? (
          <View style={{ gap: 10 }}>
            {state.news.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.newsRow}>
                <View style={styles.newsHead}>
                  <View
                    style={[
                      styles.newsDot,
                      {
                        backgroundColor:
                          item.tone === 'negative' ? palette.rose : item.tone === 'positive' ? palette.green : palette.faint,
                      },
                    ]}
                  />
                  <Mono>{item.source}</Mono>
                  <Mono>· после решения {item.turn}</Mono>
                </View>
                <Text style={styles.newsTitle}>{item.headline}</Text>
                <Text style={styles.newsText}>{item.text}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.newsEmpty}>
            <Icon name="timeline" size={14} color={palette.faint} />
            <Text style={styles.newsEmptyText}>
              Сводка появится после первого решения: этот мир начнёт публиковать новости о себе.
            </Text>
          </View>
        )}
      </View>

      <View>
        <SectionLabel accent="gold">законы реальности</SectionLabel>
        <View style={{ gap: 8 }}>
          {state.laws.map((law, index) => (
            <View key={law.id} style={styles.lawRow}>
              <Text style={[styles.lawIndex, { color: law.origin === 'consequence' ? scheme.text : palette.faint }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lawText}>{law.text}</Text>
                {law.origin === 'consequence' ? (
                  <View style={{ marginTop: 6 }}>
                    <Pill accent={universe.accent}>следствие решения</Pill>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View>
        <SectionLabel accent="violet">культура и быт</SectionLabel>
        <View style={styles.cultureGrid}>
          {universe.culture.map((fact, index) => (
            <View key={`${fact.label}-${index}`} style={styles.cultureCell}>
              <Overline color={palette.violetHi}>{fact.label}</Overline>
              <Text style={styles.cultureValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <SectionLabel accent="green">что помнит этот мир</SectionLabel>
        <View style={styles.memoryList}>
          {state.memory.slice(-7).map((fact) => (
            <View key={fact.id} style={styles.memoryRow}>
              <View style={[styles.memoryDot, { backgroundColor: fact.kind === 'decision' ? scheme.core : palette.faint }]} />
              <Text style={styles.memoryText}>{fact.text}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.memoryHint}>
          Память мира нельзя стереть: она влияет на события, диалоги и финал. Сравнить ветви можно в разделе «Ветви».
        </Text>
      </View>

      <View>
        <SectionLabel accent="cyan" action="На карту" onAction={onOpenMap}>
          места
        </SectionLabel>
        <View style={{ gap: 8 }}>
          {state.locations.slice(0, 3).map((location) => (
            <View key={location.id} style={styles.placeRow}>
              <LocationArt name={location.name} seed={universe.seed} accent={location.accent} width={54} height={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.placeName}>{location.name}</Text>
                <Text style={styles.placeBlurb}>{location.blurb}</Text>
              </View>
              <Mono>{location.kind}</Mono>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function MapTab({ universe, store }: { universe: Universe; store: ParallelStore }) {
  const location = store.selectedLocation ?? universe.state.locations[0];
  const resident = location ? universe.state.characters.find((item) => item.home === location.id) : undefined;
  const scene = store.scene && store.scene.locationId === location?.id ? store.scene : null;
  return (
    <View style={{ gap: 22 }}>
      <SectionLabel accent={universe.accent}>карта реальности</SectionLabel>
      <WorldMap
        locations={universe.state.locations}
        accent={universe.accent}
        heightRatio={0.86}
        activeId={location?.id ?? null}
        onSelect={(item: Location) => store.setSelectedLocationId(item.id)}
      />
      <Text style={styles.mapHint}>
        Нажми на узел, чтобы открыть место. Новые точки появляются по мере того, как мир меняется под твоими решениями.
      </Text>
      {scene ? (
        <View style={[styles.sceneCard, { borderColor: accents[scene.accent].core + '55' }]}>
          <Overline color={accents[scene.accent].text}>{scene.locationName}</Overline>
          <Text style={styles.sceneTitle}>{scene.title}</Text>
          <Text style={styles.sceneText}>{scene.text}</Text>
          {scene.artifact ? <Pill accent="gold">Найдено: {scene.artifact.title}</Pill> : null}
          <NarrationButton text={scene.title + '. ' + scene.text} label="Озвучить сцену" accent={scene.accent} />
          <View style={styles.sceneFoot}>
            <Pill accent={scene.accent}>{scene.effectLabel}</Pill>
            <PressableScale onPress={store.clearScene}>
              <Text style={styles.sceneClose}>Понятно</Text>
            </PressableScale>
          </View>
        </View>
      ) : null}
      {location ? (
        <MapSheet
          location={location}
          accent={location.accent}
          characterName={resident?.name}
          onOpenCharacter={resident ? () => store.openCharacter(resident.id) : undefined}
          seed={universe.seed}
          renderArt={(fallback) => (
            <Illustration
              kind="location" server={store.aiSettings.imageServer} description={illustrationBrief(universe, location)}
              label={location.name} accent={location.accent} onConfigure={() => store.go('profile')}
            >
              {fallback}
            </Illustration>
          )}
          onExplore={universe.state.ending ? undefined : () => store.explore(location.id)}
          explored={location.visitedTurn === universe.state.turn}
        />
      ) : null}
    </View>
  );
}

function PeopleTab({ universe, store }: { universe: Universe; store: ParallelStore }) {
  return (
    <View style={{ gap: 14 }}>
      <SectionLabel accent="violet">жители вселенной</SectionLabel>
      {universe.state.characters.map((character) => {
        const scheme = accents[character.accent];
        return (
          <PressableScale key={character.id} onPress={() => store.openCharacter(character.id)}>
            <View style={[styles.personCard, { borderColor: scheme.core + '2A' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <CharacterPortrait name={character.name} seed={universe.seed} accent={character.accent} stance={character.stance} width={62} height={80} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{character.name}</Text>
                  <Overline color={scheme.text} style={{ marginTop: 3 }}>{character.role}</Overline>
                </View>
                <Icon name="chevron" size={16} color={palette.faint} />
              </View>
              <Text style={styles.personQuote}>«{character.quote}»</Text>
              <View style={styles.personFoot}>
                <View style={{ flex: 1 }}>
                  <View style={styles.bondTrack}>
                    <View style={[styles.bondFill, { width: `${character.bond}%`, backgroundColor: scheme.core }]} />
                  </View>
                </View>
                <Mono>{character.status} · {character.bond}%</Mono>
              </View>
            </View>
          </PressableScale>
        );
      })}
      <Text style={styles.mapHint}>
        Жители помнят твои решения. Чем выше доверие, тем больше они рассказывают — включая то, что предпочли бы скрыть.
      </Text>
    </View>
  );
}

function ChronicleTab({ universe }: { universe: Universe }) {
  const entries = [...universe.state.chronicle].reverse();
  return (
    <View>
      <SectionLabel accent="gold">хроника вселенной</SectionLabel>
      <View style={styles.timeline}>
        <View style={styles.timelineLine} />
        {entries.map((entry, index) => {
          const scheme = accents[entry.accent];
          const emphasis = entry.kind === 'decision' || entry.kind === 'ending';
          return (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      borderColor: scheme.core,
                      backgroundColor: emphasis ? scheme.core : palette.ink,
                    },
                  ]}
                />
                {index < entries.length - 1 ? null : <View style={styles.timelineCap} />}
              </View>
              <View style={[styles.timelineBody, emphasis && { borderColor: scheme.core + '3A' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Overline color={scheme.text}>{entry.label}</Overline>
                  <Mono>{entry.year || universe.era + entry.turn * 4}</Mono>
                </View>
                <Text style={styles.timelineTitle}>{entry.title}</Text>
                <Text style={styles.timelineText}>{entry.text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  godHero: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196,180,255,0.22)',
    backgroundColor: 'rgba(22,18,44,0.7)',
    gap: 8,
  },
  godName: { fontFamily: font.display, fontSize: 24, lineHeight: 36, letterSpacing: -0.5, color: palette.text },
  godHint: { fontFamily: font.body, fontSize: 12.5, lineHeight: 21, color: palette.faint },
  faithRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  faithTrack: { flex: 1, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  faithFill: { height: 3, borderRadius: 3, backgroundColor: palette.violetHi },
  godCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,40,0.72)',
    gap: 8,
  },
  godTitle: { fontFamily: font.displayBook, fontSize: 17, lineHeight: 28, color: palette.text },
  godText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 24, color: palette.textSoft },
  godActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  godAction: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  godActionOff: { opacity: 0.4 },
  godActionTitle: { fontFamily: font.bodySemi, fontSize: 13.5, color: palette.text },
  powerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  powerChip: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 9 },
  godActionEffect: { fontFamily: font.mono, fontSize: 11, color: palette.faint },
  godEmpty: {
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  journalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  journalTitle: { fontFamily: font.bodySemi, fontSize: 13, color: palette.text },
  journalText: { fontFamily: font.body, fontSize: 12.5, lineHeight: 20, color: palette.muted, marginTop: 2 },

  newsRow: {
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.028)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 6,
  },
  newsHead: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  newsDot: { width: 5, height: 5, borderRadius: 5 },
  newsTitle: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 23, color: palette.text },
  newsText: { fontFamily: font.body, fontSize: 13, lineHeight: 22, color: palette.muted },
  newsEmpty: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  newsEmptyText: { flex: 1, fontFamily: font.body, fontSize: 13, lineHeight: 22, color: palette.faint },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 10 },
  hero: { height: 322, marginHorizontal: 20, marginTop: 2, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  heroBody: { padding: 18, gap: 8 },
  heroTitle: { fontFamily: font.display, fontSize: 25, lineHeight: 36, letterSpacing: -0.6, color: palette.text },
  heroQuestion: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft, fontStyle: 'italic' },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  heroStat: { gap: 2 },
  heroStatValue: { fontFamily: font.displayBook, fontSize: 15, lineHeight: 24 },
  heroStatDivider: { width: StyleSheet.hairlineWidth, height: 18, backgroundColor: palette.line },
  tabs: {
    flexDirection: 'row',
    marginTop: 18,
    marginHorizontal: 20,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    paddingVertical: 4,
  },
  tabsWrapped: { flexWrap: 'wrap' },
  tabThird: { width: '33.33%' },
  tabFlexible: { flex: 1 },
  tab: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  tabLabel: { fontFamily: font.bodySemi, fontSize: 12.5, letterSpacing: 0.5, color: palette.faint },
  tabMark: { width: 14, height: 2, borderRadius: 2, marginTop: 2 },
  ruleCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,40,0.66)',
  },
  ruleMark: { fontFamily: font.display, fontSize: 22, lineHeight: 30 },
  ruleText: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 26, color: palette.text },
  premise: { fontFamily: font.body, fontSize: 15, lineHeight: 25, color: palette.muted, marginTop: 14 },
  signatureCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,40,0.66)',
    gap: 6,
  },
  signatureTitle: { fontFamily: font.displayBook, fontSize: 16, lineHeight: 25, color: palette.text },
  signatureText: { fontFamily: font.body, fontSize: 13, lineHeight: 22, color: palette.textSoft },
  roleRow: { flexDirection: 'row', gap: 14, marginTop: 16 },
  roleText: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 23, color: palette.text, marginTop: 4 },
  roleHint: { fontFamily: font.body, fontSize: 12.5, lineHeight: 20, color: palette.faint, marginTop: 4 },
  sceneCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,40,0.72)',
    gap: 8,
  },
  sceneTitle: { fontFamily: font.displayBook, fontSize: 16, lineHeight: 26, color: palette.text },
  sceneText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 24, color: palette.textSoft },
  sceneFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sceneClose: { fontFamily: font.bodySemi, fontSize: 12.5, color: palette.textSoft },
  metricsLine: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 23, color: palette.textSoft },
  lawRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  lawIndex: { fontFamily: font.mono, fontSize: 13, letterSpacing: 1, marginTop: 2 },
  lawText: { fontFamily: font.body, fontSize: 14, lineHeight: 23, color: palette.textSoft },
  cultureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cultureCell: {
    width: '47.6%',
    minHeight: 96,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 6,
  },
  cultureValue: { fontFamily: font.body, fontSize: 13, lineHeight: 20, color: palette.muted },
  memoryList: { gap: 8 },
  memoryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  memoryDot: { width: 5, height: 5, borderRadius: 5, marginTop: 7 },
  memoryText: { flex: 1, fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft },
  memoryHint: { fontFamily: font.body, fontSize: 13, lineHeight: 20, color: palette.faint, marginTop: 12 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  placeDot: { width: 7, height: 7, borderRadius: 7 },
  placeName: { fontFamily: font.bodySemi, fontSize: 13.5, color: palette.text },
  placeBlurb: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: palette.muted, marginTop: 2 },
  mapHint: { fontFamily: font.body, fontSize: 13, lineHeight: 21, color: palette.faint },
  personCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(18,15,36,0.62)',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  personName: { fontFamily: font.displayBook, fontSize: 15.5, lineHeight: 25, color: palette.text },
  personQuote: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft, fontStyle: 'italic' },
  personFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bondTrack: { height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  bondFill: { height: 2, borderRadius: 2 },
  timeline: { paddingLeft: 4 },
  timelineLine: { position: 'absolute', left: 9, top: 6, bottom: 6, width: StyleSheet.hairlineWidth, backgroundColor: palette.line },
  timelineItem: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  timelineRail: { width: 18, alignItems: 'center', paddingTop: 6 },
  timelineDot: { width: 11, height: 11, borderRadius: 11, borderWidth: 1.4 },
  timelineCap: { width: 1, height: 0 },
  timelineBody: {
    flex: 1,
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.028)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 6,
  },
  timelineTitle: { fontFamily: font.bodySemi, fontSize: 14, color: palette.text },
  timelineText: { fontFamily: font.body, fontSize: 13, lineHeight: 21, color: palette.muted },
  orbFloat: { position: 'absolute', right: 16, bottom: 112, zIndex: 40 },
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


function GodTab({ universe, store }: { universe: Universe; store: ParallelStore }) {
  const [power, setPower] = useState<DivinePower>('inspire');
  const [targetId, setTargetId] = useState<string | null>(null);
  const targets = powerTargets(universe, power);
  const target = targets.find((item) => item.id === targetId);
  const selectedPower = POWERS[power];
  const powerUsed = usedPower(universe);
  const protectedPlace = universe.state.locations.find((place) => place.id === universe.state.life?.protectedLocationId);
  const pending = pendingDivine(universe);
  const faith = faithOf(universe.state);
  const journal = divineJournal(universe.state);
  const blessAffordable = faith >= DIVINE_BLESS_COST;
  const curseAffordable = faith >= DIVINE_CURSE_COST;

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.godHero}>
        <Overline color={palette.violetHi}>вы — бог этой вселенной</Overline>
        <Text style={styles.godName}>{deityOf(universe)}</Text>
        <Text style={styles.godHint}>
          За решения и прожитые дни вера возвращается. Между двумя решениями можно ответить на одно знамение и применить одну силу.
        </Text>
        <View style={styles.faithRow}>
          <View style={styles.faithTrack}>
            <View style={[styles.faithFill, { width: Math.min(100, faith) + '%' }]} />
          </View>
          <Mono>вера {faith}</Mono>
        </View>
      </View>

      {pending ? (
        <View style={[styles.godCard, { borderColor: accents[divineKindAccent[pending.kind]].core + '55' }]}>
          <Overline color={accents[divineKindAccent[pending.kind]].text}>{divineKindLabel[pending.kind]}</Overline>
          <Text style={styles.godTitle}>{pending.title}</Text>
          <Text style={styles.godText}>{pending.text}</Text>
          <View style={styles.godActions}>
            <View style={{ flex: 1 }}>
              <PressableScale onPress={store.blessDivine} disabled={!blessAffordable}>
                <View
                  style={[
                    styles.godAction,
                    { borderColor: palette.green + '66', backgroundColor: 'rgba(80,200,140,0.10)' },
                    !blessAffordable && styles.godActionOff,
                  ]}
                >
                  <Text style={[styles.godActionTitle, { color: palette.green }]}>Благословить</Text>
                  <Text style={styles.godActionEffect}>−{DIVINE_BLESS_COST} веры · +доверие</Text>
                </View>
              </PressableScale>
            </View>
            <View style={{ flex: 1 }}>
              <PressableScale onPress={store.curseDivine} disabled={!curseAffordable}>
                <View
                  style={[
                    styles.godAction,
                    { borderColor: palette.rose + '66', backgroundColor: 'rgba(255,110,140,0.10)' },
                    !curseAffordable && styles.godActionOff,
                  ]}
                >
                  <Text style={[styles.godActionTitle, { color: palette.rose }]}>Покарать</Text>
                  <Text style={styles.godActionEffect}>−{DIVINE_CURSE_COST} веры · +порядок</Text>
                </View>
              </PressableScale>
            </View>
          </View>
          {!blessAffordable && !curseAffordable ? (
            <Text style={styles.godHint}>Веры не хватает. Примите решение в мире — вера вернётся.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.godEmpty}>
          <Text style={styles.godHint}>
            {universe.state.ending ? 'Эта линия завершена.' : 'Следующее знамение придёт после решения в мире.'}
          </Text>
        </View>
      )}

      {!universe.state.ending ? (
        <View style={[styles.godCard, { borderColor: palette.line }]}>
          <SectionLabel accent="cyan">силы бога</SectionLabel>
          <View style={styles.powerRow}>
            {(Object.keys(POWERS) as DivinePower[]).map((id) => (
              <PressableScale key={id} onPress={() => { setPower(id); setTargetId(null); }}>
                <View style={[styles.powerChip, power === id && { borderColor: accents[POWERS[id].accent].hi }]}>
                  <Text style={styles.godActionTitle}>{POWERS[id].title}</Text>
                </View>
              </PressableScale>
            ))}
          </View>
          <Text style={styles.godText}>{selectedPower.text} Цена — {selectedPower.cost} веры.</Text>
          {protectedPlace ? <Mono color={palette.cyan}>оберег · {protectedPlace.name}</Mono> : null}
          {powerUsed ? <Text style={styles.godHint}>Новая сила доступна после следующего решения.</Text> : (
            <>
              <View style={styles.powerRow}>
                {targets.map((item) => (
                  <PressableScale key={item.id} onPress={() => setTargetId(item.id)}>
                    <View style={[styles.powerChip, targetId === item.id && { borderColor: accents[selectedPower.accent].hi }]}>
                      <Text style={styles.godActionTitle}>{item.name}</Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
              {targets.length === 0 ? <Text style={styles.godHint}>Сейчас нет подходящей цели.</Text> : null}
              <GhostButton
                title="Применить силу" icon="spark" accent={selectedPower.accent} compact
                disabled={!target || faith < selectedPower.cost}
                onPress={() => { if (target) store.performPower(power, target.id); }}
              />
            </>
          )}
        </View>
      ) : null}

      <View>
        <SectionLabel accent="violet">журнал бога</SectionLabel>
        {journal.length > 0 ? (
          <View style={{ gap: 10 }}>
            {journal.map((event) => (
              <View key={event.id} style={styles.journalRow}>
                <Pill accent={event.power ? POWERS[event.power].accent : event.resolved === 'bless' ? 'green' : 'rose'}>
                  {event.power ? 'сила' : event.resolved === 'bless' ? 'милость' : 'кара'}
                </Pill>
                <View style={{ flex: 1 }}>
                  <Text style={styles.journalTitle}>{event.title}</Text>
                  <Text style={styles.journalText}>{event.result}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.godHint}>Пока пусто. Ответьте на первое знамение — запись появится здесь.</Text>
        )}
      </View>
    </View>
  );
}
