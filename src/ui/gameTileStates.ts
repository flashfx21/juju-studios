// ABOUTME: The states a game picker tile can be in, and the words each one shows on the tile.
// ABOUTME: ready means in testing and pickable; the other two are shown but can't be picked yet.

export type PickerState = 'ready' | 'development' | 'coming-soon'

export const PICKER_STATE_LABELS: Record<PickerState, string> = {
  ready: 'In testing',
  development: 'In development',
  'coming-soon': 'Coming soon',
}
