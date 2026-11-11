// ABOUTME: The three lobby styles the host can choose from, with the labels and swatches shown in Host settings.
// ABOUTME: Each id matches a [data-theme] block in themes.css.

export type LobbyStyleId = 'game-show' | 'arcade' | 'rec-room'

export interface LobbyStyle {
  id: LobbyStyleId
  label: string
  swatches: string[]
}

export const LOBBY_STYLES: LobbyStyle[] = [
  {
    id: 'game-show',
    label: 'Retro game show',
    swatches: ['#F0592A', '#F2B630', '#F6E7C8', '#177A74', '#3D6FD9'],
  },
  {
    id: 'arcade',
    label: '90s arcade',
    swatches: ['#FF2EA6', '#22E4FF', '#FFE600', '#39FF6A', '#FF6A13'],
  },
  {
    id: 'rec-room',
    label: '70s rec room',
    swatches: ['#D9A21B', '#C8551F', '#7A8B3A', '#F3EBD3', '#2F4A4F'],
  },
]

export const DEFAULT_LOBBY_STYLE: LobbyStyleId = 'game-show'

export function isLobbyStyleId(value: unknown): value is LobbyStyleId {
  return LOBBY_STYLES.some((style) => style.id === value)
}
