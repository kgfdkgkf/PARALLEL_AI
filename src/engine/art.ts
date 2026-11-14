/**
 * AI-обложки миров.
 *
 * Pollinations отдаёт картинку по GET-запросу без ключа (лимит — примерно
 * одна картинка в 45 секунд на IP). Поэтому URL кэшируется по id вселенной:
 * один мир — одна генерация, дальше картинка берётся из кэша браузера.
 * Если сервис ответил ошибкой, интерфейс остаётся на локальной обложке.
 */

import type { Universe } from './types';

const ART_ENABLED = process.env.EXPO_PUBLIC_ART !== '0';
const cache = new Map<string, string>();

export function artEnabled(): boolean {
  return ART_ENABLED;
}

export function worldArtUrl(universe: Universe): string | null {
  if (!ART_ENABLED) return null;
  const cached = cache.get(universe.id);
  if (cached) return cached;

  const palettes: Record<string, string> = {
    violet: 'deep violet and cold lavender light, black sky, neon reflections',
    cyan: 'teal and icy cyan light, chrome surfaces, wet asphalt reflections',
    gold: 'warm amber and dusty gold light, sandstone and brass, sunset haze',
    rose: 'muted crimson and rose light, velvet shadow, smoke',
    green: 'acid green and moss light, glass towers, humid haze',
  };
  const styles = [
    'brutalist megastructure at dusk, vast empty plaza, monumental scale',
    'layered floating city above clouds, impossible architecture',
    'monolithic archive interior, endless shelves, single shaft of light',
    'flooded city street, broken neon signs, distant towers in mist',
    'industrial ritual ground, stone circles and cables, cold dawn',
    'vertical farm district, glass domes, cables and haze',
  ];
  const index = universe.seed % styles.length;
  const keywords = [universe.genre, universe.state.laws[0]?.text ?? '', universe.signature?.title ?? '']
    .join(' ')
    .slice(0, 120);

  const prompt = [
    styles[index],
    keywords,
    palettes[universe.accent] ?? palettes.violet,
    `year ${universe.era}`,
    'environment only, architecture and sky',
    'photorealistic matte painting, cinematic haze, no text, no letters, no screens, no ui, no people, no faces, no anime',
  ]
    .filter(Boolean)
    .join(', ');

  const params = new URLSearchParams({
    width: '832',
    height: '1104',
    seed: String(universe.seed % 1000000),
    model: 'flux',
    nologo: 'true',
    enhance: 'false',
  });

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
  cache.set(universe.id, url);
  return url;
}
