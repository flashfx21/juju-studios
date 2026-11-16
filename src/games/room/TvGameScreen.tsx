// ABOUTME: Shows a room's game on the TV, loading that game's TV screen only when a TV shows it.
// ABOUTME: Covers the games in tvGames.ts; anything else renders nothing.
import { lazy } from 'react'
import type { Room } from '../../engine/net/rooms'

const DibsTv = lazy(() => import('../dibs/TvGame').then((module) => ({ default: module.TvGame })))
const ZeroInTv = lazy(() => import('../zero-in/TvGame').then((module) => ({ default: module.TvGame })))

export function TvGameScreen({ room }: { room: Room }) {
  if (room.game === 'zero-in') return <ZeroInTv room={room} />
  if (room.game === 'dibs') return <DibsTv room={room} />
  return null
}
