// ABOUTME: Sketch Showdown rules: two teams, one drawer each, both drawing the same clue while their own team races
// ABOUTME: to guess it first. Pure logic, no screens: turn order, the clue pick, the race, sudden death and views per screen.

import cluePack from '../../../packs/sketch-showdown/clues.json'
import type { FinishingOrder, GameRules, PlayerId, RulesContext } from '../types'
import { manifest } from './manifest'
import { cleanGuess, guessMatches, type Clue } from './matching'

export type { Clue }

export const CLUES: readonly Clue[] = cluePack.clues

export type Turns = 'once' | 'twice'
export type Pace = 'quick' | 'normal' | 'relaxed'

export const TURNS: readonly Turns[] = ['once', 'twice']
export const PACES: readonly Pace[] = ['quick', 'normal', 'relaxed']

export interface SketchShowdownSettings {
  /** Everyone draws once, or twice. */
  turns: Turns
  pace: Pace
}

export const DEFAULT_SETTINGS: SketchShowdownSettings = { turns: 'once', pace: 'normal' }

/** Seconds a race lasts at each pace. */
export const RACE_SECONDS: Record<Pace, number> = { quick: 90, normal: 120, relaxed: 180 }
export const PICK_SECONDS = 15
export const COUNTDOWN_SECONDS = 5
export const VOTE_SECONDS = 15
export const LOCKOUT_MS = 2000
export const OPTIONS_PER_PICK = 3
export const MIN_TEAM_SIZE = 2
export const MAX_TEAM_SIZE = 5
/** A stroke longer than this is refused, so one input can't flood every screen. */
export const MAX_STROKE_POINTS = 2000

export type TeamIndex = 0 | 1
export const TEAM_INDEXES: readonly TeamIndex[] = [0, 1]

export type Tool = 'brush' | 'eraser' | 'line'
export type BrushSize = 'S' | 'M' | 'L' | 'XL'

export const TOOLS: readonly Tool[] = ['brush', 'eraser', 'line']
export const BRUSH_SIZES: readonly BrushSize[] = ['S', 'M', 'L', 'XL']
/** 16 swatches in two rows, skin tones included. */
export const SWATCHES: readonly string[] = [
  '#1f2124', '#ffffff', '#8a8f98', '#d6303b', '#f08a24', '#f5d33b', '#3f9b4a', '#2a6fdb',
  '#7b4bc4', '#e86fb0', '#7a4a2a', '#4fc3d9', '#f6d7c3', '#e0ac85', '#a86b47', '#5c3a26',
]

/** One finger-down to finger-up. Points are fractions of the square canvas (0 to 1), so every screen draws it the same. */
export interface Stroke {
  tool: Tool
  /** An index into SWATCHES. Ignored by the eraser. */
  color: number
  size: BrushSize
  points: [number, number][]
}

export interface TeamGuess {
  player: PlayerId
  text: string
  /** Milliseconds since the epoch. */
  at: number
}

/** How the round's clue was chosen, for the drawers' phones. */
export type HowChosen = 'both' | 'coin' | 'one' | 'random'

export interface Round {
  /** One drawer per team. */
  drawers: [PlayerId, PlayerId]
  options: Clue[]
  /** Each drawer's pick, an index into options. */
  picks: Partial<Record<PlayerId, number>>
  clue: Clue | null
  howChosen: HowChosen | null
  /** When the canvases unlocked. */
  startedAt: number | null
  drawings: [Stroke[], Stroke[]]
  /** Each team's guesses, wrong ones and the winning one, in order. */
  guesses: [TeamGuess[], TeamGuess[]]
  /** Milliseconds since the epoch until which a player who guessed wrong can't guess. */
  lockedUntil: Record<PlayerId, number>
  winner: TeamIndex | null
  /** Who got it and when. */
  winningGuess: TeamGuess | null
  suddenDeath: boolean
}

/**
 * pick: the drawers choose from 3 options. countdown: 5 seconds, canvases locked. race: draw and guess.
 * reveal: both drawings and the answer; the host's Next moves on. vote: level after the last round, so each team
 * nominates a sudden-death drawer. over: the game is done.
 */
export type Phase = 'pick' | 'countdown' | 'race' | 'reveal' | 'vote' | 'over'

export interface SketchShowdownState {
  teams: [PlayerId[], PlayerId[]]
  settings: SketchShowdownSettings
  /** Each team's drawer for every regular round, in order. */
  drawOrder: [PlayerId[], PlayerId[]]
  /** The clue bank, shuffled at setup. Options are dealt from the front, so none is shown twice. */
  deck: Clue[]
  dealt: number
  rounds: Round[]
  phase: Phase
  /** Sudden-death nominations: voter to nominee, only during the vote. */
  votes: Record<PlayerId, PlayerId>
}

export type SketchShowdownInput =
  | { type: 'pick'; option: number }
  | { type: 'stroke'; stroke: Stroke }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'guess'; text: string }
  | { type: 'vote'; nominee: PlayerId }

export function currentRound(state: SketchShowdownState): Round {
  return state.rounds[state.rounds.length - 1]
}

export function teamOf(state: SketchShowdownState, player: PlayerId): TeamIndex | null {
  if (state.teams[0].includes(player)) return 0
  if (state.teams[1].includes(player)) return 1
  return null
}

/** Regular rounds: the bigger team's size, times two when everyone draws twice. */
export function regularRoundCount(teams: readonly (readonly PlayerId[])[], turns: Turns): number {
  return Math.max(...teams.map((team) => team.length)) * (turns === 'twice' ? 2 : 1)
}

/** Round wins by team. */
export function roundWins(state: SketchShowdownState): [number, number] {
  const wins: [number, number] = [0, 0]
  for (const round of state.rounds) if (round.winner !== null) wins[round.winner] += 1
  return wins
}

/** Seconds the current phase lasts, for the engine timer. Null: the phase waits for the host. */
export function phaseSeconds(state: SketchShowdownState): number | null {
  switch (state.phase) {
    case 'pick':
      return PICK_SECONDS
    case 'countdown':
      return COUNTDOWN_SECONDS
    case 'race':
      return RACE_SECONDS[state.settings.pace]
    case 'vote':
      return VOTE_SECONDS
    case 'reveal':
    case 'over':
      return null
  }
}

/** Why a guess can't be sent right now, or null if it can. The phone shows this; the rules ignore refused guesses. */
export type GuessProblem = 'locked-out' | 'already-guessed' | 'empty' | 'not-guessing'

export function guessProblem(state: SketchShowdownState, player: PlayerId, text: string, now: number): GuessProblem | null {
  const team = teamOf(state, player)
  const round = currentRound(state)
  if (state.phase !== 'race' || team === null || round.drawers[team] === player || round.winner !== null) {
    return 'not-guessing'
  }
  const cleaned = cleanGuess(text)
  if (!cleaned) return 'empty'
  if (now < (round.lockedUntil[player] ?? 0)) return 'locked-out'
  if (round.guesses[team].some((guess) => cleanGuess(guess.text) === cleaned)) return 'already-guessed'
  return null
}

/** How much a team's drawer has drawn: total stroke length in canvas widths. Drives the TV's ink meter. */
export function inkUsed(strokes: readonly Stroke[]): number {
  let total = 0
  for (const stroke of strokes) {
    if (stroke.tool === 'eraser') continue
    for (let i = 1; i < stroke.points.length; i++) {
      const [x1, y1] = stroke.points[i - 1]
      const [x2, y2] = stroke.points[i]
      total += Math.hypot(x2 - x1, y2 - y1)
    }
  }
  return total
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Each team cycles from a random first drawer, so the smaller team's extra turns fall to different players. */
function makeDrawOrder(team: readonly PlayerId[], rounds: number, random: () => number): PlayerId[] {
  const start = Math.floor(random() * team.length)
  return Array.from({ length: rounds }, (_, i) => team[(start + i) % team.length])
}

function newRound(state: SketchShowdownState, drawers: [PlayerId, PlayerId], suddenDeath: boolean): SketchShowdownState {
  const options = state.deck.slice(state.dealt, state.dealt + OPTIONS_PER_PICK)
  if (options.length < OPTIONS_PER_PICK) throw new Error('The clue pack ran out of clues.')
  const round: Round = {
    drawers,
    options,
    picks: {},
    clue: null,
    howChosen: null,
    startedAt: null,
    drawings: [[], []],
    guesses: [[], []],
    lockedUntil: {},
    winner: null,
    winningGuess: null,
    suddenDeath,
  }
  return { ...state, dealt: state.dealt + OPTIONS_PER_PICK, rounds: [...state.rounds, round], phase: 'pick' }
}

function withRound(state: SketchShowdownState, change: Partial<Round>): SketchShowdownState {
  const rounds = [...state.rounds]
  rounds[rounds.length - 1] = { ...currentRound(state), ...change }
  return { ...state, rounds }
}

/** Same pick: that clue. Different picks: a coin flip between them. One pick: theirs. None: random from the 3. */
function chooseClue(state: SketchShowdownState, random: () => number): SketchShowdownState {
  const round = currentRound(state)
  const picks = round.drawers.map((drawer) => round.picks[drawer]).filter((pick) => pick !== undefined)
  let index: number
  let howChosen: HowChosen
  if (picks.length === 2 && picks[0] === picks[1]) [index, howChosen] = [picks[0], 'both']
  else if (picks.length === 2) [index, howChosen] = [picks[random() < 0.5 ? 0 : 1], 'coin']
  else if (picks.length === 1) [index, howChosen] = [picks[0], 'one']
  else [index, howChosen] = [Math.floor(random() * round.options.length), 'random']
  return { ...withRound(state, { clue: round.options[index], howChosen }), phase: 'countdown' }
}

function isValidStroke(stroke: Stroke): boolean {
  return (
    TOOLS.includes(stroke.tool) &&
    BRUSH_SIZES.includes(stroke.size) &&
    Number.isInteger(stroke.color) &&
    stroke.color >= 0 &&
    stroke.color < SWATCHES.length &&
    Array.isArray(stroke.points) &&
    stroke.points.length >= 1 &&
    stroke.points.length <= MAX_STROKE_POINTS &&
    stroke.points.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        point.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1),
    )
  )
}

/** Changes the drawer's own canvas, only while the race is on. */
function draw(state: SketchShowdownState, player: PlayerId, change: (strokes: Stroke[]) => Stroke[]): SketchShowdownState {
  const round = currentRound(state)
  const team = round.drawers.indexOf(player)
  if (state.phase !== 'race' || team === -1 || round.winner !== null) return state
  const drawings: [Stroke[], Stroke[]] = [...round.drawings]
  drawings[team] = change(drawings[team])
  return withRound(state, { drawings })
}

function guess(state: SketchShowdownState, player: PlayerId, text: string, ctx: RulesContext, isWord: (word: string) => boolean) {
  if (guessProblem(state, player, text, ctx.now)) return state
  const team = teamOf(state, player)!
  const round = currentRound(state)
  const entry: TeamGuess = { player, text: text.trim(), at: ctx.now }
  const guesses: [TeamGuess[], TeamGuess[]] = [...round.guesses]
  guesses[team] = [...guesses[team], entry]
  if (guessMatches(text, round.clue!, isWord)) {
    return { ...withRound(state, { guesses, winner: team, winningGuess: entry }), phase: 'reveal' as const }
  }
  return withRound(state, { guesses, lockedUntil: { ...round.lockedUntil, [player]: ctx.now + LOCKOUT_MS } })
}

/** Most votes wins; a tied vote, or no votes, is a random pick among the tied (or the whole team). */
function nominee(state: SketchShowdownState, team: TeamIndex, random: () => number): PlayerId {
  const members = state.teams[team]
  const counts = new Map<PlayerId, number>()
  for (const [voter, choice] of Object.entries(state.votes)) {
    if (members.includes(voter) && members.includes(choice)) counts.set(choice, (counts.get(choice) ?? 0) + 1)
  }
  const most = Math.max(0, ...counts.values())
  const leaders = most === 0 ? [...members] : members.filter((member) => counts.get(member) === most)
  return leaders[Math.floor(random() * leaders.length)]
}

function afterReveal(state: SketchShowdownState): SketchShowdownState {
  const round = currentRound(state)
  if (round.suddenDeath) return { ...state, phase: 'over' }
  const regular = state.drawOrder[0].length
  if (state.rounds.length < regular) {
    const i = state.rounds.length
    return newRound(state, [state.drawOrder[0][i], state.drawOrder[1][i]], false)
  }
  const [a, b] = roundWins(state)
  return a === b ? { ...state, phase: 'vote', votes: {} } : { ...state, phase: 'over' }
}

/** The rulebook. Guess matching needs the shared dictionary, so the engine builds the rules once it has loaded. */
export function sketchShowdownRules(
  isWord: (word: string) => boolean,
): GameRules<SketchShowdownState, SketchShowdownSettings, SketchShowdownInput> {
  return {
    setup(_players, settings, ctx, teams) {
      if (!teams || teams.length !== 2) throw new Error('Sketch Showdown needs exactly two teams.')
      for (const team of teams) {
        if (team.length < MIN_TEAM_SIZE || team.length > MAX_TEAM_SIZE) {
          throw new Error(`Each Sketch Showdown team needs ${MIN_TEAM_SIZE} to ${MAX_TEAM_SIZE} players.`)
        }
      }
      if (teams[0].length + teams[1].length < manifest.players.min) {
        throw new Error(`Sketch Showdown needs at least ${manifest.players.min} players.`)
      }
      const rounds = regularRoundCount(teams, settings.turns)
      const state: SketchShowdownState = {
        teams: [[...teams[0]], [...teams[1]]],
        settings,
        drawOrder: [makeDrawOrder(teams[0], rounds, ctx.random), makeDrawOrder(teams[1], rounds, ctx.random)],
        deck: shuffled(CLUES, ctx.random),
        dealt: 0,
        rounds: [],
        phase: 'pick',
        votes: {},
      }
      return newRound(state, [state.drawOrder[0][0], state.drawOrder[1][0]], false)
    },

    onInput(state, player, input, ctx) {
      const round = currentRound(state)
      switch (input.type) {
        case 'pick': {
          if (state.phase !== 'pick' || !round.drawers.includes(player) || player in round.picks) return state
          if (!Number.isInteger(input.option) || input.option < 0 || input.option >= round.options.length) return state
          const picked = withRound(state, { picks: { ...round.picks, [player]: input.option } })
          const bothIn = round.drawers.every((drawer) => drawer in currentRound(picked).picks)
          return bothIn ? chooseClue(picked, ctx.random) : picked
        }
        case 'stroke':
          return isValidStroke(input.stroke) ? draw(state, player, (strokes) => [...strokes, input.stroke]) : state
        case 'undo':
          return draw(state, player, (strokes) => strokes.slice(0, -1))
        case 'clear':
          return draw(state, player, () => [])
        case 'guess':
          return typeof input.text === 'string' ? guess(state, player, input.text, ctx, isWord) : state
        case 'vote': {
          const team = teamOf(state, player)
          if (state.phase !== 'vote' || team === null || !state.teams[team].includes(input.nominee)) return state
          return { ...state, votes: { ...state.votes, [player]: input.nominee } }
        }
      }
      return state
    },

    /**
     * pick: choose the clue. countdown: start the race. race: time's up, or the host ended the round, with no winner.
     * reveal: the host's Next. vote: nominate and start the sudden-death round.
     */
    onTimer(state, ctx) {
      switch (state.phase) {
        case 'pick':
          return chooseClue(state, ctx.random)
        case 'countdown':
          return { ...withRound(state, { startedAt: ctx.now }), phase: 'race' }
        case 'race':
          return { ...state, phase: 'reveal' }
        case 'reveal':
          return afterReveal(state)
        case 'vote':
          return newRound(state, [nominee(state, 0, ctx.random), nominee(state, 1, ctx.random)], true)
        case 'over':
          return state
      }
    },

    isOver(state) {
      return state.phase === 'over'
    },

    /** The team with more round wins first. Level (including a host ending the game early) is a tie. */
    finishingOrder(state): FinishingOrder {
      const [a, b] = roundWins(state)
      if (a === b) return [[...state.teams[0], ...state.teams[1]]]
      return a > b ? [[...state.teams[0]], [...state.teams[1]]] : [[...state.teams[1]], [...state.teams[0]]]
    },
  }
}

/** Revealed rounds show everything to everyone. */
function isRevealed(state: SketchShowdownState, round: Round): boolean {
  return round !== currentRound(state) || state.phase === 'reveal' || state.phase === 'vote' || state.phase === 'over'
}

export type Role = 'drawer' | 'guesser'

/** What one player's phone may know. Never the other team's sketch or guesses, and never the clue before the reveal unless you draw it. */
export interface PlayerView {
  phase: Phase
  team: TeamIndex
  role: Role
  roundNumber: number
  regularRounds: number
  suddenDeath: boolean
  drawers: [PlayerId, PlayerId]
  /** Your team's drawing; both once the round is revealed. */
  drawings: [Stroke[] | null, Stroke[] | null]
  /** Your team's guesses; both once the round is revealed. */
  guesses: [TeamGuess[] | null, TeamGuess[] | null]
  /** Drawers only: the three options they chose from. */
  options: Clue[] | null
  /** Drawers only: which option you picked. */
  myPick: number | null
  /** Drawers from the countdown on; everyone at the reveal. */
  clue: Clue | null
  howChosen: HowChosen | null
  startedAt: number | null
  lockedUntil: number
  winner: TeamIndex | null
  winningGuess: TeamGuess | null
  wins: [number, number]
  /** During the vote: who you nominated. */
  myVote: PlayerId | null
}

export function playerView(state: SketchShowdownState, player: PlayerId): PlayerView {
  const team = teamOf(state, player)
  if (team === null) throw new Error(`${player} isn't on a team.`)
  const round = currentRound(state)
  const revealed = isRevealed(state, round)
  const drawing = round.drawers[team] === player
  const knowsClue = revealed || (drawing && state.phase !== 'pick')
  const own = <T,>(pair: [T, T]): [T | null, T | null] =>
    revealed ? [pair[0], pair[1]] : team === 0 ? [pair[0], null] : [null, pair[1]]
  return {
    phase: state.phase,
    team,
    role: drawing ? 'drawer' : 'guesser',
    roundNumber: state.rounds.length,
    regularRounds: state.drawOrder[0].length,
    suddenDeath: round.suddenDeath,
    drawers: round.drawers,
    drawings: own(round.drawings),
    guesses: own(round.guesses),
    options: drawing ? round.options : null,
    myPick: drawing ? (round.picks[player] ?? null) : null,
    clue: knowsClue ? round.clue : null,
    howChosen: drawing || revealed ? round.howChosen : null,
    startedAt: round.startedAt,
    lockedUntil: round.lockedUntil[player] ?? 0,
    winner: round.winner,
    winningGuess: round.winningGuess,
    wins: roundWins(state),
    myVote: state.phase === 'vote' ? (state.votes[player] ?? null) : null,
  }
}

/** What the TV may show. It is often screen-shared on a call, so no strokes, guess text or clue until the reveal. */
export interface TvView {
  phase: Phase
  roundNumber: number
  regularRounds: number
  suddenDeath: boolean
  drawers: [PlayerId, PlayerId]
  teams: [PlayerId[], PlayerId[]]
  wins: [number, number]
  startedAt: number | null
  /** Live ink meter per team. */
  ink: [number, number]
  wrongGuessCounts: [number, number]
  /** Filled in at the reveal. */
  reveal: { clue: Clue; drawings: [Stroke[], Stroke[]]; guesses: [TeamGuess[], TeamGuess[]]; winner: TeamIndex | null; winningGuess: TeamGuess | null } | null
  /** Every round's two drawings and answer, once the game is over. */
  gallery: { clue: Clue; drawings: [Stroke[], Stroke[]]; winner: TeamIndex | null }[] | null
}

export function tvView(state: SketchShowdownState): TvView {
  const round = currentRound(state)
  const wrong = (team: TeamIndex) => round.guesses[team].filter((g) => g !== round.winningGuess).length
  return {
    phase: state.phase,
    roundNumber: state.rounds.length,
    regularRounds: state.drawOrder[0].length,
    suddenDeath: round.suddenDeath,
    drawers: round.drawers,
    teams: state.teams,
    wins: roundWins(state),
    startedAt: round.startedAt,
    ink: [inkUsed(round.drawings[0]), inkUsed(round.drawings[1])],
    wrongGuessCounts: [wrong(0), wrong(1)],
    reveal:
      isRevealed(state, round) && round.clue
        ? { clue: round.clue, drawings: round.drawings, guesses: round.guesses, winner: round.winner, winningGuess: round.winningGuess }
        : null,
    gallery:
      state.phase === 'over'
        ? state.rounds
            .filter((r) => r.clue)
            .map((r) => ({ clue: r.clue!, drawings: r.drawings, winner: r.winner }))
        : null,
  }
}
