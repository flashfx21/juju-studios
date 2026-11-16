// ABOUTME: Dibs in a room: the public state every phone may read (the letter before it drops, answers during the race,
// ABOUTME: Taken bounces and votes before the verdict are all masked), and each player's private view (their own answer, note and vote).
import type { PlayerId } from '../types'
import { currentChallenge, currentRound, type DibsState, type Note, type Round, type Vote } from './rules'

/** What one player alone may see: their accepted answer and last bounce during the race, their vote during a vote. */
export interface PrivateView {
  roundIndex: number
  /** Which letter the note and answer belong to, so a Deal again drops them. */
  dealtAgain: number
  voteIndex: number
  answer?: string
  note?: Note
  vote?: Vote
}

function maskRound(round: Round): Round {
  return {
    ...round,
    category: { ...round.category, id: '', name: '' },
    letter: '',
  }
}

/**
 * The state with every secret masked: rounds not yet played show nothing; the letter stays hidden until it drops;
 * during the race answers show only who has answered; notes are private; votes show who has voted until the verdict.
 */
export function publicState(state: DibsState): DibsState {
  return {
    ...state,
    rounds: state.rounds.map((round, i) => {
      if (i > state.roundIndex && state.phase !== 'over') return maskRound(round)
      if (i < state.roundIndex || state.phase === 'over') return { ...round, notes: {} }
      const shown: Round = { ...round, notes: {} }
      if (state.phase === 'category') shown.letter = ''
      if (state.phase === 'race') {
        shown.claims = round.claims.map((claim) => ({
          ...claim,
          text: '',
          at: 0,
        }))
        shown.bounces = []
      }
      if (state.phase === 'vote') {
        shown.challenges = round.challenges.map((c, index) =>
          index === round.voteIndex
            ? {
                ...c,
                votes: Object.fromEntries(Object.keys(c.votes).map((id) => [id, 'hidden' as const])),
              }
            : c,
        )
      }
      return shown
    }),
  }
}

export function privateView(state: DibsState, player: PlayerId): PrivateView {
  const round = currentRound(state)
  const view: PrivateView = {
    roundIndex: state.roundIndex,
    dealtAgain: round.dealtAgain,
    voteIndex: round.voteIndex,
  }
  if (state.phase === 'race') {
    const claim = round.claims.find((c) => c.player === player)
    if (claim) view.answer = claim.text
    if (round.notes[player]) view.note = round.notes[player]
  }
  const vote = state.phase === 'vote' ? currentChallenge(state)?.votes[player] : undefined
  if (vote === 'valid' || vote === 'not-valid') view.vote = vote
  return view
}

/** What this phone shows: the public state with its own answer, note and vote put back in. */
export function stateForPhone(shared: DibsState, mine: PrivateView | null, player: PlayerId): DibsState {
  if (!mine || mine.roundIndex !== shared.roundIndex) return shared
  const round = currentRound(shared)
  if (shared.phase === 'race' && mine.dealtAgain === round.dealtAgain) {
    const claims = round.claims.map((claim) => (claim.player === player && mine.answer ? { ...claim, text: mine.answer } : claim))
    const notes = mine.note ? { [player]: mine.note } : {}
    return withRound(shared, { ...round, claims, notes })
  }
  if (shared.phase === 'vote' && mine.vote && mine.voteIndex === round.voteIndex) {
    const challenges = round.challenges.map((c, i) => (i === round.voteIndex ? { ...c, votes: { ...c.votes, [player]: mine.vote! } } : c))
    return withRound(shared, { ...round, challenges })
  }
  return shared
}

function withRound(state: DibsState, round: Round): DibsState {
  return {
    ...state,
    rounds: state.rounds.map((r, i) => (i === state.roundIndex ? round : r)),
  }
}
