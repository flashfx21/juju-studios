// ABOUTME: Dibs rules: a category, then a letter; everyone races to claim one answer that fits, first claim keeps it.
// ABOUTME: Pure logic, no screens: dealing, Taken and wrong-letter bounces, challenges and votes, points, Deal again, finishing order.

import categoryPack from '../../../packs/dibs/categories.json'
import { DEFAULT_PACE, PACES, type Pace } from '../../engine/pace'
import { freshFirst } from '../../engine/recentlyDealt'
import { cleanAnswer, firstLetter, oneLetterOff } from '../../engine/textMatch'
import { sameWordForm } from '../../engine/wordForms'
import type { FinishingOrder, GameRules, PlayerId, RulesContext } from '../types'
import { manifest } from './manifest'

export type Tag = 'family' | 'adult'

export interface Category {
  id: string
  name: string
  tag: Tag
}

export const CATEGORIES: readonly Category[] = categoryPack.categories as Category[]

/** The 20 letters a game deals from: A to Z without Q, U, V, X, Y and Z. */
export const LETTERS: readonly string[] = 'ABCDEFGHIJKLMNOPRSTW'.split('')

export type RoundCount = 5 | 7 | 9
export type CategoryChoice = 'family' | 'everything'

export const ROUND_COUNTS: readonly RoundCount[] = [5, 7, 9]
export const CATEGORY_CHOICES: readonly CategoryChoice[] = ['family', 'everything']
export { PACES, type Pace }

/** Seconds to race at each pace. */
export { PACE_SECONDS } from './paceSeconds'
/** Seconds the category shows alone before the letter drops. */
export const CATEGORY_SECONDS = 4
/** Seconds to look over the answers and challenge. */
export const REVIEW_SECONDS = 15
/** Seconds for each challenge vote, and for showing how everyone voted. */
export const VOTE_SECONDS = 8
export const VERDICT_SECONDS = 4

export interface DibsSettings {
  pace: Pace
  rounds: RoundCount
  categories: CategoryChoice
}

export const DEFAULT_SETTINGS: DibsSettings = {
  pace: DEFAULT_PACE,
  rounds: 7,
  categories: 'family',
}

/** Longest answer a phone sends. */
export const MAX_ANSWER_LENGTH = 40
/** Any answer that survives review. */
export const VALID_POINTS = 2
/** Extra for the 1st, 2nd and 3rd answers that survive review. */
export const SPEED_BONUS = [3, 2, 1]
export const CHALLENGES_PER_ROUND = 1
/** What a challenge costs the challenger when the vote keeps the answer. */
export const FAILED_CHALLENGE_COST = 1

/** An accepted answer. `at` is milliseconds after the letter dropped. */
export interface Claim {
  player: PlayerId
  text: string
  at: number
}

/** A try that matched an answer already claimed: kept for the reveal ("Rugrats: KaliBear, 3 s before Juju"). */
export interface Bounce {
  player: PlayerId
  text: string
  owner: PlayerId
  at: number
}

/** What only the player's own phone hears about their last try. */
export interface Note {
  kind: 'taken' | 'wrong-letter'
  text: string
}

export type Vote = 'valid' | 'not-valid'
/** A vote that has been cast but isn't shown yet. */
export type VoteMark = Vote | 'hidden'

/** Everyone who challenged one answer, in one vote. */
export interface Challenge {
  author: PlayerId
  challengers: PlayerId[]
  votes: Record<PlayerId, VoteMark>
  outcome: Vote | null
}

export interface PlayerResult {
  answer: string | null
  /** False when the answer was ruled out, or there was none. */
  valid: boolean
  /** 1 is the first answer that survived review. Null without a valid answer. */
  speedRank: number | null
  /** Points for the answer. */
  points: number
  /** Points lost for failed challenges. */
  penalty: number
}

export interface Round {
  category: Category
  letter: string
  /** How many times the host dealt a new letter this round. */
  dealtAgain: number
  /** When the letter dropped (the host's clock); null before. */
  startedAt: number | null
  /** Accepted answers in the order they were accepted. */
  claims: Claim[]
  /** Players who tapped I'm out. */
  out: PlayerId[]
  bounces: Bounce[]
  notes: Record<PlayerId, Note>
  /** In claim order once votes start. */
  challenges: Challenge[]
  /** Players finished challenging. */
  done: PlayerId[]
  /** The challenge being voted on. */
  voteIndex: number
  results: Record<PlayerId, PlayerResult> | null
}

/**
 * category: the category alone. race: the letter is out, answers come in. review: every answer shown, challenges.
 * vote: one challenge at a time. verdict: how everyone voted. scores: the round's points, waiting for Next. over: done.
 */
export type Phase = 'category' | 'race' | 'review' | 'vote' | 'verdict' | 'scores' | 'over'

export interface DibsState {
  players: readonly PlayerId[]
  settings: DibsSettings
  rounds: Round[]
  roundIndex: number
  phase: Phase
  /** Letters dealt and then replaced by Deal again; never dealt again this game. */
  retired: string[]
}

export type DibsInput =
  | { type: 'answer'; text: string }
  | { type: 'out' }
  | { type: 'challenge'; author: PlayerId }
  | { type: 'withdraw' }
  | { type: 'done' }
  | { type: 'vote'; vote: Vote }

export function currentRound(state: DibsState): Round {
  return state.rounds[state.roundIndex]
}

export function currentChallenge(state: DibsState): Challenge | undefined {
  return currentRound(state).challenges[currentRound(state).voteIndex]
}

/** Whether an answer counts for the letter: its first letter after a leading "The", "A" or "An". */
export function fitsLetter(text: string, letter: string): boolean {
  return firstLetter(text) === letter.toLowerCase()
}

/** The earlier claim this one is close to but not the same as (Rugrat after Rugrats), for the "?" at review. */
export function nearDuplicateOf(round: Round, claim: Claim): Claim | undefined {
  const mine = cleanAnswer(claim.text)
  return round.claims
    .filter((other) => other.at < claim.at)
    .find((other) => {
      const theirs = cleanAnswer(other.text)
      return oneLetterOff(mine, theirs) || sameWordForm(mine, theirs)
    })
}

/** Who votes on a challenge: everyone but the author. With only 2 players the author votes too. */
export function votersFor(state: DibsState, challenge: Challenge): PlayerId[] {
  return state.players.length === 2 ? [...state.players] : state.players.filter((id) => id !== challenge.author)
}

/** Most votes wins; a tie, or no votes, keeps the answer. */
export function outcomeOf(votes: Record<PlayerId, VoteMark>): Vote {
  const cast = Object.values(votes)
  const notValid = cast.filter((vote) => vote === 'not-valid').length
  const valid = cast.filter((vote) => vote === 'valid').length
  return notValid > valid ? 'not-valid' : 'valid'
}

/** Challenges this player has made this round. */
export function challengesMade(round: Round, player: PlayerId): number {
  return round.challenges.filter((challenge) => challenge.challengers.includes(player)).length
}

export function scoreRound(players: readonly PlayerId[], round: Round): Record<PlayerId, PlayerResult> {
  const ruledOut = new Set(round.challenges.filter((c) => c.outcome === 'not-valid').map((c) => c.author))
  const valid = [...round.claims].sort((a, b) => a.at - b.at).filter((claim) => !ruledOut.has(claim.player))
  const results: Record<PlayerId, PlayerResult> = {}
  for (const player of players) {
    const claim = round.claims.find((c) => c.player === player)
    const index = valid.findIndex((c) => c.player === player)
    const failed = round.challenges.filter((c) => c.outcome === 'valid' && c.challengers.includes(player)).length
    results[player] = {
      answer: claim?.text ?? null,
      valid: index >= 0,
      speedRank: index >= 0 ? index + 1 : null,
      points: index >= 0 ? VALID_POINTS + (SPEED_BONUS[index] ?? 0) : 0,
      penalty: failed * FAILED_CHALLENGE_COST,
    }
  }
  return results
}

export interface Totals {
  points: number
  /** Rounds with the first answer that survived review. */
  roundWins: number
}

/** Running totals across every scored round. A total never drops below 0. */
export function totals(state: DibsState): Record<PlayerId, Totals> {
  const byPlayer: Record<PlayerId, Totals> = {}
  for (const player of state.players) byPlayer[player] = { points: 0, roundWins: 0 }
  for (const round of state.rounds) {
    if (!round.results) continue
    for (const [player, result] of Object.entries(round.results)) {
      byPlayer[player].points = Math.max(0, byPlayer[player].points + result.points - result.penalty)
      if (result.speedRank === 1) byPlayer[player].roundWins += 1
    }
  }
  return byPlayer
}

/** The host may deal a new letter during the race, until the first answer is accepted, while letters are left. */
export function canDealAgain(state: DibsState): boolean {
  return state.phase === 'race' && currentRound(state).claims.length === 0 && unusedLetters(state).length > 0
}

function unusedLetters(state: DibsState): string[] {
  const used = new Set([...state.rounds.map((round) => round.letter), ...state.retired])
  return LETTERS.filter((letter) => !used.has(letter))
}

/** Replaces the round's letter and starts the race over; the replaced letter isn't dealt again this game. */
export function dealAgain(state: DibsState, ctx: RulesContext): DibsState {
  if (!canDealAgain(state)) return state
  const left = unusedLetters(state)
  const round = currentRound(state)
  const letter = left[Math.floor(ctx.random() * left.length)]
  const next = withCurrentRound(state, {
    letter,
    dealtAgain: round.dealtAgain + 1,
    startedAt: ctx.now,
    out: [],
    bounces: [],
    notes: {},
  })
  return { ...next, retired: [...state.retired, round.letter] }
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function newRound(category: Category, letter: string): Round {
  return {
    category,
    letter,
    dealtAgain: 0,
    startedAt: null,
    claims: [],
    out: [],
    bounces: [],
    notes: {},
    challenges: [],
    done: [],
    voteIndex: 0,
    results: null,
  }
}

function withCurrentRound(state: DibsState, change: Partial<Round>): DibsState {
  const rounds = state.rounds.map((round, i) => (i === state.roundIndex ? { ...round, ...change } : round))
  return { ...state, rounds }
}

function showScores(state: DibsState): DibsState {
  return {
    ...withCurrentRound(state, {
      results: scoreRound(state.players, currentRound(state)),
    }),
    phase: 'scores',
  }
}

/** The race is over: review the answers, or straight to scores when nobody answered. */
function endRace(state: DibsState): DibsState {
  return currentRound(state).claims.length === 0 ? showScores(state) : { ...state, phase: 'review' }
}

/** Challenges go to a vote in claim order; with none, the round is scored. */
function startVotes(state: DibsState): DibsState {
  const round = currentRound(state)
  if (round.challenges.length === 0) return showScores(state)
  const claimOrder = (author: PlayerId) => round.claims.findIndex((claim) => claim.player === author)
  const challenges = [...round.challenges].sort((a, b) => claimOrder(a.author) - claimOrder(b.author))
  return {
    ...withCurrentRound(state, { challenges, voteIndex: 0 }),
    phase: 'vote',
  }
}

function withChallenges(state: DibsState, challenges: Challenge[]): DibsState {
  return withCurrentRound(state, { challenges })
}

function decideVote(state: DibsState): DibsState {
  const round = currentRound(state)
  const challenges = round.challenges.map((c, i) => (i === round.voteIndex ? { ...c, outcome: outcomeOf(c.votes) } : c))
  return { ...withChallenges(state, challenges), phase: 'verdict' }
}

function onAnswer(state: DibsState, player: PlayerId, text: string, ctx: RulesContext): DibsState {
  const round = currentRound(state)
  const answer = text.trim().slice(0, MAX_ANSWER_LENGTH)
  const cleaned = cleanAnswer(answer)
  if (!cleaned) return state
  const notes = { ...round.notes }
  if (!fitsLetter(answer, round.letter)) {
    notes[player] = { kind: 'wrong-letter', text: answer }
    return withCurrentRound(state, { notes })
  }
  const at = ctx.now - (round.startedAt ?? ctx.now)
  const owner = round.claims.find((claim) => cleanAnswer(claim.text) === cleaned)
  if (owner) {
    notes[player] = { kind: 'taken', text: answer }
    return withCurrentRound(state, {
      notes,
      bounces: [...round.bounces, { player, text: answer, owner: owner.player, at }],
    })
  }
  delete notes[player]
  return withCurrentRound(state, {
    notes,
    claims: [...round.claims, { player, text: answer, at }],
  })
}

function onChallenge(state: DibsState, player: PlayerId, author: PlayerId): DibsState {
  const round = currentRound(state)
  const hasClaim = round.claims.some((claim) => claim.player === author)
  if (author === player || !hasClaim || challengesMade(round, player) >= CHALLENGES_PER_ROUND) return state
  const existing = round.challenges.find((c) => c.author === author)
  const challenges = existing
    ? round.challenges.map((c) => (c === existing ? { ...c, challengers: [...c.challengers, player] } : c))
    : [...round.challenges, { author, challengers: [player], votes: {}, outcome: null }]
  return withChallenges(state, challenges)
}

function onWithdraw(state: DibsState, player: PlayerId): DibsState {
  const round = currentRound(state)
  const challenges = round.challenges
    .map((c) => ({
      ...c,
      challengers: c.challengers.filter((id) => id !== player),
    }))
    .filter((c) => c.challengers.length > 0)
  return withChallenges(state, challenges)
}

function isDoneRacing(round: Round, player: PlayerId): boolean {
  return round.out.includes(player) || round.claims.some((claim) => claim.player === player)
}

export const rules: GameRules<DibsState, DibsSettings, DibsInput> = {
  setup(players, settings, ctx) {
    if (players.length < manifest.players.min) {
      throw new Error(`Dibs needs at least ${manifest.players.min} players.`)
    }
    const pool = CATEGORIES.filter((category) => settings.categories === 'everything' || category.tag === 'family')
    const categories = freshFirst(pool, (category) => category.id, ctx.recent ?? [], ctx.random).slice(0, settings.rounds)
    if (categories.length === 0) throw new Error('The category pack has no categories for this setting.')
    const letters = shuffled(LETTERS, ctx.random)
    const rounds = categories.map((category, i) => newRound(category, letters[i]))
    return {
      players,
      settings,
      rounds,
      roundIndex: 0,
      phase: 'category',
      retired: [],
    }
  },

  onInput(state, player, input, ctx) {
    if (!state.players.includes(player)) return state
    const round = currentRound(state)
    if (state.phase === 'race') {
      if (isDoneRacing(round, player)) return state
      let next = state
      if (input.type === 'answer' && typeof input.text === 'string') next = onAnswer(state, player, input.text, ctx)
      else if (input.type === 'out') next = withCurrentRound(state, { out: [...round.out, player] })
      const after = currentRound(next)
      return state.players.every((id) => isDoneRacing(after, id)) ? endRace(next) : next
    }
    if (state.phase === 'review') {
      if (input.type === 'challenge' && !round.done.includes(player)) return onChallenge(state, player, input.author)
      if (input.type === 'withdraw' && !round.done.includes(player)) return onWithdraw(state, player)
      if (input.type !== 'done' || round.done.includes(player)) return state
      const done = [...round.done, player]
      const next = withCurrentRound(state, { done })
      return done.length === state.players.length ? startVotes(next) : next
    }
    if (state.phase === 'vote' && input.type === 'vote') {
      const challenge = currentChallenge(state)
      if (!challenge || !votersFor(state, challenge).includes(player) || player in challenge.votes) return state
      if (input.vote !== 'valid' && input.vote !== 'not-valid') return state
      const votes = { ...challenge.votes, [player]: input.vote }
      const challenges = round.challenges.map((c, i) => (i === round.voteIndex ? { ...c, votes } : c))
      const next = withChallenges(state, challenges)
      return votersFor(state, challenge).every((id) => id in votes) ? decideVote(next) : next
    }
    return state
  },

  /** Each timed step moves on when its time is up; at the scores, the host's Next starts the next round or ends the game. */
  onTimer(state, ctx) {
    const round = currentRound(state)
    switch (state.phase) {
      case 'category':
        return {
          ...withCurrentRound(state, { startedAt: ctx.now }),
          phase: 'race',
        }
      case 'race':
        return endRace(state)
      case 'review':
        return startVotes(state)
      case 'vote':
        return decideVote(state)
      case 'verdict':
        if (round.voteIndex + 1 < round.challenges.length)
          return {
            ...withCurrentRound(state, { voteIndex: round.voteIndex + 1 }),
            phase: 'vote',
          }
        return showScores(state)
      case 'scores':
        if (state.roundIndex + 1 >= state.rounds.length) return { ...state, phase: 'over' }
        return {
          ...state,
          roundIndex: state.roundIndex + 1,
          phase: 'category',
        }
      default:
        return state
    }
  },

  isOver(state) {
    return state.phase === 'over'
  },

  /** Most points, then most round wins. Still tied: a shared place. */
  finishingOrder(state): FinishingOrder {
    const scores = totals(state)
    const sorted = [...state.players].sort((a, b) => scores[b].points - scores[a].points || scores[b].roundWins - scores[a].roundWins)
    const order: FinishingOrder = []
    for (const player of sorted) {
      const last = order.at(-1)
      const same = last && scores[last[0]].points === scores[player].points && scores[last[0]].roundWins === scores[player].roundWins
      if (same) last.push(player)
      else order.push([player])
    }
    return order
  },
}
