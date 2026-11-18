// ABOUTME: No Filler rules: on your turn pick Easy, Medium or Hard blind, name 3 things before the clock runs out, and everyone else votes Clean or Filler.
// ABOUTME: Pure logic, no screens: turn order, dealing, the vote, points, the round playing out at the target, sudden death, the host's Void and Skip, finishing order.

import cardPack from '../../../packs/no-filler/cards.json'
import { freshFirst } from '../../engine/recentlyDealt'
import type { FinishingOrder, GameRules, PlayerId, RulesContext } from '../types'
import { manifest } from './manifest'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard']

/** What a Clean turn scores on a card of each difficulty. */
export const POINTS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }

export interface Card {
  id: string
  difficulty: Difficulty
  prompt: string
  category: string
}

export const CARDS: readonly Card[] = cardPack.cards as Card[]

export type TimerSeconds = 5 | 10 | 15
export type TargetScore = 10 | 15

export const TIMER_SECONDS: readonly TimerSeconds[] = [5, 10, 15]
export const TARGET_SCORES: readonly TargetScore[] = [10, 15]

/** Seconds the vote stays open, and seconds the result shows before the next speaker picks. */
export const VOTE_SECONDS = 8
export const REVEAL_SECONDS = 5

export interface NoFillerSettings {
  /** Seconds to name 3. */
  timer: TimerSeconds
  target: TargetScore
}

export const DEFAULT_SETTINGS: NoFillerSettings = { timer: 10, target: 15 }

export type Vote = 'clean' | 'filler'
/** A vote that has been cast but isn't shown yet. */
export type VoteMark = Vote | 'hidden'

/** What the host did just before this pick: voided this speaker's last try, or skipped the speaker before. */
export type HostCall = { kind: 'voided' } | { kind: 'skipped'; player: PlayerId }

export interface Turn {
  speaker: PlayerId
  /** Null until the speaker has picked a difficulty. */
  card: Card | null
  /** When the card appeared (the host's clock); null before. */
  startedAt: number | null
  /** Milliseconds after the card appeared that the speaker tapped Done. Null while speaking, or when the clock ran out. */
  stoppedAt: number | null
  votes: Record<PlayerId, VoteMark>
  outcome: Vote | null
  /** Points this turn scored; 0 until a Clean verdict. */
  points: number
  hostCall: HostCall | null
}

/**
 * pick: the speaker chooses a difficulty. speak: the card is up and the clock runs. vote: everyone else votes.
 * reveal: the verdict and who voted what. over: done.
 */
export type Phase = 'pick' | 'speak' | 'vote' | 'reveal' | 'over'

export interface NoFillerState {
  players: readonly PlayerId[]
  /** The only player whose Void turn and Skip turn count. */
  host: PlayerId
  settings: NoFillerSettings
  /** Turn order, shuffled once at setup. */
  order: PlayerId[]
  /** Who speaks this round, in order: everyone, or only the tied players in sudden death. */
  speakers: PlayerId[]
  /** The current speaker's position in `speakers`. */
  turnIndex: number
  roundIndex: number
  /** Turns begun so far, counting a pick again after a void: tells one turn's votes and clocks from the next. */
  turnCount: number
  suddenDeath: boolean
  phase: Phase
  turn: Turn
  scores: Record<PlayerId, number>
  /** Points scored in sudden death. They only break the tie for first; scores stay as they were. */
  tiebreak: Record<PlayerId, number>
  /** Card ids still to deal, per difficulty, next card first. */
  piles: Record<Difficulty, string[]>
}

export type NoFillerInput =
  | { type: 'pick'; difficulty: Difficulty }
  | { type: 'done' }
  | { type: 'vote'; vote: Vote }
  | { type: 'void' }
  | { type: 'skip' }

const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]))

/** Everyone who votes on the current turn: all players but the speaker. */
export function votersFor(state: NoFillerState): PlayerId[] {
  return state.players.filter((id) => id !== state.turn.speaker)
}

/** Most votes wins; a tie, or no votes, goes to the speaker. */
export function outcomeOf(votes: Record<PlayerId, VoteMark>): Vote {
  const cast = Object.values(votes)
  const filler = cast.filter((vote) => vote === 'filler').length
  const clean = cast.filter((vote) => vote === 'clean').length
  return filler > clean ? 'filler' : 'clean'
}

/** Someone has reached the target, so the game ends when this round does (or goes to sudden death). */
export function isFinalRound(state: NoFillerState): boolean {
  return state.phase !== 'over' && !state.suddenDeath && Object.values(state.scores).some((score) => score >= state.settings.target)
}

/** The difficulties the speaker may pick: all three, or only Hard in sudden death. */
export function pickChoices(state: NoFillerState): readonly Difficulty[] {
  return state.suddenDeath ? ['hard'] : DIFFICULTIES
}

/** The host may void a turn once its card is up, until the next speaker picks. */
export function canVoid(state: NoFillerState): boolean {
  return state.phase === 'speak' || state.phase === 'vote' || state.phase === 'reveal'
}

/** The host may skip a turn until its verdict is in. */
export function canSkip(state: NoFillerState): boolean {
  return state.phase === 'pick' || state.phase === 'speak' || state.phase === 'vote'
}

/** The same game with another player as its host, for a room whose host changed. */
export function hostedBy(state: NoFillerState, host: PlayerId): NoFillerState {
  return state.host === host ? state : { ...state, host }
}

/**
 * Who speaks after the current turn. Null when the game is over or may end first: the last turn of a round
 * decides that only once its verdict is in.
 */
export function upNext(state: NoFillerState): PlayerId | null {
  if (state.phase === 'over') return null
  if (state.turnIndex + 1 < state.speakers.length) return state.speakers[state.turnIndex + 1]
  if (state.phase === 'reveal') {
    const next = nextTurn(state)
    return next.phase === 'over' ? null : next.turn.speaker
  }
  if (state.suddenDeath) return null
  const { turn, scores, settings } = state
  const mostThisTurn = turn.card ? POINTS[turn.card.difficulty] : POINTS.hard
  const targetInReach = Object.entries(scores).some(([id, score]) => score + (id === turn.speaker ? mostThisTurn : 0) >= settings.target)
  return targetInReach ? null : state.order[0]
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function newTurn(speaker: PlayerId, hostCall: HostCall | null = null): Turn {
  return { speaker, card: null, startedAt: null, stoppedAt: null, votes: {}, outcome: null, points: 0, hostCall }
}

function startTurn(state: NoFillerState, speakers: PlayerId[], turnIndex: number): NoFillerState {
  return { ...state, speakers, turnIndex, turnCount: state.turnCount + 1, phase: 'pick', turn: newTurn(speakers[turnIndex]) }
}

/**
 * The turn after this one. A round always plays out; then, below the target, everyone goes again. At the target the
 * highest score wins, and a tie for first plays one sudden-death round between the tied players.
 */
function nextTurn(state: NoFillerState): NoFillerState {
  if (state.turnIndex + 1 < state.speakers.length) return startTurn(state, state.speakers, state.turnIndex + 1)
  if (state.suddenDeath) return { ...state, phase: 'over' }
  const top = Math.max(...state.order.map((id) => state.scores[id]))
  const nextRound = { ...state, roundIndex: state.roundIndex + 1 }
  if (top < state.settings.target) return startTurn(nextRound, state.order, 0)
  const leaders = state.order.filter((id) => state.scores[id] === top)
  if (leaders.length === 1) return { ...state, phase: 'over' }
  return startTurn({ ...nextRound, suddenDeath: true }, leaders, 0)
}

/** Takes the next card off a pile. A pile that runs out is shuffled again without the card just dealt. */
function dealCard(state: NoFillerState, difficulty: Difficulty, ctx: RulesContext): NoFillerState {
  const [id, ...rest] = state.piles[difficulty]
  const card = CARD_BY_ID.get(id)
  if (!card) return state
  const others = CARDS.filter((other) => other.difficulty === difficulty && other.id !== id).map((other) => other.id)
  const left = rest.length > 0 ? rest : others.length > 0 ? shuffled(others, ctx.random) : [id]
  return {
    ...state,
    piles: { ...state.piles, [difficulty]: left },
    phase: 'speak',
    turn: { ...state.turn, card, startedAt: ctx.now },
  }
}

/** Closes the vote: Clean scores the card's points, Filler scores 0. Sudden-death points only break the tie. */
function decideVote(state: NoFillerState): NoFillerState {
  const { turn } = state
  const outcome = outcomeOf(turn.votes)
  const points = outcome === 'clean' && turn.card ? POINTS[turn.card.difficulty] : 0
  const tally = state.suddenDeath ? 'tiebreak' : 'scores'
  return {
    ...state,
    phase: 'reveal',
    turn: { ...turn, outcome, points },
    [tally]: { ...state[tally], [turn.speaker]: state[tally][turn.speaker] + points },
  }
}

/** The host's Void turn: no score (a verdict already shown is taken back), and the speaker picks again for another card. */
function voidTurn(state: NoFillerState): NoFillerState {
  if (!canVoid(state)) return state
  const { turn } = state
  const tally = state.suddenDeath ? 'tiebreak' : 'scores'
  return {
    ...state,
    [tally]: { ...state[tally], [turn.speaker]: state[tally][turn.speaker] - turn.points },
    turnCount: state.turnCount + 1,
    phase: 'pick',
    turn: newTurn(turn.speaker, { kind: 'voided' }),
  }
}

/** The host's Skip turn: the speaker keeps their score and waits for the next round. */
function skipTurn(state: NoFillerState): NoFillerState {
  if (!canSkip(state)) return state
  const next = nextTurn(state)
  return next.phase === 'over' ? next : { ...next, turn: { ...next.turn, hostCall: { kind: 'skipped', player: state.turn.speaker } } }
}

export const rules: GameRules<NoFillerState, NoFillerSettings, NoFillerInput> = {
  setup(players, settings, ctx) {
    if (players.length < manifest.players.min) {
      throw new Error(`No Filler needs at least ${manifest.players.min} players.`)
    }
    const order = shuffled(players, ctx.random)
    const pile = (difficulty: Difficulty) =>
      freshFirst(
        CARDS.filter((card) => card.difficulty === difficulty),
        (card) => card.id,
        ctx.recent ?? [],
        ctx.random,
      ).map((card) => card.id)
    const piles = { easy: pile('easy'), medium: pile('medium'), hard: pile('hard') }
    if (DIFFICULTIES.some((difficulty) => piles[difficulty].length === 0)) throw new Error('The card pack needs cards of every difficulty.')
    const zeroes = () => Object.fromEntries(players.map((id) => [id, 0]))
    return {
      players,
      host: players[0],
      settings,
      order,
      speakers: order,
      turnIndex: 0,
      roundIndex: 0,
      turnCount: 1,
      suddenDeath: false,
      phase: 'pick',
      turn: newTurn(order[0]),
      scores: zeroes(),
      tiebreak: zeroes(),
      piles,
    }
  },

  onInput(state, player, input, ctx) {
    if (input.type === 'void') return player === state.host ? voidTurn(state) : state
    if (input.type === 'skip') return player === state.host ? skipTurn(state) : state
    if (!state.players.includes(player)) return state
    const { turn } = state
    if (state.phase === 'pick' && input.type === 'pick') {
      if (player !== turn.speaker || !pickChoices(state).includes(input.difficulty)) return state
      return dealCard(state, input.difficulty, ctx)
    }
    if (state.phase === 'speak' && input.type === 'done') {
      if (player !== turn.speaker) return state
      return { ...state, phase: 'vote', turn: { ...turn, stoppedAt: ctx.now - (turn.startedAt ?? ctx.now) } }
    }
    if (state.phase === 'vote' && input.type === 'vote') {
      const voters = votersFor(state)
      if (!voters.includes(player) || player in turn.votes) return state
      if (input.vote !== 'clean' && input.vote !== 'filler') return state
      const votes = { ...turn.votes, [player]: input.vote }
      const next = { ...state, turn: { ...turn, votes } }
      return voters.every((id) => id in votes) ? decideVote(next) : next
    }
    return state
  },

  /** The speaking clock running out opens the vote, the vote clock closes it, and the reveal moves on to the next speaker. The pick isn't timed. */
  onTimer(state) {
    switch (state.phase) {
      case 'speak':
        return { ...state, phase: 'vote' }
      case 'vote':
        return decideVote(state)
      case 'reveal':
        return nextTurn(state)
      default:
        return state
    }
  },

  isOver(state) {
    return state.phase === 'over'
  },

  /** Most points, then most sudden-death points. Still tied: a shared place. */
  finishingOrder(state): FinishingOrder {
    const { scores, tiebreak } = state
    const sorted = [...state.players].sort((a, b) => scores[b] - scores[a] || tiebreak[b] - tiebreak[a])
    const order: FinishingOrder = []
    for (const player of sorted) {
      const last = order.at(-1)
      if (last && scores[last[0]] === scores[player] && tiebreak[last[0]] === tiebreak[player]) last.push(player)
      else order.push([player])
    }
    return order
  },
}
