// ABOUTME: Shows a room's game on the TV, loading that game's TV screen only when a TV shows it.
// ABOUTME: Covers the games in tvGames.ts; anything else renders nothing.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { Room } from '../../engine/net/rooms'

type TvGame = LazyExoticComponent<ComponentType<{ room: Room }>>

const SCREENS: Record<string, TvGame> = {
  'dial-it-in': lazy(() => import('../dial-it-in/TvGame').then((module) => ({ default: module.TvGame }))),
  'zero-in': lazy(() => import('../zero-in/TvGame').then((module) => ({ default: module.TvGame }))),
  chainword: lazy(() => import('../chainword/TvGame').then((module) => ({ default: module.TvGame }))),
  'sketch-showdown': lazy(() => import('../sketch-showdown/TvGame').then((module) => ({ default: module.TvGame }))),
  'pin-drop': lazy(() => import('../pin-drop/TvGame').then((module) => ({ default: module.TvGame }))),
  'dont-jinx-it': lazy(() => import('../dont-jinx-it/TvGame').then((module) => ({ default: module.TvGame }))),
  dibs: lazy(() => import('../dibs/TvGame').then((module) => ({ default: module.TvGame }))),
}

export function TvGameScreen({ room }: { room: Room }) {
  const Screen = SCREENS[room.game]
  return Screen ? <Screen room={room} /> : null
}
