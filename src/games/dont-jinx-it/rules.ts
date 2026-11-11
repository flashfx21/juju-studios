// ABOUTME: Don't Jinx It rules, individual mode: a rotating guesser, one-word clues from everyone else, and any
// ABOUTME: clue written twice (or nearly twice) is jinxed before the guesser sees what survived. Pure logic, no screens.

import formPack from '../../../packs/dont-jinx-it/word-forms.json'
import wordPack from '../../../packs/dont-jinx-it/words.json'
import type { FinishingOrder, GameRules, PlayerId } from '../types'
import { manifest } from './manifest'

export const MYSTERY_WORDS: readonly string[] = wordPack.words
export const WORD_FORM_GROUPS: readonly (readonly string[])[] = formPack.groups

export type Pace = 'quick' | 'normal' | 'relaxed'

export const PACES: readonly Pace[] = ['quick', 'normal', 'relaxed']

/** Seconds to write clues and to guess, by pace. */
export const PACE_SECONDS: Record<Pace, { write: number; guess: number }> = {
  quick: { write: 45, guess: 30 },
  normal: { write: 60, guess: 45 },
  relaxed: { write: 90, guess: 60 },
}

export const PILE_SECONDS = 10
export const VERDICT_SECONDS = 5
/** The host usually taps Next sooner; this is the fallback. */
export const REVEAL_SECONDS = 20
/** A writer may skip the word only this early in the writing time, once per turn. */
export const SKIP_WINDOW_SECONDS = 15

export const GUESSER_POINTS = 2
/** Given once per player whose clue survived, even if both of their clues did. */
export const SURVIVING_CLUE_POINTS = 1

export interface DontJinxItSettings {
  pace: Pace
  /** Everyone guesses twice. */
  longGame: boolean
}

export const DEFAULT_SETTINGS: DontJinxItSettings = { pace: 'normal', longGame: false }

export type GuessResult = 'correct' | 'miss' | 'pass'

export interface Turn {
  guesser: PlayerId
  /** Secret: the guesser's phone and the TV never get it before the reveal. */
  word: string
  /** When writing began, in milliseconds, for the skip window. */
  writeStartedAt: number
  skipUsed: boolean
  /** Each writer's clues, lowercase, final once submitted. A writer who never submits counts as blank. */
  clues: Record<PlayerId, string[]>
  guess: string | null
  result: GuessResult | null
}

/**
 * write: everyone but the guesser writes clues. pile: jinxed clues are removed on screen.
 * guess: the guesser sees the survivors. verdict: right or wrong. reveal: who wrote what. over: every turn played.
 */
export type Phase = 'write' | 'pile' | 'guess' | 'verdict' | 'reveal' | 'over'

export interface DontJinxItState {
  /** Turn order, which is also the guesser rotation. */
  players: readonly PlayerId[]
  pace: Pace
  /** Dealt at setup, one per guess. */
  turns: Turn[]
  turnIndex: number
  phase: Phase
  /** Words not dealt to any turn, drawn from when a writer skips. */
  spareWords: string[]
}

export type DontJinxItInput =
  | { type: 'clues'; words: string[] }
  | { type: 'skip' }
  | { type: 'guess'; word: string }
  | { type: 'pass' }

/** Why a clue was refused, in the order they are checked. */
export type ClueProblem = 'empty' | 'not-letters' | 'mystery-word' | 'part-of-word' | 'clues-match'

/** survived: the guesser sees it. jinxed: an exact match. close-call: a near match, also removed in individual mode. */
export type ClueFate = 'survived' | 'jinxed' | 'close-call'

export interface PileClue {
  word: string
  by: PlayerId
  fate: ClueFate
  /** Writers of the clues this one matched, in turn order. Empty when it survived. */
  matchedWith: PlayerId[]
}

export function currentTurn(state: DontJinxItState): Turn {
  return state.turns[state.turnIndex]
}

/** Everyone except this turn's guesser, in turn order. */
export function writersFor(state: DontJinxItState, turn: Turn): PlayerId[] {
  return state.players.filter((player) => player !== turn.guesser)
}

/** One clue each, or two each when there are only 3 players, so the guesser still gets enough clues. */
export function cluesPerWriter(playerCount: number): number {
  return playerCount === 3 ? 2 : 1
}

/** Seconds the current phase lasts before the engine's timer moves it on, or null once the game is over. */
export function phaseSeconds(state: DontJinxItState): number | null {
  switch (state.phase) {
    case 'write':
      return PACE_SECONDS[state.pace].write
    case 'pile':
      return PILE_SECONDS
    case 'guess':
      return PACE_SECONDS[state.pace].guess
    case 'verdict':
      return VERDICT_SECONDS
    case 'reveal':
      return REVEAL_SECONDS
    case 'over':
      return null
  }
}

function normalize(word: string): string {
  return word.trim().toLowerCase()
}

/** Checks a writer's clues against the mystery word. One entry per clue; null means that clue is fine. */
export function clueProblems(words: readonly string[], mysteryWord: string): (ClueProblem | null)[] {
  const problems = words.map((raw): ClueProblem | null => {
    const word = normalize(raw)
    if (!word) return 'empty'
    if (!/^[a-z]+$/.test(word)) return 'not-letters'
    if (word === mysteryWord) return 'mystery-word'
    if (word.length >= 3 && (word.includes(mysteryWord) || mysteryWord.includes(word))) return 'part-of-word'
    return null
  })
  if (words.length === 2 && !problems[0] && !problems[1] && normalize(words[0]) === normalize(words[1])) {
    problems[1] = 'clues-match'
  }
  return problems
}

/** Strips common endings so regular forms meet: towels, boxes, babies, baking and running lose their endings. */
function stem(word: string): string {
  let w = word
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`
  else if (w.length > 4 && /(ss|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2)
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (/([b-df-hj-km-np-rt-z])\1$/.test(w)) w = w.slice(0, -1)
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1)
  return w
}

const formGroupOf = new Map<string, number>()
WORD_FORM_GROUPS.forEach((group, i) => group.forEach((word) => formGroupOf.set(word, i)))

/** Same word in another form: towel / towels, bake / baking, run / ran. */
function sameWordForm(a: string, b: string): boolean {
  if (stem(a) === stem(b)) return true
  const group = formGroupOf.get(a)
  return group !== undefined && group === formGroupOf.get(b)
}

/** A compound built on the other word: bird / birdhouse. Short or partial overlaps (car / carpet) don't count. */
function compoundOf(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  if (shorter.length < 4 || longer.length - shorter.length < 3) return false
  return longer.startsWith(shorter) || longer.endsWith(shorter)
}

/** Two different clues close enough to jinx each other. Exact matches are handled separately. */
export function isCloseCall(a: string, b: string): boolean {
  return a !== b && (sameWordForm(a, b) || compoundOf(a, b))
}

/** Every clue this turn, in turn order, with what happened to it. */
export function resolvePile(state: DontJinxItState, turn: Turn): PileClue[] {
  const entries = writersFor(state, turn).flatMap((by) => (turn.clues[by] ?? []).map((word) => ({ word, by })))
  return entries.map((entry, i) => {
    const others = entries.filter((_, j) => j !== i)
    const exact = others.filter((other) => other.word === entry.word)
    const close = others.filter((other) => isCloseCall(other.word, entry.word))
    const fate: ClueFate = exact.length > 0 ? 'jinxed' : close.length > 0 ? 'close-call' : 'survived'
    const matched = new Set([...exact, ...close].map((other) => other.by))
    return { ...entry, fate, matchedWith: state.players.filter((player) => matched.has(player)) }
  })
}

export function survivors(state: DontJinxItState, turn: Turn): string[] {
  return resolvePile(state, turn)
    .filter((clue) => clue.fate === 'survived')
    .map((clue) => clue.word)
}

/** Points earned on one turn, by player id. Nothing on a miss or pass. */
export function turnPoints(state: DontJinxItState, turn: Turn): Record<PlayerId, number> {
  if (turn.result !== 'correct') return {}
  const points: Record<PlayerId, number> = { [turn.guesser]: GUESSER_POINTS }
  for (const clue of resolvePile(state, turn)) {
    if (clue.fate === 'survived') points[clue.by] = SURVIVING_CLUE_POINTS
  }
  return points
}

/** Each player's points across every turn guessed so far, by player id. */
export function totalScores(state: DontJinxItState): Record<PlayerId, number> {
  const totals: Record<PlayerId, number> = {}
  for (const player of state.players) totals[player] = 0
  for (const turn of state.turns) {
    for (const [player, points] of Object.entries(turnPoints(state, turn))) totals[player] += points
  }
  return totals
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function withTurn(state: DontJinxItState, changes: Partial<Turn>): DontJinxItState {
  const turns = state.turns.map((turn, i) => (i === state.turnIndex ? { ...turn, ...changes } : turn))
  return { ...state, turns }
}

function judgeGuess(guess: string, word: string): GuessResult {
  return guess === word || sameWordForm(guess, word) ? 'correct' : 'miss'
}

function submitClues(state: DontJinxItState, player: PlayerId, words: string[]): DontJinxItState {
  const turn = currentTurn(state)
  const writers = writersFor(state, turn)
  if (!writers.includes(player) || player in turn.clues) return state
  if (words.length !== cluesPerWriter(state.players.length)) return state
  if (clueProblems(words, turn.word).some((problem) => problem !== null)) return state

  const clues = { ...turn.clues, [player]: words.map(normalize) }
  const updated = withTurn(state, { clues })
  return writers.every((writer) => writer in clues) ? { ...updated, phase: 'pile' } : updated
}

function skipWord(state: DontJinxItState, player: PlayerId, now: number): DontJinxItState {
  const turn = currentTurn(state)
  if (!writersFor(state, turn).includes(player) || turn.skipUsed) return state
  if (now - turn.writeStartedAt >= SKIP_WINDOW_SECONDS * 1000 || state.spareWords.length === 0) return state
  const [word, ...spareWords] = state.spareWords
  return { ...withTurn(state, { word, clues: {}, skipUsed: true }), spareWords }
}

function finishGuess(state: DontJinxItState, guess: string | null): DontJinxItState {
  const result = guess === null ? 'pass' : judgeGuess(guess, currentTurn(state).word)
  return { ...withTurn(state, { guess, result }), phase: 'verdict' }
}

function startNextTurn(state: DontJinxItState, now: number): DontJinxItState {
  const turnIndex = state.turnIndex + 1
  if (turnIndex >= state.turns.length) return { ...state, phase: 'over' }
  const next = { ...state, turnIndex, phase: 'write' as const }
  return withTurn(next, { writeStartedAt: now })
}

export const rules: GameRules<DontJinxItState, DontJinxItSettings, DontJinxItInput> = {
  /** Players arrive in turn order; that order is the guesser rotation. */
  setup(players, settings, ctx) {
    if (players.length < manifest.players.min) {
      throw new Error(`Don't Jinx It needs at least ${manifest.players.min} players.`)
    }
    const turnCount = players.length * (settings.longGame ? 2 : 1)
    if (turnCount * 2 > MYSTERY_WORDS.length) {
      throw new Error(`The word pack has only ${MYSTERY_WORDS.length} words for ${turnCount} turns and their skips.`)
    }
    const deck = shuffled(MYSTERY_WORDS, ctx.random)
    const turns: Turn[] = deck.slice(0, turnCount).map((word, i) => ({
      guesser: players[i % players.length],
      word,
      writeStartedAt: ctx.now,
      skipUsed: false,
      clues: {},
      guess: null,
      result: null,
    }))
    return { players, pace: settings.pace, turns, turnIndex: 0, phase: 'write', spareWords: deck.slice(turnCount) }
  },

  /** Ignores anything sent by the wrong player, in the wrong phase, or that breaks a clue rule. */
  onInput(state, player, input, ctx) {
    const turn = currentTurn(state)
    if (state.phase === 'write') {
      if (input.type === 'clues') return submitClues(state, player, input.words)
      if (input.type === 'skip') return skipWord(state, player, ctx.now)
      return state
    }
    if (state.phase === 'guess' && player === turn.guesser) {
      if (input.type === 'pass') return finishGuess(state, null)
      if (input.type === 'guess') {
        const guess = normalize(input.word)
        return /^[a-z]+$/.test(guess) ? finishGuess(state, guess) : state
      }
    }
    return state
  },

  /** Time up moves each phase on. Writing time up leaves missing clues blank; guessing time up is a pass. */
  onTimer(state, ctx) {
    switch (state.phase) {
      case 'write':
        return { ...state, phase: 'pile' }
      case 'pile':
        return { ...state, phase: 'guess' }
      case 'guess':
        return finishGuess(state, null)
      case 'verdict':
        return { ...state, phase: 'reveal' }
      case 'reveal':
        return startNextTurn(state, ctx.now)
      case 'over':
        return state
    }
  },

  isOver(state) {
    return state.phase === 'over'
  },

  finishingOrder(state) {
    const totals = totalScores(state)
    const byScore = new Map<number, PlayerId[]>()
    for (const player of state.players) {
      byScore.set(totals[player], [...(byScore.get(totals[player]) ?? []), player])
    }
    const places: FinishingOrder = [...byScore.entries()].sort(([a], [b]) => b - a).map(([, ids]) => ids)
    return places
  },
}

const PHASE_ORDER: readonly Phase[] = ['write', 'pile', 'guess', 'verdict', 'reveal', 'over']

function reached(state: DontJinxItState, phase: Phase): boolean {
  return PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf(phase)
}

/** Who has sent their clues this turn. No words. */
export interface WriterProgress {
  player: PlayerId
  submitted: boolean
}

/** What one player's phone may know right now. */
export interface PlayerView {
  phase: Phase
  turnIndex: number
  turnCount: number
  guesser: PlayerId
  isGuesser: boolean
  /** Null for the guesser until the reveal. */
  word: string | null
  cluesNeeded: number
  progress: WriterProgress[]
  canSkip: boolean
  /** This writer's own clues once sent; null for the guesser. */
  myClues: string[] | null
  /** Every clue with its writer: non-guessers from the pile on, the guesser only at the reveal. */
  pile: PileClue[] | null
  /** Surviving clue words, no writers, for everyone from the guess on. */
  survivors: string[] | null
  guess: string | null
  result: GuessResult | null
  scores: Record<PlayerId, number>
}

/** One face-down card on the TV during the clue drop. */
export interface TvCard {
  fate: ClueFate
  matchedWith: PlayerId[]
  /** Only for survivors, and only once the cards flip at the guess; every word at the reveal. */
  word: string | null
}

/** What the TV may show right now. The guesser is watching it. */
export interface TvView {
  phase: Phase
  turnIndex: number
  turnCount: number
  guesser: PlayerId
  /** Null until the reveal. */
  word: string | null
  progress: WriterProgress[]
  cards: TvCard[] | null
  survivors: string[] | null
  guess: string | null
  result: GuessResult | null
  scores: Record<PlayerId, number>
}

function writerProgress(state: DontJinxItState, turn: Turn): WriterProgress[] {
  return writersFor(state, turn).map((player) => ({ player, submitted: player in turn.clues }))
}

function verdictParts(state: DontJinxItState, turn: Turn) {
  return reached(state, 'verdict') ? { guess: turn.guess, result: turn.result } : { guess: null, result: null }
}

/** Filters the state for one player's phone, so a secret is never sent where it must not appear. */
export function playerView(state: DontJinxItState, player: PlayerId, now: number): PlayerView {
  const turn = currentTurn(state)
  const isGuesser = player === turn.guesser
  const revealed = reached(state, 'reveal')
  const canSkip =
    state.phase === 'write' &&
    !isGuesser &&
    !turn.skipUsed &&
    state.spareWords.length > 0 &&
    now - turn.writeStartedAt < SKIP_WINDOW_SECONDS * 1000
  return {
    phase: state.phase,
    turnIndex: state.turnIndex,
    turnCount: state.turns.length,
    guesser: turn.guesser,
    isGuesser,
    word: isGuesser && !revealed ? null : turn.word,
    cluesNeeded: cluesPerWriter(state.players.length),
    progress: writerProgress(state, turn),
    canSkip,
    myClues: isGuesser ? null : (turn.clues[player] ?? null),
    pile: reached(state, isGuesser ? 'reveal' : 'pile') ? resolvePile(state, turn) : null,
    survivors: reached(state, 'guess') ? survivors(state, turn) : null,
    ...verdictParts(state, turn),
    scores: totalScores(state),
  }
}

/** Filters the state for the TV: no mystery word and no jinxed clue text before the reveal. */
export function tvView(state: DontJinxItState): TvView {
  const turn = currentTurn(state)
  const revealed = reached(state, 'reveal')
  const flipped = reached(state, 'guess')
  const cards = reached(state, 'pile')
    ? resolvePile(state, turn).map((clue) => ({
        fate: clue.fate,
        matchedWith: clue.matchedWith,
        word: revealed || (flipped && clue.fate === 'survived') ? clue.word : null,
      }))
    : null
  return {
    phase: state.phase,
    turnIndex: state.turnIndex,
    turnCount: state.turns.length,
    guesser: turn.guesser,
    word: revealed ? turn.word : null,
    progress: writerProgress(state, turn),
    cards,
    survivors: flipped ? survivors(state, turn) : null,
    ...verdictParts(state, turn),
    scores: totalScores(state),
  }
}
