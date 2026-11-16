// ABOUTME: A ticking count of whole seconds left until a room's deadline, for countdowns on phones.
// ABOUTME: Null when nothing is timed.
import { useEffect, useState } from 'react'

function secondsUntil(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

/**
 * Seconds left until the deadline, ticking. Null when there is no deadline. The clock is checked four times a
 * second, but the screen only draws again when the number of seconds changes.
 */
export function useSecondsLeft(deadline: number | null): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (deadline === null) return
    const tick = () => setNow((shown) => (secondsUntil(deadline, shown) === secondsUntil(deadline, Date.now()) ? shown : Date.now()))
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, 250)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [deadline])
  return deadline === null ? null : secondsUntil(deadline, now)
}
