import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GhostButton, Mono, Pill, SectionLabel } from '../components';
import { NarrationButton } from '../components/NarrationButton';
import { lifeOf } from '../engine/life';
import type { Universe } from '../engine/types';
import { accents, font, palette, radius } from '../theme';

export function WorldJournal({ universe, onObserve }: { universe: Universe; onObserve: () => void }) {
  const life = lifeOf(universe);
  const latest = life.journal.at(-1);
  return (
    <View style={styles.content}>
      <View>
        <SectionLabel accent="cyan">дневник жителей</SectionLabel>
        <View style={styles.card}>
          <Mono color={palette.cyan}>день {life.day}</Mono>
          <Text style={styles.body}>
            {universe.state.ending
              ? 'Последние записи этой линии.'
              : 'Жители сами продолжают свои дела. Примерно каждые три минуты проходит один день мира.'}
          </Text>
          {!universe.state.ending ? (
            <GhostButton title="Наблюдать следующий день" icon="eye" compact accent="cyan" onPress={onObserve} />
          ) : null}
          {latest ? (
            <NarrationButton text={latest.title + '. ' + latest.text} label="Озвучить последнюю запись" accent={latest.accent} />
          ) : null}
        </View>
      </View>

      <View style={styles.group}>
        {[...life.journal].reverse().map((entry) => (
          <View key={entry.day} style={styles.card}>
            <Mono color={accents[entry.accent].text}>день {entry.day}</Mono>
            <Text style={styles.title}>{entry.title}</Text>
            <Text style={styles.body}>{entry.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.group}>
        <SectionLabel accent="violet">сюжетные линии</SectionLabel>
        {life.threads.map((thread) => (
          <View key={thread.title} style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.title}>{thread.title}</Text>
              <Pill accent={thread.progress === 3 ? 'green' : 'violet'}>
                {thread.progress === 3 ? 'завершено' : `${thread.progress}/3`}
              </Pill>
            </View>
            <Text style={styles.body}>{thread.detail}</Text>
          </View>
        ))}
      </View>

      <View style={styles.group}>
        <SectionLabel accent="gold">коллекция артефактов</SectionLabel>
        {life.artifacts.length === 0 ? (
          <Text style={styles.body}>Осмотри места на карте, чтобы найти первые артефакты.</Text>
        ) : life.artifacts.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Pill accent="gold">день {item.day}</Pill>
            </View>
            <Text style={styles.body}>{item.description}</Text>
            <Mono>{universe.state.locations.find((place) => place.id === item.locationId)?.name ?? ''}</Mono>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 25 },
  group: { gap: 9 },
  card: {
    padding: 14,
    gap: 7,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    backgroundColor: 'rgba(20,16,40,0.68)',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 23, color: palette.text },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 22, color: palette.textSoft },
});
