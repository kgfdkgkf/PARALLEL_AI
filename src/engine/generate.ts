import type { AccentKey } from '../theme';
import { clamp } from '../theme';
import { buildDecision } from './events';
import { scenarioFor } from './scenarios';
import { hypothesisText } from './hypothesis';
import { hashString, mulberry32 } from './hash';
import { varyUniverse } from './lexicon';
import { buildGenesisPack } from './genesis';
import { detectTheme, GENESIS_TEMPLATE, ThemePack } from './themes';
import type {
  Character,
  Objective,
  Signature,
  ChronicleEntry,
  CultureFact,
  EngineMode,
  Law,
  Location,
  Metrics,
  ThemeId,
  Universe,
  WorldFact,
  WorldState,
} from './types';

const ACCENT_CYCLE: AccentKey[] = ['violet', 'cyan', 'gold', 'rose', 'green'];

const BASE_METRICS: Record<ThemeId, Metrics> = {
  truth: { order: 57, freedom: 31, trust: 44, tech: 66 },
  time: { order: 61, freedom: 27, trust: 37, tech: 74 },
  memory: { order: 47, freedom: 52, trust: 62, tech: 58 },
  fear: { order: 73, freedom: 42, trust: 55, tech: 49 },
  ai: { order: 55, freedom: 40, trust: 46, tech: 87 },
  lives: { order: 64, freedom: 49, trust: 58, tech: 71 },
  genesis: { order: 52, freedom: 47, trust: 43, tech: 56 },
};

const MAP_POINTS = [
  { x: 0.5, y: 0.46 },
  { x: 0.23, y: 0.26 },
  { x: 0.77, y: 0.24 },
  { x: 0.24, y: 0.66 },
  { x: 0.76, y: 0.64 },
];

export { hashString, mulberry32 } from './hash';

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanQuestion(question: string): string {
  return question
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^что[,]?\s+если\s+(бы\s+)?/i, '')
    .replace(/^а\s+что[,]?\s+если\s+(бы\s+)?/i, '')
    .replace(/\?+$/, '');
}

function deriveGenesisTitle(question: string): string {
  const core = cleanQuestion(question);
  const trimmed = core.length > 42 ? `${core.slice(0, 42).trim()}…` : core;
  return `МИР, ГДЕ ${trimmed.toUpperCase()}`;
}

function genesisPremise(question: string, era: number): string {
  const core = cleanQuestion(question);
  return `В ${era - 60} году мир проснулся в новой конфигурации: ${core.toLowerCase()}. Никто не запомнил самого дня — только слухи и четыре официальные версии случившегося. Спустя шестьдесят лет общество научилось жить внутри этого правила, но так и не научилось его понимать.`;
}

function statusFor(bond: number): string {
  if (bond >= 78) return 'На вашей стороне';
  if (bond >= 58) return 'Доверяет';
  if (bond >= 38) return 'Открыт к разговору';
  return 'Насторожен';
}

export function characterStatus(bond: number): string {
  return statusFor(bond);
}

function buildLocations(pack: ThemePack, random: () => number): Location[] {
  return pack.locations.map((seed, index) => {
    const point = MAP_POINTS[index];
    return {
      id: `loc-${index}`,
      name: seed.name,
      kind: seed.kind,
      blurb: seed.blurb,
      detail: seed.detail,
      x: point.x + (random() - 0.5) * 0.06,
      y: point.y + (random() - 0.5) * 0.06,
      unlocked: index < 3,
      accent: ACCENT_CYCLE[(index + 1) % ACCENT_CYCLE.length],
    };
  });
}

function buildCharacters(pack: ThemePack, locations: Location[], random: () => number): Character[] {
  return pack.cast.slice(0, 3).map((seed, index) => {
    const bond = 26 + Math.floor(random() * 18);
    return {
      id: `chr-${index}`,
      name: seed.name,
      role: seed.role,
      age: seed.age,
      quote: seed.quote,
      bio: seed.bio,
      goal: seed.goal,
      fear: seed.fear,
      secret: seed.secret,
      stance: seed.stance,
      accent: ACCENT_CYCLE[(index + 2) % ACCENT_CYCLE.length],
      sigil: seed.sigil,
      bond,
      status: statusFor(bond),
      mood: 'calm',
      home: locations[index % locations.length].id,
      knows: [pack.laws[index % pack.laws.length], pack.eras[pack.eras.length - 1].title],
    };
  });
}

function buildChronicle(pack: ThemePack, era: number): ChronicleEntry[] {
  const entries: ChronicleEntry[] = [
    {
      id: 'chr-origin',
      year: era - 60,
      label: 'ТОЧКА СДВИГА',
      title: pack.id === 'genesis' ? 'Правило перестало действовать' : 'Изменение правила',
      text: pack.rule,
      kind: 'origin',
      accent: pack.accent,
      turn: 0,
    },
  ];
  pack.eras.forEach((item, index) => {
    entries.push({
      id: `chr-era-${index}`,
      year: item.year,
      label: 'ЭПОХА',
      title: item.title,
      text: item.text,
      kind: 'era',
      accent: index === pack.eras.length - 1 ? pack.accent : 'violet',
      turn: 0,
    });
  });
  return entries;
}

export function createUniverse(question: string, mode: EngineMode = 'demo'): Universe {
  const detected = detectTheme(question);
  const pack = detected.id === 'genesis' ? buildGenesisPack(question) : detected;
  const seed = hashString(`${hypothesisText(question).toLowerCase()}::${pack.id}`);
  const random = mulberry32(seed);
  const metricsBase = BASE_METRICS[pack.id];

  const metrics: Metrics = {
    order: clamp(metricsBase.order + (random() - 0.5) * 10),
    freedom: clamp(metricsBase.freedom + (random() - 0.5) * 10),
    trust: clamp(metricsBase.trust + (random() - 0.5) * 10),
    tech: clamp(metricsBase.tech + (random() - 0.5) * 10),
  };

  const laws: Law[] = pack.laws.map((text, index) => ({
    id: `law-${index}`,
    text,
    origin: 'core',
    turn: 0,
  }));

  const locations = buildLocations(pack, random);
  const characters = buildCharacters(pack, locations, random);
  const culture: CultureFact[] = pack.culture;
  const chronicle = buildChronicle(pack, pack.era);

  const memory: WorldFact[] = [
    { id: 'fact-0', turn: 0, text: `Установлено правило: ${pack.rule.toLowerCase()}`, kind: 'law' },
    {
      id: 'fact-1',
      turn: 0,
      text: `Последняя эпоха — «${pack.eras[pack.eras.length - 1].title}» (${pack.eras[pack.eras.length - 1].year})`,
      kind: 'event',
    },
  ];

  const title = pack.title;
  const rule = pack.rule;
  const premise = pack.premise;

  const roles = [
    'Странник из мира без правил',
    'Наблюдатель, которого здесь не ждут',
    'Голос, который слышат только в момент выбора',
    'Пришлый, чьи решения становятся законами',
    'Свидетель, которому этот мир снится',
  ];
  const objectives: Objective[] = [
    {
      id: 'trust',
      title: 'Сохранить доверие',
      description: 'К финалу доверие жителей должно быть не ниже 55.',
      metric: 'trust',
      target: 55,
    },
    {
      id: 'freedom',
      title: 'Не отдать свободу',
      description: 'К финалу свобода должна быть не ниже 60.',
      metric: 'freedom',
      target: 60,
    },
    {
      id: 'order',
      title: 'Удержать порядок',
      description: 'К финалу порядок должен быть не ниже 55.',
      metric: 'order',
      target: 55,
    },
    {
      id: 'tech',
      title: 'Разбудить технологии',
      description: 'К финалу технологии должны быть не ниже 70.',
      metric: 'tech',
      target: 70,
    },
  ];

  const signatures: Signature[] = [
    {
      title: 'Хроника шёпота',
      text: 'Институт, который записывает то, что люди не решаются сказать вслух. Записи не публикуют — их читают вслух раз в год, и после этого спорят, что было сказано на самом деле.',
    },
    {
      title: 'Стеклянный суд',
      text: 'Суд, где приговор виден заранее: зал построен из прозрачных панелей, и решение каждого присяжного читается по его лицу. Оправдать здесь сложнее, чем осудить.',
    },
    {
      title: 'Нулевой этаж',
      text: 'Уровень города, которого нет на картах: там живут те, кто отказался участвовать в системе. Формально это не преступление, практически — билет в один конец.',
    },
    {
      title: 'Двойная запись',
      text: 'Каждый закон существует в двух версиях: официальной и той, которую знают юристы. Разница между ними — главный негласный предмет торговли.',
    },
    {
      title: 'Праздник исключения',
      text: 'Раз в год городу разрешают нарушить главное правило — один день, официально. После праздника число нарушений падает: люди тратят весь запас смелости за сутки.',
    },
    {
      title: 'Комитет забытых имён',
      text: 'Собрание, которое решает, кого помнить. Имена, вычеркнутые из списка, исчезают из учебников, но остаются в разговорах — и это считается формой сопротивления.',
    },
    {
      title: 'Тихий аукцион',
      text: 'Закрытые торги, где продают не вещи, а разрешения: на ошибку, на молчание, на вторую попытку. Лоты не объявляют, о них узнают от тех, кто уже купил.',
    },
    {
      title: 'Архив возражений',
      text: 'Библиотека несогласий: каждое «против» записано и подписано. Читать можно всем, пользоваться — только тем, кто согласился, что возражение не отменяет решения.',
    },
  ];

  const baseState: WorldState = {
    metrics,
    laws,
    locations,
    characters,
    chronicle,
    memory,
    news: [],
    pending: null,
    turn: 0,
    ending: null,
  };

  const worldId = `u-${seed.toString(36)}-${Date.now().toString(36).slice(-4)}`;

  const universe: Universe = {
    id: worldId,
    seed,
    question: question.trim(),
    title,
    codename: pack.codename,
    genre: pack.genre,
    era: pack.era,
    premise,
    rule,
    theme: pack.id,
    accent: pack.accent,
    cover: pack.cover,
    culture,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    playerRole: roles[seed % roles.length],
    signature: signatures[Math.floor(random() * signatures.length) % signatures.length],
    objective: objectives[Math.floor(random() * objectives.length) % objectives.length],
    state: baseState,
    path: [],
  };

  const scenario = scenarioFor(question);
  if (pack.id === 'genesis') {
    universe.signature = { title: scenario.artifact, text: scenario.artifactUse };
  }
  const world = mode === 'demo' && pack.id !== 'genesis' ? varyUniverse(universe) : universe;
  world.state.pending = buildDecision(world);
  return world;
}

export function pickAccent(seed: number): AccentKey {
  return ACCENT_CYCLE[seed % ACCENT_CYCLE.length];
}

export function makeGenesisPack(): ThemePack {
  return GENESIS_TEMPLATE as ThemePack;
}
