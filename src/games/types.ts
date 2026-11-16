// ABOUTME: Draft types for the cartridge contract: what every game's manifest and rules must provide.
// ABOUTME: Shared by all games; the engine calls a game only through these shapes.

import type { GameStatus } from './lineup'

export type { GameStatus }

export type GameMode = 'individual' | 'teams'

/** One choice a host can set before a game starts. */
export interface GameSetting {
  id: string
  label: string
  options: readonly (string | number)[]
  default: string | number
}

/** The label on the cartridge: what the picker and lobby show. */
export interface GameManifest {
  id: string
  title: string
  pitch: string
  tag: string
  players: { min: number; max: number }
  minutes: number
  modes: readonly GameMode[]
  status: GameStatus
  settings: readonly GameSetting[]
}

/** The words on a game's How to play page, written for players. Title, tag, players and length come from the manifest. */
export interface HowToPlay {
  /** One or two sentences that open the page. */
  intro: string
  /** What the TV and the phones do. */
  needs: readonly string[]
  steps: readonly string[]
  scoring: readonly string[]
  goodToKnow: readonly string[]
  /** Each setting the host picks before the game, with its choices. */
  hostPicks: readonly string[]
}

export type PlayerId = string

/**
 * Teams for a team game, made by the engine before setup (split at random, then the host can swap and lock).
 * Each inner list is one team's players.
 */
export type Teams = readonly (readonly PlayerId[])[]

/**
 * Everything impure a rule needs, passed in by the engine so rules stay pure.
 * `now` is milliseconds since the epoch; `random` returns a number in [0, 1).
 * `recent` lists pack items (by id) this device dealt in recent games, oldest first; setup deals them last.
 */
export interface RulesContext {
  now: number
  random: () => number
  recent?: readonly string[]
}

/**
 * Players or teams from first place to last. Each inner list is one place;
 * more than one id in a place means a tie. A team game lists the whole team's players in its place.
 */
export type FinishingOrder = PlayerId[][]

/** The rulebook: pure functions from state to state. */
export interface GameRules<State, Settings, Input> {
  /** Team games get `teams`; individual games never do. */
  setup(players: readonly PlayerId[], settings: Settings, ctx: RulesContext, teams?: Teams): State
  onInput(state: State, player: PlayerId, input: Input, ctx: RulesContext): State
  onTimer(state: State, ctx: RulesContext): State
  isOver(state: State): boolean
  finishingOrder(state: State): FinishingOrder
}
