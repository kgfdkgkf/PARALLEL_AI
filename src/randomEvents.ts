
export interface RandomEvent {
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral";
}

const events: RandomEvent[] = [
  {
    title: "Научный прорыв",
    description: "Учёные совершили открытие, способное изменить будущее.",
    type: "positive",
  },
  {
    title: "Экономический кризис",
    description: "Мировая экономика столкнулась с неожиданными трудностями.",
    type: "negative",
  },
  {
    title: "Неизвестный сигнал",
    description: "Астрономы обнаружили странный сигнал из глубин космоса.",
    type: "neutral",
  },
  {
    title: "Народные протесты",
    description: "Жители крупных городов вышли на улицы.",
    type: "negative",
  },
  {
    title: "Международное соглашение",
    description: "Государства договорились о совместном развитии.",
    type: "positive",
  },
];

export function getRandomEvent(): RandomEvent {
  const index = Math.floor(Math.random() * events.length);
  return events[index];
}
