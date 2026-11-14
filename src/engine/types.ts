import type { AccentKey, CoverId } from '../theme';

export type EngineMode = 'demo' | 'ai';

export type AiStatus = 'unknown' | 'online' | 'offline';

export type ThemeId = 'time' | 'memory' | 'truth' | 'fear' | 'ai' | 'lives' | 'genesis';

export type MetricKey = 'order' | 'freedom' | 'trust' | 'tech';

export type Metrics = Record<MetricKey, number>;

export type Stance = 'control' | 'liberty' | 'transcend';

export type Law = {
  id: string;
  text: string;
  origin: 'core' | 'consequence';
  turn: number;
};

export type Location = {
  id: string;
  name: string;
  kind: string;
  blurb: string;
  detail: string;
  /** 0..1 координаты на карте мира */
  x: number;
  y: number;
  unlocked: boolean;
  accent: AccentKey;
  /** на каком ходу место уже осматривали */
  visitedTurn?: number;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  age: number;
  quote: string;
  bio: string;
  goal: string;
  fear: string;
  secret: string;
  stance: Stance;
  accent: AccentKey;
  sigil?: string;
  /** 0..100 — насколько житель вам доверяет */
  bond: number;
  status: string;
  mood: 'calm' | 'tense' | 'hopeful' | 'broken';
  home: string;
  /** факты мира, которые житель знает лично */
  knows: string[];
};

export type ChronicleKind = 'origin' | 'era' | 'decision' | 'consequence' | 'ending' | 'scene';

export type ChronicleEntry = {
  id: string;
  year: number;
  label: string;
  title: string;
  text: string;
  kind: ChronicleKind;
  accent: AccentKey;
  turn: number;
};

export type Option = {
  id: string;
  title: string;
  detail: string;
  cost: string;
  intent: string;
  stance: Stance;
  effects: Partial<Metrics>;
  headline: string;
  explanation: string;
  ripple: string[];
  law?: string;
  memory: string;
};

export type Decision = {
  id: string;
  index: number;
  total: number;
  kicker: string;
  title: string;
  context: string;
  question: string;
  options: Option[];
};

export type WorldFact = {
  id: string;
  turn: number;
  text: string;
  kind: 'decision' | 'law' | 'event';
};

/** Уникальный артефакт/институт конкретной вселенной. */
export type Signature = { title: string; text: string };

export type CultureFact = {
  label: string;
  value: string;
};

/** Личная цель партии — видна в мире и проверяется в финале. */
export type Objective = {
  id: string;
  title: string;
  description: string;
  metric: MetricKey;
  target: number;
};

export type NewsItem = {
  id: string;
  source: string;
  headline: string;
  text: string;
  turn: number;
  tone: 'positive' | 'negative' | 'neutral';
};

export type Ending = {
  id: string;
  kind: 'order' | 'freedom' | 'balance' | 'collapse' | 'machine';
  title: string;
  epigraph: string;
  body: string[];
  accent: AccentKey;
};

export type DivineEvent = {
  id: string;
  turn: number;
  kind: 'omen' | 'prayer' | 'crisis' | 'miracle';
  title: string;
  text: string;
  characterId?: string;
  characterName?: string;
  resolved?: 'bless' | 'curse';
  result?: string;
};

export type WorldState = {
  faith?: number;
  divine?: DivineEvent[];
  metrics: Metrics;
  laws: Law[];
  locations: Location[];
  characters: Character[];
  chronicle: ChronicleEntry[];
  memory: WorldFact[];
  news: NewsItem[];
  pending: Decision | null;
  turn: number;
  ending: Ending | null;
};

export type BranchNode = {
  id: string;
  turn: number;
  decisionId: string;
  decisionTitle: string;
  question: string;
  optionId: string;
  optionTitle: string;
  headline: string;
  accent: AccentKey;
  createdAt: string;
  /** состояние мира до этого решения */
  snapshot: WorldState;
};

export type Universe = {
  id: string;
  seed: number;
  question: string;
  title: string;
  codename: string;
  genre: string;
  era: number;
  premise: string;
  rule: string;
  theme: ThemeId;
  accent: AccentKey;
  cover: CoverId;
  culture: CultureFact[];
  createdAt: string;
  updatedAt: string;
  mode: EngineMode;
  /** кем видит игрока этот мир */
  playerRole?: string;
  deity?: string;
  signature?: Signature;
  objective?: Objective;
  state: WorldState;
  path: BranchNode[];
};

export type ChatMessage = {
  id: string;
  from: 'user' | 'character';
  text: string;
};

export type Outcome = {
  option: Option;
  allyName?: string;
  before: Metrics;
  after: Metrics;
  node: BranchNode;
  ending: Ending | null;
  law?: string;
  memory: string;
};
