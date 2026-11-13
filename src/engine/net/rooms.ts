// ABOUTME: Game rooms in the Realtime Database at rooms/{code}: who hosts, who joined, the game state, and inputs.
// ABOUTME: The host's device runs the game: players send inputs, the host applies them and writes the new state.

import {
  get,
  onChildAdded,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  type DatabaseReference,
} from 'firebase/database'
import { firebaseBackend } from './firebase'

/** What other players see of someone in a room. */
export interface RoomPlayer {
  username: string
  initials: string
  color: string
}

export interface Room {
  code: string
  host: string
  game: string
  /** By player id (the sign-in uid), in the order they joined. */
  players: Record<string, RoomPlayer & { joinedAt: number }>
  /** The game's state, written by the host. Null before the game starts. */
  play: { state: string; deadline: number | null } | null
}

/** Letters that can't be mistaken for each other or for numbers when read off a screen. */
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_LENGTH = 4

function roomRef(code: string, path = ''): DatabaseReference {
  return ref(firebaseBackend().database, `rooms/${code}${path ? `/${path}` : ''}`)
}

function newCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join('')
}

function joinAs(code: string, uid: string, player: RoomPlayer): Promise<void> {
  return set(roomRef(code, `players/${uid}`), { ...player, joinedAt: serverTimestamp() })
}

/** Opens a new room hosted by this player and joins it. Tries new codes if one is taken. */
export async function createRoom(uid: string, game: string, player: RoomPlayer): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode()
    try {
      // The rules only allow creating a room that doesn't exist yet, so a taken code is refused.
      await set(roomRef(code), { host: uid, game, createdAt: serverTimestamp() })
    } catch {
      continue
    }
    await joinAs(code, uid, player)
    return code
  }
  throw new Error('No free room code found.')
}

export type JoinOutcome = 'joined' | 'no-room' | 'other-game'

/** Joins an existing room for this game. Joining again (after a refresh) is fine. */
export async function joinRoom(code: string, uid: string, game: string, player: RoomPlayer): Promise<JoinOutcome> {
  const snapshot = await get(roomRef(code, 'game'))
  if (!snapshot.exists()) return 'no-room'
  if (snapshot.val() !== game) return 'other-game'
  await joinAs(code, uid, player)
  return 'joined'
}

/** Calls back with the room (null if it doesn't exist) and again on every change. Returns a stop function. */
export function watchRoom(code: string, onChange: (room: Room | null) => void, onError: (error: Error) => void): () => void {
  return onValue(
    roomRef(code),
    (snapshot) => {
      const value = snapshot.val()
      if (!value) {
        onChange(null)
        return
      }
      onChange({
        code,
        host: value.host,
        game: value.game,
        players: value.players ?? {},
        play: value.play ? { state: value.play.state, deadline: value.play.deadline ?? null } : null,
      })
    },
    onError,
  )
}

/** Players in the order they joined. */
export function playerIds(room: Room): string[] {
  return Object.entries(room.players)
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
    .map(([uid]) => uid)
}

/** Host only: saves the game state (as JSON, so empty lists survive) and when the current timer runs out. */
export function writePlay(code: string, state: unknown, deadline: number | null): Promise<void> {
  return set(roomRef(code, 'play'), { state: JSON.stringify(state), deadline })
}

/** Host only: clears the game so the room is back in its waiting state. */
export function clearPlay(code: string): Promise<void> {
  return remove(roomRef(code, 'play'))
}

/** A player sends one input to the host. */
export function sendInput(code: string, uid: string, input: unknown): Promise<void> {
  return set(push(roomRef(code, 'inputs')), { by: uid, input: JSON.stringify(input) })
}

/** Host only: calls back once for every input, oldest first, then removes it. Returns a stop function. */
export function takeInputs(code: string, onInput: (by: string, input: unknown) => void): () => void {
  return onChildAdded(roomRef(code, 'inputs'), (snapshot) => {
    const value = snapshot.val()
    void remove(snapshot.ref)
    if (!value || typeof value.by !== 'string' || typeof value.input !== 'string') return
    try {
      onInput(value.by, JSON.parse(value.input))
    } catch {
      // A garbled input is dropped.
    }
  })
}
