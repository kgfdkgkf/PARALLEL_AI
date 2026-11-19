import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { font, palette, type AccentKey } from '../theme';
import { GhostButton } from './ui';

let stopCurrent: (() => void) | undefined;

export function NarrationButton({
  text,
  label = 'Прослушать',
  accent = 'violet',
}: {
  text: string;
  label?: string;
  accent?: AccentKey;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const stopThis = useRef<(() => void) | undefined>(undefined);

  useEffect(() => () => stopThis.current?.(), [text]);

  const toggle = () => {
    if (stopThis.current) {
      stopThis.current();
      return;
    }
    stopCurrent?.();
    setFailed(false);
    const finish = (error = false) => {
      if (stopCurrent !== stop) return;
      stopCurrent = undefined;
      stopThis.current = undefined;
      setPlaying(false);
      setFailed(error);
    };
    const stop = () => {
      finish();
      Speech.stop().catch(() => undefined);
    };
    stopCurrent = stop;
    stopThis.current = stop;
    setPlaying(true);
    try {
      Speech.speak(text, {
        language: 'ru-RU',
        rate: 0.92,
        onDone: () => finish(),
        onStopped: () => finish(),
        onError: () => finish(true),
      });
    } catch {
      finish(true);
    }
  };

  return (
    <View style={{ gap: 5, alignSelf: 'flex-start' }}>
      <GhostButton title={playing ? 'Остановить' : label} icon={playing ? 'close' : 'sound'} compact accent={accent} onPress={toggle} />
      {failed ? (
        <Text accessibilityLiveRegion="polite" style={{ color: palette.muted, fontFamily: font.body, fontSize: 12 }}>
          Озвучка недоступна. Проверь системный голос и повтори.
        </Text>
      ) : null}
    </View>
  );
}
