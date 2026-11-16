// ABOUTME: The words around Zero In's TV screens: the round label in the header and the status in the bar along the bottom.
// ABOUTME: The host moves the game on from their phone, so the bar tells them when.
import { currentRound, finalIsNext, type ZeroInState } from './rules'

/** "Round 3 of 10", "Final round" or "Game over". */
export function zeroInRoundLabel(state: ZeroInState): string {
  if (state.phase === 'over') return 'Game over'
  return currentRound(state).final ? 'Final round' : `Round ${state.roundIndex + 1} of ${state.rounds.length}`
}

/** Where the game is, and that the host moves it on from their phone. */
export function zeroInStatus(state: ZeroInState): string {
  if (state.phase === 'over') return 'Game over'
  const round = currentRound(state)
  if (state.phase === 'guessing') return `${round.locked.length} of ${state.players.length} locked in`
  const next = round.final ? 'final standings' : finalIsNext(state) ? 'the final round' : 'the next question'
  return `Host: tap Next on your phone for ${next}`
}
