// ABOUTME: No Filler's cartridge label: title, pitch, player counts and the host's timer and target score settings.
// ABOUTME: Player count and length come from docs/games/01-no-filler.md (length is an estimate, not playtested).
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'no-filler',
  title: 'No Filler',
  pitch: 'Name 3 before time runs out. No um, no uh, no like.',
  tag: 'Party',
  players: { min: 3, max: 10 },
  minutes: 25,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [
    { id: 'timer', label: 'Timer', options: [5, 10, 15], default: 10 },
    { id: 'target', label: 'Target score', options: [10, 15], default: 15 },
  ],
}
