// ABOUTME: The words around Dibs' TV screens: the round label in the header and the status in the bar along the bottom.
// ABOUTME: Everyone plays on their phone and the host moves the scores on from theirs, so the bar says what to do and where.
import { currentChallenge, currentRound, votersFor, type DibsState } from './rules'

/** "Round 3 of 7" or "Game over". */
export function dibsRoundLabel(state: DibsState): string {
  return state.phase === 'over' ? 'Game over' : `Round ${state.roundIndex + 1} of ${state.rounds.length}`
}

/** Where the game is, and what to do on the phones. */
export function dibsStatus(state: DibsState): string {
  const round = currentRound(state)
  switch (state.phase) {
    case 'category':
      return 'Letter coming'
    case 'race':
      return `Answer on your phone · ${round.claims.length + round.out.length} of ${state.players.length} in`
    case 'review':
      return `Challenge on your phone · ${round.done.length} of ${state.players.length} done`
    case 'vote': {
      const challenge = currentChallenge(state)!
      return `Vote on your phone · ${Object.keys(challenge.votes).length} of ${votersFor(state, challenge).length} votes in`
    }
    case 'verdict':
      return currentChallenge(state)?.outcome === 'not-valid' ? 'Not valid' : 'Valid: the answer stands'
    case 'scores':
      return `Host: tap Next on your phone for ${state.roundIndex + 1 >= state.rounds.length ? 'the final standings' : 'the next round'}`
    default:
      return 'Game over'
  }
}
