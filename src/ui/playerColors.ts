// ABOUTME: The six player colors, their shade in each lobby style, and the readable ink to put on each one.
// ABOUTME: Hex values match --player-* in themes.css; ink follows the design's contrast rule (white or near-black).
import type { LobbyStyleId } from './themes/lobbyStyles'

export type PlayerColorId = 'red' | 'gold' | 'teal' | 'blue' | 'pink' | 'olive'

export const PLAYER_COLOR_IDS: PlayerColorId[] = ['red', 'gold', 'teal', 'blue', 'pink', 'olive']

export const PLAYER_COLOR_NAMES: Record<PlayerColorId, string> = {
  red: 'Red',
  gold: 'Gold',
  teal: 'Teal',
  blue: 'Blue',
  pink: 'Pink',
  olive: 'Olive',
}

export const PLAYER_COLORS: Record<LobbyStyleId, Record<PlayerColorId, string>> = {
  'game-show': { red: '#C2302B', gold: '#F2B630', teal: '#177A74', blue: '#3D6FD9', pink: '#E8489A', olive: '#7A8B3A' },
  arcade: { red: '#FF4F45', gold: '#FFE600', teal: '#22E4FF', blue: '#7B93FF', pink: '#FF2EA6', olive: '#39FF6A' },
  'rec-room': { red: '#B4481A', gold: '#D9A21B', teal: '#2F6F6A', blue: '#2E4F8F', pink: '#B8456E', olive: '#7A8B3A' },
}

/** White or near-black, whichever contrasts more with the given color. */
export function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.0563 ? '#FFFFFF' : '#15120C'
}
