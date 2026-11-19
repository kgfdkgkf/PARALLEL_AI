import { clamp, type AccentKey } from '../theme';
import { collectArtifact, findArtifact } from './life';
import { hashString } from './hash';
import type { Artifact, ChronicleEntry, Metrics, Universe } from './types';

export type Scene = {
  title: string;
  text: string;
  effectLabel: string;
  metric: keyof Metrics;
  delta: number;
  accent: AccentKey;
  locationName: string;
  locationId: string;
  artifact?: Artifact;
};

type SceneTemplate = {
  title: string;
  text: (ctx: { place: string; law: string; person: string; role: string; rule: string }) => string;
  metric: keyof Metrics;
  delta: number;
};

const GENERIC: SceneTemplate[] = [
  {
    title: 'Что здесь видно',
    text: ({ place, person, law }) =>
      `${place} выглядит спокойнее, чем звучит в новостях. ${person} провожает тебя взглядом и говорит в сторону: «${law}» — так здесь объясняют всё, что не хочется объяснять. Ты замечаешь, что люди говорят тише, когда называют имя Совета.`,
    metric: 'trust',
    delta: 2,
  },
  {
    title: 'Разговор на пороге',
    text: ({ place, person, role }) =>
      `На входе в ${place} тебя останавливает ${role}. Не для проверки — просто чтобы предупредить: «Здесь не спрашивают, зачем ты пришёл. Здесь смотрят, что ты сделаешь». ${person} кивает из глубины помещения и возвращается к своим делам.`,
    metric: 'order',
    delta: 1,
  },
  {
    title: 'Следы прежнего мира',
    text: ({ place, rule }) =>
      `В ${place} сохранилось то, что не успели переписать: надпись, дата, чья-то подпись под стеклом. Правило «${rule}» появилось позже — и всё здесь помнит момент, когда его ещё не было. Ты уходишь с ощущением, что мир держится на привычке, а не на законе.`,
    metric: 'freedom',
    delta: 2,
  },
];

const BY_KIND: Record<string, SceneTemplate[]> = {
  Институт: [
    {
      title: 'Очередь без разговоров',
      text: ({ place, law, person }) =>
        `В ${place} очередь двигается молча: говорить в коридоре не запрещено, но не принято. На стене — выдержка из правил: «${law}». ${person} стоит у окна и считает, сколько человек зашло за час. Когда ты проходишь мимо, он говорит: «Наверху считают иначе. Но наверху не стоят в очереди».`,
      metric: 'order',
      delta: 3,
    },
    {
      title: 'Кабинет с видом на город',
      text: ({ place, person, rule }) =>
        `Тебя пускают в ${place} на минуту — ровно на одну. Из окна видно район, который живёт по правилу «${rule}» уже шестьдесят лет. ${person} говорит без пафоса: «Мы не придумали это правило. Мы просто перестали с ним спорить». Ты замечаешь на столе папку с надписью «исключения» — она толще, чем свод законов.`,
      metric: 'trust',
      delta: 2,
    },
  ],
  Рынок: [
    {
      title: 'Цена молчания',
      text: ({ place, person }) =>
        `На ${place} торгуются не словами, а паузами. ${person} показывает тебе три пальца, потом два — это значит, что цена упала. Здесь никто не спрашивает, откуда товар: важно, что он уходит быстро. Ты покупаешь мелочь и чувствуешь, как местные расслабляются: чужак, который платит, — почти свой.`,
      metric: 'freedom',
      delta: 2,
    },
  ],
  Архив: [
    {
      title: 'Запись, которой нет',
      text: ({ place, person, rule }) =>
        `В ${place} выдают плёнки по одной. ${person} ставит перед тобой катушку без подписи и говорит: «Здесь записано, как жили до правила». Голос на записи спорит сам с собой; ты слышишь «${rule}» в форме вопроса — и понимаешь, что когда-то это было не решением, а страхом.`,
      metric: 'tech',
      delta: 2,
    },
  ],
  Мемориал: [
    {
      title: 'Стена без имён',
      text: ({ place, person }) =>
        `На ${place} не пишут имён — только годы. ${person} объясняет: «Имена слишком быстро становятся аргументом». Ты стоишь дольше, чем планировал, и ловишь себя на мысли, что считаешь даты, будто они что-то доказывают.`,
      metric: 'trust',
      delta: 3,
    },
  ],
  Граница: [
    {
      title: 'Место, где правило слабее',
      text: ({ place, person, rule }) =>
        `За ${place} начинается территория, где «${rule}» соблюдают через раз. ${person} встречает тебя без удивления: «Сюда приезжают те, кому не хватило места в правилах». Здесь дешевле жить и дороже молчать — и это единственная здешняя экономика.`,
      metric: 'freedom',
      delta: 3,
    },
  ],
  Наука: [
    {
      title: 'Прибор, который всё считает',
      text: ({ place, person }) =>
        `В ${place} тебе показывают прибор, который измеряет не нарушения, а настроение: сколько людей за неделю назвали правило нормальным. ${person} говорит: «Цифры нас устраивают. Нас не устраивает, что их считаем мы сами».`,
      metric: 'tech',
      delta: 3,
    },
  ],
  Квартал: [
    {
      title: 'Двор, где говорят шёпотом',
      text: ({ place, person, law }) =>
        `В ${place} на детской площадке тихо, хотя играют дети. ${person} объясняет: «${law}» — и пожимает плечами, будто это ответ на всё. Ты замечаешь на стене старую надпись, закрашенную дважды, и понимаешь: тут умеют жить с любым правилом.`,
      metric: 'trust',
      delta: 2,
    },
  ],
};

function templatesFor(kind: string): SceneTemplate[] {
  const specific = BY_KIND[kind] ?? BY_KIND[Object.keys(BY_KIND).find((key) => kind.toLowerCase().includes(key.toLowerCase())) ?? ''];
  return specific ? [...specific, ...GENERIC] : GENERIC;
}

export function exploreLocation(universe: Universe, locationId: string): { universe: Universe; scene: Scene } | null {
  const location = universe.state.locations.find((item) => item.id === locationId);
  if (!location || !location.unlocked || universe.state.ending) return null;
  if (location.visitedTurn === universe.state.turn) return null;

  const seed = hashString(`${universe.seed}:${location.id}:${universe.state.turn}`);
  const person = universe.state.characters[seed % Math.max(1, universe.state.characters.length)];
  const law = universe.state.laws[seed % Math.max(1, universe.state.laws.length)]?.text ?? universe.rule;
  const variants = templatesFor(location.kind);
  const template = variants[seed % variants.length];

  const artifact = findArtifact(universe, location);
  const current = artifact ? collectArtifact(universe, artifact) : universe;
  const next: Universe = { ...current, state: {
    ...current.state,
    metrics: { ...current.state.metrics },
    memory: [...current.state.memory],
    chronicle: [...current.state.chronicle],
  } };
  const before = next.state.metrics[template.metric];
  next.state.metrics[template.metric] = clamp(before + template.delta);
  const delta = next.state.metrics[template.metric] - before;
  next.state.locations = next.state.locations.map((item) =>
    item.id === location.id ? { ...item, visitedTurn: next.state.turn } : item,
  );

  const text = template.text({
    place: location.name,
    law,
    person: person?.name ?? 'местный житель',
    role: person?.role ?? 'смотритель',
    rule: universe.rule,
  });

  next.state.memory.push({
    id: `fact-place-${location.id}-${next.state.memory.length}`,
    turn: next.state.turn,
    text: `Посещено место «${location.name}»: ${template.title.toLowerCase()}.`,
    kind: 'event',
  });

  const entry: ChronicleEntry = {
    id: `chr-place-${location.id}-${next.state.turn}`,
    year: universe.era + next.state.turn * 4,
    label: 'МЕСТО',
    title: location.name,
    text,
    kind: 'scene',
    accent: location.accent,
    turn: next.state.turn,
  };
  next.state.chronicle.push(entry);
  next.updatedAt = new Date().toISOString();

  const metricLabel: Record<keyof Metrics, string> = {
    order: 'порядок',
    freedom: 'свобода',
    trust: 'доверие',
    tech: 'технологии',
  };

  return {
    universe: next,
    scene: {
      title: template.title,
      text,
      effectLabel: delta ? `${delta > 0 ? '+' : ''}${delta} ${metricLabel[template.metric]}` : 'Показатели без изменений',
      metric: template.metric,
      delta,
      accent: location.accent,
      locationName: location.name,
      locationId: location.id,
      artifact: artifact ?? undefined,
    },
  };
}
