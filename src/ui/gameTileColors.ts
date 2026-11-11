// ABOUTME: Each game's tile colors in each lobby style, so picker tiles never look like one repeated card.
// ABOUTME: Values come from the game picker in docs/design/source; games without an entry use the style's default.
import type { LobbyStyleId } from './themes/lobbyStyles'

export interface TileColors {
  /** Tile face (game show door, arcade cabinet body, rec room box). */
  bg: string
  /** Text on the face. */
  ink: string
  /** Arcade screen text; rec room stripe band colors. */
  accent?: string
  stripe?: string[]
}

export const GAME_TILE_COLORS: Record<LobbyStyleId, Record<string, TileColors>> = {
  'game-show': {
    'no-filler': { bg: '#F0592A', ink: '#12204A' },
    'dial-it-in': { bg: '#F2B630', ink: '#12204A' },
    'closest-without-going-over': { bg: '#F6E7C8', ink: '#12204A' },
    chainword: { bg: '#177A74', ink: '#FFF6D6' },
    'sketch-showdown': { bg: '#C2302B', ink: '#FFF6D6' },
    'pin-drop': { bg: '#3563C7', ink: '#FFF6D6' },
  },
  arcade: {
    'no-filler': { bg: '#141414', ink: '#FFFFFF', accent: '#39FF6A' },
    'dial-it-in': { bg: '#FF6A13', ink: '#FFFFFF', accent: '#FF8A3D' },
    'closest-without-going-over': { bg: '#22E4FF', ink: '#FFFFFF', accent: '#FFE600' },
    chainword: { bg: '#FFE600', ink: '#FFFFFF', accent: '#FFE600' },
    'sketch-showdown': { bg: '#FF2EA6', ink: '#FFFFFF', accent: '#22E4FF' },
    'pin-drop': { bg: '#2E2A3A', ink: '#FFFFFF', accent: '#39FF6A' },
  },
  'rec-room': {
    'no-filler': { bg: '#0B0B0B', ink: '#F5D000', stripe: ['#2DBE4E', '#F5D000', '#E5322B'] },
    'dial-it-in': { bg: '#B0461A', ink: '#F3EBD3', stripe: ['#D9A21B', '#F3EBD3'] },
    'closest-without-going-over': {
      bg: '#F3EBD3',
      ink: '#A23F15',
      stripe: ['#D9A21B', '#C8551F', '#7A8B3A', '#5A3A22'],
    },
    chainword: { bg: '#D9A21B', ink: '#3D2716', stripe: ['#C8551F', '#5A3A22'] },
    'sketch-showdown': { bg: '#5F6E2A', ink: '#F3EBD3', stripe: ['#D9A21B', '#C8551F'] },
    'pin-drop': { bg: '#2F4A4F', ink: '#E3B23C', stripe: ['#C8551F', '#D9A21B'] },
    'hidden-traitor': { bg: '#7A2E0D', ink: '#F3EBD3' },
    'word-agents': { bg: '#2E4F8F', ink: '#F3EBD3' },
    'board-game': { bg: '#D9A21B', ink: '#3D2716' },
    'maze-chase': { bg: '#2F4A4F', ink: '#E3B23C' },
    'snake-arena': { bg: '#5F6E2A', ink: '#F3EBD3' },
    'one-word-clue': { bg: '#B8456E', ink: '#F3EBD3' },
  },
}

/** Hard-stop color bands, e.g. the rec room box's stripe across the top. */
export function stripeGradient(colors: string[], direction: string): string {
  const step = 100 / colors.length
  const bands = colors.map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`)
  return `linear-gradient(${direction}, ${bands.join(', ')})`
}
