import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import type { Character, Location, Universe } from '../engine/types';
import { accents, font, palette, radius, type AccentKey } from '../theme';
import { GhostButton } from './ui';

type Kind = 'location' | 'portrait';
type ArtState = { status: 'idle' | 'loading' | 'error' } | { status: 'ready'; uri: string };
const cache = new Map<string, string>();
const inProgress = new Map<string, Promise<string>>();

export function illustrationEndpoint(server: string): string | null {
  try {
    const base = new URL(server.trim() || process.env.EXPO_PUBLIC_API_URL || '');
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) return null;
    return base.href.replace(/\/+$/, '') + '/v1/illustrations';
  } catch {
    return null;
  }
}

export function illustrationBrief(universe: Universe, subject: Character | Location): string {
  const description = 'bio' in subject
    ? `${subject.name}, ${subject.age} лет, ${subject.role}. ${subject.bio}`
    : `${subject.name}, ${subject.kind}. ${subject.detail}`;
  return `${description.slice(0, 620)} Мир ${universe.title.slice(0, 60)}, ${universe.era} год. ${universe.rule.slice(0, 175)}`.slice(0, 900);
}

function loadImage(endpoint: string, key: string, kind: Kind, description: string): Promise<string> {
  const existing = inProgress.get(key);
  if (existing) return existing;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110000);
  const request = fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, description }),
    signal: controller.signal,
  }).then(async (response) => {
    if (response.status === 503) throw new Error('На сервере пока не настроена image-модель.');
    if (response.status === 429) throw new Error('Сервер занят. Повтори чуть позже.');
    if (!response.ok) throw new Error('Модель не вернула картинку. Можно повторить.');
    const image = await response.json();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(image.mime) ||
        typeof image.base64 !== 'string' || !image.base64 || image.base64.length > 6990508) {
      throw new Error('Сервер вернул неподдерживаемое изображение.');
    }
    const uri = `data:${image.mime};base64,${image.base64}`;
    cache.set(key, uri);
    if (cache.size > 8) cache.delete(cache.keys().next().value!);
    return uri;
  }).finally(() => {
    clearTimeout(timer);
    inProgress.delete(key);
  });
  inProgress.set(key, request);
  return request;
}

export function Illustration({
  kind, server, description, accent, label, onConfigure, children,
}: {
  kind: Kind;
  server: string;
  description: string;
  accent: AccentKey;
  label: string;
  onConfigure: () => void;
  children?: React.ReactNode;
}) {
  const endpoint = illustrationEndpoint(server);
  const key = JSON.stringify([endpoint, kind, description]);
  const [generated, setGenerated] = useState<{ key: string; art: ArtState }>({ key, art: { status: 'idle' } });
  const [error, setError] = useState('');
  const cached = cache.get(key);
  const art = generated.key === key && generated.art.status !== 'idle'
    ? generated.art
    : cached ? { status: 'ready' as const, uri: cached } : { status: 'idle' as const };

  useEffect(() => {
    let current = true;
    const request = inProgress.get(key);
    if (request) {
      setGenerated({ key, art: { status: 'loading' } });
      request.then((uri) => {
        if (current) setGenerated({ key, art: { status: 'ready', uri } });
      }, () => {
        if (current) setGenerated({ key, art: { status: 'error' } });
      });
    }
    return () => { current = false; };
  }, [key]);

  const generate = () => {
    if (!endpoint) {
      onConfigure();
      return;
    }
    setError('');
    setGenerated({ key, art: { status: 'loading' } });
    loadImage(endpoint, key, kind, description).then(
      (uri) => setGenerated((current) => current.key === key ? { key, art: { status: 'ready', uri } } : current),
      (reason: unknown) => {
        setError(reason instanceof Error && reason.message.endsWith('.') ? reason.message : 'Не удалось связаться с сервером иллюстраций.');
        setGenerated((current) => current.key === key ? { key, art: { status: 'error' } } : current);
      },
    );
  };

  return (
    <View style={styles.container}>
      {art.status === 'ready' ? (
        <Image source={{ uri: art.uri }} accessibilityLabel={label} resizeMode="cover" style={styles.image} onError={() => {
          cache.delete(key);
          setError('Изображение не удалось открыть.');
          setGenerated({ key, art: { status: 'error' } });
        }} />
      ) : children}
      {art.status === 'loading' ? (
        <View style={styles.loading} accessibilityLiveRegion="polite">
          <ActivityIndicator color={accents[accent].hi} />
          <Text style={styles.note}>Модель рисует иллюстрацию…</Text>
        </View>
      ) : null}
      {art.status === 'error' ? (
        <Text style={styles.note} accessibilityLiveRegion="polite">{error || 'Не удалось получить иллюстрацию.'}</Text>
      ) : null}
      {art.status === 'idle' || art.status === 'error' ? (
        <GhostButton
          title={!endpoint ? 'Настроить иллюстрации' : art.status === 'error' ? 'Повторить' : kind === 'portrait' ? 'Создать портрет' : 'Создать иллюстрацию'}
          icon="spark" accent={accent} compact onPress={generate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  image: { width: '100%', height: 230, borderRadius: radius.md, backgroundColor: palette.ink },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  note: { fontFamily: font.body, fontSize: 13, lineHeight: 20, color: palette.muted },
});
