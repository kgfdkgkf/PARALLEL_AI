import type { AccentKey } from '../theme';
import type { ChronicleEntry, Universe, WorldState } from './types';
import { hashString, mulberry32 } from './hash';

/**
 * Живой мир.
 *
 * После каждого решения мир «проживает» ещё несколько лет сам: метрики
 * понемногу дрейфуют, а в хронику попадают записи, которых не было ни в одном
 * шаблоне, — они собираются из текущего состояния мира.
 */

const OPENINGS = [
  'Между решениями прошло ещё несколько лет.',
  'Хроника продолжается без твоего участия.',
  'Город давно перестал замечать, что живёт по новым правилам.',
  'Прошло время, и стало видно, что именно изменилось.',
  'В архивах появилась новая папка — без твоего имени.',
  'Тишина между событиями оказалась самой громкой.',
];

const EVENTS = [
  'на площади снова спорят о том, кто первым нарушил правило.',
  'школа ввела новый курс — «как жить рядом с этим».',
  'в городе открылась лавка, где торгуют воспоминаниями о старом порядке.',
  'на стене у ратуши появилась надпись, которую никто не решается стереть.',
  'судья впервые сослался на твой поступок как на прецедент.',
  'ремесленники перестали делать вещи, которые теперь запрещены.',
  'в газете вышла колонка с вопросом, слышит ли нас кто-нибудь ещё.',
  'дети придумали игру, в которой один из них — бог, а остальные — правила.',
  'инженеры предложили обходить правило технически, а не юридически.',
  'на рынке начали платить за молчание, и цена выросла втрое.',
  'в библиотеку принесли дневник человека, который жил до изменения.',
  'старейшины собрались, чтобы решить, можно ли это называть нормой.',
];

const REACTIONS = [
  'Никто не удивился — все ждали.',
  'Половина города одобрила, половина сделала вид, что не заметила.',
  'Власти промолчали, и это было красноречивее слов.',
  'Запись вскоре переписали, но слух остался.',
  'Люди начали жить так, будто это было всегда.',
  'На этом месте теперь стоит памятник без объяснений.',
  'О случившемся напоминает только одна строка в отчёте.',
  'Через год об этом говорили уже как о традиции.',
];

const PERSONAL = [
  'впервые за много лет попросил совета у чужака.',
  'начал вести счёт собственным ошибкам.',
  'отказался от должности — тихо, без письма.',
  'перестал называть это правилом и стал называть судьбой.',
  'пришёл к выводу, что молчание — тоже решение.',
  'сжёг старую запись, но копия осталась.',
  'начал учить детей тому, чего сам боится.',
  'записал твоё имя на стене — и стёр, подумав.',
];

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Медленный дрейф цивилизации: мир живёт по своим законам между решениями. */
export function driftMetrics(state: WorldState, random: () => number): WorldState['metrics'] {
  const laws = state.laws.length;
  const avgBond = state.characters.length
    ? state.characters.reduce((sum, character) => sum + character.bond, 0) / state.characters.length
    : 50;
  const jitter = () => (random() > 0.5 ? 1 : -1);

  return {
    order: clamp(state.metrics.order + (laws >= 5 ? 1 : -1) + jitter()),
    freedom: clamp(state.metrics.freedom + (laws >= 5 ? -2 : 1) + jitter()),
    trust: clamp(state.metrics.trust + (avgBond >= 50 ? 1 : -1) + (random() > 0.6 ? 1 : 0)),
    tech: clamp(state.metrics.tech + (state.metrics.tech >= 55 ? 1 : 0) + jitter()),
  };
}

/**
 * Возвращает мир, который прожил ещё пару лет: дрейф метрик плюс свежие
 * записи в дневнике. Идемпотентно по ходу — повторный вызов на тот же ход
 * ничего не добавляет.
 */
export function tickWorld(universe: Universe): Universe {
  const state = universe.state;
  const turn = state.turn;
  if (state.chronicle.some((entry) => entry.id === `diary-${turn}-0`)) return universe;

  const seed = hashString(`tick:${universe.seed}:${turn}`);
  const random = mulberry32(seed);
  const character = state.characters.length ? pick(state.characters, random) : undefined;
  const location = state.locations.length ? pick(state.locations, random) : undefined;
  const metrics = driftMetrics(state, random);

  const accents: AccentKey[] = ['violet', 'cyan', 'gold', 'green', 'rose'];
  const entries: ChronicleEntry[] = [
    {
      id: `diary-${turn}-0`,
      year: universe.era + turn * 4,
      label: 'дневник',
      title: 'Мир живёт без тебя',
      text: `${pick(OPENINGS, random)} ${location ? location.name : 'Город'} — ${pick(EVENTS, random)} ${pick(REACTIONS, random)}`,
      kind: 'scene',
      accent: pick(accents, random),
      turn,
    },
    {
      id: `diary-${turn}-1`,
      year: universe.era + turn * 4,
      label: 'дневник',
      title: character ? `Запись о ${character.name.split(' ')[0]}` : 'Запись без имени',
      text: character
        ? `${character.name} ${pick(PERSONAL, random)}`
        : 'В дневнике осталась страница, подписанная чужим почерком.',
      kind: 'scene',
      accent: pick(accents, random),
      turn,
    },
  ];

  return {
    ...universe,
    state: {
      ...state,
      metrics,
      chronicle: [...state.chronicle, ...entries].slice(-80),
    },
  };
}

/** Записи дневника для отдельного блока в хронике. */
export function diaryEntries(state: WorldState): ChronicleEntry[] {
  return state.chronicle.filter((entry) => entry.label === 'дневник').slice(-8).reverse();
}
