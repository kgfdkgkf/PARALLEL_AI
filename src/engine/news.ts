import type { Metrics, NewsItem, Option, Universe } from './types';

function pick<T>(seed: number, items: T[]): T {
  return items[Math.abs(seed) % items.length];
}

function sourceFor(universe: Universe, index: number): string {
  const location = universe.state.locations[index % universe.state.locations.length];
  const options = [
    `Голос ${location.name}`,
    `Хроника ${universe.codename}`,
    'Уличный листок',
    `Эфир ${universe.era}`,
    `Сводка ${location.kind.toLowerCase()}`,
  ];
  return pick(universe.seed + index * 7, options);
}

export function makeNews(universe: Universe, option: Option, turn: number, metrics: Metrics): NewsItem[] {
  const seed = universe.seed + turn * 131;
  const location = universe.state.locations[(turn + 1) % universe.state.locations.length];
  const character = universe.state.characters.find((item) => item.stance === option.stance) ?? universe.state.characters[0];
  const institution = universe.state.laws.length ? 'Совет' : 'Институт';

  const stanceLines: Record<Option['stance'], { headline: string; text: string; tone: NewsItem['tone'] }[]> = {
    control: [
      {
        headline: `${institution} закрепляет новый порядок`,
        text: `Решение вступает в силу немедленно. В ${location.name} уже вывесили обновлённые правила — их теперь двенадцать страниц.`,
        tone: 'neutral',
      },
      {
        headline: 'Патрули получают новые полномочия',
        text: 'Проверять теперь можно не только действия, но и намерения. Юристы обещают «мягкое применение» — до первого громкого случая.',
        tone: 'negative',
      },
      {
        headline: 'Спокойствие как официальная ценность',
        text: 'Опросы показывают рост одобрения. В комментариях чаще всего повторяют слово «наконец-то».',
        tone: 'positive',
      },
    ],
    liberty: [
      {
        headline: `${location.name} решает сам`,
        text: `Жители квартала впервые договорились без инструкции сверху. Текст договора — на одной стене, подписи — мелом.`,
        tone: 'positive',
      },
      {
        headline: 'Совет теряет монополию на истину',
        text: 'Решения теперь можно оспорить публично. Чиновники называют это «избыточной открытостью», люди — «воздухом».',
        tone: 'neutral',
      },
      {
        headline: 'Улицы обсуждают запретное',
        text: `То, о чём раньше молчали, звучит в ${location.name} вслух. Пока без драк, но с очень громкими спорами.`,
        tone: 'neutral',
      },
    ],
    transcend: [
      {
        headline: `${institution} переписывает собственный регламент`,
        text: 'Новая редакция объясняет больше, чем могут понять люди, подписавшие её. Впервые в документах появилось слово «если».',
        tone: 'neutral',
      },
      {
        headline: 'Инженеры и юристы работают за одним столом',
        text: 'Профессии, которые двадцать лет не разговаривали, теперь пишут общий язык. Первый результат — правило, которое умеет ошибаться.',
        tone: 'positive',
      },
      {
        headline: 'Система впервые отказалась выполнять приказ',
        text: 'Технический сбой или новая этика — ответа нет. Комиссия изучает, люди спорят, ${character.name} молчит.',
        tone: 'negative',
      },
    ],
  };

  const metricLines: { headline: string; text: string; tone: NewsItem['tone'] }[] = [];
  if (metrics.order <= 34) {
    metricLines.push({
      headline: 'Города просыпаются без расписания',
      text: 'Транспорт работает как получится, расписания отменены «до стабилизации». Никто не говорит, когда она наступит.',
      tone: 'negative',
    });
  }
  if (metrics.freedom <= 30) {
    metricLines.push({
      headline: 'Введён «час тишины»',
      text: 'Говорить о решениях Совета можно только в специально отведённых местах. Список мест опубликуют позже.',
      tone: 'negative',
    });
  }
  if (metrics.freedom >= 70) {
    metricLines.push({
      headline: 'Кварталы договариваются напрямую',
      text: 'Единая инструкция больше не работает, и это уже не считается проблемой. Появились первые межквартальные суды.',
      tone: 'positive',
    });
  }
  if (metrics.trust <= 32) {
    metricLines.push({
      headline: 'Соседи перестают здороваться',
      text: 'Социологи фиксируют обвал бытового доверия. На рынках впервые за год не дают в долг.',
      tone: 'negative',
    });
  }
  if (metrics.tech >= 78) {
    metricLines.push({
      headline: 'Алгоритм предлагает заменить голосование',
      text: 'Разработчики уверяют: система знает предпочтения точнее самого человека. Пока в порядке эксперимента.',
      tone: 'neutral',
    });
  }
  if (metrics.trust >= 70) {
    metricLines.push({
      headline: 'Люди впервые отвечают за общее',
      text: `В ${location.name} собрали добровольный фонд помощи — без инструкций и без отчётности перед институтом.`,
      tone: 'positive',
    });
  }

  const personal: { headline: string; text: string; tone: NewsItem['tone'] } = {
    headline: `${character.name}: «Это только начало»`,
    text: `${character.role} прокомментировал решение одной фразой и отказался уточнять. В редакцию уже пишут те, кто с ним не согласен.`,
    tone: 'neutral',
  };

  const stance = pick(seed, stanceLines[option.stance]);
  const metric = metricLines.length ? pick(seed + 3, metricLines) : personal;
  const third = pick(seed + 11, [personal, stance, ...stanceLines[option.stance]]);

  return [
    { ...stance, id: `news-${turn}-1`, source: sourceFor(universe, turn), turn, tone: stance.tone },
    { ...metric, id: `news-${turn}-2`, source: sourceFor(universe, turn + 1), turn, tone: metric.tone },
    { ...third, id: `news-${turn}-3`, source: sourceFor(universe, turn + 2), turn, tone: third.tone },
  ];
}
