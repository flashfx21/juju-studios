// ABOUTME: Zero In's cartridge label: title, pitch, player counts and the host's pace, rounds and lanes settings.
// ABOUTME: Player count and length come from docs/games/03-zero-in.md (length is an estimate, not playtested).
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'zero-in',
  title: 'Zero In',
  pitch: "Guess a price, year or number. Closest wins. The final round: don't go over.",
  tag: 'Game show',
  players: { min: 3, max: 10 },
  minutes: 10,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [
    { id: 'pace', label: 'Pace', options: ['quick', 'normal', 'relaxed'], default: 'normal' },
    { id: 'rounds', label: 'Rounds', options: [5, 10, 15], default: 10 },
    { id: 'lanes', label: 'Lanes', options: ['mix', 'price', 'year', 'number'], default: 'mix' },
  ],
}
