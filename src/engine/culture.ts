import type { CultureFact } from './types';

/**
 * Модели иногда возвращают несколько фактов культуры с одинаковым label
 * («Ритуал», «Язык»). Одинаковые строки ломают ключи в списках и выглядят
 * как дубли, поэтому подписи приводим к уникальным, сохраняя все значения.
 */
export function dedupeCulture(facts: CultureFact[], limit = 5): CultureFact[] {
  const seen = new Map<string, number>();
  const result: CultureFact[] = [];
  for (const fact of facts) {
    const value = fact.value?.trim();
    if (!value) continue;
    const base = (fact.label || 'Обычай').trim();
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const label = count === 0 ? base : `${base} · ${count + 1}`;
    result.push({ label, value });
    if (result.length >= limit) break;
  }
  return result;
}
