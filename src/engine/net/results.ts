// ABOUTME: Saved game results at results/{resultId}: the game, the room, when, and each person's place and points.
// ABOUTME: The room's host saves a result once per game; a lobby room also adds it to the night's session.

import { get, ref, serverTimestamp, set } from 'firebase/database'
import { firebaseBackend } from './firebase'
import { addSessionGame, type Room } from './rooms'

export interface PlayerResult {
  /** 1 is first; tied players share a place. */
  place: number
  points: number
}

export interface GameResult {
  id: string
  game: string
  room: string
  at: number
  /** Everyone who played, bots included. */
  size: number
  /** People only, by sign-in uid. Bots play but aren't kept. */
  players: Record<string, PlayerResult>
}

function resultRef(id = '') {
  return ref(firebaseBackend().database, `results${id ? `/${id}` : ''}`)
}

/** The id of the result for the game a room is playing now; null if the game has no start stamp. */
export function resultIdFor(room: Room): string | null {
  return room.play?.startedAt ? `${room.code}-${room.play.startedAt}` : null
}

/** Ids this device has already saved (or is saving), so a finished game that is published again saves once. */
const saved = new Set<string>()

/**
 * Host only: saves a finished game's places and points for the people in it. Saving the same game again does
 * nothing (the rules refuse to change a saved result). In a lobby room the game joins the night's session.
 * The write is sent without reading first, so a phone that is offline when the game ends keeps it queued and
 * saves once it's back online.
 */
export async function saveResult(room: Room, game: string, players: Record<string, PlayerResult>, size: number): Promise<void> {
  const id = resultIdFor(room)
  if (!id || saved.has(id)) return
  saved.add(id)
  const at = Date.now()
  try {
    try {
      // The server stamps the time, so a result can't be dated past a later leaderboard reset.
      await set(resultRef(id), { game, room: room.code, at: serverTimestamp(), size, players })
    } catch (refused) {
      // Refused is fine when the result is already there (this host reloaded after saving it); anything else is a real failure.
      if (!(await get(resultRef(id))).exists()) throw refused
    }
    if (room.lobby) {
      const points = Object.fromEntries(Object.entries(players).map(([uid, result]) => [uid, result.points]))
      await addSessionGame(room.code, id, { game, at, points })
    }
  } catch (error) {
    saved.delete(id)
    console.error('Saving the game result failed', error)
  }
}

export function asResults(value: unknown): GameResult[] {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value as Record<string, Omit<GameResult, 'id'>>)
    .filter(([, result]) => result && typeof result.game === 'string' && result.players)
    .map(([id, result]) => ({ ...result, id }))
}
