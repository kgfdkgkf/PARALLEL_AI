import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere } from '../components/Atmosphere';
import { BottomNav } from '../components/BottomNav';
import { Signet } from '../components/Avatar';
import { Divider, GhostButton, Icon, Mono, Overline, Pill, PressableScale, Reveal, SectionLabel } from '../components';
import { PROVIDERS, embeddedKey, type ProviderId } from '../engine/providers';
import { accents, font, palette, radius } from '../theme';
import type { ParallelStore } from '../state/useParallel';

export function ProfileScreen({ store }: { store: ParallelStore }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const provider = PROVIDERS[store.aiSettings.provider];
  const providerOrder: ProviderId[] = ['demo', 'gemini', 'groq', 'openrouter', 'deepseek', 'local', 'backend'];
  const endingBadges = [
    { kind: 'order', title: 'Хрустальный порядок', accent: 'gold' as const },
    { kind: 'freedom', title: 'Дикий рассвет', accent: 'green' as const },
    { kind: 'balance', title: 'Третий вариант', accent: 'violet' as const },
    { kind: 'machine', title: 'Автоматический рай', accent: 'cyan' as const },
    { kind: 'collapse', title: 'Тихий распад', accent: 'rose' as const },
  ];
  const collected = new Set(store.archive.map((item) => item.state.ending?.kind).filter(Boolean));
  const scheme = accents.violet;
  const stats = store.stats;
  const since = store.archive.length ? new Date(store.archive[store.archive.length - 1].createdAt) : null;
  const sinceLabel = since
    ? since.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent="violet" intensity="soft" starCount={44} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          <Reveal>
            <Overline color={scheme.text}>профиль исследователя</Overline>
            <View style={styles.identity}>
              <Signet accent="violet" stance="transcend" size={74} id="profile" bond={Math.min(100, stats.worlds * 12)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.name}>Исследователь{'\n'}реальностей</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Pill accent="violet">уровень {Math.min(9, 1 + Math.floor(stats.decisions / 3))}</Pill>
                  <Pill accent="cyan">с {sinceLabel}</Pill>
                </View>
              </View>
            </View>
          </Reveal>

          <Reveal delay={100} style={{ marginTop: 24 }}>
            <View style={styles.statsGrid}>
            {/* 2×2: подписи не должны рваться по слогам */}
              {[
                { label: 'вселенных', value: stats.worlds, accent: 'violet' as const },
                { label: 'решений', value: stats.decisions, accent: 'gold' as const },
                { label: 'финалов', value: stats.endings, accent: 'green' as const },
                { label: 'союзников', value: stats.chars, accent: 'cyan' as const },
              ].map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.statCell}>
                  <Text style={[styles.statValue, { color: accents[item.accent].hi }]}>{String(item.value).padStart(2, '0')}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Reveal>

          <Reveal delay={160} style={{ marginTop: 26 }}>
            <SectionLabel accent="cyan">движок</SectionLabel>
            <View style={styles.engineCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.engineDot, { backgroundColor: store.engineMode === 'ai' ? palette.green : palette.gold }]} />
                  <Text style={styles.engineTitle}>{store.engineMode === 'ai' ? 'AI CORE' : 'DEMO CORE'}</Text>
                </View>
                <Mono>{store.engineMode === 'ai' ? store.aiProvider : 'локальная модель'}</Mono>
              </View>
              <Text style={styles.engineText}>
                {store.engineMode === 'ai'
                  ? store.aiStatus === 'online'
                    ? 'Ядро на связи: миры, следующие события и реплики жителей приходят из модели. Метрики и память мира считаются локально, чтобы последствия оставались честными.'
                    : 'Адрес ядра задан, но сервер пока не отвечает. Приложение продолжает работать на локальном движке — метка вернётся на AI CORE, как только сервер ответит.'
                  : 'Вселенные собирает встроенный детерминированный движок: он строит законы, историю, персонажей и считает последствия решений. Это не запущенная языковая модель — поэтому метка DEMO остаётся видимой.'}
              </Text>
              <Divider style={{ marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="spark" size={13} color={palette.green} />
                <Text style={styles.engineTitle}>AI CORE</Text>
              </View>
              <Text style={styles.engineText}>
                {store.engineMode === 'ai'
                  ? `Провайдер: ${store.aiProvider}. Статус: ${store.aiStatus === 'online' ? 'на связи' : store.aiStatus === 'unknown' ? 'не проверен' : 'нет ответа'}.`
                  : 'Выберите провайдера в блоке ниже и вставьте бесплатный ключ — приложение обратится к модели напрямую. Альтернатива: запустить свой backend из папки backend/ и задать EXPO_PUBLIC_API_URL.'}
              </Text>
            </View>
          </Reveal>

          <Reveal delay={170} style={{ marginTop: 22 }}>
            <SectionLabel accent="gold">коллекция финалов</SectionLabel>
            <View style={styles.badgeGrid}>
              {endingBadges.map((badge, index) => {
                const unlocked = collected.has(badge.kind as never);
                return (
                  <View
                    key={badge.kind + String(index)}
                    style={[
                      styles.badgeCell,
                      unlocked && { borderColor: accents[badge.accent].core + '88', backgroundColor: accents[badge.accent].core + '14' },
                    ]}
                  >
                    <Icon name={unlocked ? 'check' : 'lock'} size={13} color={unlocked ? accents[badge.accent].hi : palette.faint} />
                    <Text style={[styles.badgeTitle, unlocked && { color: palette.text }]} numberOfLines={2}>
                      {badge.title}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.aiMessage}>
              Открыто {collected.size} из 5. Финалы сохраняются в архиве вместе с мирами и зависят от баланса метрик.
            </Text>
          </Reveal>

          <Reveal delay={190} style={{ marginTop: 22 }}>
            <SectionLabel accent="cyan">AI-ядро</SectionLabel>
            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>Кто пишет миры</Text>
              <Text style={styles.aiText}>
                Локальный движок работает всегда. Чтобы миры, события и реплики писала настоящая модель, выберите
                провайдера и вставьте бесплатный ключ — он останется только на этом устройстве.
              </Text>
              <View style={styles.providerRow}>
                {providerOrder.map((id) => {
                  const active = store.aiSettings.provider === id;
                  return (
                    <PressableScale
                      key={id}
                      onPress={() => {
                        setCheckMessage(null);
                        store.updateAiSettings({ provider: id, model: '' });
                      }}
                    >
                      <View style={[styles.providerChip, active && styles.providerChipActive]}>
                        <Text style={[styles.providerText, active && { color: palette.text }]}>
                          {PROVIDERS[id].label}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>

              {provider.needsKey ? (
                <View style={{ gap: 8, marginTop: 14 }}>
                  <Text style={styles.aiLabel}>КЛЮЧ</Text>
                  <TextInput
                    value={store.aiSettings.key}
                    onChangeText={(key) => {
                      setCheckMessage(null);
                      store.updateAiSettings({ key });
                    }}
                    placeholder="вставьте ключ провайдера"
                    placeholderTextColor={palette.faint}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.aiInput}
                  />
                  {embeddedKey && store.aiSettings.key.trim() === embeddedKey ? (
                    <Text style={styles.aiWarning}>
                      Ключ встроен в эту сборку для демонстрации. Перед публикацией перевыпустите его.
                    </Text>
                  ) : null}
                  {store.aiSettings.key.trim().length > 8 ? (
                    <Text style={styles.aiSaved}>
                      Ключ сохранён на этом устройстве: ····{store.aiSettings.key.trim().slice(-4)}
                    </Text>
                  ) : null}
                  <Text style={styles.aiLabel}>МОДЕЛЬ</Text>
                  <TextInput
                    value={store.aiSettings.model}
                    onChangeText={(model) => store.updateAiSettings({ model })}
                    placeholder={provider.model}
                    placeholderTextColor={palette.faint}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.aiInput}
                  />
                </View>
              ) : null}

              <Text style={styles.aiHint}>{provider.hint}</Text>
              {provider.docsUrl ? <Text style={styles.aiLink}>{provider.docsUrl}</Text> : null}

              <View style={styles.aiActions}>
                <GhostButton
                  title={store.aiChecking ? 'Проверяем…' : 'Проверить связь'}
                  icon="spark"
                  accent="cyan"
                  compact
                  onPress={async () => {
                    const result = await store.checkAi();
                    setCheckMessage(result.message);
                  }}
                />
                <View style={styles.aiStatus}>
                  <View
                    style={[
                      styles.aiDot,
                      {
                        backgroundColor:
                          store.aiStatus === 'online' ? palette.green : store.aiStatus === 'offline' ? palette.rose : palette.faint,
                      },
                    ]}
                  />
                  <Mono>
                    {store.aiStatus === 'online' ? 'на связи' : store.aiStatus === 'offline' ? 'нет связи' : 'не проверено'}
                  </Mono>
                </View>
              </View>

              {checkMessage ? (
                <Text style={[styles.aiMessage, { color: store.aiStatus === 'online' ? palette.green : palette.rose }]}>
                  {checkMessage}
                </Text>
              ) : null}
              {!checkMessage && store.aiError ? <Text style={styles.aiMessage}>{store.aiError}</Text> : null}
              {provider.id === 'demo' ? (
                <Text style={styles.aiMessage}>
                  Сейчас активен локальный движок: одинаковый вопрос даёт одинаковый мир. Выберите Gemini или Groq, чтобы
                  миры писала модель.
                </Text>
              ) : null}
            </View>
          </Reveal>

          <Reveal delay={240} style={{ marginTop: 22 }}>
            <SectionLabel accent="violet">о проекте</SectionLabel>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>ПАРАЛЛЕЛЬ</Text>
              <Text style={styles.aboutText}>
                Технологический арт-проект о том, что реальность — это всего лишь набор правил, которые кто-то однажды
                согласился соблюдать. Один вопрос открывает вселенную. Одно решение — её будущее.
              </Text>
              <Text style={styles.aboutText}>
                У каждой вселенной есть память: законы, хроника, доверие жителей и снимки мира в точках ветвления. Поэтому
                последствия не теряются, а накапливаются.
              </Text>
              <View style={styles.techRow}>
                <Mono>expo · react native</Mono>
                <Mono>локальная память</Mono>
                <Mono>v1.0</Mono>
              </View>
            </View>
          </Reveal>

          <Reveal delay={280} style={{ marginTop: 22 }}>
            <SectionLabel accent="gold">данные</SectionLabel>
            {confirmReset ? (
              <View style={styles.resetCard}>
                <Text style={styles.resetText}>Удалить весь архив, чаты и память вселенных? Это действие необратимо.</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <PressableScale onPress={() => setConfirmReset(false)}>
                    <View style={styles.resetGhost}>
                      <Text style={styles.resetGhostText}>Отмена</Text>
                    </View>
                  </PressableScale>
                  <PressableScale
                    onPress={() => {
                      store.resetAll();
                      setConfirmReset(false);
                    }}
                  >
                    <View style={styles.resetDanger}>
                      <Text style={styles.resetDangerText}>Удалить всё</Text>
                    </View>
                  </PressableScale>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <GhostButton title="Очистить локальный архив" icon="close" accent="rose" onPress={() => setConfirmReset(true)} />
                <View style={styles.noteRow}>
                  <Icon name="lock" size={12} color={palette.faint} />
                  <Text style={styles.noteText}>Данные хранятся только на устройстве. Аккаунтов и облака нет.</Text>
                </View>
              </View>
            )}
          </Reveal>
        </ScrollView>
        <BottomNav active={store.tab} onChange={(tab) => store.go(tab)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
  name: { fontFamily: font.display, fontSize: 21, lineHeight: 33, letterSpacing: -0.5, color: palette.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: {
    width: '47.6%',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  statValue: { fontFamily: font.display, fontSize: 22, lineHeight: 34, letterSpacing: -0.5 },
  statLabel: { marginTop: 4, fontFamily: font.bodySemi, fontSize: 12.5, letterSpacing: 1, color: palette.muted, textTransform: 'uppercase' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeCell: {
    width: '47.6%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  badgeTitle: { flex: 1, fontFamily: font.bodySemi, fontSize: 12.5, lineHeight: 19, color: palette.muted },
  aiCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 10,
  },
  aiTitle: { fontFamily: font.bodyBold, fontSize: 13, letterSpacing: 1.2, color: palette.text, textTransform: 'uppercase' },
  aiText: { fontFamily: font.body, fontSize: 13, lineHeight: 22, color: palette.muted },
  providerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  providerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  providerChipActive: { borderColor: palette.violet + 'AA', backgroundColor: 'rgba(139,108,255,0.18)' },
  providerText: { fontFamily: font.bodySemi, fontSize: 12.5, color: palette.muted },
  aiWarning: { fontFamily: font.body, fontSize: 12, lineHeight: 20, color: palette.gold },
  aiSaved: { fontFamily: font.bodySemi, fontSize: 12, color: palette.green, marginTop: 2 },
  aiLabel: { fontFamily: font.bodySemi, fontSize: 11.5, letterSpacing: 1.4, color: palette.faint, marginTop: 6 },
  aiInput: {
    height: 44,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    fontFamily: font.body,
    fontSize: 13.5,
    color: palette.text,
  },
  aiHint: { fontFamily: font.body, fontSize: 12.5, lineHeight: 21, color: palette.muted, marginTop: 10 },
  aiLink: { fontFamily: font.bodySemi, fontSize: 12.5, color: palette.cyan },
  aiActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  aiStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiDot: { width: 6, height: 6, borderRadius: 6 },
  aiMessage: { fontFamily: font.body, fontSize: 12.5, lineHeight: 21, color: palette.faint, marginTop: 8 },
  engineCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  engineDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.gold },
  engineTitle: { fontFamily: font.bodyBold, fontSize: 13, letterSpacing: 1.4, color: palette.text },
  engineText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.muted, marginTop: 8 },
  aboutCard: {
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(20,16,40,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    gap: 10,
  },
  aboutTitle: { fontFamily: font.display, fontSize: 18, lineHeight: 30, letterSpacing: 1.4, color: palette.text },
  aboutText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.muted },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  resetCard: {
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.rose + '55',
    backgroundColor: 'rgba(255,127,156,0.06)',
  },
  resetText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 22, color: palette.textSoft },
  resetGhost: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.06)' },
  resetGhostText: { fontFamily: font.bodySemi, fontSize: 13, color: palette.textSoft },
  resetDanger: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: palette.rose },
  resetDangerText: { fontFamily: font.bodySemi, fontSize: 13, color: palette.ink },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  noteText: { fontFamily: font.body, fontSize: 12.5, color: palette.faint },
});
