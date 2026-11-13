// ABOUTME: Saved player profiles (username, color, initials) at profiles/{uid} in the Realtime Database.
// ABOUTME: Each player reads and writes only their own; the email stays in sign-in, never in the profile.

import { onValue, ref, set } from 'firebase/database'
import { PLAYER_COLOR_IDS, type PlayerColorId } from '../../ui/playerColors'
import { firebaseBackend } from './firebase'

export interface Profile {
  username: string
  /** Up to 3 letters; 2-letter styles show the first two. */
  initials: string
  color: PlayerColorId
}

function profileRef(uid: string) {
  return ref(firebaseBackend().database, `profiles/${uid}`)
}

/** A stored value as a Profile, or null when it is missing or not shaped like one. */
function asProfile(value: unknown): Profile | null {
  if (!value || typeof value !== 'object') return null
  const { username, initials, color } = value as Record<string, unknown>
  if (typeof username !== 'string' || typeof initials !== 'string') return null
  if (!PLAYER_COLOR_IDS.includes(color as PlayerColorId)) return null
  return { username, initials, color: color as PlayerColorId }
}

/** Calls back with this player's profile (null if they have none yet), and again on every change. Returns a stop function. */
export function watchProfile(
  uid: string,
  onChange: (profile: Profile | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onValue(profileRef(uid), (snapshot) => onChange(asProfile(snapshot.val())), onError)
}

export function saveProfile(uid: string, profile: Profile): Promise<void> {
  return set(profileRef(uid), profile)
}
