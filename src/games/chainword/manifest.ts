// ABOUTME: Chainword's cartridge label: title, pitch, player counts and the host's word and chain length settings.
// ABOUTME: Player count and length are placeholders from docs/games/chainword.md.
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'chainword',
  title: 'Chainword',
  pitch: 'Race a chain of words in hard mode. Fewest guesses wins.',
  tag: 'Words',
  players: { min: 2, max: 10 },
  minutes: 10,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [
    { id: 'wordLength', label: 'Letters per word', options: [4, 5, 6, 7], default: 5 },
    { id: 'chainLength', label: 'Words in the chain', options: [3, 5], default: 3 },
  ],
}
