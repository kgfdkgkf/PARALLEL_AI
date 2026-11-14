import { accents } from '../theme';
import type { AccentKey } from '../theme';
import type { ChronicleKind, DivineEvent, Universe, WorldState } from './types';
import { hashString, mulberry32 } from './hash';

export const DIVINE_BLESS_COST = 12;
export const DIVINE_CURSE_COST = 8;

const DEITIES = [
  'Тихий Свидетель',
  'Бог Несказанного',
  'Хранитель Паузы',
  'Тот, Кто Считает',
  'Бог Второй Попытки',
  'Молчаливый Арбитр',
];

export function deityOf(universe: Universe): string {
  if (universe.deity) return universe.deity;
  const seed = hashString(`deity:${universe.id}`);
  return DEITIES[seed % DEITIES.length];
}

/**
 * Вера считается из журнала: мир верит в бога тем сильнее, чем дольше он существует,
 * но каждая милость тратит веру, а кара — наоборот, подпитывает её страхом.
 */
export function faithOf(state: WorldState): number {
  const journal = state.divine ?? [];
  const blesses = journal.filter((event) => event.resolved === 'bless').length;
  const curses = journal.filter((event) => event.resolved === 'curse').length;
  return Math.max(0, Math.min(100, 50 + state.turn * 4 - blesses * 12 + curses * 6));
}

export function divineJournal(state: WorldState): DivineEvent[] {
  return (state.divine ?? []).slice().reverse();
}

type Pending = {
  turn: number;
  kind: DivineEvent['kind'];
  title: string;
  text: string;
  characterId?: string;
  characterName?: string;
};

const TEMPLATES: ((universe: Universe, name: string) => { kind: Pending['kind']; title: string; text: string })[] = [
  (universe, name) => ({
    kind: 'prayer',
    title: `Молитва без адреса`,
    text: `${name} шепчет в пустоту: «Если тот, кто это придумал, слышит — пусть подаст знак». Никто не отвечает. У тебя есть ровно один способ ответить.`,
  }),
  (universe, name) => ({
    kind: 'crisis',
    title: `Трещина в правиле`,
    text: `${universe.rule} впервые даёт сбой прямо на глазах ${name}. Мир ждёт, признаешь ли ты это частью замысла — или вмешаешься.`,
  }),
  (universe, name) => ({
    kind: 'omen',
    title: `Знамение на площади`,
    text: `Над городом повисает свет, которого не должно быть. ${name} смотрит вверх и произносит твоё имя вслух — впервые за всё время.`,
  }),
  (universe, name) => ({
    kind: 'miracle',
    title: `Чужая удача`,
    text: `${name} находит то, что искал всю жизнь, — и сразу понимает, что это подарок. Теперь весь город строит догадки, кто подарил.`,
  }),
  (universe, name) => ({
    kind: 'prayer',
    title: `Просьба о наказании`,
    text: `${name} приходит к алтарю с просьбой не о милости, а о каре: «Накажи того, кто это сделал». Ты видишь, кто на самом деле виноват.`,
  }),
  (universe, name) => ({
    kind: 'crisis',
    title: `Сделка с тишиной`,
    text: `Город решает, что боги молчат, — и начинает жить без них. ${name} единственный продолжает приносить дары. Это твой последний шанс ответить.`,
  }),
];

/** Событие текущего хода: детерминированное, но не повторяется в одном мире на одном ходу. */
export function pendingDivine(universe: Universe): Pending | null {
  const state = universe.state;
  const turn = state.turn;
  if ((state.divine ?? []).some((event) => event.turn === turn)) return null;
  const seed = hashString(`divine:${universe.id}:${turn}`);
  const random = mulberry32(seed);
  const characters = state.characters;
  const character = characters.length ? characters[Math.floor(random() * characters.length)] : undefined;
  const template = TEMPLATES[seed % TEMPLATES.length];
  const name = character ? character.name.split(' ')[0] : 'житель';
  const { kind, title, text } = template(universe, name);
  return { turn, kind, title, text, characterId: character?.id, characterName: character?.name };
}

/** Благословение: дороже, но даёт веру и доверие. */
export function bless(universe: Universe): Universe | null {
  const pending = pendingDivine(universe);
  if (!pending) return null;
  if (faithOf(universe.state) < DIVINE_BLESS_COST) return null;
  return resolve(universe, pending, 'bless');
}

/** Кара: дешевле, укрепляет порядок и страх, но отнимает доверие. */
export function curse(universe: Universe): Universe | null {
  const pending = pendingDivine(universe);
  if (!pending) return null;
  if (faithOf(universe.state) < DIVINE_CURSE_COST) return null;
  return resolve(universe, pending, 'curse');
}

function resolve(universe: Universe, pending: Pending, choice: 'bless' | 'curse'): Universe {
  const state = universe.state;
  const bless = choice === 'bless';
  const cost = bless ? DIVINE_BLESS_COST : DIVINE_CURSE_COST;

  const metrics = {
    ...state.metrics,
    trust: clamp(state.metrics.trust + (bless ? 6 : -7)),
    freedom: clamp(state.metrics.freedom + (bless ? 3 : -2)),
    order: clamp(state.metrics.order + (bless ? -1 : 5)),
    tech: clamp(state.metrics.tech + (bless ? 1 : 2)),
  };

  const characters = state.characters.map((character) => {
    if (character.id !== pending.characterId) return character;
    return { ...character, bond: clamp(character.bond + (bless ? 7 : -9)) };
  });

  const faith = clamp(faithOf(state) - cost + (bless ? 0 : 6));

  const entry: DivineEvent = {
    id: `divine-${state.turn}-${choice}`,
    turn: state.turn,
    kind: pending.kind,
    title: pending.title,
    text: pending.text,
    characterId: pending.characterId,
    characterName: pending.characterName,
    resolved: choice,
    result: bless
      ? `${pending.characterName ?? 'Житель'} получил ответ: «Да». Доверие выросло, вера укрепилась.`
      : `${pending.characterName ?? 'Житель'} получил ответ: «Нет». Порядок вырос, доверие просело.`,
  };

  const chronicle = [
    ...state.chronicle,
    {
      id: `chronicle-divine-${state.turn}-${choice}`,
      turn: state.turn,
      kind: (bless ? 'event' : 'law') as ChronicleKind,
      year: 0,
      label: bless ? 'милость' : 'кара',
      title: bless ? 'Бог сказал «да»' : 'Бог сказал «нет»',
      text: entry.result ?? '',
      accent: (bless ? 'green' : 'rose') as AccentKey,
    },
  ].slice(-40);

  const memory = [
    ...state.memory,
    {
      id: `fact-divine-${state.turn}-${choice}`,
      turn: state.turn,
      kind: 'event' as const,
      text: bless
        ? `На ${pending.title.toLowerCase()} ты ответил милостью — и это запомнили.`
        : `На ${pending.title.toLowerCase()} ты ответил карой — и это тоже запомнили.`,
    },
  ].slice(-12);

  return {
    ...universe,
    state: {
      ...state,
      metrics,
      characters,
      faith,
      divine: [...(state.divine ?? []), entry],
      chronicle,
      memory,
    },
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function divineAccent(choice: 'bless' | 'curse'): AccentKey {
  return choice === 'bless' ? 'green' : 'rose';
}

export const divineLabels: Record<'bless' | 'curse', { title: string; effect: string }> = {
  bless: { title: 'Благословить', effect: `−${DIVINE_BLESS_COST} веры · +доверие · +свобода` },
  curse: { title: 'Покарать', effect: `−${DIVINE_CURSE_COST} веры · +порядок · −доверие` },
};

export const divineKindLabel: Record<DivineEvent['kind'], string> = {
  omen: 'знамение',
  prayer: 'молитва',
  crisis: 'кризис',
  miracle: 'чудо',
};

export const divineKindAccent: Record<DivineEvent['kind'], AccentKey> = {
  omen: 'cyan',
  prayer: 'violet',
  crisis: 'rose',
  miracle: 'gold',
};

export function divineColorOf(accent: AccentKey) {
  return accents[accent];
}
