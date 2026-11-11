// ABOUTME: Repeatable random numbers from a text seed: the same seed gives the same sequence on every device.
// ABOUTME: Lets players on separate phones be dealt the same game without a server.
import { hashText } from './hashText'

/** Returns a function like Math.random (0 inclusive to 1 exclusive) whose sequence is fixed by the seed (mulberry32). */
export function seededRandom(seed: string): () => number {
  let state = hashText(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
