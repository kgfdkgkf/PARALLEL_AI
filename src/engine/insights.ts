import { TOTAL_DECISIONS } from './events';
import type { Character, MetricKey, Metrics, Universe } from './types';

export const METRIC_LABELS: Record<MetricKey, string> = {
  order: 'Порядок',
  freedom: 'Свобода',
  trust: 'Доверие',
  tech: 'Технологии',
};

const METRIC_KEYS: MetricKey[] = ['order', 'freedom', 'trust', 'tech'];

/** Метрика с наибольшим значением. */
export function strongestMetric(metrics: Metrics): MetricKey {
  return METRIC_KEYS.reduce((best, key) => (metrics[key] > metrics[best] ? key : best), METRIC_KEYS[0]);
}

/** Метрика с наименьшим значением. */
export function weakestMetric(metrics: Metrics): MetricKey {
  return METRIC_KEYS.reduce((worst, key) => (metrics[key] < metrics[worst] ? key : worst), METRIC_KEYS[0]);
}

/** 0..100: чем ближе метрики друг к другу, тем выше равновесие мира. */
export function balanceScore(metrics: Metrics): number {
  const values = METRIC_KEYS.map((key) => metrics[key]);
  const spread = Math.max(...values) - Math.min(...values);
  return Math.max(0, Math.min(100, Math.round(100 - spread)));
}

/** Среднее доверие жителей (0..100). */
export function averageBond(characters: Character[]): number {
  if (characters.length === 0) return 0;
  const sum = characters.reduce((total, item) => total + item.bond, 0);
  return Math.round(sum / characters.length);
}

/** Жители, которые поддержат решение (доверие от 50 %). */
export function allies(characters: Character[]): Character[] {
  return characters.filter((item) => item.bond >= 50);
}

/** Сколько решений из шести уже принято, в процентах. */
export function progressPercent(universe: Universe): number {
  const done = Math.min(universe.state.turn, TOTAL_DECISIONS);
  return Math.round((done / TOTAL_DECISIONS) * 100);
}

export type WorldReport = {
  title: string;
  progress: number;
  strongest: MetricKey;
  weakest: MetricKey;
  balance: number;
  averageBond: number;
  allies: string[];
  laws: number;
  branches: number;
};

/** Сводка по миру для профиля, архива или экрана финала. */
export function buildWorldReport(universe: Universe): WorldReport {
  const { state } = universe;
  return {
    title: universe.title,
    progress: progressPercent(universe),
    strongest: strongestMetric(state.metrics),
    weakest: weakestMetric(state.metrics),
    balance: balanceScore(state.metrics),
    averageBond: averageBond(state.characters),
    allies: allies(state.characters).map((item) => item.name),
    laws: state.laws.length,
    branches: universe.path.length,
  };
}

/** Текстовая версия сводки — удобно добавлять в «Поделиться». */
export function formatWorldReport(universe: Universe): string {
  const report = buildWorldReport(universe);
  const allyLine = report.allies.length > 0 ? report.allies.join(', ') : 'пока нет';
  return [
    `«${report.title}» — пройдено ${report.progress}%`,
    `Сильнее всего: ${METRIC_LABELS[report.strongest]}, слабее всего: ${METRIC_LABELS[report.weakest]}`,
    `Равновесие мира: ${report.balance}/100`,
    `Среднее доверие жителей: ${report.averageBond}%`,
    `Союзники: ${allyLine}`,
    `Законов: ${report.laws} · Ветвей: ${report.branches}`,
  ].join('\n');
}
