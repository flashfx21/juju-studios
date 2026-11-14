// ABOUTME: Host only: turns a finished room game's finishing order into places and points, and saves them for the people in it.
// ABOUTME: Bots take their place in the scoring but aren't saved.
import { saveResult } from '../../engine/net/results'
import type { Room } from '../../engine/net/rooms'
import { placesAndPoints } from '../../engine/scoring'
import type { FinishingOrder, Teams } from '../types'
import { botFor } from './bots'

export function saveFinishedGame(room: Room, game: string, order: FinishingOrder, teams?: Teams): void {
  const people = Object.entries(placesAndPoints(order, teams)).filter(([id]) => !botFor(id))
  void saveResult(room, game, Object.fromEntries(people), order.flat().length)
}
