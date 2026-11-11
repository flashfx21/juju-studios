// ABOUTME: Dial It In rules: each round a rotating clue giver sees a hidden target on a spectrum card,
// ABOUTME: everyone else guesses a number privately and scores by closeness. Pure logic, no screens.

import spectrumPack from '../../../packs/dial-it-in/spectrums.json'
import type { FinishingPlace, GameRules, Player, Random } from '../types'
import { manifest, type DialItInSettings, type DialRange } from './manifest'

/** A pair of opposites. The dial runs from left (1) to right (the top of the range). */
export interface SpectrumCard {
  id: string
  left: string
  right: string
}

export const SPECTRUM_CARDS: SpectrumCard[] = spectrumPack

export interface Round {
  clueGiverId: string
  card: SpectrumCard
  /** Secret until the reveal. Only the clue giver's phone may show it during guessing. */
  target: number
  /** Guesses by player id. A guess is final once submitted. */
  guesses: Record<string, number>
  /** Points by guesser id, filled in at the reveal. Guessers who never answered score 0. */
  points: Record<string, number>
}

/** guessing: guessers enter numbers. reveal: target and points on screen. over: every player has given a clue. */
export type Phase = 'guessing' | 'reveal' | 'over'

export interface DialItInState {
  players: Player[]
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
export function guessersFor(state: DialItInState, round: Round): Player[] {
  return state.players.filter((player) => player.id !== round.clueGiverId)
}

/** Each player's points across all revealed rounds, by player id. */
export function totalScores(state: DialItInState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const player of state.players) totals[player.id] = 0
  for (const round of state.rounds) {
    for (const [playerId, points] of Object.entries(round.points)) {
      totals[playerId] += points
    }
  }
  return totals
}

function shuffled<T>(items: T[], random: Random): T[] {
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
    const guess = round.guesses[guesser.id]
    points[guesser.id] = guess === undefined ? 0 : closenessPoints(guess, round.target, state.range)
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
  /** Players arrive in turn order; that order is the clue-giver rotation. */
  setup(players, settings, random = Math.random) {
    if (players.length < manifest.players.min) {
      throw new Error(`Dial It In needs at least ${manifest.players.min} players.`)
    }
    if (players.length > SPECTRUM_CARDS.length) {
      throw new Error(`The spectrum pack has only ${SPECTRUM_CARDS.length} cards for ${players.length} players.`)
    }
    const cards = shuffled(SPECTRUM_CARDS, random)
    const rounds = players.map((player, i) => ({
      clueGiverId: player.id,
      card: cards[i],
      target: 1 + Math.floor(random() * settings.range),
      guesses: {},
      points: {},
    }))
    return { players, range: settings.range, rounds, roundIndex: 0, phase: 'guessing' }
  },

  /** Ignores anything that isn't a fresh, in-range guess from a guesser during guessing. */
  onInput(state, playerId, input) {
    if (state.phase !== 'guessing' || input.type !== 'guess') return state
    const round = currentRound(state)
    const guessers = guessersFor(state, round)
    if (!guessers.some((player) => player.id === playerId)) return state
    if (playerId in round.guesses) return state
    if (!isValidGuess(input.value, state.range)) return state

    const guesses = { ...round.guesses, [playerId]: input.value }
    const rounds = state.rounds.map((r, i) => (i === state.roundIndex ? { ...r, guesses } : r))
    const updated = { ...state, rounds }
    const everyoneGuessed = guessers.every((player) => player.id in guesses)
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
    const byScore = new Map<number, string[]>()
    for (const player of state.players) {
      const score = totals[player.id]
      byScore.set(score, [...(byScore.get(score) ?? []), player.id])
    }
    const places: FinishingPlace[] = [...byScore.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, ids]) => ids)
    return places
  },
}
