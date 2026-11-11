// ABOUTME: Chainword's rulebook: everyone races the same chain of hidden 5-letter words in hard mode.
// ABOUTME: Fewest total guesses wins (a missed word counts as 7); ties go to the faster total time.
import pack from '../../../packs/chainword/words.json'
import type { FinishingOrder, GameRules, PlayerId, RulesContext } from '../types'

export const WORD_LENGTH = 5
export const GUESSES_PER_WORD = 6
/** What a missed word adds to a player's total: one more than the guess cap. */
export const MISSED_WORD_COST = GUESSES_PER_WORD + 1

export type ChainLength = 3 | 5

export interface ChainwordSettings {
  chainLength: ChainLength
}

export const DEFAULT_SETTINGS: ChainwordSettings = { chainLength: 3 }

export interface GuessInput {
  type: 'guess'
  word: string
}

export type ChainwordInput = GuessInput

/** green: right letter, right spot. yellow: in the word, wrong spot. gray: not in the word (or no more copies). */
export type Mark = 'green' | 'yellow' | 'gray'

export interface WordAttempt {
  guesses: string[]
  marks: Mark[][]
  solved: boolean
}

export interface PlayerRun {
  /** One entry per word started, in chain order. */
  attempts: WordAttempt[]
  /** Set when the player has finished the last word in the chain. */
  finishedAt: number | null
}

export interface ChainwordState {
  chain: string[]
  startedAt: number
  runs: Record<PlayerId, PlayerRun>
}

/** Why a guess was refused. The phone turns these into words; the guess is not counted. */
export type GuessProblem =
  | { kind: 'not-playing' }
  | { kind: 'wrong-length' }
  | { kind: 'not-a-word' }
  | { kind: 'keep-green'; letter: string; position: number }
  | { kind: 'use-letter'; letter: string; count: number }

const ANSWERS: readonly string[] = pack.answers
const ACCEPTED = new Set<string>([...pack.answers, ...pack.guesses])

function normalize(word: string): string {
  return word.trim().toLowerCase()
}

/** Colors a guess against the answer. Repeated letters are only marked as often as the answer has them. */
export function markGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(guess.length).fill('gray')
  const unmatched = new Map<string, number>()
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = 'green'
    } else {
      unmatched.set(answer[i], (unmatched.get(answer[i]) ?? 0) + 1)
    }
  }
  for (let i = 0; i < guess.length; i++) {
    const left = unmatched.get(guess[i]) ?? 0
    if (marks[i] !== 'green' && left > 0) {
      marks[i] = 'yellow'
      unmatched.set(guess[i], left - 1)
    }
  }
  return marks
}

function countLetters(word: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const letter of word) counts.set(letter, (counts.get(letter) ?? 0) + 1)
  return counts
}

/** Hard mode: greens stay in place, and every revealed letter (green or yellow) is used again, as many times as revealed. */
function hardModeProblem(guess: string, attempt: WordAttempt): GuessProblem | null {
  const required = new Map<string, number>()
  for (let g = 0; g < attempt.guesses.length; g++) {
    const previous = attempt.guesses[g]
    const marks = attempt.marks[g]
    const revealed = new Map<string, number>()
    for (let i = 0; i < previous.length; i++) {
      if (marks[i] === 'green' && guess[i] !== previous[i]) {
        return { kind: 'keep-green', letter: previous[i], position: i }
      }
      if (marks[i] !== 'gray') revealed.set(previous[i], (revealed.get(previous[i]) ?? 0) + 1)
    }
    for (const [letter, count] of revealed) {
      required.set(letter, Math.max(required.get(letter) ?? 0, count))
    }
  }
  const used = countLetters(guess)
  for (const [letter, count] of required) {
    if ((used.get(letter) ?? 0) < count) return { kind: 'use-letter', letter, count }
  }
  return null
}

function currentAttempt(run: PlayerRun): WordAttempt {
  return run.attempts[run.attempts.length - 1]
}

/** Checks a guess before it is sent. Returns null when the guess is allowed. */
export function checkGuess(state: ChainwordState, player: PlayerId, word: string): GuessProblem | null {
  const run = state.runs[player]
  if (!run || run.finishedAt !== null) return { kind: 'not-playing' }
  const guess = normalize(word)
  if (guess.length !== WORD_LENGTH) return { kind: 'wrong-length' }
  if (!ACCEPTED.has(guess)) return { kind: 'not-a-word' }
  return hardModeProblem(guess, currentAttempt(run))
}

function emptyAttempt(): WordAttempt {
  return { guesses: [], marks: [], solved: false }
}

/** Picks distinct answers at random. */
function dealChain(length: number, random: () => number): string[] {
  const pool = [...ANSWERS]
  const chain: string[] = []
  for (let i = 0; i < length; i++) {
    const pick = Math.floor(random() * pool.length)
    chain.push(pool[pick])
    pool.splice(pick, 1)
  }
  return chain
}

function setup(players: readonly PlayerId[], settings: ChainwordSettings, ctx: RulesContext): ChainwordState {
  const runs: Record<PlayerId, PlayerRun> = {}
  for (const player of players) runs[player] = { attempts: [emptyAttempt()], finishedAt: null }
  return { chain: dealChain(settings.chainLength, ctx.random), startedAt: ctx.now, runs }
}

function onInput(state: ChainwordState, player: PlayerId, input: ChainwordInput, ctx: RulesContext): ChainwordState {
  if (checkGuess(state, player, input.word) !== null) return state

  const run = state.runs[player]
  const guess = normalize(input.word)
  const wordIndex = run.attempts.length - 1
  const attempt = currentAttempt(run)
  const marks = markGuess(guess, state.chain[wordIndex])
  const solved = marks.every((mark) => mark === 'green')
  const updated: WordAttempt = {
    guesses: [...attempt.guesses, guess],
    marks: [...attempt.marks, marks],
    solved,
  }

  const attempts = [...run.attempts.slice(0, -1), updated]
  const wordDone = solved || updated.guesses.length === GUESSES_PER_WORD
  const chainDone = wordDone && wordIndex === state.chain.length - 1
  if (wordDone && !chainDone) attempts.push(emptyAttempt())

  return {
    ...state,
    runs: { ...state.runs, [player]: { attempts, finishedAt: chainDone ? ctx.now : null } },
  }
}

/** Chainword has no round timer. */
function onTimer(state: ChainwordState): ChainwordState {
  return state
}

function isOver(state: ChainwordState): boolean {
  return Object.values(state.runs).every((run) => run.finishedAt !== null)
}

function attemptCost(attempt: WordAttempt): number {
  return attempt.solved ? attempt.guesses.length : MISSED_WORD_COST
}

/** Guesses so far, counting each missed word as 7. A word in progress counts the guesses made on it. */
export function totalGuesses(run: PlayerRun): number {
  return run.attempts.reduce((sum, attempt, i) => {
    const inProgress = i === run.attempts.length - 1 && run.finishedAt === null
    return sum + (inProgress ? attempt.guesses.length : attemptCost(attempt))
  }, 0)
}

/** Milliseconds from the start to finishing the chain, or null if not finished. */
export function totalTime(state: ChainwordState, run: PlayerRun): number | null {
  return run.finishedAt === null ? null : run.finishedAt - state.startedAt
}

function finishingOrder(state: ChainwordState): FinishingOrder {
  const ranked = Object.entries(state.runs).map(([player, run]) => ({
    player,
    guesses: totalGuesses(run),
    time: totalTime(state, run) ?? Infinity,
  }))
  ranked.sort((a, b) => a.guesses - b.guesses || a.time - b.time)

  const order: FinishingOrder = []
  for (let i = 0; i < ranked.length; i++) {
    const tied = i > 0 && ranked[i].guesses === ranked[i - 1].guesses && ranked[i].time === ranked[i - 1].time
    if (tied) order[order.length - 1].push(ranked[i].player)
    else order.push([ranked[i].player])
  }
  return order
}

/** What the TV may show about one player: colors only, never letters. */
export interface PlayerProgress {
  player: PlayerId
  /** Marks for every guess, grouped by chain word. */
  words: Mark[][][]
  /** Index of the word being worked on; equals the chain length once finished. */
  wordIndex: number
  solvedWords: number
  totalGuesses: number
  finished: boolean
}

export function tvProgress(state: ChainwordState): PlayerProgress[] {
  return Object.entries(state.runs).map(([player, run]) => {
    const finished = run.finishedAt !== null
    return {
      player,
      words: run.attempts.map((attempt) => attempt.marks.map((marks) => [...marks])),
      wordIndex: finished ? state.chain.length : run.attempts.length - 1,
      solvedWords: run.attempts.filter((attempt) => attempt.solved).length,
      totalGuesses: totalGuesses(run),
      finished,
    }
  })
}

export const rules: GameRules<ChainwordState, ChainwordSettings, ChainwordInput> = {
  setup,
  onInput,
  onTimer,
  isOver,
  finishingOrder,
}
