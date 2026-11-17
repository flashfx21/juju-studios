// ABOUTME: How each player in a Don't Jinx It room appears on its screens: a name and a player color.
// ABOUTME: People come from their room entry, bots from their own look; the phones and the room's TV share it.
import type { Room } from '../../engine/net/rooms'
import { PLAYER_COLOR_IDS, type PlayerColorId } from '../../ui/playerColors'
import { botFor } from '../room/bots'
import type { PlayerId } from '../types'
import type { Seat } from './Pieces'

/** How each player appears: people as their room entry, bots as their own look. */
export function useSeats(room: Room, players: readonly PlayerId[]): Record<PlayerId, Seat> {
  const seats: Record<PlayerId, Seat> = {}
  for (const id of players) {
    const bot = botFor(id)
    const person = room.players[id]
    if (bot) seats[id] = { name: bot.look.name, color: bot.look.color }
    else {
      const color = person && PLAYER_COLOR_IDS.includes(person.color as PlayerColorId) ? (person.color as PlayerColorId) : 'silver'
      seats[id] = { name: person?.username ?? 'Player', color }
    }
  }
  return seats
}
