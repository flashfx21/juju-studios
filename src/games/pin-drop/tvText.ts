// ABOUTME: The words around Pin Drop's TV screens: the round label in the header and the status in the bar along the bottom.
// ABOUTME: Everyone drops their pin on their phone and the host moves the game on from theirs, so the bar says what to do and where.
import { currentRound, type PinDropState } from './rules'

/** "Round 3 of 7" or "Game over". */
export function pinDropRoundLabel(state: PinDropState): string {
  return state.phase === 'over' ? 'Game over' : `Round ${state.roundIndex + 1} of ${state.rounds.length}`
}

/** Where the game is, and what to do on the phones. */
export function pinDropStatus(state: PinDropState): string {
  switch (state.phase) {
    case 'guessing':
      return `Drop your pin on your phone · ${currentRound(state).locked.length} of ${state.players.length} locked in`
    case 'reveal':
      return 'Host: tap Standings on your phone'
    case 'standings':
      return `Host: tap ${state.roundIndex + 1 >= state.rounds.length ? 'Final standings' : 'Next round'} on your phone`
    default:
      return 'Game over'
  }
}
