// ABOUTME: Watches sign-in and the signed-in player's saved profile once for the whole app, and shares them as useMe().
// ABOUTME: Also watches whether the player is an admin, may host rooms, or is a playtester (games in testing).
import { useEffect, useState, type ReactNode } from 'react'
import { watchFlag } from '../engine/net/admin'
import { watchSignedInPlayer, type SignedInPlayer } from '../engine/net/auth'
import { watchProfile, type Profile } from '../engine/net/profiles'
import { MeContext, type Me } from './useMe'

export function MeProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<SignedInPlayer | null | undefined>(undefined)
  const [profile, setProfile] = useState<{ uid: string; value: Profile | null } | undefined>(undefined)
  const [flags, setFlags] = useState({ uid: '', isAdmin: false, host: false, playtester: false })

  useEffect(() => watchSignedInPlayer(setPlayer), [])

  useEffect(() => {
    if (!player) return
    const uid = player.uid
    return watchProfile(
      uid,
      (value) => setProfile({ uid, value }),
      (error) => {
        console.error('Reading the profile failed', error)
        setProfile({ uid, value: null })
      },
    )
  }, [player])

  useEffect(() => {
    if (!player) return
    const uid = player.uid
    // Flags left from another player on this device never carry over.
    const mine = (f: typeof flags) => (f.uid === uid ? f : { uid, isAdmin: false, host: false, playtester: false })
    const stops = [
      watchFlag('admins', uid, (on) => setFlags((f) => ({ ...mine(f), isAdmin: on }))),
      watchFlag('hosts', uid, (on) => setFlags((f) => ({ ...mine(f), host: on }))),
      watchFlag('playtesters', uid, (on) => setFlags((f) => ({ ...mine(f), playtester: on }))),
    ]
    return () => stops.forEach((stop) => stop())
  }, [player])

  let me: Me
  if (player === undefined) me = { kind: 'checking' }
  else if (player === null) me = { kind: 'signed-out' }
  else {
    const mine = flags.uid === player.uid
    me = {
      kind: 'signed-in',
      player,
      profile: profile?.uid === player.uid ? profile.value : undefined,
      isAdmin: mine && flags.isAdmin,
      canHost: mine && (flags.isAdmin || flags.host),
      canPlaytest: mine && (flags.isAdmin || flags.playtester),
    }
  }

  return <MeContext.Provider value={me}>{children}</MeContext.Provider>
}
