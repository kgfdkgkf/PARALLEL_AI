import { clamp } from '../theme';
import { hashString } from './hash';
import { scenarioFor } from './scenarios';
import type { Artifact, Location, Universe, WorldLife } from './types';

export const WORLD_DAY_MS = 3 * 60 * 1000;
export const MAX_MISSED_DAYS = 12;

export function lifeOf(universe: Universe, now = Date.now()): WorldLife {
  if (universe.state.life) return universe.state.life;
  const scenario = scenarioFor(universe.question);
  const first = universe.state.characters[0];
  const second = universe.state.characters[1];
  const place = universe.state.locations[0]?.name ?? 'город';
  return {
    day: 0,
    lastAt: now,
    journal: [{
      day: 0,
      title: 'Первые записи',
      text: `Жители составили планы на ближайшие дни. Новые записи появятся, когда они приступят к делу. Место встречи — «${place}».`,
      accent: 'violet',
    }],
    threads: [
      { title: scenario.disputes[0], detail: `${first?.name ?? 'Местный мастер'} собирает наблюдения, чтобы разобраться, как новое правило меняет работу района.`, progress: 0 },
      { title: 'Независимая проверка', detail: `${second?.name ?? 'Местный житель'} ищет доказательства, что у жителей и городской службы есть общая версия событий.`, progress: 0 },
      { title: 'Коллекция свидетельств', detail: `Местные собирают вещи, которые объясняют, как устроен этот мир. Первый пункт списка — ${universe.signature?.title ?? scenario.artifact}.`, progress: 0 },
    ],
    artifacts: [],
  };
}

const REPORTS = [
  [
    'первая группа начала записывать, как правило меняет жизнь района.',
    'соседи сравнили записи и выяснили, что старый распорядок подходит только части жителей.',
    'запустили новый график работы и вывесили его там, где раньше собиралась очередь.',
  ],
  [
    'местные собрали две версии спорного случая и договорились поговорить со свидетелями.',
    'проверяющие открыли журнал наблюдений и обнаружили пропущенную запись.',
    'служба признала ошибку и согласилась публиковать исходные наблюдения.',
  ],
  [
    'объявили сбор уцелевших вещей с записками владельцев.',
    'жители сравнили предметы из разных районов и записали, чем отличались способы выживания.',
    'открылась небольшая выставка. У каждой вещи есть история того, кто ею пользовался.',
  ],
];

export function advanceLife(universe: Universe, now = Date.now(), observe = false): Universe {
  if (universe.state.ending) return universe;
  let life = lifeOf(universe, now);
  const elapsed = Math.max(0, Math.floor((now - life.lastAt) / WORLD_DAY_MS));
  const days = observe ? 1 : Math.min(MAX_MISSED_DAYS, elapsed);
  if (!days) return universe.state.life ? universe : { ...universe, state: { ...universe.state, life } };

  const metrics = { ...universe.state.metrics };
  const memory = [...universe.state.memory];
  const unlocked = universe.state.locations.filter((item) => item.unlocked);
  for (let index = 0; index < days; index += 1) {
    const day = life.day + 1;
    const place = unlocked[(day - 1) % unlocked.length];
    const placeName = place?.name ?? 'город';
    const actor = universe.state.characters[(day - 1) % universe.state.characters.length]?.name ?? 'Местный житель';
    const threadIndex = (day - 1) % life.threads.length;
    const current = life.threads[threadIndex];
    const progress = Math.min(3, current.progress + 1);
    const incident = hashString(`life:${universe.seed}:${day}`) % 4 === 0;
    const protectedPlace = !!place && life.protectedLocationId === place.id;
    const loss = incident && !protectedPlace;
    const title = current.progress < 3 ? current.title : 'Обычный день в мире';
    const text = loss
      ? `${actor} сообщает из места «${placeName}»: работа остановилась после спорного случая. Доверие жителей снизилось.`
      : protectedPlace && incident
        ? `В месте «${placeName}» оберег сработал в момент происшествия. ${actor} передал об этом соседям.`
        : current.progress < 3
          ? `${actor} сообщает из места «${placeName}»: ${REPORTS[threadIndex][progress - 1]}`
          : `${actor} сверяет новые записи в месте «${placeName}». Последние договорённости пока действуют.`;
    const threads = life.threads.map((thread, i) => i === threadIndex && !loss ? { ...thread, progress } : thread);
    if (loss) metrics.trust = clamp(metrics.trust - 2);
    if (!loss && current.progress < 3 && progress === 3) {
      metrics.trust = clamp(metrics.trust + 2);
      memory.push({ id: `life-${day}`, turn: universe.state.turn, kind: 'event', text: `Дневник, день ${day}. ${title}. ${text}` });
    }
    const entry: WorldLife['journal'][number] = { day, title, text, accent: loss ? 'rose' : 'cyan' };
    life = {
      ...life,
      day,
      threads,
      protectedLocationId: protectedPlace && incident ? undefined : life.protectedLocationId,
      journal: [...life.journal, entry].slice(-30),
    };
  }
  const lastAt = observe || elapsed > MAX_MISSED_DAYS ? now : life.lastAt + days * WORLD_DAY_MS;
  return {
    ...universe,
    state: { ...universe.state, metrics, memory, life: { ...life, lastAt } },
  };
}

export function findArtifact(universe: Universe, location: Location): Artifact | null {
  const index = universe.state.locations.findIndex((item) => item.id === location.id);
  const id = `artifact-${location.id}`;
  const life = lifeOf(universe);
  if (index < 0 || !location.unlocked || life.artifacts.some((item) => item.id === id)) return null;
  const scenario = scenarioFor(universe.question);
  const variants = [
    universe.signature
      ? { title: universe.signature.title, description: universe.signature.text }
      : { title: scenario.artifact, description: scenario.artifactUse },
    { title: 'Карта со старыми отметками', description: `Показывает, как менялось место «${location.name}» после Сдвига. На обороте сохранился маршрут для тех, кто впервые приехал сюда.` },
    { title: 'Протокол первого спора', description: `Запись из места «${location.name}». В ней отмечено, какие меры жители предложили, когда стало ясно, что прежний порядок изменился.` },
    { title: 'Рабочий образец', description: `Опытный предмет из места «${location.name}». По следам переделок можно восстановить, как его приспосабливали к правилу «${universe.rule}».` },
    { title: 'Письма следующему поколению', description: `Жители места «${location.name}» написали, каким запомнили мир до перемен и какие решения оставляют детям.` },
  ];
  const item = variants[index % variants.length];
  return { id, ...item, day: life.day, locationId: location.id };
}

export function collectArtifact(universe: Universe, artifact: Artifact): Universe {
  const life = lifeOf(universe);
  if (life.artifacts.some((item) => item.id === artifact.id)) return universe;
  return {
    ...universe,
    state: {
      ...universe.state,
      life: { ...life, artifacts: [...life.artifacts, artifact] },
      memory: [...universe.state.memory, {
        id: artifact.id, turn: universe.state.turn, text: `Найдено: «${artifact.title}». ${artifact.description}`, kind: 'event',
      }],
    },
  };
}
