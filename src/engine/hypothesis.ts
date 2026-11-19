export function hypothesisText(input: string): string {
  return input
    .normalize('NFC')
    .trim()
    .replace(/^(?:а\s+)?что\s*,?\s*если(?=\s|$|[,…!?])(?:\s+бы(?=\s|$|[,…!?]))?[,\s]*/iu, '')
    .replace(/^[\s…]+|[\s.!?…]+$/gu, '')
    .replace(/\s+/gu, ' ');
}

export function isPlayableHypothesis(input: string): boolean {
  const words = hypothesisText(input).match(/\p{L}{2,}/gu) ?? [];
  return words.join('').length >= 6 && new Set(words.map((word) => word.toLowerCase())).size >= 2;
}

const STOP_WORDS = new Set([
  'люди', 'человек', 'могли', 'можно', 'всегда', 'никогда', 'каждый', 'каждого', 'стала', 'стало',
  'стали', 'перестали', 'больше', 'вместо', 'который', 'мире', 'были', 'было', 'только',
]);

export function premiseAnchors(input: string): string[] {
  const words = hypothesisText(input).toLowerCase().replace(/ё/g, 'е').match(/\p{L}{3,}/gu) ?? [];
  return [...new Set(words.filter((word) => !STOP_WORDS.has(word)).map((word) => word.slice(0, 4)))];
}

export function anchorMatches(anchors: string[], text: string): number {
  const words = text.toLowerCase().replace(/ё/g, 'е').match(/\p{L}+/gu) ?? [];
  return anchors.filter((anchor) => words.some((word) => word.startsWith(anchor))).length;
}
