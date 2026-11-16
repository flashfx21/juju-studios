// ABOUTME: Zero In in a room: the public state every phone may read (answers and guesses masked until the reveal),
// ABOUTME: each player's private view (their own guess), and how bots guess.
import type { BotSkill } from '../room/bots'
import type { PlayerId } from '../types'
import { currentRound, MAX_GUESS, type Lane, type Question, type ZeroInState } from './rules'

/** Stands in for an answer nobody may see yet. Never a real answer (answers are 0 or more). */
export const HIDDEN_ANSWER = -1
/** Stands in for a guess that has been made but is still private. Never a real guess. */
export const HIDDEN_GUESS = -1

/** What one player alone may see while guessing: their own guess and whether it's locked. */
export interface PrivateView {
  roundIndex: number
  guess?: number
}

function hideAnswer(question: Question): Question {
  return { ...question, answer: HIDDEN_ANSWER, fact: undefined, source: '' }
}

/**
 * The state with every secret masked: questions not yet asked show nothing but their lane, the question being guessed
 * hides its answer, and guesses show only who has guessed, not what.
 */
export function publicState(state: ZeroInState): ZeroInState {
  return {
    ...state,
    rounds: state.rounds.map((round, i) => {
      if (state.phase === 'over' || i < state.roundIndex || (i === state.roundIndex && state.phase !== 'guessing')) return round
      if (i > state.roundIndex) return { ...round, question: { ...hideAnswer(round.question), prompt: '', topic: '', unit: '' }, guesses: {} }
      return {
        ...round,
        question: hideAnswer(round.question),
        guesses: Object.fromEntries(Object.keys(round.guesses).map((player) => [player, HIDDEN_GUESS])),
      }
    }),
  }
}

/** This player's own guess for the round being guessed. */
export function privateView(state: ZeroInState, player: PlayerId): PrivateView {
  const view: PrivateView = { roundIndex: state.roundIndex }
  const guess = currentRound(state).guesses[player]
  if (state.phase === 'guessing' && guess !== undefined) view.guess = guess
  return view
}

/**
 * What this phone shows: the public state with its own guess put back in. Until the private view has loaded
 * (`undefined`) the placeholder stays, so the screen can wait for the real number; a view with no guess for
 * this round means there is none, and the placeholder goes.
 */
export function stateForPhone(shared: ZeroInState, mine: PrivateView | null | undefined, player: PlayerId): ZeroInState {
  if (shared.phase !== 'guessing' || mine === undefined || !(player in currentRound(shared).guesses)) return shared
  const guess = mine && mine.roundIndex === shared.roundIndex ? mine.guess : undefined
  return {
    ...shared,
    rounds: shared.rounds.map((round, i) => {
      if (i !== shared.roundIndex) return round
      const others = Object.fromEntries(Object.entries(round.guesses).filter(([id]) => id !== player))
      return { ...round, guesses: guess === undefined ? others : { ...others, [player]: guess } }
    }),
  }
}

/** How far off a bot usually is: years by a number of years, everything else by a share of the answer. */
const YEAR_SPREAD: Record<BotSkill, number> = { sharp: 6, casual: 18 }
const SHARE_SPREAD: Record<BotSkill, number> = { sharp: 0.15, casual: 0.35 }
/** Now and then a bot is wildly off, so "way off" and wide reveals get tested. */
const WILD_CHANCE = 0.1

/**
 * A bot's guess: the answer plus a bell-shaped miss, sometimes wide. In the final round bots aim a little low,
 * so some go over and some stay safe.
 */
export function botGuess(question: Question, final: boolean, skill: BotSkill, random: () => number): number {
  const normal = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  const wild = random() < WILD_CHANCE ? 3 : 1
  const lane: Lane = question.lane
  const spread = lane === 'year' ? YEAR_SPREAD[skill] : Math.max(1, question.answer * SHARE_SPREAD[skill])
  const aimLow = final ? spread * 0.6 : 0
  const guess = Math.round(question.answer + normal * spread * wild - aimLow)
  return Math.min(MAX_GUESS, Math.max(0, guess))
}
