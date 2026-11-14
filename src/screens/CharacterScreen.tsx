import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Atmosphere } from '../components/Atmosphere';
import { AiCover } from '../components/AiCover';
import { CharacterPortrait } from '../components/Portraits';
import { Divider, Icon, IconButton, Mono, Overline, Pill, PressableScale, Reveal } from '../components';
import { dativeName } from '../engine/chat';
import { accents, covers, fillImage, font, palette, radius } from '../theme';
import type { ParallelStore } from '../state/useParallel';

function TypingDots({ color }: { color: string }) {
  const values = useRef([new Animated.Value(0.2), new Animated.Value(0.2), new Animated.Value(0.2)]).current;
  useEffect(() => {
    const loops = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(value, { toValue: 1, duration: 420, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(value, { toValue: 0.2, duration: 420, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.delay(240),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [values]);

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }}>
      {values.map((value, index) => (
        <Animated.View key={index} style={{ width: 5, height: 5, borderRadius: 5, backgroundColor: color, opacity: value }} />
      ))}
    </View>
  );
}

export function CharacterScreen({ store }: { store: ParallelStore }) {
  const universe = store.active;
  const character = store.activeCharacter;
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<ScrollViewInstance | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [store.messages.length, store.typing]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  if (!universe || !character) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.muted, fontFamily: font.body }}>Житель не найден.</Text>
      </View>
    );
  }

  const scheme = accents[character.accent];
  const secretUnlocked = character.bond >= 46;
  const lastReply = [...store.messages].reverse().find((message) => message.from === 'character');

  const speak = (text: string) => {
    try {
      Speech.stop();
      if (speaking) {
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      Speech.speak(text, {
        language: 'ru-RU',
        rate: 0.94,
        pitch: character.stance === 'control' ? 0.82 : character.stance === 'transcend' ? 1.08 : 0.95,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent={character.accent} intensity="soft" starCount={40} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <IconButton name="back" onPress={store.back} accent={character.accent} size={36} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Mono>{universe.codename}</Mono>
          </View>
          <IconButton name={speaking ? 'close' : 'sound'} onPress={() => lastReply && speak(lastReply.text)} accent={character.accent} size={36} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.identityArt}>
              <Image source={covers[universe.cover]} resizeMode="cover" style={[fillImage, { opacity: 0.32 }]} />
              <AiCover universe={universe} style={{ opacity: 0.34 }} />
              <LinearGradient
                colors={['rgba(6,5,14,0.35)', 'rgba(6,5,14,0.92)', palette.ink]}
                locations={[0, 0.62, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <Reveal>
              <View style={styles.identity}>
                <CharacterPortrait name={character.name} accent={character.accent} stance={character.stance} width={96} height={124} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name}>{character.name}</Text>
                  <Overline color={scheme.text}>{character.role}</Overline>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <Pill accent={character.accent}>{character.status}</Pill>
                    <Pill accent="cyan">{character.age} лет</Pill>
                  </View>
                  <View style={styles.bondRow}>
                    <View style={styles.bondTrack}>
                      <View style={[styles.bondFill, { width: `${character.bond}%`, backgroundColor: scheme.core }]} />
                    </View>
                    <Mono>доверие {character.bond}%</Mono>
                  </View>
                </View>
              </View>
            </Reveal>

            <Reveal delay={90}>
              <View style={[styles.quoteCard, { borderColor: scheme.core + '33' }]}>
                <Text style={[styles.quoteMark, { color: scheme.core }]}>“</Text>
                <Text style={styles.quote}>{character.quote}</Text>
              </View>
            </Reveal>

            <Reveal delay={140} style={{ marginTop: 18 }}>
              <View style={styles.factGrid}>
                <View style={styles.factCell}>
                  <Overline color={palette.green}>цель</Overline>
                  <Text style={styles.factText}>{character.goal}</Text>
                </View>
                <View style={styles.factCell}>
                  <Overline color={palette.rose}>страх</Overline>
                  <Text style={styles.factText}>{character.fear}</Text>
                </View>
              </View>
            </Reveal>

            <Reveal delay={190} style={{ marginTop: 10 }}>
              <View style={[styles.secretCell, { borderColor: secretUnlocked ? scheme.core + '3A' : palette.lineSoft }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name={secretUnlocked ? 'eye' : 'lock'} size={13} color={secretUnlocked ? scheme.hi : palette.faint} />
                  <Overline color={secretUnlocked ? scheme.text : palette.faint}>тайна</Overline>
                </View>
                <Text style={[styles.factText, { opacity: secretUnlocked ? 1 : 0.55, marginTop: 8 }]}>
                  {secretUnlocked
                    ? character.secret
                    : 'Житель расскажет это сам — когда доверие станет выше 46%. Спрашивай, спорь, слушай.'}
                </Text>
              </View>
            </Reveal>

            <View style={{ marginTop: 22, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.liveDot, { backgroundColor: scheme.core }]} />
                <Mono>разговор · {store.messages.filter((message) => message.from === 'user').length} реплик</Mono>
              </View>
              {store.messages.map((message) => {
                const mine = message.from === 'user';
                return (
                  <View key={message.id} style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
                    <View
                      style={[
                        styles.bubble,
                        mine
                          ? { backgroundColor: scheme.core + '26', borderColor: scheme.core + '4A' }
                          : { backgroundColor: 'rgba(255,255,255,0.045)', borderColor: palette.lineSoft },
                      ]}
                    >
                      <Text style={[styles.bubbleText, mine && { color: palette.text }]}>{message.text}</Text>
                      {!mine ? (
                        <PressableScale onPress={() => speak(message.text)} hitSlop={10}>
                          <View style={styles.bubbleSound}>
                            <Icon name="sound" size={12} color={palette.faint} />
                          </View>
                        </PressableScale>
                      ) : null}
                    </View>
                  </View>
                );
              })}
              {store.typing ? (
                <View style={[styles.bubble, { backgroundColor: 'rgba(255,255,255,0.045)', borderColor: palette.lineSoft, alignSelf: 'flex-start' }]}>
                  <TypingDots color={scheme.hi} />
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {store.messages.length <= 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                {store.prompts.map((prompt) => (
                  <PressableScale key={prompt} onPress={() => store.sendMessage(prompt)}>
                    <View style={styles.promptChip}>
                      <Text style={styles.promptText}>{prompt}</Text>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={`Написать ${dativeName(character.name)}…`}
                placeholderTextColor={palette.faint}
                selectionColor={scheme.core}
                style={styles.input}
                onSubmitEditing={() => {
                  if (!draft.trim()) return;
                  store.sendMessage(draft);
                  setDraft('');
                }}
                returnKeyType="send"
              />
              <PressableScale
                onPress={() => {
                  if (!draft.trim()) return;
                  store.sendMessage(draft);
                  setDraft('');
                }}
              >
                <View style={[styles.sendButton, { backgroundColor: draft.trim() ? scheme.core : 'rgba(255,255,255,0.06)' }]}>
                  <Icon name="send" size={16} color={draft.trim() ? palette.ink : palette.faint} strokeWidth={1.7} />
                </View>
              </PressableScale>
            </View>
            <Text style={styles.disclaimer}>
          Житель отвечает внутри законов своей вселенной и помнит прошлые решения.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6, gap: 10 },
  identityArt: {
    height: 190,
    marginHorizontal: -20,
    marginTop: -8,
    marginBottom: -46,
    overflow: 'hidden',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 8 },
  name: { fontFamily: font.display, fontSize: 22, lineHeight: 36, letterSpacing: -0.5, color: palette.text },
  bondRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  bondTrack: { flex: 1, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  bondFill: { height: 2, borderRadius: 2 },
  quoteCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,40,0.6)',
    flexDirection: 'row',
    gap: 10,
  },
  quoteMark: { fontFamily: font.display, fontSize: 26, lineHeight: 32, marginTop: -4 },
  quote: { flex: 1, fontFamily: font.body, fontSize: 14.5, lineHeight: 25, color: palette.textSoft, fontStyle: 'italic' },
  factGrid: { flexDirection: 'row', gap: 10 },
  factCell: {
    flex: 1,
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
    gap: 6,
  },
  factText: { fontFamily: font.body, fontSize: 13.5, lineHeight: 21, color: palette.textSoft },
  secretCell: {
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  liveDot: { width: 5, height: 5, borderRadius: 5 },
  bubbleRow: { flexDirection: 'row' },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  bubbleText: { fontFamily: font.body, fontSize: 14, lineHeight: 23, color: palette.textSoft },
  bubbleSound: { alignSelf: 'flex-end', opacity: 0.7 },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.lineSoft,
    backgroundColor: 'rgba(6,5,14,0.94)',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    fontFamily: font.body,
    fontSize: 15,
    color: palette.text,
  },
  sendButton: { width: 46, height: 46, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontFamily: font.body, fontSize: 12, color: palette.faint, marginTop: 8, textAlign: 'center' },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    maxWidth: 240,
  },
  promptText: { fontFamily: font.body, fontSize: 13, color: palette.textSoft },
});
