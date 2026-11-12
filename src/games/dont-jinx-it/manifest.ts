// ABOUTME: Don't Jinx It's cartridge label: title, pitch, player counts and the host's pace and long game settings.
// ABOUTME: Individual mode only until teams exist (phase 2). Length is a placeholder from docs/games/12-dont-jinx-it.md.
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'dont-jinx-it',
  title: "Don't Jinx It",
  pitch: 'Give one-word clues to the guesser. Matching clues cancel out.',
  tag: 'Words',
  players: { min: 3, max: 10 },
  minutes: 15,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [
    { id: 'pace', label: 'Pace', options: ['quick', 'normal', 'relaxed'], default: 'normal' },
    { id: 'longGame', label: 'Everyone guesses twice', options: ['off', 'on'], default: 'off' },
  ],
}
