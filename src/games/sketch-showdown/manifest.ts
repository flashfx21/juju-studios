// ABOUTME: Sketch Showdown's cartridge label: title, pitch, player counts and the host's turns and pace settings.
// ABOUTME: Team mode only: two teams of 2 to 5. Length is an estimate from docs/games/05-sketch-showdown.md.
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'sketch-showdown',
  title: 'Sketch Showdown',
  pitch: 'Two teams, one clue, two drawers. First team to guess wins.',
  tag: 'Teams',
  players: { min: 4, max: 10 },
  minutes: 15,
  modes: ['teams'],
  status: 'coming-soon',
  settings: [
    { id: 'turns', label: 'Turns', options: ['once', 'twice'], default: 'once' },
    { id: 'pace', label: 'Pace', options: ['quick', 'normal', 'relaxed'], default: 'normal' },
  ],
}
