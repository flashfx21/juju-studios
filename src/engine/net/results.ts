// ABOUTME: Saved game results at results/{resultId}: the game, the room, when, and each person's place and points.
// ABOUTME: The room's host saves a result once per game; a lobby room also adds it to the night's session.

import { get, onValue, ref, set } from 'firebase/database'
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

/** Ids this device has already saved, so a host that keeps publishing a finished game saves it once. */
const saved = new Set<string>()

/**
 * Host only: saves a finished game's places and points for the people in it. Saving the same game again does
 * nothing (the rules refuse to change a saved result). In a lobby room the game joins the night's session.
 */
export async function saveResult(room: Room, game: string, players: Record<string, PlayerResult>, size: number): Promise<void> {
  const id = resultIdFor(room)
  if (!id || saved.has(id)) return
  saved.add(id)
  const at = Date.now()
  try {
    const existing = await get(resultRef(id))
    if (!existing.exists()) await set(resultRef(id), { game, room: room.code, at, size, players })
    if (room.lobby) {
      const points = Object.fromEntries(Object.entries(players).map(([uid, result]) => [uid, result.points]))
      await addSessionGame(room.code, id, { game, at, points })
    }
  } catch (error) {
    saved.delete(id)
    console.error('Saving the game result failed', error)
  }
}

function asResults(value: unknown): GameResult[] {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value as Record<string, Omit<GameResult, 'id'>>)
    .filter(([, result]) => result && typeof result.game === 'string' && result.players)
    .map(([id, result]) => ({ ...result, id }))
}

/** Every saved result this player is in, newest first, kept up to date. Returns a stop function. */
export function watchMyResults(uid: string, onChange: (results: GameResult[]) => void, onError: (error: Error) => void): () => void {
  return onValue(
    resultRef(),
    (snapshot) =>
      onChange(
        asResults(snapshot.val())
          .filter((result) => uid in result.players)
          .sort((a, b) => b.at - a.at),
      ),
    onError,
  )
}
