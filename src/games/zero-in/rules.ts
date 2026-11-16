// ABOUTME: Zero In rules: each round asks for a price, year or number; the closest guess wins, over or under,
// ABOUTME: and the final round is "don't go over". Pure logic, no screens: dealing, guesses and lock-ins, places, points, finishing order.

import questionPack from '../../../packs/zero-in/questions.json'
import { DEFAULT_PACE, PACES, type Pace } from '../../engine/pace'
import { freshFirst } from '../../engine/recentlyDealt'
import type { FinishingOrder, GameRules, PlayerId, RulesContext } from '../types'
import { manifest } from './manifest'

export type Lane = 'price' | 'year' | 'number'
export const LANES: readonly Lane[] = ['price', 'year', 'number']

export interface Question {
  id: string
  lane: Lane
  topic: string
  prompt: string
  /** Always one whole number. */
  answer: number
  /** What sits in the entry box: "$" before the number, "cents" or "feet" after it. Empty for years. */
  unit: string
  unitPosition: 'before' | 'after'
  asOf?: string
  source: string
  fact?: string
  local: boolean
}

export const QUESTIONS: readonly Question[] = questionPack.questions as Question[]

export type LaneChoice = 'mix' | Lane
export type RoundCount = 5 | 10 | 15

export const LANE_CHOICES: readonly LaneChoice[] = ['mix', ...LANES]
export const ROUND_COUNTS: readonly RoundCount[] = [5, 10, 15]
export { PACES, type Pace }

/** Seconds to guess at each pace. */
export const PACE_SECONDS: Record<Pace, number> = { quick: 20, normal: 30, relaxed: 45 }

export interface ZeroInSettings {
  pace: Pace
  rounds: RoundCount
  lanes: LaneChoice
}

export const DEFAULT_SETTINGS: ZeroInSettings = { pace: DEFAULT_PACE, rounds: 10, lanes: 'mix' }

/** Biggest guess a phone accepts: 9 digits. */
export const MAX_GUESS = 999_999_999
/** The final round never asks a question whose answer is under this, so "don't go over" has room to play. */
export const FINAL_MIN_ANSWER = 10
/** A topic shows up at most this often in one game (best effort). */
const TOPIC_LIMIT = 2

/** Points for 1st, 2nd and 3rd closest; everyone else scores 0. The final round doubles them. */
export const PLACE_POINTS = [3, 2, 1]
export const EXACT_BONUS = 2
export const FINAL_MULTIPLIER = 2

export interface RoundResult {
  /** The guess that counted (locked, or typed when time ran out); null for no guess. */
  guess: number | null
  /** How far from the answer; null for no guess. */
  distance: number | null
  /** 1 is closest; tied guesses share a place and skip the next. Null for no guess or a bust. */
  place: number | null
  points: number
  exact: boolean
  /** Final round only: the guess went over the answer. */
  bust: boolean
}

export interface Round {
  question: Question
  /** The last round of every game: closest without going over, double points. */
  final: boolean
  /** Each player's guess so far: typed (a draft) or locked. */
  guesses: Record<PlayerId, number>
  /** Players whose guess is final. */
  locked: PlayerId[]
  /** Filled in at the reveal. */
  results: Record<PlayerId, RoundResult> | null
}

/** guessing: phones take guesses. reveal: the answer, places, round points and totals, waiting for Next. over: done. */
export type Phase = 'guessing' | 'reveal' | 'over'

export interface ZeroInState {
  players: readonly PlayerId[]
  settings: ZeroInSettings
  rounds: Round[]
  roundIndex: number
  phase: Phase
}

/** A draft can still change; a lock is final and carries the guess with it. */
export type ZeroInInput = { type: 'draft'; value: number } | { type: 'lock'; value: number }

export function currentRound(state: ZeroInState): Round {
  return state.rounds[state.roundIndex]
}

export function isValidGuess(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_GUESS
}

/**
 * Picks questions in pack order (fresh first), keeping a topic from coming up twice in a row or more than twice a game.
 * When the pack can't meet that, the rules bend (first the per-game limit, then the in-a-row one) so the game never stalls.
 */
function pickRegular(pool: readonly Question[], count: number, before: Question[], after: Question | null): Question[] {
  const chosen: Question[] = []
  const left = [...pool]
  for (let step = 0; step < 3 && chosen.length < count; step++) {
    for (let i = 0; i < left.length && chosen.length < count; ) {
      const question = left[i]
      const sequence = [...before, ...chosen]
      const previous = sequence.at(-1)
      const isLast = chosen.length === count - 1
      const sameInARow = previous?.topic === question.topic || (isLast && after?.topic === question.topic)
      const tooMany = [...sequence, ...(after ? [after] : [])].filter((q) => q.topic === question.topic).length >= TOPIC_LIMIT
      const ok = step === 0 ? !sameInARow && !tooMany : step === 1 ? !sameInARow : true
      if (ok) {
        chosen.push(question)
        left.splice(i, 1)
      } else i++
    }
  }
  return chosen
}

/** The final question first (from Price Tag when the lanes are mixed), then the regular rounds before it. */
function dealQuestions(settings: ZeroInSettings, ctx: RulesContext): { questions: Question[]; hasFinal: boolean } {
  const recent = ctx.recent ?? []
  const inLanes = QUESTIONS.filter((q) => settings.lanes === 'mix' || q.lane === settings.lanes)
  const finalLane: Lane = settings.lanes === 'mix' ? 'price' : settings.lanes
  const finalPool = freshFirst(
    inLanes.filter((q) => q.lane === finalLane && q.answer >= FINAL_MIN_ANSWER),
    (q) => q.id,
    recent,
    ctx.random,
  )
  const final = finalPool[0] ?? null
  const regularPool = freshFirst(
    inLanes.filter((q) => q !== final),
    (q) => q.id,
    recent,
    ctx.random,
  )
  // A small pack or a single lane may hold fewer questions than rounds: play as many as there are.
  const regularCount = Math.min(settings.rounds - (final ? 1 : 0), regularPool.length)
  const regular = pickRegular(regularPool, regularCount, [], final)
  return { questions: final ? [...regular, final] : regular, hasFinal: final !== null }
}

/** Places by distance: equal distances share a place and the next place is skipped (12 and 16 both 1st, 8 is 3rd). */
function placesByDistance(distances: Record<PlayerId, number>): Record<PlayerId, number> {
  const places: Record<PlayerId, number> = {}
  const values = Object.values(distances)
  for (const [player, distance] of Object.entries(distances)) places[player] = 1 + values.filter((d) => d < distance).length
  return places
}

export function scoreRound(players: readonly PlayerId[], round: Round): Record<PlayerId, RoundResult> {
  const { answer } = round.question
  const multiplier = round.final ? FINAL_MULTIPLIER : 1
  const scored: Record<PlayerId, number> = {}
  for (const player of players) {
    const guess = round.guesses[player]
    if (guess === undefined) continue
    if (round.final && guess > answer) continue
    scored[player] = Math.abs(guess - answer)
  }
  const places = placesByDistance(scored)
  const results: Record<PlayerId, RoundResult> = {}
  for (const player of players) {
    const guess = round.guesses[player] ?? null
    const place = places[player] ?? null
    const exact = guess === answer
    const placePoints = place !== null && place <= PLACE_POINTS.length ? PLACE_POINTS[place - 1] : 0
    results[player] = {
      guess,
      distance: guess === null ? null : Math.abs(guess - answer),
      place,
      points: (placePoints + (exact ? EXACT_BONUS : 0)) * multiplier,
      exact,
      bust: round.final && guess !== null && guess > answer,
    }
  }
  return results
}

/** Players for a round's reveal: places first (closest first), then busts, then no guess. */
export function roundOrder(players: readonly PlayerId[], results: Record<PlayerId, RoundResult>): PlayerId[] {
  const rank = (r: RoundResult) => r.place ?? (r.bust ? 1000 : 2000)
  return [...players].sort((a, b) => rank(results[a]) - rank(results[b]) || (results[a].distance ?? 0) - (results[b].distance ?? 0))
}

export interface Totals {
  points: number
  /** Rounds with the closest guess, shared places included. */
  wins: number
  exacts: number
}

/** Running totals across every revealed round. */
export function totals(state: ZeroInState): Record<PlayerId, Totals> {
  const byPlayer: Record<PlayerId, Totals> = {}
  for (const player of state.players) byPlayer[player] = { points: 0, wins: 0, exacts: 0 }
  for (const round of state.rounds) {
    if (!round.results) continue
    for (const [player, result] of Object.entries(round.results)) {
      byPlayer[player].points += result.points
      if (result.place === 1) byPlayer[player].wins += 1
      if (result.exact) byPlayer[player].exacts += 1
    }
  }
  return byPlayer
}

function withCurrentRound(state: ZeroInState, change: Partial<Round>): ZeroInState {
  const rounds = state.rounds.map((round, i) => (i === state.roundIndex ? { ...round, ...change } : round))
  return { ...state, rounds }
}

function reveal(state: ZeroInState): ZeroInState {
  return { ...withCurrentRound(state, { results: scoreRound(state.players, currentRound(state)) }), phase: 'reveal' }
}

/** Is this the round before the final? Its reveal then warns that the final round is next. */
export function finalIsNext(state: ZeroInState): boolean {
  return state.rounds[state.roundIndex + 1]?.final === true
}

export const rules: GameRules<ZeroInState, ZeroInSettings, ZeroInInput> = {
  setup(players, settings, ctx) {
    if (players.length < manifest.players.min) {
      throw new Error(`Zero In needs at least ${manifest.players.min} players.`)
    }
    const { questions, hasFinal } = dealQuestions(settings, ctx)
    if (questions.length === 0) throw new Error('The question pack has no questions for these lanes.')
    const rounds = questions.map((question, i) => ({
      question,
      final: hasFinal && i === questions.length - 1,
      guesses: {},
      locked: [],
      results: null,
    }))
    return { players, settings, rounds, roundIndex: 0, phase: 'guessing' }
  },

  /** Drafts change until the player locks in; a lock is final. The round reveals once everyone has locked in. */
  onInput(state, player, input) {
    const round = currentRound(state)
    if (state.phase !== 'guessing' || !state.players.includes(player) || round.locked.includes(player)) return state
    if (!isValidGuess(input.value)) return state
    const guesses = { ...round.guesses, [player]: input.value }
    if (input.type === 'draft') return withCurrentRound(state, { guesses })
    if (input.type !== 'lock') return state
    const locked = [...round.locked, player]
    const next = withCurrentRound(state, { guesses, locked })
    return locked.length === state.players.length ? reveal(next) : next
  },

  /** guessing: time's up, typed guesses count. reveal: the host's Next starts the next question (or ends the game). */
  onTimer(state) {
    if (state.phase === 'guessing') return reveal(state)
    if (state.phase === 'reveal') {
      const nextIndex = state.roundIndex + 1
      if (nextIndex >= state.rounds.length) return { ...state, phase: 'over' }
      return { ...state, roundIndex: nextIndex, phase: 'guessing' }
    }
    return state
  },

  isOver(state) {
    return state.phase === 'over'
  },

  /** Most points, then most round wins, then most exact hits. Still tied: a shared place. */
  finishingOrder(state): FinishingOrder {
    const scores = totals(state)
    const key = (p: PlayerId) => [scores[p].points, scores[p].wins, scores[p].exacts]
    const sorted = [...state.players].sort((a, b) => {
      const [ka, kb] = [key(a), key(b)]
      return kb[0] - ka[0] || kb[1] - ka[1] || kb[2] - ka[2]
    })
    const order: FinishingOrder = []
    for (const player of sorted) {
      const last = order.at(-1)
      if (last && key(last[0]).every((value, i) => value === key(player)[i])) last.push(player)
      else order.push([player])
    }
    return order
  },
}
