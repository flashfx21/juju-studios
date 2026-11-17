// ABOUTME: Admin, host and playtester flags (admins/{uid}, hosts/{uid}, playtesters/{uid}) and the admin's tools: profiles, rooms and saved games.
// ABOUTME: The first admin is added by hand in the Firebase console; the database rules, not the app, enforce what admins can do.

import { onValue, ref, remove, set } from 'firebase/database'
import { firebaseBackend } from './firebase'
import { watchProfiles, type Profile } from './profiles'

/** The lists an admin keeps: who is an admin, who may open rooms, and who sees the games still in testing. */
export type PlayerFlag = 'admins' | 'hosts' | 'playtesters'

function flagRef(list: PlayerFlag, uid: string) {
  return ref(firebaseBackend().database, `${list}/${uid}`)
}

/** Calls back with whether this player is on the list, and again on every change. Returns a stop function. */
export function watchFlag(list: PlayerFlag, uid: string, onChange: (on: boolean) => void): () => void {
  return onValue(
    flagRef(list, uid),
    (snapshot) => onChange(snapshot.val() === true),
    () => onChange(false),
  )
}

/** Admin only: every saved profile, who sees the games in testing and who may host, kept up to date. Returns a stop function. */
export function watchPlayers(
  onChange: (profiles: Record<string, Profile>, playtesters: Record<string, boolean>, hosts: Record<string, boolean>) => void,
  onError: (error: Error) => void,
): () => void {
  let profiles: Record<string, Profile> = {}
  let playtesters: Record<string, boolean> = {}
  let hosts: Record<string, boolean> = {}
  const { database } = firebaseBackend()
  const stopProfiles = watchProfiles((all) => {
    profiles = all
    onChange(profiles, playtesters, hosts)
  }, onError)
  const stopPlaytesters = onValue(
    ref(database, 'playtesters'),
    (snapshot) => {
      playtesters = snapshot.val() ?? {}
      onChange(profiles, playtesters, hosts)
    },
    onError,
  )
  const stopHosts = onValue(
    ref(database, 'hosts'),
    (snapshot) => {
      hosts = snapshot.val() ?? {}
      onChange(profiles, playtesters, hosts)
    },
    onError,
  )
  return () => {
    stopProfiles()
    stopPlaytesters()
    stopHosts()
  }
}

/** Admin only: let a player see the games still in testing (Solo play, and in the lobbies they host), or stop them. */
export function setPlaytester(uid: string, allowed: boolean): Promise<void> {
  return allowed ? set(flagRef('playtesters', uid), true) : remove(flagRef('playtesters', uid))
}

/** Admin only: let a player open rooms (and so save their results), or stop them. */
export function setHost(uid: string, allowed: boolean): Promise<void> {
  return allowed ? set(flagRef('hosts', uid), true) : remove(flagRef('hosts', uid))
}

/** Admin only: removes a player's profile, so they set it up again next time they open the site. */
export function resetProfile(uid: string): Promise<void> {
  return remove(ref(firebaseBackend().database, `profiles/${uid}`))
}

/** Admin only: who is an admin, kept up to date. Returns a stop function. */
export function watchAdmins(onChange: (admins: Record<string, boolean>) => void, onError: (error: Error) => void): () => void {
  return onValue(ref(firebaseBackend().database, 'admins'), (snapshot) => onChange(snapshot.val() ?? {}), onError)
}

/** Admin only: makes another player an admin, or stops them being one. The rules refuse changing your own. */
export function setAdmin(uid: string, on: boolean): Promise<void> {
  return on ? set(flagRef('admins', uid), true) : remove(flagRef('admins', uid))
}

/** One open room as Admin lists it. */
export interface OpenRoom {
  code: string
  host: string
  game: string
  lobby: boolean
  /** When the room opened; 0 for rooms made before rooms kept the time. */
  createdAt: number
  players: string[]
}

/** Admin only: every open room, newest first, kept up to date. Returns a stop function. */
export function watchOpenRooms(onChange: (rooms: OpenRoom[]) => void, onError: (error: Error) => void): () => void {
  return onValue(
    ref(firebaseBackend().database, 'rooms'),
    (snapshot) => {
      const rooms = Object.entries((snapshot.val() ?? {}) as Record<string, Record<string, unknown>>).map(([code, room]) => ({
        code,
        host: String(room.host ?? ''),
        game: String(room.game ?? ''),
        lobby: room.lobby === true,
        createdAt: typeof room.createdAt === 'number' ? room.createdAt : 0,
        players: Object.keys((room.players as Record<string, unknown> | undefined) ?? {}),
      }))
      onChange(rooms.sort((a, b) => b.createdAt - a.createdAt))
    },
    onError,
  )
}

export { closeRoom } from './rooms'

/** Admin only: deletes a bad or test game, so it stops counting on the leaderboard and in Stats. */
export function deleteResult(id: string): Promise<void> {
  return remove(ref(firebaseBackend().database, `results/${id}`))
}
