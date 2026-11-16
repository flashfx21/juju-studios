// ABOUTME: One clock for every phone in a room: the database server's time, worked out from this device's clock and
// ABOUTME: how far off it is. Times shared between phones (a deadline, a start) are kept in server time.

import { onValue, ref } from 'firebase/database'
import { firebaseBackend } from './firebase'

/** Server time minus this device's time, in milliseconds. 0 until the database reports it. */
let offset = 0
let watching = false
const listeners = new Set<() => void>()

function watchOffset() {
  if (watching) return
  watching = true
  onValue(ref(firebaseBackend().database, '.info/serverTimeOffset'), (snapshot) => {
    const value: unknown = snapshot.val()
    const next = typeof value === 'number' ? value : 0
    if (next === offset) return
    offset = next
    listeners.forEach((listener) => listener())
  })
}

/** The time now on the shared clock. */
export function sharedNow(): number {
  watchOffset()
  return Date.now() + offset
}

/** A time on this device's clock, as the shared clock tells it. */
export function toSharedTime(local: number): number {
  watchOffset()
  return local + offset
}

/** A shared time, as this device's clock tells it, so it can be compared with Date.now(). */
export function fromSharedTime(shared: number): number {
  watchOffset()
  return shared - offset
}

/** Calls back when this device learns how far its clock is off. Returns a stop function. */
export function onClockChange(listener: () => void): () => void {
  watchOffset()
  listeners.add(listener)
  return () => listeners.delete(listener)
}
