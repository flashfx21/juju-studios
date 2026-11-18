// ABOUTME: No Filler words for screens: difficulty names, points, where the game stands, when the speaker stopped,
// ABOUTME: who voted what and why a verdict went the speaker's way. Kept apart from the screens so phones and the TV say the same.
import type { PlayerId } from '../types'
import { isFinalRound, rules, votersFor, type Difficulty, type NoFillerState, type Turn, type Vote } from './rules'

export const DIFFICULTY_NAMES: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export const VOTE_NAMES: Record<Vote, string> = { clean: 'Clean', filler: 'Filler' }

const PLACES = ['1st', '2nd', '3rd']

export function placeText(n: number): string {
  return PLACES[n - 1] ?? `${n}th`
}

export function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

/** How long a prompt is, so a card can set long ones smaller and still fit. */
export function promptLength(prompt: string): 'short' | 'medium' | 'long' {
  if (prompt.length <= 28) return 'short'
  return prompt.length <= 40 ? 'medium' : 'long'
}

/** Where the game stands: "First to 15", "Final round", "Sudden death" or "Game over". */
export function stageLabel(state: NoFillerState): string {
  if (state.phase === 'over') return 'Game over'
  if (state.suddenDeath) return 'Sudden death'
  return isFinalRound(state) ? 'Final round' : `First to ${state.settings.target}`
}

/** When the speaker stopped the clock, as "Stopped at 6.4 s", or that it ran out. */
export function stoppedText(turn: Turn): string {
  return turn.stoppedAt === null ? 'Time ran out' : `Stopped at ${(turn.stoppedAt / 1000).toFixed(1)} s`
}

/** Voters who voted this way; `null` gives the voters who didn't vote. */
export function votersBy(state: NoFillerState, vote: Vote | null): PlayerId[] {
  return votersFor(state).filter((id) => (vote === null ? !(id in state.turn.votes) : state.turn.votes[id] === vote))
}

/** Why a verdict went to the speaker without a majority, or null when the vote decided it. */
export function verdictNote(state: NoFillerState): string | null {
  const clean = votersBy(state, 'clean').length
  const filler = votersBy(state, 'filler').length
  if (clean + filler === 0) return 'Nobody voted, so it goes to the speaker.'
  return clean === filler ? 'A tie goes to the speaker.' : null
}

/** What the verdict did for the speaker: "+2 for Ana" or "No points for Ana". */
export function resultText(state: NoFillerState, names: Record<PlayerId, string>): string {
  const { turn } = state
  const name = names[turn.speaker]
  if (turn.outcome !== 'clean') return `No points for ${name}`
  return state.suddenDeath ? `${name} went Clean in sudden death` : `+${turn.points} for ${name}`
}

/** How sudden death settled first place, for the final standings; null when there was none. */
export function suddenDeathText(state: NoFillerState, names: Record<PlayerId, string>): string | null {
  if (!state.suddenDeath) return null
  const first = rules.finishingOrder(state)[0]
  const tiedOn = state.scores[first[0]]
  if (first.length === 1) return `Tied on ${tiedOn}. ${names[first[0]]} wins the sudden death.`
  return `Tied on ${tiedOn}, and still tied after sudden death: ${nameList(first, names)} share first.`
}

/** A list of names as "Ana, Bo and Cy". */
export function nameList(ids: readonly PlayerId[], names: Record<PlayerId, string>): string {
  const list = ids.map((id) => names[id])
  return list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`
}
