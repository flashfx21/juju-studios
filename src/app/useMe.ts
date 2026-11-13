// ABOUTME: Who is using this device: still checking, signed out, or signed in with their saved profile.
// ABOUTME: MeProvider (MeProvider.tsx) keeps it current for the whole app; screens read it with useMe().
import { createContext, useContext } from 'react'
import type { SignedInPlayer } from '../engine/net/auth'
import type { Profile } from '../engine/net/profiles'

export type Me =
  | { kind: 'checking' }
  | { kind: 'signed-out' }
  /** profile is undefined while it loads and null when this player has none yet. */
  | { kind: 'signed-in'; player: SignedInPlayer; profile: Profile | null | undefined }

export const MeContext = createContext<Me>({ kind: 'checking' })

export function useMe(): Me {
  return useContext(MeContext)
}
