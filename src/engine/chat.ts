import { detectTheme, GENESIS_TEMPLATE } from './themes';
import type { Character, Universe } from './types';

type Intent =
  | 'greeting'
  | 'identity'
  | 'world'
  | 'decision'
  | 'secret'
  | 'fear'
  | 'future'
  | 'bond'
  | 'help'
  | 'thanks'
  | 'open';

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();
  if (/^(привет|здравств|хай|добрый|добрый день|добрый вечер|ку)/.test(text)) return 'greeting';
  if (/кто ты|как тебя зовут|расскажи о себе|ты кто|тво[её] имя|чем занима/.test(text)) return 'identity';
  if (/секрет|тайн|скрываешь|врёш|врешь|недоговар/.test(text)) return 'secret';
  if (/боишься|страшно|страх|тревог/.test(text)) return 'fear';
  if (/решени|выбор|что делать|как быть|посоветуй|совет/.test(text)) return 'decision';
  if (/будущ|дальше|что будет|конец|умрём|умрем/.test(text)) return 'future';
  if (/доверя|друг|дружб|любл|любов|одинок|близк/.test(text)) return 'bond';
  if (/помог|помочь|подскаж|объясни/.test(text)) return 'help';
  if (/спасибо|благодар/.test(text)) return 'thanks';
  if (/мир|правил|закон|как вы жив|устройств|почему так|общество|город|жизнь здесь/.test(text)) return 'world';
  return 'open';
}

function lexiconOf(universe: Universe) {
  if (universe.theme === 'genesis') return GENESIS_TEMPLATE.lexicon;
  return detectTheme(universe.question).lexicon;
}

function lastFact(universe: Universe): string | null {
  const facts = universe.state.memory.filter((item) => item.kind === 'decision');
  return facts.length ? facts[facts.length - 1].text : null;
}

function lastLaw(universe: Universe): string {
  const laws = universe.state.laws;
  return laws[laws.length - 1]?.text ?? universe.rule;
}

function locationName(universe: Universe, character: Character): string {
  const home = universe.state.locations.find((item) => item.id === character.home);
  return home?.name ?? 'окраина';
}

export function greetingFor(universe: Universe, character: Character): string {
  const fact = lastFact(universe);
  if (fact) {
    return `Ты пришёл из другого мира — это видно сразу. После того как ${fact.charAt(0).toLowerCase()}${fact.slice(1)}, здесь мало кто говорит с «снаружи». Спрашивай, пока я не ушёл в ${locationName(universe, character)}.`;
  }
  return `Я ${character.role.toLowerCase()} и живу в ${locationName(universe, character)}. Здесь не принято спрашивать прямо, но ты, похоже, не отсюда. Спрашивай.`;
}

export type ChatReply = {
  text: string;
  bondDelta: number;
  revealedSecret: boolean;
};

export function replyToCharacter(
  universe: Universe,
  character: Character,
  message: string,
  messageCount: number,
): ChatReply {
  const intent = detectIntent(message);
  const lexicon = lexiconOf(universe);
  const metrics = universe.state.metrics;
  const fact = lastFact(universe);
  const law = lastLaw(universe);
  const place = locationName(universe, character);
  const canReveal = character.bond >= 46 || messageCount >= 3;
  const secretLine = character.secret;

  const aboutLast = fact ? ` С тех пор как ${fact.charAt(0).toLowerCase()}${fact.slice(1)}, я думаю об этом каждый день.` : '';

  let text: string;
  let revealed = false;

  switch (intent) {
    case 'greeting':
      text = `Здравствуй. Здесь не принято долго здороваться — ${lexicon.ritual} всё равно важнее слов. Ты пришёл из другого мира, я чувствую.${aboutLast}`;
      break;
    case 'identity':
      text = `Я ${character.name}, ${character.role.toLowerCase()}. ${character.bio} Мой дом — ${place}.${aboutLast}`;
      break;
    case 'world':
      text = `Наш мир держится на одном предложении: «${universe.rule}» Это не метафора и не лозунг — это физика. ${metrics.freedom < 35 ? 'Мы платим за неё свободой, и большинство не замечает счёта.' : 'Мы научились жить внутри неё, но так и не научились её любить.'}${aboutLast}`;
      break;
    case 'decision':
      text = `Ты спрашиваешь совета — значит, тебе решать. Я бы сказал так: ${lexicon.institution} предложит тебе порядок, ${character.stance === 'control' ? 'и это честный путь' : 'и это ловушка'}. Всё, что делается без согласия, здесь держится ровно одно поколение.`;
      break;
    case 'secret':
      if (canReveal) {
        revealed = true;
        text = `Хорошо. Только между нами.\n\n${secretLine}\n\nТеперь ты знаешь то, что я не говорю вслух. И если ты однажды решишь за нас обоих — вспомни это.`;
      } else {
        text = `Нет. Не так быстро. Сначала ответь, зачем тебе это — и я подумаю, можно ли тебе верить.`;
      }
      break;
    case 'fear':
      text = `«${character.fear}» — вот чего я не говорю вслух. ${
        character.bond >= 46
          ? 'Но тебе скажу: я боюсь, что это случится раньше, чем я успею что-то исправить.'
          : 'Пока не скажу. Слишком много чести для нашего первого разговора.'
      }`;
      break;
    case 'future':
      text = `Будущее здесь зависит не от законов. Оно зависит от того, кто первым решит, что закон можно менять. ${character.mood === 'broken' ? 'И я не уверен, что это будешь не я.' : 'Я надеюсь, что это будешь не только ты.'}`;
      break;
    case 'bond':
      text = character.bond >= 55
        ? `Мы знакомы недолго, но я уже говорю с тобой иначе, чем с соседями. В этом мире доверие — не чувство, а решение. Я его принял.`
        : `Доверие здесь измеряется не словами. Сделай что-нибудь — с этого и начнём.`;
      break;
    case 'help':
      text = `Хочешь понять наш мир — начни с ${place}. ${lexicon.taboo.charAt(0).toUpperCase()}${lexicon.taboo.slice(1)} здесь обсуждать не принято, и именно поэтому это самое важное, что ты можешь узнать.`;
      break;
    case 'thanks':
      text = `Не благодари. Просто помни, что я сказал, — и не решай за нас молча.`;
      break;
    default:
      text = `Ты спрашиваешь не про то, что здесь принято обсуждать — и поэтому интересно. В нашем мире ${lexicon.scarcity} — это не тема для разговора. Но с тобой можно. Что конкретно тебя задело?`;
      break;
  }

  if (intent !== 'secret' || !revealed) {
    if (messageCount === 0) text = `${text}\n\n${law}`;
  }

  return {
    text,
    bondDelta: intent === 'secret' || intent === 'fear' ? 6 : 3,
    revealedSecret: revealed,
  };
}

/** Дательный падеж для имени: «Написать Лиде», «Написать Оскару». */
export function dativeName(name: string): string {
  const first = name.split(' ')[0];
  if (!first) return name;
  const lower = first.toLowerCase();
  if (lower.endsWith('ия')) return `${first.slice(0, -1)}и`;
  if (lower.endsWith('а') || lower.endsWith('я')) return `${first.slice(0, -1)}е`;
  if (lower.endsWith('й')) return `${first.slice(0, -1)}ю`;
  if (/[аеёиоуыэюя]$/.test(lower)) return first;
  return `${first}у`;
}

export function suggestedQuestions(universe: Universe, character: Character): string[] {
  const lexicon = lexiconOf(universe);
  const pool = [
    `Почему у вас принято молчать о ${lexicon.taboo}?`,
    `Как ты живёшь в мире, где ${lexicon.scarcity} — это ценность?`,
    `Ты доверяешь ${lexicon.institution}?`,
    `Что случилось после решения Совета?`,
    `Чего ты боишься?`,
    `Расскажи о себе.`,
  ];
  const index = character.name.length % 2;
  return pool.slice(index, index + 3);
}
