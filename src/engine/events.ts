import { clamp } from '../theme';
import { hashString } from './hash';
import { tickWorld } from './diary';
import { makeNews } from './news';
import { detectTheme, GENESIS_TEMPLATE, type Lexicon } from './themes';
import type {
  BranchNode,
  Character,
  Decision,
  Ending,
  Metrics,
  Option,
  Stance,
  Universe,
  WorldState,
} from './types';

export const TOTAL_DECISIONS = 6;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function lexiconOf(universe: Universe): Lexicon {
  if (universe.theme === 'genesis') return GENESIS_TEMPLATE.lexicon;
  return detectTheme(universe.question).lexicon;
}

function stanceName(stance: Stance): string {
  if (stance === 'control') return 'порядок';
  if (stance === 'liberty') return 'свободу';
  return 'трансформацию';
}

function byStance(characters: Character[], stance: Stance): Character {
  return characters.find((item) => item.stance === stance) ?? characters[0];
}

function lowerFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function metricLine(metrics: Metrics): string {
  if (metrics.order <= 28) return 'Улицы теряют управление: институты работают, но никто не слушает.';
  if (metrics.freedom <= 25) return 'В домах становится тише: люди перестают говорить о том, чего нельзя изменить.';
  if (metrics.trust <= 28) return 'Соседи перестают здороваться — доверие стало дефицитным ресурсом.';
  if (metrics.tech >= 82) return 'Технологии обгоняют язык: люди не успевают придумывать слова для нового.';
  if (metrics.order >= 76) return 'Порядок становится воздухом: его не замечают, пока не попробуют выйти.';
  if (metrics.freedom >= 72) return 'Свободы так много, что за неё больше некому отвечать.';
  return 'Мир держится на компромиссе — пока никто не считает, сколько он стоит.';
}

type Draft = Omit<Option, 'id'>;

function draft(option: Draft): Draft {
  return option;
}

function templateOne(l: Lexicon, state: WorldState, characters: Character[]): { title: string; context: string; question: string; options: Draft[] } {
  const rebel = byStance(characters, 'liberty');
  const keeper = byStance(characters, 'control');
  return {
    title: 'Первый разлом',
    context: `Прошло десять лет. ${l.institution} впервые фиксирует случай, который не предусмотрен ни одним законом: ${l.commodity} использовали не так, как предполагали авторы правила. Инцидент попадает в прессу. ${keeper.name} требует ясности, ${rebel.name} — чтобы исключение осталось исключением.`,
    question: 'Что сделать с первым исключением?',
    options: [
      draft({
        title: 'Закрепить исключение как норму',
        detail: 'Признать случай допустимым и описать его отдельным пунктом. Правило останется целым.',
        cost: 'Свобода: −8 · Порядок: +12',
        intent: 'Сохранить закон, встроив в него лазейку',
        stance: 'control',
        effects: { order: 12, freedom: -8, trust: -3, tech: 4 },
        headline: 'Исключение стало правилом',
        explanation: `Вместо того чтобы ломать закон, ${l.institution} вырезал в нём аккуратную дверь. Теперь у порядка есть официальный выход — и все знают, где он.`,
        ripple: [
          'Случай №1 входит в учебники как «дверь» — и как первое поражение правила.',
          'Те, кто нарушал раньше, требуют амнистии по новому пункту.',
        ],
        law: 'Исключение №1 закреплено как норма.',
        memory: 'Закреплено первое исключение из правила — «дверь».',
      }),
      draft({
        title: 'Оставить право людям',
        detail: 'Не описывать случай вовсе. Каждый решает сам, и государство не вмешивается.',
        cost: 'Свобода: +13 · Порядок: −8',
        intent: 'Дать людям право на собственную трактовку',
        stance: 'liberty',
        effects: { freedom: 13, order: -8, trust: 6, tech: 1 },
        headline: 'Право решать осталось у людей',
        explanation: `Никто не запретил и не разрешил. Через год таких случаев — сотни, и каждый живёт по своему устному договору. ${rebel.name} называет это взрослением. ${keeper.name} — распадом.`,
        ripple: [
          'В городах появляются кварталы, где правило толкуют по-своему.',
          `Юристы впервые в истории ${l.wound} не могут сказать, что законно.`,
        ],
        memory: 'Право толковать правило передано самим людям.',
      }),
      draft({
        title: 'Переписать само правило',
        detail: 'Не защищать закон, а собрать новый — с учётом того, что выяснилось.',
        cost: 'Технологии: +12 · Порядок: −6',
        intent: 'Сделать правило честнее его авторов',
        stance: 'transcend',
        effects: { tech: 12, trust: 3, order: -6, freedom: 2 },
        headline: 'Правило изменило себя',
        explanation: `Правило переписали впервые за шестьдесят лет. Оно стало сложнее и умнее — и теперь защищает себя само, без института. ${l.institution} впервые не знает, как это проверить.`,
        ripple: [
          'Новая редакция правила объясняет больше, чем могут понять обычные люди.',
          'Появляется профессия переводчика между законом и человеком.',
        ],
        law: 'Правило переписано с учётом первого исключения.',
        memory: 'Правило впервые переписали — и оно стало самоисполняемым.',
      }),
    ],
  };
}

function templateTwo(l: Lexicon, state: WorldState, characters: Character[]): { title: string; context: string; question: string; options: Draft[] } {
  const keeper = byStance(characters, 'control');
  const seer = byStance(characters, 'transcend');
  return {
    title: 'Институт',
    context: `${l.institution} предлагает кодифицировать новую реальность: единый реестр, лицензии и надзор. Черновик занимает девятьсот страниц. ${keeper.name} уверен, что без этого правило развалится. ${seer.name} считает, что реестр и есть настоящая власть.`,
    question: 'Кому доверить контроль над правилом?',
    options: [
      draft({
        title: 'Передать контроль институту',
        detail: 'Один орган, один реестр, одна процедура. Быстро и предсказуемо.',
        cost: 'Порядок: +14 · Свобода: −11',
        intent: 'Сделать правило управляемым',
        stance: 'control',
        effects: { order: 14, freedom: -11, trust: -4, tech: 3 },
        headline: 'Надзор стал профессией',
        explanation: `${l.institution} получает полномочия и бюджет. Правило впервые кто-то охраняет — и впервые кто-то решает, кому разрешено его трактовать.`,
        ripple: [
          'В стране появляется служба, о которой не написано в конституции.',
          `Люди начинают спрашивать разрешения там, где раньше просто жили.`,
        ],
        law: 'Контроль над правилом закреплён за институтом.',
        memory: 'Создан единый реестр и надзорный орган.',
      }),
      draft({
        title: 'Независимый совет',
        detail: 'Смешанный орган: юристы, жители, независимые инженеры. Медленнее, но не один.',
        cost: 'Доверие: +9 · Свобода: +11',
        intent: 'Разделить власть между теми, кого она касается',
        stance: 'liberty',
        effects: { order: -3, freedom: 11, trust: 9, tech: 2 },
        headline: 'Власть разделили',
        explanation: `Совет собирается раз в месяц и спорит вслух. Решения принимаются медленно, но их никто не воспринимает как приказ. ${seer.name} впервые довольна заседанием.`,
        ripple: [
          'Реестр заполняется добровольно — и заполнен на две трети.',
          'Институт теряет монополию на истину, но сохраняет штат.',
        ],
        memory: 'Создан независимый совет из жителей и специалистов.',
      }),
      draft({
        title: 'Реестр открыт каждому',
        detail: 'Не надзор, а витрина: любой может смотреть, как работает правило.',
        cost: 'Доверие: +12 · Технологии: +8',
        intent: 'Заменить контроль прозрачностью',
        stance: 'transcend',
        effects: { trust: 12, tech: 8, order: -4, freedom: 4 },
        headline: 'Контроль заменили видимостью',
        explanation: `Реестр выложили в открытый доступ. Институт потерял тайну, но приобрёл функцию: теперь он обслуживает, а не решает. ${l.scarcity} впервые видна как цифра на общей карте.`,
        ripple: [
          'Появляются гражданские приложения, читающие реестр лучше института.',
          'Чиновники впервые боятся не начальства, а публикации.',
        ],
        law: 'Реестр правила открыт для каждого.',
        memory: 'Реестр опубликован полностью и открыт для общества.',
      }),
    ],
  };
}

function templateThree(l: Lexicon, state: WorldState, characters: Character[]): { title: string; context: string; question: string; options: Draft[] } {
  const rebel = byStance(characters, 'liberty');
  return {
    title: 'Инакомыслие',
    context: `На окраинах растёт движение «За ${l.frontier}». Их тысячи, они не агрессивны и очень заметны: каждую пятницу они выходят к ${l.institution} и молча стоят. ${rebel.name} уже выступает на их собраниях.`,
    question: 'Что делать с теми, кто хочет отменить правило?',
    options: [
      draft({
        title: 'Запретить движение',
        detail: 'Признать собрания угрозой и ввести ответственность за призывы.',
        cost: 'Порядок: +11 · Доверие: −9',
        intent: 'Не дать протесту стать нормой',
        stance: 'control',
        effects: { order: 11, freedom: -13, trust: -9, tech: 1 },
        headline: 'Пятницы стали тише',
        explanation: `Собрания разогнаны по протоколу, лидеры оштрафованы. Движение не исчезло — оно переехало в подвалы, где его уже никто не может посчитать.`,
        ripple: [
          'Движение уходит в сеть и становится анонимным.',
          'Полиция впервые получает полномочия проверять «намерение» на улице.',
        ],
        law: 'Публичные призывы отменить правило запрещены.',
        memory: 'Движение «За новое правило» запрещено.',
      }),
      draft({
        title: 'Дать им трибуну',
        detail: 'Разрешить собрания и выделить эфирное время для их аргументов.',
        cost: 'Свобода: +12 · Порядок: −5',
        intent: 'Услышать тех, кому правило не подходит',
        stance: 'liberty',
        effects: { freedom: 12, trust: 8, order: -5, tech: 2 },
        headline: 'Протест стал разговором',
        explanation: `Движение получило трибуну — и потеряло ореол. Их аргументы впервые проверили публично: половина оказалась утопией, половина — точным попаданием. ${rebel.name} называет это честностью.`,
        ripple: [
          'Пятничные собрания превращаются в открытые дебаты.',
          'Власть впервые вынуждена отвечать на вопросы в прямом эфире.',
        ],
        law: 'Собрания и призывы отменить правило разрешены.',
        memory: 'Движение получило трибуну и право публичного спора.',
      }),
      draft({
        title: 'Включить их в Совет',
        detail: 'Пригласить лидеров движения в орган, который охраняет правило.',
        cost: 'Доверие: +11 · Порядок: +1',
        intent: 'Сделать противников частью системы',
        stance: 'transcend',
        effects: { trust: 11, freedom: 5, order: 1, tech: 3 },
        headline: 'Противники вошли в комнату решений',
        explanation: `Трое лидеров движения получают места в Совете. Теперь они обязаны предлагать не только «против», и это меняет их быстрее, чем любые запреты.`,
        ripple: [
          'Движение раскалывается: часть считает лидеров предателями.',
          'В Совете впервые звучит слово, которое раньше было запрещено.',
        ],
        law: 'Представители движения получили места в Совете.',
        memory: 'Движение вошло в Совет и стало частью власти.',
      }),
    ],
  };
}

function templateFour(l: Lexicon, state: WorldState, characters: Character[]): { title: string; context: string; question: string; options: Draft[] } {
  const keeper = byStance(characters, 'control');
  return {
    title: 'Цена',
    context: `Журналистка находит документы: всё это время ${l.scarcity} распределялась неравномерно. ${l.wound} был не случайностью, а решением шести человек. ${keeper.name} знал об этом и подписывал.`,
    question: 'Что делать с правдой о цене?',
    options: [
      draft({
        title: 'Закрыть публикацию',
        detail: 'Изъять материалы, объяснить это государственной необходимостью.',
        cost: 'Доверие: −14 · Порядок: +8',
        intent: 'Сохранить веру в институт',
        stance: 'control',
        effects: { order: 8, freedom: -10, trust: -14, tech: 0 },
        headline: 'Правда осталась внутри',
        explanation: `Материалы изъяты, журналистка уволена. Официально ничего не произошло — и именно поэтому история будет жить в каждой кухне страны.`,
        ripple: [
          'Документы всё равно утекают — по частям и с искажениями.',
          'Институт теряет остаток доверия, но сохраняет контроль.',
        ],
        law: 'Публикация материалов о распределении запрещена.',
        memory: 'Правда о неравенстве скрыта властью.',
      }),
      draft({
        title: 'Опубликовать всё',
        detail: 'Открыть документы полностью, включая имена и суммы.',
        cost: 'Доверие: +14 · Порядок: −11',
        intent: 'Отдать обществу право знать',
        stance: 'liberty',
        effects: { trust: 14, freedom: 9, order: -11, tech: 1 },
        headline: 'Страна узнала цену',
        explanation: `Публикация выходит в полдень. К вечеру в городах стихийные собрания, к утру — четыре отставки. Общество впервые видит механизм целиком, и это некрасиво.`,
        ripple: [
          'Доверие к институту падает, доверие между людьми растёт.',
          'Появляются независимые реестры, которые нельзя изъять.',
        ],
        memory: 'Правда о распределении опубликована полностью.',
      }),
      draft({
        title: 'Переложить цену на технологию',
        detail: 'Не наказывать людей, а передать распределение алгоритму без имён.',
        cost: 'Технологии: +13 · Доверие: +2',
        intent: 'Убрать человека из решения — и вину вместе с ним',
        stance: 'transcend',
        effects: { tech: 13, trust: 2, order: -2, freedom: 1 },
        headline: 'Решение стало ничьим',
        explanation: `Распределение поручено системе, у которой нет биографии. Неравенство исчезает, а вопрос «кто виноват» становится невозможным — и это ощущается как облегчение и как утрата.`,
        ripple: [
          'Никто больше не отвечает за несправедливость — она просто вычисляется.',
          'Люди начинают искать ошибку в алгоритме, как раньше искали виновного.',
        ],
        law: 'Распределение передано независимому алгоритму.',
        memory: 'Распределение отдано алгоритму без человеческого участия.',
      }),
    ],
  };
}

function templateFive(l: Lexicon, state: WorldState, characters: Character[]): { title: string; context: string; question: string; options: Draft[] } {
  const seer = byStance(characters, 'transcend');
  return {
    title: 'Снаружи',
    context: `Соседние страны узнали про ${l.commodity} и требуют переговоров. Одни хотят перенять правило целиком, другие — закрыть границу, пока заражение не распространилось. ${seer.name} уже готовит доклад о последствиях.`,
    question: 'Как вести себя с внешним миром?',
    options: [
      draft({
        title: 'Закрыть границы',
        detail: 'Оставить правило внутри страны и запретить вывоз любых его следов.',
        cost: 'Порядок: +10 · Технологии: −2',
        intent: 'Защитить мир от собственного открытия',
        stance: 'control',
        effects: { order: 10, freedom: -7, trust: -6, tech: -2 },
        headline: 'Страна стала заповедником',
        explanation: `Границы закрыты, обмен прекращён. Внутри правило крепнет без внешних возражений, снаружи о нём говорят как о национальной аномалии.`,
        ripple: [
          'Внутренние цены растут, внешние связи рвутся.',
          'Появляется поколение, которое не видело иностранца.',
        ],
        law: 'Вывоз и обсуждение правила за границей запрещены.',
        memory: 'Границы закрыты для защиты правила.',
      }),
      draft({
        title: 'Открыть обмен',
        detail: 'Разрешить приезжать, смотреть и спорить. Ничего не скрывать.',
        cost: 'Свобода: +9 · Технологии: +5',
        intent: 'Проверить правило чужими глазами',
        stance: 'liberty',
        effects: { freedom: 9, trust: 8, order: -6, tech: 5 },
        headline: 'Правило вышло наружу',
        explanation: `Иностранные наблюдатели приезжают и уезжают с вопросами. Правило впервые критикуют вслух — и впервые защищают не из страха, а из убеждения.`,
        ripple: [
          'Появляются смешанные семьи, живущие по двум правилам сразу.',
          'Часть граждан впервые видит свою страну со стороны.',
        ],
        memory: 'Страна открыла границы для наблюдателей и споров.',
      }),
      draft({
        title: 'Экспортировать правило',
        detail: 'Предложить соседям перенять модель и стать центром нового мира.',
        cost: 'Технологии: +9 · Доверие: −4',
        intent: 'Сделать исключение нормой для всех',
        stance: 'transcend',
        effects: { tech: 9, order: 3, freedom: -2, trust: -4 },
        headline: 'Правило стало экспортом',
        explanation: `Через два года три страны живут по тому же правилу. Влияние растёт, но вместе с ним растёт и цена ошибки: теперь она общая.`,
        ripple: [
          'Появляется международный орган, повторяющий ваш институт.',
          'Дома всё чаще спрашивают: а мы точно хотим быть образцом?',
        ],
        law: 'Правило действует и за пределами страны.',
        memory: 'Правило экспортировано в соседние страны.',
      }),
    ],
  };
}

function templateSix(l: Lexicon, state: WorldState, characters: Character[]): { title: string; context: string; question: string; options: Draft[] } {
  const keeper = byStance(characters, 'control');
  const seer = byStance(characters, 'transcend');
  return {
    title: 'Предел',
    context: `Совет собирается в последний раз. На столе три проекта будущего. ${keeper.name} предлагает зафиксировать достигнутое. ${seer.name} — отменить правило и посмотреть, что вырастет. За окном площадь, на которой молча стоят люди, пришедшие узнать решение.`,
    question: 'Каким будет этот мир дальше?',
    options: [
      draft({
        title: 'Зафиксировать порядок навсегда',
        detail: 'Записать правило в неизменяемую конституцию и закрыть вопрос.',
        cost: 'Порядок: +15 · Свобода: −14',
        intent: 'Остановить историю в точке равновесия',
        stance: 'control',
        effects: { order: 15, freedom: -14, trust: -3, tech: 2 },
        headline: 'История остановлена',
        explanation: `Правило вписано в камень. Следующие поколения будут жить в мире, который им не выбирали, — но будут жить спокойно.`,
        ripple: [
          'Совет перестаёт собираться: обсуждать больше нечего.',
          'Появляется подпольная профессия — толкователь неписаного.',
        ],
        law: 'Правило объявлено неизменным.',
        memory: 'Правило закреплено как неизменное.',
      }),
      draft({
        title: 'Раздать право каждому',
        detail: 'Отменить центральный надзор и передать правило общинам.',
        cost: 'Свобода: +15 · Порядок: −12',
        intent: 'Сделать так, чтобы правило принадлежало людям',
        stance: 'liberty',
        effects: { freedom: 15, order: -12, trust: 10, tech: 0 },
        headline: 'Правило стало общим',
        explanation: `Надзор распущен, и страна распадается на тысячи маленьких версий правила. Кто-то живёт почти как раньше, кто-то строит небывалое. Общего ответа нет — и впервые это не проблема.`,
        ripple: [
          'Соседние кварталы начинают договариваться напрямую.',
          'Единая статистика исчезает: никто больше не знает целого.',
        ],
        law: 'Право применять правило передано общинам.',
        memory: 'Центральный надзор упразднён, правило передано общинам.',
      }),
      draft({
        title: 'Отменить правило',
        detail: 'Снять ограничение целиком и посмотреть, что станет с миром.',
        cost: 'Свобода: +8 · Технологии: +6',
        intent: 'Вернуть человечеству возможность выбора',
        stance: 'transcend',
        effects: { tech: 6, trust: 6, freedom: 8, order: -8 },
        headline: 'Ограничение снято',
        explanation: `Правило отменяют в прямом эфире. Ничего не взрывается. Просто на следующее утро мир оказывается чуть другим — и впервые за шестьдесят лет никто не знает, каким он будет.`,
        ripple: [
          'Появляются люди, которые помнят мир до правила, и они рассказывают.',
          'Институты теряют смысл существования, но не штат.',
        ],
        law: 'Правило отменено.',
        memory: 'Правило отменено — мир снова открыт.',
      }),
    ],
  };
}

const TEMPLATES = [templateOne, templateTwo, templateThree, templateFour, templateFive, templateSix];

export function buildDecision(universe: Universe): Decision {
  const index = Math.min(universe.state.turn, TOTAL_DECISIONS - 1);
  const lexicon = lexiconOf(universe);
  const source = TEMPLATES[index](lexicon, universe.state, universe.state.characters);
  const decisionId = `${universe.id}-d${index + 1}`;
  return {
    id: decisionId,
    index: index + 1,
    total: TOTAL_DECISIONS,
    kicker: `ТОЧКА ВЫБОРА ${String(index + 1).padStart(2, '0')} / ${String(TOTAL_DECISIONS).padStart(2, '0')}`,
    title: source.title,
    context: source.context,
    question: source.question,
    options: source.options.map((option, optionIndex) => ({
      ...option,
      id: `${decisionId}-o${optionIndex + 1}`,
    })),
  };
}

export function computeEnding(state: WorldState, universe: Universe): Ending {
  const lexicon = lexiconOf(universe);
  const { order, freedom, trust, tech } = state.metrics;
  const seer = byStance(state.characters, 'transcend');
  const keeper = byStance(state.characters, 'control');
  const rebel = byStance(state.characters, 'liberty');
  const place = state.locations.find((item) => item.unlocked)?.name ?? 'Точка Сдвига';

  if (order <= 30 || trust <= 22) {
    return {
      id: 'collapse',
      kind: 'collapse',
      title: 'ТИХИЙ РАСПАД',
      epigraph: 'Ничего не рухнуло. Просто больше никто не отвечает за целое.',
      body: [
        `К ${universe.era + 20} году ${lexicon.institution} существует лишь на бумаге. ${place} работает, но не подчиняется. Люди живут по частным договорённостям, которые не записаны нигде.`,
        `Свободы достаточно, чтобы каждый жил как хочет, и недостаточно, чтобы кто-то мог защитить общее. ${rebel.name} называет это взрослением. ${keeper.name} — концом.`,
        `Историки назовут это не катастрофой, а расслоением: мир не погиб, он просто перестал быть одним миром.`,
      ],
      accent: 'rose',
    };
  }

  if (order >= 74 && freedom <= 44) {
    return {
      id: 'order',
      kind: 'order',
      title: 'ХРУСТАЛЬНЫЙ ПОРЯДОК',
      epigraph: 'Ничего не случилось. Это и есть победа.',
      body: [
        `${lexicon.institution} довёл правило до абсолютной чистоты. ${lexicon.scarcity} больше не обсуждают: её распределяют. Улицы ${place} стали безопасными и очень тихими.`,
        `${keeper.name} говорит, что дети разучились спрашивать «а что, если» — и считает это ценой. ${seer.name} считает это платой за то, что никто больше не боится утра.`,
        `Мир стал предсказуемым. В нём хорошо жить и почти нечего вспоминать.`,
      ],
      accent: 'gold',
    };
  }

  if (tech >= 80) {
    return {
      id: 'machine',
      kind: 'machine',
      title: 'АВТОМАТИЧЕСКИЙ РАЙ',
      epigraph: 'Всё решено. Решать больше не нужно.',
      body: [
        `К ${universe.era + 20} году ${lexicon.commodity} окончательно передан системам. Люди просыпаются в мире, который уже всё учёл, — и не могут вспомнить, когда в последний раз что-то выбирали.`,
        `${seer.name} называет это освобождением от решений. ${rebel.name} — освобождением от людей. Оба правы, и это худшая часть.`,
        `В ${place} ставят памятник не человеку, а протоколу. Никто не возражает: возражение тоже оптимизировано.`,
      ],
      accent: 'cyan',
    };
  }

  if (freedom >= 68) {
    return {
      id: 'freedom',
      kind: 'freedom',
      title: 'ДИКИЙ РАССВЕТ',
      epigraph: 'Мир стал опаснее и честнее.',
      body: [
        `Надзор распался на тысячи договорённостей. В одних кварталах ${lexicon.commodity} чтят, в других — отрицают, и между ними нет ни вражды, ни общего языка.`,
        `${rebel.name} говорит, что впервые люди живут по собственному выбору. ${keeper.name} отвечает, что выбор без последствий — не выбор, а каприз.`,
        `В ${place} до сих пор собираются те, кто помнит правило целиком. Их слушают, но не слушаются: слишком у каждого своя реальность.`,
      ],
      accent: 'green',
    };
  }

  return {
    id: 'balance',
    kind: 'balance',
    title: 'ТРЕТИЙ ВАРИАНТ',
    epigraph: 'Ни утопия, ни катастрофа. Просто мир, который выдержал.',
    body: [
      `К ${universe.era + 20} году ${lexicon.commodity} стал обыденностью, как электричество: о нём вспоминают, когда ломается. ${lexicon.institution} работает, но уже не определяет жизнь.`,
      `${seer.name} добилась своего: правило осталось, но перестало быть приговором. ${keeper.name} тоже доволен — порядок не рухнул.`,
      `В ${place} на стене выбито одно предложение: «Мир не стал лучше. Он стал другим — и мы научились в нём жить».`,
    ],
    accent: 'violet',
  };
}

export function applyOption(
  universe: Universe,
  optionId: string,
  allyId?: string,
): { universe: Universe; node: BranchNode; before: Metrics; option: Option; ending: Ending | null; allyName?: string } {
  const decision = universe.state.pending;
  if (!decision) throw new Error('No pending decision');
  const option = decision.options.find((item) => item.id === optionId);
  if (!option) throw new Error('Unknown option');

  const before = { ...universe.state.metrics };
  const snapshot = clone(universe.state);
  let next = clone(universe.state);
  const turn = universe.state.turn;

  (Object.keys(option.effects) as (keyof Metrics)[]).forEach((key) => {
    const delta = option.effects[key] ?? 0;
    next.metrics[key] = clamp(next.metrics[key] + delta);
  });

  if (option.law) {
    next.laws.push({
      id: `law-consequence-${turn + 1}-${next.laws.length}`,
      text: option.law,
      origin: 'consequence',
      turn: turn + 1,
    });
    next.memory.push({ id: `fact-law-${turn}-${next.memory.length}`, turn: turn + 1, text: option.law, kind: 'law' });
  }

  next.characters = next.characters.map((character) => {
    const matches = character.stance === option.stance;
    const bond = clamp(character.bond + (matches ? 13 : -9));
    const mood = matches ? 'hopeful' : bond < 30 ? 'broken' : 'tense';
    return {
      ...character,
      bond,
      mood,
      status: statusOf(bond, matches),
      knows: [...character.knows, option.memory].slice(-4),
    };
  });

  const year = universe.era + (turn + 1) * 4;
  next.chronicle.push({
    id: `chr-decision-${turn + 1}-${next.chronicle.length}`,
    year,
    label: decision.kicker,
    title: decision.title,
    text: `${option.title}. ${option.explanation}`,
    kind: 'decision',
    accent: universe.accent,
    turn: turn + 1,
  });

  const ripples = [...option.ripple, metricLine(next.metrics)];
  next.chronicle.push({
    id: `chr-consequence-${turn + 1}-${next.chronicle.length}`,
    year,
    label: 'ПОСЛЕДСТВИЕ',
    title: option.headline,
    text: ripples.join(' '),
    kind: 'consequence',
    accent: next.characters.find((item) => item.stance === option.stance)?.accent ?? universe.accent,
    turn: turn + 1,
  });

  next.memory.push({ id: `fact-decision-${turn}-${next.memory.length}`, turn: turn + 1, text: option.memory, kind: 'decision' });
  next.memory.push({ id: `fact-ripple-${turn}-${next.memory.length}`, turn: turn + 1, text: ripples[0], kind: 'event' });

  next.locations = next.locations.map((location, index) => {
    if (location.unlocked) return location;
    return index <= turn + 3 ? { ...location, unlocked: true } : location;
  });

  next.turn = turn + 1;
  next.pending = null;

  const node: BranchNode = {
    id: `node-${turn + 1}-${hashString(`${universe.id}:${turn}:${option.id}`).toString(36)}`,
    turn: turn + 1,
    decisionId: decision.id,
    decisionTitle: decision.title,
    question: decision.question,
    optionId: option.id,
    optionTitle: option.title,
    headline: option.headline,
    accent: universe.accent,
    createdAt: new Date().toISOString(),
    snapshot,
  };

  const nextUniverse: Universe = {
    ...universe,
    state: next,
    path: [...universe.path, node],
    updatedAt: new Date().toISOString(),
  };

  let allyName: string | undefined;
  const ally = universe.state.characters.find((item) => item.id === allyId && item.bond >= 50);
  if (ally) {
    allyName = ally.name;
    const allyMetric = ally.stance === 'control' ? 'order' : ally.stance === 'liberty' ? 'freedom' : 'tech';
    next.metrics[allyMetric] = clamp(next.metrics[allyMetric] + 4);
    next.metrics.trust = clamp(next.metrics.trust + 2);
    next.characters = next.characters.map((item) =>
      item.id === ally.id
        ? { ...item, bond: clamp(item.bond - 6), status: statusOf(clamp(item.bond - 6), item.stance === option.stance) }
        : item,
    );
    next.memory.push({
      id: `fact-ally-${turn}-${next.memory.length}`,
      turn: turn + 1,
      text: `${ally.name} открыто поддержал решение — и потратил на это своё влияние.`,
      kind: 'decision',
    });
  }

  next = tickWorld(nextUniverse).state;
  nextUniverse.state = next;
  next.news = [...makeNews(nextUniverse, option, next.turn, next.metrics), ...next.news].slice(0, 12);

  let ending: Ending | null = null;
  if (next.turn >= TOTAL_DECISIONS) {
    ending = computeEnding(next, nextUniverse);
    next.ending = ending;
    next.chronicle.push({
      id: 'chr-ending',
      year: universe.era + 24,
      label: 'ФИНАЛ',
      title: ending.title,
      text: ending.epigraph,
      kind: 'ending',
      accent: ending.accent,
      turn: next.turn,
    });
  } else {
    nextUniverse.state.pending = buildDecision(nextUniverse);
  }

  return { universe: nextUniverse, node, before, option, ending, allyName };
}

function statusOf(bond: number, matches: boolean): string {
  if (bond >= 80) return 'Ваш союзник';
  if (bond >= 60) return 'Доверяет';
  if (bond >= 40) return matches ? 'Согласен с вами' : 'Сомневается';
  if (bond >= 25) return 'Насторожен';
  return 'Против вас';
}

export function rewindUniverse(universe: Universe, nodeId: string): Universe {
  const index = universe.path.findIndex((node) => node.id === nodeId);
  if (index < 0) return universe;
  const node = universe.path[index];
  const restored = clone(node.snapshot);
  return {
    ...universe,
    state: restored,
    path: universe.path.slice(0, index),
    updatedAt: new Date().toISOString(),
  };
}

export function stanceTitle(stance: Stance): string {
  if (stance === 'control') return 'Контроль';
  if (stance === 'liberty') return 'Свобода';
  return 'Трансформация';
}

export { lowerFirst, stanceName };
