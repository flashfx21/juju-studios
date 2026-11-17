// ABOUTME: The shared clock, ticking once a second, for Chainword in a room: every phone and the TV see the same
// ABOUTME: time left on the chain, and finish times compare fairly.
import { useEffect, useState } from 'react'
import { sharedNow } from '../../engine/net/clock'

export function useNow(): number {
  const [now, setNow] = useState(() => sharedNow())
  useEffect(() => {
    const timer = setInterval(() => setNow(sharedNow()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}
