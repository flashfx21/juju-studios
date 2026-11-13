// ABOUTME: Clues a bot gives in solo play: each spectrum card has a few clues placed on the 1 to 100 dial,
// ABOUTME: and the bot says the one that lands closest to its secret target.
import botCluePack from '../../../packs/dial-it-in/bot-clues.json'
import type { DialRange, SpectrumCard } from './rules'

/** A clue and where it lands on the 1 to 100 dial. */
interface PlacedClue {
  text: string
  at: number
}

const BOT_CLUES: Record<string, PlacedClue[]> = botCluePack

/** Where a 1 to 100 spot lands on this range's dial. */
function onRange(at: number, range: DialRange): number {
  return Math.round(1 + ((at - 1) * (range - 1)) / 99)
}

/** The card's clue closest to the target, or undefined if the card has no clues. */
export function botClue(card: SpectrumCard, target: number, range: DialRange): string | undefined {
  const clues = BOT_CLUES[card.id] ?? []
  let best: PlacedClue | undefined
  for (const clue of clues) {
    if (!best || Math.abs(onRange(clue.at, range) - target) < Math.abs(onRange(best.at, range) - target)) best = clue
  }
  return best?.text
}
