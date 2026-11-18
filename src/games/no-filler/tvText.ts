// ABOUTME: The words around No Filler's TV screens: the status in the bar along the bottom.
// ABOUTME: The speaker talks out loud and everyone else votes on their phone, so the bar says what to do and where.
import { VOTE_NAMES } from './format'
import { votersFor, type NoFillerState } from './rules'

/** Where the turn is, and what to do. */
export function noFillerStatus(state: NoFillerState): string {
  switch (state.phase) {
    case 'pick':
      return state.suddenDeath ? 'Sudden death · Hard cards only' : 'Speaker: pick on your phone'
    case 'speak':
      return 'Name 3 · No um, uh, er or like'
    case 'vote':
      return `Vote on your phone · ${Object.keys(state.turn.votes).length} of ${votersFor(state).length} votes in`
    case 'reveal':
      return state.turn.outcome ? VOTE_NAMES[state.turn.outcome] : ''
    default:
      return 'Game over'
  }
}
