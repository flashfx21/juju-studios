// ABOUTME: Admin and playtester flags (admins/{uid}, playtesters/{uid}) and the admin's tools over every profile.
// ABOUTME: Admins are added by hand in the Firebase console; the database rules, not the app, enforce what they can do.

import { onValue, ref, remove, set } from 'firebase/database'
import { firebaseBackend } from './firebase'
import { asProfile, type Profile } from './profiles'

function flagRef(list: 'admins' | 'playtesters', uid: string) {
  return ref(firebaseBackend().database, `${list}/${uid}`)
}

/** Calls back with whether this player is on the list, and again on every change. Returns a stop function. */
export function watchFlag(list: 'admins' | 'playtesters', uid: string, onChange: (on: boolean) => void): () => void {
  return onValue(
    flagRef(list, uid),
    (snapshot) => onChange(snapshot.val() === true),
    () => onChange(false),
  )
}

/** Admin only: every saved profile and who may use Solo play, kept up to date. Returns a stop function. */
export function watchPlayers(
  onChange: (profiles: Record<string, Profile>, playtesters: Record<string, boolean>) => void,
  onError: (error: Error) => void,
): () => void {
  let profiles: Record<string, Profile> = {}
  let playtesters: Record<string, boolean> = {}
  const { database } = firebaseBackend()
  const stopProfiles = onValue(
    ref(database, 'profiles'),
    (snapshot) => {
      // Anything under profiles that is not shaped like a profile (say, a hand-made console entry) is left out.
      profiles = {}
      for (const [uid, value] of Object.entries(snapshot.val() ?? {})) {
        const profile = asProfile(value)
        if (profile) profiles[uid] = profile
      }
      onChange(profiles, playtesters)
    },
    onError,
  )
  const stopPlaytesters = onValue(
    ref(database, 'playtesters'),
    (snapshot) => {
      playtesters = snapshot.val() ?? {}
      onChange(profiles, playtesters)
    },
    onError,
  )
  return () => {
    stopProfiles()
    stopPlaytesters()
  }
}

/** Admin only: let a player use Solo play (games still in testing), or stop them. */
export function setPlaytester(uid: string, allowed: boolean): Promise<void> {
  return allowed ? set(flagRef('playtesters', uid), true) : remove(flagRef('playtesters', uid))
}

/** Admin only: removes a player's profile, so they set it up again next time they open the site. */
export function resetProfile(uid: string): Promise<void> {
  return remove(ref(firebaseBackend().database, `profiles/${uid}`))
}
