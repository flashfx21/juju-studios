// ABOUTME: Chainword in a room: what each phone shares (word results and guess counts, never letters), the standings, and bots.
// ABOUTME: Pure, so tests can check the standings order and seed the bots.
import { seededRandom } from '../../engine/seededRandom'
import type { BotSkill } from '../room/bots'
import type { PlayerId } from '../types'
import { GUESSES_PER_WORD, MISSED_WORD_COST, totalGuesses, totalTime, type ChainwordState } from './rules'

/** What one player shares with the room. */
export interface Progress {
  /** One entry per finished word, in chain order: how many guesses it cost (7 for a missed word). */
  words: { solved: boolean; cost: number }[]
  /** Guesses made on the word in progress. */
  current: number
  finished: boolean
  /** Guesses so far, missed words counting 7: the same total the phone shows. */
  totalGuesses: number
  /** From the start of the game to finishing the chain; null until finished. */
  timeMs: number | null
}

/** The progress a player's own game state shares. */
export function progressOf(state: ChainwordState, player: PlayerId): Progress {
  const run = state.runs[player]
  const finished = run.finishedAt !== null
  const done = finished ? run.attempts : run.attempts.slice(0, -1)
  return {
    words: done.map((attempt) => ({ solved: attempt.solved, cost: attempt.solved ? attempt.guesses.length : MISSED_WORD_COST })),
    current: finished ? 0 : run.attempts[run.attempts.length - 1].guesses.length,
    finished,
    totalGuesses: totalGuesses(run),
    timeMs: totalTime(state, run),
  }
}

export interface Standing {
  player: PlayerId
  /** 1 is first. Players level on everything share a place. */
  place: number
  progress: Progress
}

/** Nobody has shared anything yet: on word 1, no guesses. */
const NOT_STARTED: Progress = { words: [], current: 0, finished: false, totalGuesses: 0, timeMs: null }

/**
 * Standings: finished players first, by fewest guesses then fastest time (the game's own order);
 * then players still going, furthest along first, then fewest guesses.
 */
export function standings(players: readonly PlayerId[], shared: Record<PlayerId, Progress>): Standing[] {
  const rows = players.map((player) => ({ player, progress: shared[player] ?? NOT_STARTED }))
  const compare = (a: Progress, b: Progress) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1
    if (a.finished) return a.totalGuesses - b.totalGuesses || (a.timeMs ?? 0) - (b.timeMs ?? 0)
    return b.words.length - a.words.length || a.totalGuesses - b.totalGuesses
  }
  rows.sort((a, b) => compare(a.progress, b.progress))
  return rows.map((row, i) => {
    let place = i + 1
    for (let j = i - 1; j >= 0 && compare(rows[j].progress, row.progress) === 0; j--) place = j + 1
    return { ...row, place }
  })
}

/** The game is over once every player has finished their chain. */
export function everyoneFinished(players: readonly PlayerId[], shared: Record<PlayerId, Progress>): boolean {
  return players.every((player) => shared[player]?.finished)
}

/** Chance of solving a word on guess 1 to 6, then of missing it. Sharp bots solve sooner and miss less. */
const GUESS_ODDS: Record<BotSkill, number[]> = {
  sharp: [0.01, 0.08, 0.3, 0.33, 0.17, 0.08, 0.03],
  casual: [0, 0.04, 0.17, 0.3, 0.25, 0.14, 0.1],
}

/** Seconds a bot spends on each guess: [quickest, slowest]. */
const SECONDS_PER_GUESS: Record<BotSkill, [number, number]> = {
  sharp: [10, 22],
  casual: [15, 35],
}

/** One bot's whole game, decided up front from its seed: for each word, how many guesses and how long each took. */
function botPlan(seed: string, skill: BotSkill, chainLength: number): { guesses: number; solved: boolean; secondsEach: number[] }[] {
  const random = seededRandom(seed)
  const [quickest, slowest] = SECONDS_PER_GUESS[skill]
  return Array.from({ length: chainLength }, () => {
    let roll = random()
    let outcome = 0
    while (outcome < GUESS_ODDS[skill].length - 1 && roll >= GUESS_ODDS[skill][outcome]) {
      roll -= GUESS_ODDS[skill][outcome]
      outcome++
    }
    const solved = outcome < GUESSES_PER_WORD
    const guesses = solved ? outcome + 1 : GUESSES_PER_WORD
    const secondsEach = Array.from({ length: guesses }, () => quickest + (slowest - quickest) * random())
    return { guesses, solved, secondsEach }
  })
}

/**
 * Where a bot is after `elapsedMs` of play. The same seed always gives the same game, so a host that reloads
 * shows the same bot. When the host ends the game, words the bot hadn't finished count as missed.
 */
export function botProgress(seed: string, skill: BotSkill, chainLength: number, elapsedMs: number, endedAtMs: number | null): Progress {
  const plan = botPlan(seed, skill, chainLength)
  const words: Progress['words'] = []
  let clock = 0
  let current = 0
  const limit = endedAtMs === null ? elapsedMs : Math.min(elapsedMs, endedAtMs)
  for (const word of plan) {
    let used = 0
    while (used < word.guesses && clock + word.secondsEach[used] * 1000 <= limit) {
      clock += word.secondsEach[used] * 1000
      used++
    }
    if (used < word.guesses) {
      current = used
      break
    }
    words.push({ solved: word.solved, cost: word.solved ? word.guesses : MISSED_WORD_COST })
  }
  const finishedChain = words.length === chainLength
  if (finishedChain || endedAtMs === null || elapsedMs < endedAtMs) {
    const total = words.reduce((sum, w) => sum + w.cost, 0) + (finishedChain ? 0 : current)
    return { words, current: finishedChain ? 0 : current, finished: finishedChain, totalGuesses: total, timeMs: finishedChain ? clock : null }
  }
  // Ended early: the word in progress and the rest count as missed.
  while (words.length < chainLength) words.push({ solved: false, cost: MISSED_WORD_COST })
  return { words, current: 0, finished: true, totalGuesses: words.reduce((sum, w) => sum + w.cost, 0), timeMs: endedAtMs }
}
