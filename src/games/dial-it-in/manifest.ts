// ABOUTME: The Dial It In label: title, pitch, player range, modes and its settings.
// ABOUTME: Spec lives in docs/games/dial-it-in.md. Status stays "coming-soon" until tests pass and a local playtest.

import type { GameManifest } from '../types'

/** How wide the dial is: 1 to 50 is easier, 1 to 100 is the standard game. */
export type DialRange = 50 | 100

export interface DialItInSettings {
  range: DialRange
}

export const manifest: GameManifest<DialItInSettings> = {
  id: 'dial-it-in',
  title: 'Dial It In',
  pitch: 'Guess where the clue lands between two opposites, 1 to 100.',
  tag: 'Brainy',
  players: { min: 3, max: 10 },
  lengthMinutes: 20,
  modes: ['individual'],
  status: 'coming-soon',
  defaultSettings: { range: 100 },
}
