// ABOUTME: Lays out Zero In's TV number line: which stretch of numbers it shows, where the answer and each guess sit,
// ABOUTME: which guesses are "way off" past an edge, and which row each guess chip takes so neighbors don't overlap.
import type { PlayerId } from '../types'

export interface LinePoint {
  id: PlayerId
  value: number
  /** 0 is the left edge, 1 the right. Way-off guesses sit at the edge they went past. */
  position: number
  wayOff: 'low' | 'high' | null
  /** 0 is the row nearest the line. */
  row: number
}

export interface NumberLine {
  low: number
  high: number
  answerPosition: number
  points: LinePoint[]
}

/** A guess this many times farther off than the typical guess is drawn "way off" at the edge. */
const WAY_OFF_FACTOR = 4
/** Extra room past the outermost guess or answer, as a share of the shown stretch. */
const MARGIN = 0.08
/** Chips closer than this (share of the line) go in different rows. */
const CHIP_GAP = 0.075
export const MAX_ROWS = 4

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

export function layoutLine(answer: number, guesses: Record<PlayerId, number>): NumberLine {
  const entries = Object.entries(guesses)
  const distances = entries.map(([, value]) => Math.abs(value - answer))
  const typical = Math.max(1, distances.length ? median(distances) : 1)
  const near = entries.filter(([, value]) => Math.abs(value - answer) <= typical * WAY_OFF_FACTOR).map(([, value]) => value)
  let low = Math.min(answer, ...near)
  let high = Math.max(answer, ...near)
  if (high - low < 2) {
    low -= 1
    high += 1
  }
  const margin = (high - low) * MARGIN
  // Guesses and answers are never negative, so the line doesn't go below 0.
  low = Math.max(0, low - margin)
  high += margin
  const at = (value: number) => (value - low) / (high - low)

  const points: LinePoint[] = entries.map(([id, value]) => {
    const wayOff = value < low ? 'low' : value > high ? 'high' : null
    return { id, value, position: wayOff === 'low' ? 0 : wayOff === 'high' ? 1 : at(value), wayOff, row: 0 }
  })
  // Left to right, each chip takes the first row whose last chip is far enough away.
  const lastInRow: number[] = []
  for (const point of [...points].sort((a, b) => a.position - b.position || a.value - b.value)) {
    let row = lastInRow.findIndex((position) => point.position - position >= CHIP_GAP)
    if (row === -1) row = lastInRow.length < MAX_ROWS ? lastInRow.length : MAX_ROWS - 1
    lastInRow[row] = point.position
    point.row = row
  }
  return { low, high, answerPosition: at(answer), points }
}
