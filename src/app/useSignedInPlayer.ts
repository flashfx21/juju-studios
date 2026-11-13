// ABOUTME: Who is signed in on this device, kept up to date for a screen.
// ABOUTME: Undefined while sign-in is still being checked on page load, then a player or null.
import { useEffect, useState } from 'react'
import { watchSignedInPlayer, type SignedInPlayer } from '../engine/net/auth'

export function useSignedInPlayer(): SignedInPlayer | null | undefined {
  const [player, setPlayer] = useState<SignedInPlayer | null | undefined>(undefined)
  useEffect(() => watchSignedInPlayer(setPlayer), [])
  return player
}
