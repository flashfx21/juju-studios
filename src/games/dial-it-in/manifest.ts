// ABOUTME: Dial It In's cartridge label: title, pitch, player counts and the host's dial range setting.
// ABOUTME: Player count and length are placeholders from docs/games/dial-it-in.md.
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'dial-it-in',
  title: 'Dial It In',
  pitch: 'Guess where the clue lands between two opposites, 1 to 100.',
  tag: 'Brainy',
  players: { min: 3, max: 10 },
  minutes: 20,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [{ id: 'range', label: 'Dial range', options: [50, 100], default: 100 }],
}
