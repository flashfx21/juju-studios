// ABOUTME: Dial It In rules: each round a rotating clue giver sees a hidden target on a spectrum card,
// ABOUTME: everyone else guesses a number privately and scores by closeness. Pure logic, no screens.

import spectrumPack from '../../../packs/dial-it-in/spectrums.json'
import type { FinishingOrder, GameRules, PlayerId } from '../types'
import { manifest } from './manifest'

/** A pair of opposites. The dial runs from left (1) to right (the top of the range). */
export interface SpectrumCard {
  id: string
  left: string
  right: string
}

export const SPECTRUM_CARDS: SpectrumCard[] = spectrumPack

/** How wide the dial is: 1 to 50 is easier, 1 to 100 is the standard game. */
export type DialRange = 50 | 100

export const DIAL_RANGES: readonly DialRange[] = [50, 100]

export type TurnsEach = 1 | 2 | 3
export const TURNS_EACH: readonly TurnsEach[] = [1, 2, 3]

export interface DialItInSettings {
  range: DialRange
  /** Players who take turns giving the clue, in turn order. Leave out to have everyone give clues (bots can't). */
  clueGivers?: readonly PlayerId[]
  /** How many times the clue goes round each clue giver. Leave out for once each. */
  turnsEach?: TurnsEach
}

export const DEFAULT_SETTINGS: DialItInSettings = { range: 100 }

export interface Round {
  clueGiver: PlayerId
  card: SpectrumCard
  /** Secret until the reveal. Only the clue giver's phone may show it during guessing. */
  target: number
  /** Guesses by player id. A guess is final once submitted. */
  guesses: Record<string, number>
  /** Points by guesser id, filled in at the reveal. Guessers who never answered score 0. */
  points: Record<string, number>
}

/** guessing: guessers enter numbers. reveal: target and points on screen. over: every clue-giving turn is done. */
export type Phase = 'guessing' | 'reveal' | 'over'

export interface DialItInState {
  /** Turn order, which is also the clue-giver rotation. */
  players: readonly PlayerId[]
  range: DialRange
  /** One round per player, dealt at setup, in clue-giver order. */
  rounds: Round[]
  roundIndex: number
  phase: Phase
}

export type DialItInInput = { type: 'guess'; value: number }

export const BULLSEYE_POINTS = 10

/**
 * 10 for a bullseye, one point less per step away, never below 0.
 * A step is 2 numbers on the 1 to 100 dial and 1 number on the 1 to 50 dial,
 * so both ranges score within the closest fifth of the dial.
 */
export function closenessPoints(guess: number, target: number, range: DialRange): number {
  const step = range / 50
  const stepsAway = Math.floor(Math.abs(guess - target) / step)
  return Math.max(0, BULLSEYE_POINTS - stepsAway)
}

export function currentRound(state: DialItInState): Round {
  return state.rounds[state.roundIndex]
}

/** Everyone except this round's clue giver. */
export function guessersFor(state: DialItInState, round: Round): PlayerId[] {
  return state.players.filter((player) => player !== round.clueGiver)
}

/** Each player's points across all revealed rounds, by player id. */
export function totalScores(state: DialItInState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const player of state.players) totals[player] = 0
  for (const round of state.rounds) {
    for (const [playerId, points] of Object.entries(round.points)) {
      totals[playerId] += points
    }
  }
  return totals
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function isValidGuess(value: unknown, range: DialRange): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= range
}

function revealRound(state: DialItInState): DialItInState {
  const round = currentRound(state)
  const points: Record<string, number> = {}
  for (const guesser of guessersFor(state, round)) {
    const guess = round.guesses[guesser]
    points[guesser] = guess === undefined ? 0 : closenessPoints(guess, round.target, state.range)
  }
  const rounds = state.rounds.map((r, i) => (i === state.roundIndex ? { ...r, points } : r))
  return { ...state, rounds, phase: 'reveal' }
}

function startNextRound(state: DialItInState): DialItInState {
  const nextIndex = state.roundIndex + 1
  if (nextIndex >= state.rounds.length) return { ...state, phase: 'over' }
  return { ...state, roundIndex: nextIndex, phase: 'guessing' }
}

export const rules: GameRules<DialItInState, DialItInSettings, DialItInInput> = {
  /** Players arrive in turn order; that order (or the clue givers named in settings) is the clue-giver rotation. */
  setup(players, settings, ctx) {
    if (players.length < manifest.players.min) {
      throw new Error(`Dial It In needs at least ${manifest.players.min} players.`)
    }
    const givers = (settings.clueGivers ?? players).filter((player) => players.includes(player))
    if (givers.length === 0) throw new Error('Dial It In needs at least one clue giver.')
    const order = Array.from({ length: settings.turnsEach ?? 1 }, () => givers).flat()
    if (order.length > SPECTRUM_CARDS.length) {
      throw new Error(`The spectrum pack has only ${SPECTRUM_CARDS.length} cards for ${order.length} rounds.`)
    }
    const cards = shuffled(SPECTRUM_CARDS, ctx.random)
    const rounds = order.map((player, i) => ({
      clueGiver: player,
      card: cards[i],
      target: 1 + Math.floor(ctx.random() * settings.range),
      guesses: {},
      points: {},
    }))
    return { players, range: settings.range, rounds, roundIndex: 0, phase: 'guessing' }
  },

  /** Ignores anything that isn't a fresh, in-range guess from a guesser during guessing. */
  onInput(state, player, input) {
    if (state.phase !== 'guessing' || input.type !== 'guess') return state
    const round = currentRound(state)
    const guessers = guessersFor(state, round)
    if (!guessers.includes(player)) return state
    if (player in round.guesses) return state
    if (!isValidGuess(input.value, state.range)) return state

    const guesses = { ...round.guesses, [player]: input.value }
    const rounds = state.rounds.map((r, i) => (i === state.roundIndex ? { ...r, guesses } : r))
    const updated = { ...state, rounds }
    const everyoneGuessed = guessers.every((guesser) => guesser in guesses)
    return everyoneGuessed ? revealRound(updated) : updated
  },

  /** Guessing time up: reveal. Reveal time up: next clue giver, or the game ends. */
  onTimer(state) {
    if (state.phase === 'guessing') return revealRound(state)
    if (state.phase === 'reveal') return startNextRound(state)
    return state
  },

  isOver(state) {
    return state.phase === 'over'
  },

  finishingOrder(state) {
    const totals = totalScores(state)
    const byScore = new Map<number, PlayerId[]>()
    for (const player of state.players) {
      const score = totals[player]
      byScore.set(score, [...(byScore.get(score) ?? []), player])
    }
    const places: FinishingOrder = [...byScore.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, ids]) => ids)
    return places
  },
}
