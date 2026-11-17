// ABOUTME: Where each guess sits on the TV's dial at the reveal: its place along the dial and a row above it,
// ABOUTME: so guesses that land close together stack up instead of covering each other.
import type { PlayerId } from '../types'

export interface DialMark {
  id: PlayerId
  value: number
  /** 0 at the left end of the dial (1) to 1 at the right end (the top of the range). */
  position: number
  /** 0 sits on the dial; each row above is one higher. */
  row: number
}

/** Guesses closer together than this share of the dial would overlap, so they take different rows. */
const MARK_WIDTH = 0.055

/** 0 for 1, 1 for the top of the range. */
export function dialPosition(value: number, range: number): number {
  return (value - 1) / (range - 1)
}

/** Every guess in dial order, each on the lowest row where it clears the guesses already placed. */
export function layoutMarks(guesses: Record<PlayerId, number>, range: number): DialMark[] {
  const lastInRow: number[] = []
  return Object.entries(guesses)
    .sort(([idA, a], [idB, b]) => a - b || idA.localeCompare(idB))
    .map(([id, value]) => {
      const position = dialPosition(value, range)
      let row = lastInRow.findIndex((last) => position - last >= MARK_WIDTH)
      if (row === -1) row = lastInRow.length
      lastInRow[row] = position
      return { id, value, position, row }
    })
}
