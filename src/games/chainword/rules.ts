// ABOUTME: Chainword's rulebook: everyone races the same chain of hidden words (4 to 7 letters), with hard mode as an option.
// ABOUTME: Fewest total guesses wins (a missed word counts as 7); ties go to the faster total time.
import answerPack from '../../../packs/chainword/answers.json'
import guessPack from '../../../packs/chainword/guesses.json'
import type { FinishingOrder, GameRules, PlayerId, RulesContext } from '../types'

export const GUESSES_PER_WORD = 6
/** What a missed word adds to a player's total: one more than the guess cap. */
export const MISSED_WORD_COST = GUESSES_PER_WORD + 1

export type ChainLength = 3 | 5
export type WordLength = 4 | 5 | 6 | 7

export const CHAIN_LENGTHS: readonly ChainLength[] = [3, 5]
export const WORD_LENGTHS: readonly WordLength[] = [4, 5, 6, 7]

export interface ChainwordSettings {
  chainLength: ChainLength
  wordLength: WordLength
  /** Greens stay in place and revealed letters must be used again. */
  hardMode: boolean
}

export const DEFAULT_SETTINGS: ChainwordSettings = { chainLength: 3, wordLength: 5, hardMode: false }

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
  wordLength: WordLength
  hardMode: boolean
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

export function answersFor(wordLength: WordLength): readonly string[] {
  return answerPack[wordLength]
}

const accepted = new Map<WordLength, Set<string>>()

/** The words a player may type at this length. Built on first use; the pack stores each length as one string. */
function acceptedWords(wordLength: WordLength): Set<string> {
  let words = accepted.get(wordLength)
  if (!words) {
    words = new Set(guessPack[wordLength].split(' '))
    accepted.set(wordLength, words)
  }
  return words
}

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
  if (guess.length !== state.wordLength) return { kind: 'wrong-length' }
  if (!acceptedWords(state.wordLength).has(guess)) return { kind: 'not-a-word' }
  return state.hardMode ? hardModeProblem(guess, currentAttempt(run)) : null
}

function emptyAttempt(): WordAttempt {
  return { guesses: [], marks: [], solved: false }
}

/** Picks distinct answers at random. */
function dealChain(settings: ChainwordSettings, random: () => number): string[] {
  const pool = [...answersFor(settings.wordLength)]
  const chain: string[] = []
  for (let i = 0; i < settings.chainLength; i++) {
    const pick = Math.floor(random() * pool.length)
    chain.push(pool[pick])
    pool.splice(pick, 1)
  }
  return chain
}

function setup(players: readonly PlayerId[], settings: ChainwordSettings, ctx: RulesContext): ChainwordState {
  const runs: Record<PlayerId, PlayerRun> = {}
  for (const player of players) runs[player] = { attempts: [emptyAttempt()], finishedAt: null }
  return {
    wordLength: settings.wordLength,
    hardMode: settings.hardMode,
    chain: dealChain(settings, ctx.random),
    startedAt: ctx.now,
    runs,
  }
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

/**
 * Ends the game now for everyone still playing: the word in progress and every word not reached count as missed.
 * Finished players keep their results.
 */
export function endGame(state: ChainwordState, ctx: RulesContext): ChainwordState {
  const runs: Record<PlayerId, PlayerRun> = {}
  for (const [player, run] of Object.entries(state.runs)) {
    if (run.finishedAt !== null) {
      runs[player] = run
      continue
    }
    const attempts = [...run.attempts]
    while (attempts.length < state.chain.length) attempts.push(emptyAttempt())
    runs[player] = { attempts, finishedAt: ctx.now }
  }
  return { ...state, runs }
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
