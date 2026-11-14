import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere, Halo } from '../components/Atmosphere';
import { BottomNav } from '../components/BottomNav';
import { BrandMark } from '../components/Cover';
import { Icon } from '../components/Icon';
import { Divider, GhostButton, Mono, Overline, PressableScale, PrimaryButton, Reveal, SectionLabel } from '../components/ui';
import { accents, font, palette, radius, space } from '../theme';
import type { ParallelStore } from '../state/useParallel';

const SUGGESTIONS = [
  'Что, если бы время можно было покупать?',
  'Что, если бы люди помнили все прошлые жизни?',
  'Что, если бы ИИ появился двести лет назад?',
  'Что, если бы никто не испытывал страха?',
  'Что, если бы у каждого было две жизни?',
  'Что, если бы люди никогда не умели лгать?',
  'Что, если бы сны были общей реальностью?',
  'Что, если бы гравитация зависела от памяти?',
];

const STEPS = [
  { title: 'Формулируем закон', text: 'Из гипотезы извлекается правило, по которому будет жить новый мир.' },
  { title: 'Пишем историю', text: 'Четыре эпохи, точка сдвига, культура, технологии и запреты.' },
  { title: 'Собираем жителей', text: 'Три персонажа с целями, страхами и тайнами, встроенными в законы.' },
  { title: 'Проверяем память', text: 'Каждое решение остаётся в памяти мира и влияет на следующие события.' },
];

export function CreateScreen({ store }: { store: ParallelStore }) {
  const [value, setValue] = useState(store.draftQuestion);
  const [focused, setFocused] = useState(false);
  const scheme = accents.violet;
  const trimmed = value.trim();
  const valid = trimmed.length >= 8;
  const counter = useMemo(() => `${value.length}/180`, [value.length]);

  const submit = () => {
    if (!valid) return;
    store.setDraftQuestion(trimmed);
    store.createWorld(trimmed);
    setValue('');
    store.setDraftQuestion('');
  };

  const randomPrompt = () => {
    const pick = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
    setValue(pick);
  };

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent="violet" intensity="soft" starCount={42} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Reveal>
              <View style={styles.topRow}>
                <BrandMark size={34} />
                <Mono>новая ветвь</Mono>
              </View>
              <Overline color={scheme.text} style={{ marginTop: 22 }}>
                лаборатория гипотез
              </Overline>
              <Text style={styles.title}>Какое правило{'\n'}ты изменишь?</Text>
              <Text style={styles.subtitle}>
                Сформулируй одно изменение — и получишь целый мир, который вырос вокруг него за шестьдесят лет.
              </Text>
            </Reveal>

            <Reveal delay={120} style={{ marginTop: 24 }}>
              <View style={[styles.composer, focused && { borderColor: scheme.core + '80' }]}>
                {focused ? <Halo size={260} color={scheme.core + '22'} style={{ top: -60, right: -70 }} /> : null}
                <Text style={styles.composerLabel}>А ЧТО, ЕСЛИ…</Text>
                <TextInput
                  value={value}
                  onChangeText={(next) => {
                    setValue(next);
                    store.setDraftQuestion(next);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  multiline
                  maxLength={180}
                  placeholder="…люди никогда не умели лгать?"
                  placeholderTextColor={palette.faint}
                  selectionColor={scheme.core}
                  style={styles.input}
                />
                <Divider style={{ marginTop: 12 }} />
                <View style={styles.composerFoot}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="spark" size={13} color={scheme.hi} />
                    <Mono>{counter}</Mono>
                  </View>
                  <PressableScale onPress={randomPrompt}>
                    <View style={styles.dice}>
                      <Icon name="reset" size={12} color={palette.textSoft} />
                      <Text style={styles.diceText}>случайная</Text>
                    </View>
                  </PressableScale>
                </View>
              </View>
            </Reveal>

            <Reveal delay={200} style={{ marginTop: space.lg }}>
              <PrimaryButton title="СОЗДАТЬ РЕАЛЬНОСТЬ" icon="spark" onPress={submit} disabled={!valid} />
              {!valid ? <Text style={styles.hint}>Минимум 8 символов — движку нужен смысл, а не набор букв.</Text> : null}
              <Text style={styles.engineHint}>
                {store.engineMode === 'ai'
                  ? 'Сборка идёт через AI CORE: законы, история и жители пишутся моделью в реальном времени.'
                  : 'Сборка идёт на локальном DEMO CORE. Подключите API, чтобы миры писала модель.'}
              </Text>
            </Reveal>

            <Reveal delay={280} style={{ marginTop: space.xl }}>
              <SectionLabel accent="gold">готовые гипотезы</SectionLabel>
            </Reveal>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((item, index) => (
                <PressableScale key={item} onPress={() => setValue(item)}>
                  <View style={styles.suggestion}>
                    <Text style={styles.suggestionIndex}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.suggestionText}>{item}</Text>
                  </View>
                </PressableScale>
              ))}
            </View>

            <Reveal delay={340} style={{ marginTop: space.xl }}>
              <SectionLabel accent="cyan">что произойдёт</SectionLabel>
              <View style={styles.steps}>
                {STEPS.map((step, index) => (
                  <View key={step.title} style={styles.step}>
                    <View style={styles.stepIndexWrap}>
                      <Text style={[styles.stepIndex, { color: scheme.text }]}>0{index + 1}</Text>
                      {index < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 18 }}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Reveal>

            <Reveal delay={400} style={{ marginTop: space.sm }}>
              <GhostButton title="Как это работает без ИИ-ключа" icon="eye" onPress={() => store.go('branches')} />
            </Reveal>
          </ScrollView>
        </KeyboardAvoidingView>
        <BottomNav active={store.tab} onChange={(tab) => store.go(tab)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  title: {
    fontFamily: font.display,
    fontSize: 28,
    lineHeight: 41,
    letterSpacing: -0.9,
    color: palette.text,
    marginTop: 8,
  },
  subtitle: { fontFamily: font.body, fontSize: 15, lineHeight: 24, color: palette.muted, marginTop: 12, maxWidth: 330 },
  composer: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    backgroundColor: 'rgba(18,15,36,0.72)',
    padding: 18,
    overflow: 'hidden',
  },
  composerLabel: { fontFamily: font.bodySemi, fontSize: 12, letterSpacing: 2.2, color: palette.violetHi },
  input: {
    marginTop: 12,
    minHeight: 86,
    fontFamily: font.bodySemi,
    fontSize: 17,
    lineHeight: 29,
    color: palette.text,
    textAlignVertical: 'top',
    padding: 0,
  },
  composerFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  dice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  diceText: { fontFamily: font.bodySemi, fontSize: 12, letterSpacing: 0.8, color: palette.textSoft },
  hint: { fontFamily: font.body, fontSize: 13, color: palette.faint, marginTop: 10, textAlign: 'center' },
  engineHint: {
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 21,
    color: palette.faint,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  suggestions: { gap: 8, marginTop: 4 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.032)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  suggestionIndex: { fontFamily: font.mono, fontSize: 12, color: palette.gold, letterSpacing: 1.2 },
  suggestionText: { flex: 1, fontFamily: font.body, fontSize: 14, lineHeight: 22, color: palette.textSoft },
  steps: { marginTop: 6 },
  step: { flexDirection: 'row', gap: 14 },
  stepIndexWrap: { alignItems: 'center', width: 24 },
  stepIndex: { fontFamily: font.mono, fontSize: 12, letterSpacing: 1 },
  stepLine: { flex: 1, width: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginVertical: 6 },
  stepTitle: { fontFamily: font.bodySemi, fontSize: 15, color: palette.text },
  stepText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 21.5, color: palette.muted, marginTop: 4 },
});
