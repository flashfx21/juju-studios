// ABOUTME: What each game in the picker can do right now: pickable "in testing" games and what picking one offers.
// ABOUTME: A game is pickable when it has a Solo play page and this player may use Solo play; nothing here marks a game playable.
import type { LineupGame } from '../games/lineup'
import type { PickerState } from '../ui/gameTileStates'
import { PLAYTESTS } from './playtests'

export function pickerState(game: LineupGame, canPlaytest: boolean): PickerState {
  if (canPlaytest && game.id in PLAYTESTS) return 'ready'
  return game.phase === 'development' || game.phase === 'solo-test' || game.phase === 'group-test'
    ? 'development'
    : 'coming-soon'
}

export interface PickAction {
  label: string
  /** The Solo play page (#/playtest/<page>) the action opens. */
  page: string
}

/** Buttons offered once a game is picked. Games not listed get a single "Play solo" for their own page. */
const ACTIONS: Record<string, PickAction[]> = {
  'pin-drop': [
    { label: 'Play solo with bots', page: 'pin-drop' },
    { label: 'Start a room', page: 'pin-drop-together' },
  ],
  'dial-it-in': [
    { label: 'Play solo with bots', page: 'dial-it-in' },
    { label: 'Start a room', page: 'dial-it-in-together' },
  ],
  'dont-jinx-it': [
    { label: 'Play solo with bots', page: 'dont-jinx-it' },
    { label: 'Start a room', page: 'dont-jinx-it-together' },
  ],
  'sketch-showdown': [{ label: 'Draw with bots', page: 'sketch-showdown' }],
  chainword: [
    { label: 'Play solo', page: 'chainword' },
    { label: 'Start a room', page: 'chainword-together' },
  ],
}

export function pickActions(gameId: string): PickAction[] {
  return ACTIONS[gameId] ?? [{ label: 'Play solo', page: gameId }]
}

/** Six tiles fill the picker; more games go on further pages. */
export const TILES_PER_PAGE = 6
