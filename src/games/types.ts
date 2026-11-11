// ABOUTME: Draft types for the cartridge contract: what every game's manifest and rules module provides.
// ABOUTME: A minimal stand-in until the engine's contract is built (build order step 6); expect it to change.

import type { GameStatus } from './lineup'

/** A player as the rules see them. Profile details (color, initials) stay with the engine. */
export interface Player {
  id: string
  name: string
}

export type GameMode = 'individual' | 'teams'

/** The label on the cartridge: what the game picker and lobby show. */
export interface GameManifest<Settings> {
  id: string
  title: string
  pitch: string
  tag: string
  players: { min: number; max: number }
  lengthMinutes: number
  modes: GameMode[]
  status: GameStatus
  defaultSettings: Settings
}

/** Returns a number from 0 (inclusive) to 1 (exclusive), like Math.random. Passed in so tests can fix the outcome. */
export type Random = () => number

/** One place in a finishing order. Players who tie share a place. */
export type FinishingPlace = string[]

/** The rulebook: pure functions the host runs. No screens, no network. */
export interface GameRules<State, Settings, Input> {
  setup(players: Player[], settings: Settings, random?: Random): State
  onInput(state: State, playerId: string, input: Input): State
  onTimer(state: State): State
  isOver(state: State): boolean
  /** Best first. Each entry is one place holding the ids of everyone tied there. */
  finishingOrder(state: State): FinishingPlace[]
}
