// ABOUTME: The words around Sketch Showdown's TV screens: the round label in the header, the status in the bar along the
// ABOUTME: bottom, and the reveal's lines (who won the round, how fast, each team's wrong guesses trimmed to fit).
import type { TeamGuess, TvView } from './rules'
import { TEAM_LOOKS } from './teams'

/** "Round 3 of 5", "Sudden death" or "Game over". */
export function sketchRoundLabel(view: TvView): string {
  if (view.phase === 'over') return 'Game over'
  if (view.phase === 'vote' || view.suddenDeath) return 'Sudden death'
  return `Round ${view.roundNumber} of ${view.regularRounds}`
}

/** What the host's Next leads to from the reveal. */
function afterReveal(view: TvView): string {
  if (view.suddenDeath) return 'the result'
  if (view.roundNumber < view.regularRounds) return 'the next round'
  return view.wins[0] === view.wins[1] ? 'sudden death' : 'the result'
}

/** Where the game is, and what to do on the phones. */
export function sketchStatus(view: TvView): string {
  switch (view.phase) {
    case 'pick':
      return 'Drawers are choosing'
    case 'countdown':
      return 'Get ready'
    case 'race':
      return 'Draw and guess on your phone'
    case 'reveal':
      return `Host: tap Next on your phone for ${afterReveal(view)}`
    case 'vote':
      return 'Nominate a drawer on your phone'
    case 'over':
      return 'Game over'
  }
}

/** "Pencils got it!" or "Nobody got it", once the round is revealed. */
export function revealHeadline(view: TvView): string {
  const winner = view.reveal?.winner ?? null
  return winner === null ? 'Nobody got it' : `${TEAM_LOOKS[winner].name} got it!`
}

/** "Pencils win!" or "It's a tie". */
export function resultHeadline(wins: readonly [number, number]): string {
  return wins[0] === wins[1] ? "It's a tie" : `${TEAM_LOOKS[wins[0] > wins[1] ? 0 : 1].name} win!`
}

/** How long the winning guess took, as "12 s". Empty when nobody got it. */
export function winTimeText(view: TvView): string {
  const won = view.reveal?.winningGuess
  if (!won || view.startedAt === null) return ''
  return `${Math.max(0, Math.round((won.at - view.startedAt) / 1000))} s`
}

/** A team's wrong guesses for under its drawing: the last `limit`, then "and 12 more". */
export function wrongGuessText(guesses: readonly TeamGuess[], winning: TeamGuess | null, limit: number): string {
  const wrong = guesses.filter((guess) => !(winning && guess.at === winning.at && guess.player === winning.player && guess.text === winning.text))
  if (wrong.length === 0) return 'No wrong guesses'
  const shown = wrong.slice(-limit)
  const more = wrong.length - shown.length
  return `${shown.map((guess) => guess.text).join(', ')}${more > 0 ? ` and ${more} more` : ''}`
}
