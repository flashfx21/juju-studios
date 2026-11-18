// ABOUTME: No Filler in a room: the public state every phone and the TV may read (no cards still in the piles, and during
// ABOUTME: the vote only who has voted, never how), and each player's private view (their own vote).
import type { PlayerId } from '../types'
import type { NoFillerState, Vote } from './rules'

/** What one player alone may see: their own vote while the vote is open. */
export interface PrivateView {
  /** Which turn the vote belongs to, so a vote never carries over to the next turn. */
  turnCount: number
  vote?: Vote
}

/**
 * The state with every secret masked: the piles are empty, so nobody can read which card each difficulty deals next;
 * votes show who has voted until the verdict. The card being played is public from the moment it appears.
 */
export function publicState(state: NoFillerState): NoFillerState {
  const shown: NoFillerState = { ...state, piles: { easy: [], medium: [], hard: [] } }
  if (state.phase === 'vote') {
    const votes = Object.fromEntries(Object.keys(state.turn.votes).map((id) => [id, 'hidden' as const]))
    shown.turn = { ...state.turn, votes }
  }
  return shown
}

export function privateView(state: NoFillerState, player: PlayerId): PrivateView {
  const view: PrivateView = { turnCount: state.turnCount }
  const vote = state.phase === 'vote' ? state.turn.votes[player] : undefined
  if (vote === 'clean' || vote === 'filler') view.vote = vote
  return view
}

/** What this phone shows: the public state with its own vote put back in. */
export function stateForPhone(shared: NoFillerState, mine: PrivateView | null, player: PlayerId): NoFillerState {
  if (!mine || !mine.vote || mine.turnCount !== shared.turnCount || shared.phase !== 'vote') return shared
  return { ...shared, turn: { ...shared.turn, votes: { ...shared.turn.votes, [player]: mine.vote } } }
}
