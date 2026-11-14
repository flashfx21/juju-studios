// ABOUTME: Leaderboard points from a game's finishing order: every game puts 100 points on the table.
// ABOUTME: Individual games pay the top half on a countdown split; 2 teams split 80/20; 3+ teams pay the top 2 teams.
import type { FinishingOrder, PlayerId, Teams } from '../games/types'

export const POINTS_PER_GAME = 100

/** Shares for each scoring place: with N places, 1st gets N, 2nd N - 1, down to 1. */
function countdownShares(places: number): number[] {
  return Array.from({ length: places }, (_, i) => places - i)
}

/**
 * Splits `pool` across the groups in `order` (each inner list one place, ties share it). Tied groups pool the
 * shares of every place they cover and split them evenly, so two tied for 1st of 2 each get half of 1st plus 2nd.
 */
function splitByPlace<T>(order: T[][], shares: number[], pool: number): Map<T, number> {
  const total = shares.reduce((sum, share) => sum + share, 0)
  const points = new Map<T, number>()
  let place = 0
  for (const group of order) {
    const covered = shares.slice(place, place + group.length).reduce((sum, share) => sum + share, 0)
    for (const member of group) points.set(member, (pool * covered) / total / group.length)
    place += group.length
  }
  return points
}

/** Individual game: the top 50% of players score (odd counts round down, never fewer than 1). */
function individualPoints(order: FinishingOrder): Record<PlayerId, number> {
  const players = order.flat().length
  const scoring = Math.max(1, Math.floor(players / 2))
  const byPlayer = splitByPlace(order, countdownShares(scoring), POINTS_PER_GAME)
  return Object.fromEntries(order.flat().map((player) => [player, byPlayer.get(player) ?? 0]))
}

/** Team game: 2 teams split 80/20; 3 or more pay the top 2 teams 67/33. A team's points split evenly among its members. */
function teamPoints(order: FinishingOrder, teams: Teams): Record<PlayerId, number> {
  const teamOf = (player: PlayerId) => teams.findIndex((team) => team.includes(player))
  const teamOrder = order.map((place) => [...new Set(place.map(teamOf).filter((team) => team >= 0))])
  const shares = teams.length === 2 ? [80, 20] : [2, 1]
  const byTeam = splitByPlace(teamOrder, shares, POINTS_PER_GAME)
  const points: Record<PlayerId, number> = {}
  teams.forEach((team, index) => {
    for (const player of team) points[player] = (byTeam.get(index) ?? 0) / team.length
  })
  return points
}

/** Points per player for a finished game. Team games pass their teams; a team game's order lists whole teams per place. */
export function pointsFor(order: FinishingOrder, teams?: Teams): Record<PlayerId, number> {
  return teams && teams.length >= 2 ? teamPoints(order, teams) : individualPoints(order)
}

/**
 * Each player's place (1 is first, ties share, the next place skips) and points for a finished game.
 * In a team game every member takes the team's place.
 */
export function placesAndPoints(order: FinishingOrder, teams?: Teams): Record<PlayerId, { place: number; points: number }> {
  const points = pointsFor(order, teams)
  const isTeamGame = teams !== undefined && teams.length >= 2
  const result: Record<PlayerId, { place: number; points: number }> = {}
  let place = 1
  for (const group of order) {
    for (const player of group) result[player] = { place, points: points[player] ?? 0 }
    place += isTeamGame ? new Set(group.map((player) => teams.findIndex((team) => team.includes(player)))).size : group.length
  }
  return result
}
