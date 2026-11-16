// ABOUTME: Host only: turns a finished room game's finishing order into places and points, and saves them for the people in it.
// ABOUTME: Bots take their place in the scoring but aren't saved. A game with fewer than 3 people is practice: games skip saving it.
import { saveResult } from '../../engine/net/results'
import type { Room } from '../../engine/net/rooms'
import { placesAndPoints } from '../../engine/scoring'
import type { FinishingOrder, PlayerId, Teams } from '../types'
import { botFor } from './bots'

/** Fewer people than this (bots don't count) makes a practice game: it isn't saved. */
const PRACTICE_BELOW = 3

export function isPractice(players: readonly PlayerId[]): boolean {
  return players.filter((id) => !botFor(id)).length < PRACTICE_BELOW
}

export function saveFinishedGame(room: Room, game: string, order: FinishingOrder, teams?: Teams): void {
  const people = Object.entries(placesAndPoints(order, teams)).filter(([id]) => !botFor(id))
  void saveResult(room, game, Object.fromEntries(people), order.flat().length)
}
