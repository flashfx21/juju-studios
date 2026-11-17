// ABOUTME: The words around Dial It In's TV screens: the round label in the header and the status in the bar along the bottom.
// ABOUTME: Everyone guesses on their phone and the host moves the game on from theirs, so the bar says what to do and where.
import { currentRound, guessersFor, type DialItInState } from './rules'

/** "Round 3 of 8" or "Game over". */
export function dialItInRoundLabel(state: DialItInState): string {
  return state.phase === 'over' ? 'Game over' : `Round ${state.roundIndex + 1} of ${state.rounds.length}`
}

/** Where the game is, and what to do on the phones. Counts who has guessed, never what. */
export function dialItInStatus(state: DialItInState): string {
  if (state.phase === 'over') return 'Game over'
  const round = currentRound(state)
  if (state.phase === 'guessing') {
    const guessers = guessersFor(state, round)
    const lockedIn = guessers.filter((guesser) => guesser in round.guesses).length
    return `Guess on your phone · ${lockedIn} of ${guessers.length} locked in`
  }
  const lastRound = state.roundIndex === state.rounds.length - 1
  return `Host: tap ${lastRound ? 'Final standings' : 'Next round'} on your phone`
}
