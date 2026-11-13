// ABOUTME: A ticking count of whole seconds left until a room's deadline, for countdowns on phones.
// ABOUTME: Null when nothing is timed.
import { useEffect, useState } from 'react'

/** Seconds left until the deadline, ticking. Null when there is no deadline. */
export function useSecondsLeft(deadline: number | null): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (deadline === null) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [deadline])
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
}
