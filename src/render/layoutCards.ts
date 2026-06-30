import { padRight, visibleLength } from '../utils/text.js';

export function layoutCards(cards: string[][], preferredColumns: number, terminalWidth: number): string {
  if (cards.length === 0) return '';

  const cardWidth = Math.max(...cards.flat().map(visibleLength));
  const gap = 4;
  const maxColumns = Math.max(1, Math.floor((terminalWidth + gap) / (cardWidth + gap)));
  const columns = Math.max(1, Math.min(preferredColumns, maxColumns));
  const output: string[] = [];

  for (let index = 0; index < cards.length; index += columns) {
    const rowCards = cards.slice(index, index + columns);
    const height = Math.max(...rowCards.map((card) => card.length));

    for (let lineIndex = 0; lineIndex < height; lineIndex++) {
      output.push(
        rowCards
          .map((card) => padRight(card[lineIndex] ?? '', cardWidth))
          .join(' '.repeat(gap))
          .trimEnd()
      );
    }

    output.push('');
  }

  return output.join('\n').trimEnd();
}
