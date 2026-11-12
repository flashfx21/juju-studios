// ABOUTME: Pin Drop's cartridge label: title, pitch, player counts and the host's scoring, pace, rounds, units and labels settings.
// ABOUTME: Player count and length are placeholders from docs/games/06-pin-drop.md.
import type { GameManifest } from '../types'

export const manifest: GameManifest = {
  id: 'pin-drop',
  title: 'Pin Drop',
  pitch: 'A photo appears. Drop your pin on the map. Closest wins.',
  tag: 'Travel',
  players: { min: 2, max: 10 },
  minutes: 12,
  modes: ['individual'],
  status: 'coming-soon',
  settings: [
    { id: 'scoring', label: 'Scoring', options: ['match', 'stroke'], default: 'match' },
    { id: 'pace', label: 'Seconds per round', options: [45, 60, 90], default: 60 },
    { id: 'rounds', label: 'Rounds', options: [5, 7, 9], default: 7 },
    { id: 'units', label: 'Units', options: ['mi', 'km'], default: 'mi' },
    { id: 'labels', label: 'Map labels', options: ['on', 'off'], default: 'on' },
  ],
}
