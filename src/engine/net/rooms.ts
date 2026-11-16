// ABOUTME: Game rooms in the Realtime Database at rooms/{code}: who hosts, who joined, the game state and progress; secrets and inputs at roomSecrets/{code}.
// ABOUTME: The host's device runs the game. A lobby room lasts the night: it votes, then switches from game to game.

import {
  get,
  onChildAdded,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  type DatabaseReference,
} from 'firebase/database'
import { firebaseBackend } from './firebase'

/** What other players see of someone in a room. */
export interface RoomPlayer {
  username: string
  initials: string
  color: string
  /** The player symbol id, when their profile has one. */
  symbol?: string
}

/** The game id a lobby room shows between games. */
export const LOBBY = 'lobby'

export interface Room {
  code: string
  host: string
  /** The game the room is on now; a lobby room is on LOBBY between games. */
  game: string
  /** A room for the night: it starts in the lobby and moves from game to game. */
  lobby: boolean
  /** In a lobby room, each player's vote for the next game (a game id). */
  votes: Record<string, string>
  /** By player id (the sign-in uid), in the order they joined. */
  players: Record<string, RoomPlayer & { joinedAt: number }>
  /** The game's state, written by the host. Null before the game starts. `startedAt` names this game for its saved result. */
  play: { state: string; deadline: number | null; startedAt: number | null } | null
  /** What each player (or bot) shares about their own game, as JSON, for games where every phone plays its own copy. */
  progress: Record<string, string>
  /** A lobby room's night: how many games were planned, the games finished so far, and whether the host ended it. */
  session: Session
}

/** One finished game in a lobby room's night. */
export interface SessionGame {
  game: string
  at: number
  /** Leaderboard points for each person (bots aren't kept). */
  points: Record<string, number>
}

export interface Session {
  /** Games planned for the night; null until the host starts the first game. */
  planned: number | null
  /** Finished games by result id. */
  games: Record<string, SessionGame>
  ended: boolean
}

/** Finished games in the order they were played. */
export function sessionGames(session: Session): SessionGame[] {
  return Object.values(session.games).sort((a, b) => a.at - b.at)
}

/** Each person's points for the night so far, most first. */
export function sessionTotals(session: Session): [string, number][] {
  const totals = new Map<string, number>()
  for (const game of sessionGames(session)) {
    for (const [uid, points] of Object.entries(game.points)) totals.set(uid, (totals.get(uid) ?? 0) + points)
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}

/** The night is over once the planned games are played or the host ends it. */
export function sessionOver(session: Session): boolean {
  return session.ended || (session.planned !== null && Object.keys(session.games).length >= session.planned)
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

/** Only what a room shows of a player: whatever else the caller's object carries stays out of the room. */
function shownPlayer({ username, initials, color, symbol }: RoomPlayer): RoomPlayer {
  return symbol ? { username, initials, color, symbol } : { username, initials, color }
}

function joinAs(code: string, uid: string, player: RoomPlayer): Promise<void> {
  return set(roomRef(code, `players/${uid}`), { ...shownPlayer(player), joinedAt: serverTimestamp() })
}

/** Opens a new room hosted by this player and joins it. Tries new codes if one is taken. Pass LOBBY for a room for the night. */
export async function createRoom(uid: string, game: string, player: RoomPlayer): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode()
    try {
      // The rules only allow creating a room that doesn't exist yet, so a taken code is refused.
      await set(roomRef(code), { host: uid, game, lobby: game === LOBBY, createdAt: serverTimestamp() })
    } catch {
      continue
    }
    await joinAs(code, uid, player)
    return code
  }
  throw new Error('No free room code found.')
}

/** The game a room is playing, or null when there's no room with that code. */
export async function roomGame(code: string): Promise<string | null> {
  const snapshot = await get(roomRef(code, 'game'))
  return snapshot.exists() ? String(snapshot.val()) : null
}

export type JoinOutcome = 'joined' | 'no-room' | 'other-game'

/** Joins an existing room for this game. Joining again (after a refresh) is fine. */
export async function joinRoom(code: string, uid: string, game: string, player: RoomPlayer): Promise<JoinOutcome> {
  const snapshot = await get(roomRef(code))
  if (!snapshot.exists()) return 'no-room'
  // A lobby room can be joined from any of its games; other rooms only for their own game.
  if (snapshot.child('game').val() !== game && !snapshot.child('lobby').val()) return 'other-game'
  // Someone already in the room keeps their place in the joining order.
  if (snapshot.child(`players/${uid}`).exists()) await update(roomRef(code, `players/${uid}`), { ...shownPlayer(player), symbol: player.symbol ?? null })
  else await joinAs(code, uid, player)
  return 'joined'
}

/** Leaves a room: this player's entry and vote go, so later games don't deal them in. */
export function leaveRoom(code: string, uid: string): Promise<void> {
  return update(ref(firebaseBackend().database), { [`rooms/${code}/players/${uid}`]: null, [`rooms/${code}/votes/${uid}`]: null })
}

/** Host only: hands the room to another player in it (their phone runs the games from here), then leaves. */
export async function passHost(code: string, uid: string, to: string): Promise<void> {
  await set(roomRef(code, 'host'), to)
  await leaveRoom(code, uid)
}

/** The host or an admin: closes the room for everyone, with its hidden game data. Phones in it see the room is gone. */
export function closeRoom(code: string): Promise<void> {
  return update(ref(firebaseBackend().database), { [`roomSecrets/${code}`]: null, [`rooms/${code}`]: null })
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
        lobby: value.lobby === true,
        votes: value.votes ?? {},
        players: value.players ?? {},
        play: value.play
          ? { state: value.play.state, deadline: value.play.deadline ?? null, startedAt: value.play.startedAt ?? null }
          : null,
        progress: value.progress ?? {},
        session: {
          planned: typeof value.session?.planned === 'number' ? value.session.planned : null,
          games: value.session?.games ?? {},
          ended: value.session?.ended === true,
        },
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

/** Host only: starts a game with its first state, stamped with the start time that names its saved result. */
export function startPlay(code: string, state: unknown, deadline: number | null): Promise<void> {
  return set(roomRef(code, 'play'), { state: JSON.stringify(state), deadline, startedAt: Date.now() })
}

/** Host only: saves the game state (as JSON, so empty lists survive) and when the current timer runs out. */
export function writePlay(code: string, state: unknown, deadline: number | null): Promise<void> {
  return update(roomRef(code, 'play'), { state: JSON.stringify(state), deadline })
}

/** The paths that hold a room's game: clearing them all in one write leaves no half-cleared room. */
function playPaths(code: string): Record<string, null> {
  return { [`rooms/${code}/progress`]: null, [`roomSecrets/${code}`]: null, [`rooms/${code}/play`]: null }
}

/** Host only: clears the game (everyone's progress, the game's secrets and waiting inputs too) so the room is back in its waiting state. */
export function clearPlay(code: string): Promise<void> {
  return update(ref(firebaseBackend().database), playPaths(code))
}

/**
 * Secrets live outside the room, at roomSecrets/{code}, because anyone who can read a room can read all of it.
 * There the host keeps the full game, each player has a view only they can read (a target, their own guess),
 * and players' inputs wait where only the host can read them.
 */
function secretRef(code: string, path = ''): DatabaseReference {
  return ref(firebaseBackend().database, `roomSecrets/${code}${path ? `/${path}` : ''}`)
}

/** Host only: the full game, with every secret in it, so a host that reloads can carry on. */
export function writeHostGame(code: string, state: unknown): Promise<void> {
  return set(secretRef(code, 'host'), JSON.stringify(state))
}

/** Host only: reads back the full game; null when there isn't one. */
export async function readHostGame(code: string): Promise<unknown> {
  const snapshot = await get(secretRef(code, 'host'))
  return snapshot.exists() ? JSON.parse(String(snapshot.val())) : null
}

/** Host only: what one player alone may see. */
export function writePlayerView(code: string, uid: string, view: unknown): Promise<void> {
  return set(secretRef(code, `views/${uid}`), JSON.stringify(view))
}

/** This player's own view, kept up to date (null until the host writes one). Returns a stop function. */
export function watchPlayerView(code: string, uid: string, onChange: (view: unknown) => void): () => void {
  return onValue(
    secretRef(code, `views/${uid}`),
    (snapshot) => onChange(snapshot.exists() ? JSON.parse(String(snapshot.val())) : null),
    () => onChange(null),
  )
}

/** Host only: moves a lobby room to another game (or back to LOBBY), clearing the last game and the votes. */
export function switchGame(code: string, game: string): Promise<void> {
  return update(ref(firebaseBackend().database), { ...playPaths(code), [`rooms/${code}/votes`]: null, [`rooms/${code}/game`]: game })
}

/** Host only, in a lobby room: how many games the night will have. */
export function planSession(code: string, games: number): Promise<void> {
  return set(roomRef(code, 'session/planned'), games)
}

/** Host only, in a lobby room: adds a finished game to the night. */
export function addSessionGame(code: string, resultId: string, game: SessionGame): Promise<void> {
  return set(roomRef(code, `session/games/${resultId}`), game)
}

/** Host only, in a lobby room: ends the night early, going straight to the recap. */
export function endSession(code: string): Promise<void> {
  return set(roomRef(code, 'session/ended'), true)
}

/** In a lobby room: this player's vote for the next game. */
export function castVote(code: string, uid: string, game: string): Promise<void> {
  return set(roomRef(code, `votes/${uid}`), game)
}

/** Shares a player's own progress (as JSON). A player writes their own; the host also writes for bots. */
export function writeProgress(code: string, id: string, progress: unknown): Promise<void> {
  return set(roomRef(code, `progress/${id}`), JSON.stringify(progress))
}

/** A player sends one input to the host. Only the host can read it. */
export function sendInput(code: string, uid: string, input: unknown): Promise<void> {
  return set(push(secretRef(code, 'inputs')), { by: uid, input: JSON.stringify(input) })
}

/** Host only: calls back once for every input, oldest first, then removes it. Returns a stop function. */
export function takeInputs(code: string, onInput: (by: string, input: unknown) => void): () => void {
  return onChildAdded(secretRef(code, 'inputs'), (snapshot) => {
    const value = snapshot.val()
    remove(snapshot.ref).catch((error) => console.error('Removing a handled input failed', error))
    if (!value || typeof value.by !== 'string' || typeof value.input !== 'string') return
    try {
      onInput(value.by, JSON.parse(value.input))
    } catch {
      // A garbled input is dropped.
    }
  })
}
