import type { Character, Location, Universe } from './types';
import { hashString, mulberry32 } from './hash';

/**
 * Комбинаторная лексика.
 *
 * Никаких «пулов готовых названий»: имена собираются из слогов, а фразы —
 * из частей. Даже при одинаковой гипотезе два мира получают разные топонимы,
 * имена и формулировки.
 */

const ONSETS = ['в', 'д', 'л', 'м', 'н', 'р', 'с', 'т', 'к', 'пр', 'тр', 'ск', 'гл', 'зв', 'ш', 'бл'];
const VOWELS = ['а', 'о', 'е', 'и', 'у', 'я', 'э', 'ю'];
const CODAS = ['н', 'р', 'л', 'м', 'с', 'т', 'к', 'д', 'в', 'рь', 'ль', 'нь', 'ст', 'рн', 'ск'];

const PLACE_SUFFIX = ['град', 'порт', 'холм', 'дол', 'рий', 'тия', 'виль', 'сфера', 'купол', 'шпиль'];
const CHAR_SUFFIX = ['ин', 'ар', 'ей', 'ис', 'он', 'ия', 'эй', 'ур', 'эль', 'ина'];
const LAW_VERBS = [
  'запрещает',
  'разрешает',
  'требует',
  'оплачивает',
  'фиксирует',
  'обязывает',
  'распределяет',
  'признаёт',
  'отменяет',
  'пересчитывает',
];
const LAW_OBJECTS = [
  'молчание',
  'память',
  'очередь',
  'время',
  'имя',
  'прикосновение',
  'выбор',
  'ошибку',
  'согласие',
  'вторую попытку',
  'свидетеля',
  'долг',
];
const PREFIX_TITLE = ['закон', 'правило', 'акт', 'кодекс', 'устав', 'протокол'];

function syllable(random: () => number): string {
  return ONSETS[Math.floor(random() * ONSETS.length)] + VOWELS[Math.floor(random() * VOWELS.length)];
}

export function makeWord(seed: number, parts = 2, suffix: string[] = []): string {
  const random = mulberry32(seed);
  let word = '';
  for (let index = 0; index < parts; index += 1) word += syllable(random);
  if (random() > 0.35) word += CODAS[Math.floor(random() * CODAS.length)];
  if (suffix.length) word += suffix[Math.floor(random() * suffix.length)];
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function makePlaceName(seed: number): string {
  return makeWord(seed, 2, PLACE_SUFFIX);
}

export function makeCharacterName(seed: number): string {
  const random = mulberry32(seed);
  const first = makeWord(seed, 2) + CHAR_SUFFIX[Math.floor(random() * CHAR_SUFFIX.length)];
  const second = makeWord(seed + 17, 2) + CHAR_SUFFIX[Math.floor(random() * CHAR_SUFFIX.length)];
  return `${first} ${second}`;
}

export function makeLawTitle(seed: number): string {
  const random = mulberry32(seed);
  const prefix = PREFIX_TITLE[Math.floor(random() * PREFIX_TITLE.length)];
  const verb = LAW_VERBS[Math.floor(random() * LAW_VERBS.length)];
  const object = LAW_OBJECTS[Math.floor(random() * LAW_OBJECTS.length)];
  return `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${makeWord(seed + 3, 1).toLowerCase()} ${verb} ${object}`;
}

function reseed(base: number, index: number, salt = 0): number {
  return (base + index * 7919 + salt * 104729) % 2147483647;
}

/**
 * Переименовывает сущности демо-мира: локации, жителей, часть законов.
 * Имена воспроизводимы для одной и той же гипотезы.
 */
export function varyUniverse(universe: Universe): Universe {
  const base = hashString(`vary:${universe.seed}`);
  const locations = universe.state.locations.map((location: Location, index: number) => ({
    ...location,
    name: makePlaceName(reseed(base, index)),
  }));
  const characters = universe.state.characters.map((character: Character, index: number) => ({
    ...character,
    name: makeCharacterName(reseed(base, index, 3)),
  }));
  const laws = universe.state.laws.map((law, index) =>
    index % 2 === 0
      ? { ...law, title: makeLawTitle(reseed(base, index, 7)) }
      : law,
  );
  return {
    ...universe,
    state: {
      ...universe.state,
      locations,
      characters,
      laws,
    },
  };
}
