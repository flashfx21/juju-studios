// ABOUTME: Dial It In in a room: the public state every phone may read (secrets masked), each player's private view, and bots.
// ABOUTME: Unrevealed targets are hidden from everyone but that round's clue giver, and guesses stay private until the reveal.
import type { BotSkill } from '../room/bots'
import type { PlayerId } from '../types'
import { currentRound, type DialItInState, type DialRange } from './rules'

/** Stands in for a target nobody but the clue giver may see. Never a real target (targets start at 1). */
export const HIDDEN_TARGET = 0
/** Stands in for a guess that has been made but is still private. Never a real guess. */
export const HIDDEN_GUESS = -1

/** What one player alone may see during guessing: the target if they give the clue, and their own guess. */
export interface PrivateView {
  roundIndex: number
  target?: number
  guess?: number
}

function isSecret(state: DialItInState, index: number): boolean {
  if (state.phase === 'over') return false
  return index > state.roundIndex || (index === state.roundIndex && state.phase === 'guessing')
}

/** The state with every secret masked: rounds not yet revealed show no target and only who has guessed, not what. */
export function publicState(state: DialItInState): DialItInState {
  return {
    ...state,
    rounds: state.rounds.map((round, i) =>
      isSecret(state, i)
        ? {
            ...round,
            target: HIDDEN_TARGET,
            guesses: Object.fromEntries(Object.keys(round.guesses).map((player) => [player, HIDDEN_GUESS])),
          }
        : round,
    ),
  }
}

/** This player's secrets for the round being guessed. */
export function privateView(state: DialItInState, player: PlayerId): PrivateView {
  const round = currentRound(state)
  const view: PrivateView = { roundIndex: state.roundIndex }
  if (state.phase !== 'guessing') return view
  if (round.clueGiver === player) view.target = round.target
  if (player in round.guesses) view.guess = round.guesses[player]
  return view
}

/** What this phone shows: the public state with its own secrets put back in. */
export function stateForPhone(shared: DialItInState, mine: PrivateView | null, player: PlayerId): DialItInState {
  if (!mine || mine.roundIndex !== shared.roundIndex || shared.phase !== 'guessing') return shared
  return {
    ...shared,
    rounds: shared.rounds.map((round, i) => {
      if (i !== shared.roundIndex) return round
      const guesses = mine.guess === undefined ? round.guesses : { ...round.guesses, [player]: mine.guess }
      return { ...round, target: mine.target ?? round.target, guesses }
    }),
  }
}

/** How far off a bot usually is, as a share of the dial: a sharp bot reads the clue better than a casual one. */
const SPREAD: Record<BotSkill, number> = { sharp: 0.08, casual: 0.18 }

/**
 * A bot's guess. Bots can't hear the clue, so they play like someone who usually reads it right:
 * near the target, off by a random amount that's smaller for sharp bots.
 */
export function botDialGuess(target: number, range: DialRange, skill: BotSkill, random: () => number): number {
  // Two uniform draws make a bell-shaped miss: usually close, sometimes well off.
  const normal = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  const guess = Math.round(target + normal * SPREAD[skill] * range)
  return Math.min(range, Math.max(1, guess))
}
