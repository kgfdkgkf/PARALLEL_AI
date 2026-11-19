import { clamp } from '../theme';
import { characterStatus } from './generate';
import { collectArtifact, findArtifact, lifeOf } from './life';
import type { AccentKey } from '../theme';
import type { DivineEvent, DivinePower, Universe, WorldState } from './types';
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
  const seed = hashString(`deity:${universe.seed}`);
  return DEITIES[seed % DEITIES.length];
}

export function faithOf(state: WorldState): number {
  const cost = (state.divine ?? []).reduce((sum, event) => {
    return sum + (event.cost ?? (event.resolved === 'bless' ? DIVINE_BLESS_COST : event.resolved === 'curse' ? DIVINE_CURSE_COST : 0));
  }, 0);
  return clamp(50 + state.turn * 6 + Math.min(24, state.life?.day ?? 0) - cost);
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
  if (state.ending || (state.divine ?? []).some((event) => event.turn === turn && event.resolved)) return null;
  const seed = hashString(`divine:${universe.seed}:${turn}`);
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

function record(universe: Universe, entry: DivineEvent, accent: AccentKey, label: string): Universe {
  const state = universe.state;
  return {
    ...universe,
    updatedAt: new Date().toISOString(),
    state: {
      ...state,
      divine: [...(state.divine ?? []), entry],
      chronicle: [...state.chronicle, {
        id: `chronicle-${entry.id}`, turn: state.turn, kind: 'scene',
        year: universe.era + state.turn * 4, label, title: entry.title, text: entry.result ?? entry.text, accent,
      }],
      memory: [...state.memory, { id: `fact-${entry.id}`, turn: state.turn, kind: 'event', text: entry.result ?? entry.text }],
    },
  };
}

function changeBond(state: WorldState, id: string | undefined, delta: number) {
  return state.characters.map((character) => {
    if (character.id !== id) return character;
    const bond = clamp(character.bond + delta);
    return { ...character, bond, status: characterStatus(bond) };
  });
}

function resolve(universe: Universe, pending: Pending, choice: 'bless' | 'curse'): Universe {
  const state = universe.state;
  const bless = choice === 'bless';
  const metrics = {
    ...state.metrics,
    trust: clamp(state.metrics.trust + (bless ? 6 : -7)),
    freedom: clamp(state.metrics.freedom + (bless ? 3 : -2)),
    order: clamp(state.metrics.order + (bless ? -1 : 5)),
    tech: clamp(state.metrics.tech + (bless ? 1 : 2)),
  };
  const entry: DivineEvent = {
    ...pending,
    id: `divine-${state.turn}-${choice}`,
    resolved: choice,
    cost: bless ? DIVINE_BLESS_COST : DIVINE_CURSE_COST,
    result: bless
      ? `Бог ответил милостью на «${pending.title}». Жители стали больше доверять друг другу.`
      : `Бог ответил карой на «${pending.title}». Жители крепче держатся за порядок и меньше доверяют друг другу.`,
  };

  return record({
    ...universe,
    state: { ...state, metrics, characters: changeBond(state, pending.characterId, bless ? 7 : -9) },
  }, entry, bless ? 'green' : 'rose', bless ? 'милость' : 'кара');
}

export const POWERS: Record<DivinePower, { title: string; cost: number; text: string; accent: AccentKey }> = {
  inspire: { title: 'Вдохновение', cost: 9, text: 'Укрепить связь с выбранным жителем и повысить доверие в мире.', accent: 'violet' },
  protect: { title: 'Оберег', cost: 10, text: 'Защитить место от следующего происшествия в дневнике. Одновременно действует один оберег.', accent: 'cyan' },
  reveal: { title: 'Откровение', cost: 12, text: 'Найти спрятанный артефакт в открытом месте.', accent: 'gold' },
};

export function usedPower(universe: Universe): boolean {
  return !!universe.state.divine?.some((entry) => entry.turn === universe.state.turn && entry.power);
}

export function powerTargets(universe: Universe, power: DivinePower): { id: string; name: string }[] {
  if (power === 'inspire') return universe.state.characters.filter((character) => character.bond < 100);
  return universe.state.locations.filter((place) => {
    if (!place.unlocked) return false;
    return power === 'protect'
      ? universe.state.life?.protectedLocationId !== place.id
      : !!findArtifact(universe, place);
  });
}

export function useDivinePower(universe: Universe, power: DivinePower, targetId: string): Universe | null {
  const config = POWERS[power];
  const state = universe.state;
  if (state.ending || usedPower(universe) || faithOf(state) < config.cost) return null;
  const target = powerTargets(universe, power).find((item) => item.id === targetId);
  if (!target) return null;

  let next: Universe;
  let result: string;
  if (power === 'inspire') {
    const metrics = { ...state.metrics, trust: clamp(state.metrics.trust + 2) };
    next = { ...universe, state: { ...state, metrics, characters: changeBond(state, targetId, 14) } };
    result = `Вдохновение: ${target.name} получил знак и снова вышел к людям.`;
  } else if (power === 'protect') {
    next = { ...universe, state: { ...state, life: { ...lifeOf(universe), protectedLocationId: targetId } } };
    result = `В месте «${target.name}» появился оберег. Он сработает при следующем происшествии здесь.`;
  } else {
    const place = state.locations.find((item) => item.id === targetId);
    const artifact = place && findArtifact(universe, place);
    if (!artifact) return null;
    next = collectArtifact(universe, artifact);
    result = `В месте «${target.name}» нашли «${artifact.title}». Предмет внесли в коллекцию.`;
  }

  return record(next, {
    id: `divine-${state.turn}-${power}`, turn: state.turn, kind: 'miracle',
    title: config.title, text: config.text, result, cost: config.cost, power,
  }, config.accent, 'вмешательство');
}

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
