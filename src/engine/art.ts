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

  const prompt = [
    'wide cinematic environment concept art',
    universe.title.toLowerCase(),
    universe.genre.toLowerCase(),
    universe.premise.slice(0, 140),
    `year ${universe.era}`,
    'empty landscape, architecture and sky only',
    'no people, no characters, no portrait, no anime, no girl, no boy, no face',
    'painterly matte painting, muted cinematic palette, volumetric haze, epic scale, film still',
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
