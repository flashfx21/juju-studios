// ABOUTME: Watches sign-in and the signed-in player's saved profile once for the whole app, and shares them as useMe().
// ABOUTME: A profile typed on Join just before signing in is saved here as soon as sign-in finishes.
import { useEffect, useState, type ReactNode } from 'react'
import { watchFlag } from '../engine/net/admin'
import { watchSignedInPlayer, type SignedInPlayer } from '../engine/net/auth'
import { saveProfile, watchProfile, type Profile } from '../engine/net/profiles'
import { clearPendingProfile, loadPendingProfile } from './pendingProfile'
import { MeContext, type Me } from './useMe'

export function MeProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<SignedInPlayer | null | undefined>(undefined)
  const [profile, setProfile] = useState<{ uid: string; value: Profile | null } | undefined>(undefined)
  const [flags, setFlags] = useState({ uid: '', isAdmin: false, playtester: false })

  useEffect(() => watchSignedInPlayer(setPlayer), [])

  useEffect(() => {
    if (!player) return
    const uid = player.uid
    return watchProfile(
      uid,
      (value) => {
        // What the player just typed on Join is their choice, so it is saved over any older profile.
        const pending = loadPendingProfile()
        if (pending) {
          clearPendingProfile()
          saveProfile(uid, pending).catch((error: unknown) => {
            console.error('Saving the profile from Join failed', error)
            setProfile({ uid, value })
          })
        } else {
          setProfile({ uid, value })
        }
      },
      (error) => {
        console.error('Reading the profile failed', error)
        setProfile({ uid, value: null })
      },
    )
  }, [player])

  useEffect(() => {
    if (!player) return
    const uid = player.uid
    const stopAdmin = watchFlag('admins', uid, (on) =>
      setFlags((f) => ({ ...(f.uid === uid ? f : { playtester: false }), uid, isAdmin: on })),
    )
    const stopPlaytester = watchFlag('playtesters', uid, (on) =>
      setFlags((f) => ({ ...(f.uid === uid ? f : { isAdmin: false }), uid, playtester: on })),
    )
    return () => {
      stopAdmin()
      stopPlaytester()
    }
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
      canPlaytest: mine && (flags.isAdmin || flags.playtester),
    }
  }

  return <MeContext.Provider value={me}>{children}</MeContext.Provider>
}
