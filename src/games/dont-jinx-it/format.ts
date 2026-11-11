// ABOUTME: Wording Don't Jinx It's TV and phone screens share: timers, places, name lists and jinx attributions.
// ABOUTME: Kept in one place so the TV and every phone describe the same jinx the same way.
import type { PlayerId } from '../types'
import type { PileClue } from './rules'

/** 75 becomes "1:15". */
export function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')
  return `${n}${suffix}`
}

/** "Bo", "Bo and Cy", "Bo, Cy and Di". */
export function nameList(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Two letters for a player's chip: "Bot A" is "BA", "Juju" is "JU". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

/** A player's place by points (1 plus everyone ahead) and whether anyone shares it. */
export function standingOf(scores: Record<PlayerId, number>, player: PlayerId): { place: number; tied: boolean } {
  const points = Object.values(scores)
  return {
    place: 1 + points.filter((p) => p > scores[player]).length,
    tied: points.filter((p) => p === scores[player]).length > 1,
  }
}

/**
 * Who jinxed a clue, without the clue's word. Exact matches name every writer of the word in turn order,
 * so matching clues carry the same stamp; close calls name the other writers.
 */
export function jinxedBy(clue: PileClue, names: Record<PlayerId, string>, turnOrder: readonly PlayerId[]): string {
  if (clue.fate === 'close-call') return `close call with ${nameList(clue.matchedWith.map((id) => names[id]))}`
  return turnOrder
    .filter((id) => id === clue.by || clue.matchedWith.includes(id))
    .map((id) => names[id])
    .join(' + ')
}
