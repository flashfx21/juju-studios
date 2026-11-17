// ABOUTME: Pin Drop's players as the map draws them: initials, color and symbol for each pin.
// ABOUTME: Shared by the phone and TV screens, so both keep the map's pins steady while nothing about a look changes.
import { useMemo } from 'react'
import type { PlayerId } from '../types'
import type { MapPlayer } from './PinMap'
import type { PinDropState } from './rules'

/** The players as the map draws them. The list only changes when a look does, so the map keeps its pins (and a drag in progress). */
export function useMapPlayers(state: PinDropState, looks: Record<PlayerId, Omit<MapPlayer, 'id'>>): MapPlayer[] {
  const drawn = JSON.stringify(state.players.map((id) => ({ id, initials: looks[id].initials, color: looks[id].color, symbol: looks[id].symbol })))
  return useMemo(() => JSON.parse(drawn) as MapPlayer[], [drawn])
}
