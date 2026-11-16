// ABOUTME: Dibs' cartridge label: title, pitch, player counts and the host's pace, rounds and categories settings.
// ABOUTME: Player count and length come from docs/games/13-dibs.md (length is an estimate, not playtested).
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'dibs',
  title: 'Dibs',
  pitch: 'A category, then a letter. Race to claim an answer that fits. First claim keeps it.',
  tag: 'Words',
  players: { min: 2, max: 10 },
  minutes: 10,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [
    {
      id: 'pace',
      label: 'Pace',
      options: ['quick', 'normal', 'relaxed'],
      default: 'normal',
    },
    { id: 'rounds', label: 'Rounds', options: [5, 7, 9], default: 7 },
    {
      id: 'categories',
      label: 'Categories',
      options: ['family', 'everything'],
      default: 'family',
    },
  ],
}
