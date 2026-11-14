// ABOUTME: Tests for leaderboard points: the countdown split, ties, odd player counts and team games.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { placesAndPoints, pointsFor } from './scoring'

function rounded(points: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(points).map(([id, value]) => [id, Math.round(value * 100) / 100]))
}

describe('individual games', () => {
  it('pays the top half of 8 players 40/30/20/10', () => {
    const order = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => [id])
    expect(pointsFor(order)).toEqual({ a: 40, b: 30, c: 20, d: 10, e: 0, f: 0, g: 0, h: 0 })
  })

  it('rounds odd counts down: 5 players pay the top 2', () => {
    expect(rounded(pointsFor([['a'], ['b'], ['c'], ['d'], ['e']]))).toEqual({ a: 66.67, b: 33.33, c: 0, d: 0, e: 0 })
  })

  it('pays the winner everything with 2 or 3 players', () => {
    expect(pointsFor([['a'], ['b']])).toEqual({ a: 100, b: 0 })
    expect(pointsFor([['a'], ['b'], ['c']])).toEqual({ a: 100, b: 0, c: 0 })
  })

  it('splits the places a tie covers', () => {
    // 4 players, 2 scoring places: a and b tie for 1st and share 1st plus 2nd.
    expect(pointsFor([['a', 'b'], ['c'], ['d']])).toEqual({ a: 50, b: 50, c: 0, d: 0 })
    // A tie across the cut shares only the scoring place it covers.
    expect(pointsFor([['a'], ['b', 'c'], ['d']])).toEqual({ a: 200 / 3, b: 50 / 3, c: 50 / 3, d: 0 })
  })

  it('always hands out 100 points', () => {
    const points = pointsFor([['a'], ['b', 'c'], ['d'], ['e'], ['f']])
    expect(Object.values(points).reduce((sum, p) => sum + p, 0)).toBeCloseTo(100)
  })
})

describe('team games', () => {
  const teams = [
    ['a', 'b', 'c', 'd'],
    ['e', 'f', 'g', 'h'],
  ]

  it('splits 80/20 between 2 teams, evenly among members', () => {
    const points = pointsFor([teams[1], teams[0]], teams)
    expect(points).toEqual({ e: 20, f: 20, g: 20, h: 20, a: 5, b: 5, c: 5, d: 5 })
  })

  it('splits a 2-team tie evenly', () => {
    expect(pointsFor([[...teams[0], ...teams[1]]], teams)).toEqual({ a: 12.5, b: 12.5, c: 12.5, d: 12.5, e: 12.5, f: 12.5, g: 12.5, h: 12.5 })
  })

  it('pays the top 2 of 3 teams 67/33', () => {
    const three = [['a', 'b'], ['c', 'd'], ['e']]
    expect(rounded(pointsFor([three[2], three[0], three[1]], three))).toEqual({ e: 66.67, a: 16.67, b: 16.67, c: 0, d: 0 })
  })
})

describe('places', () => {
  it('shares a place on a tie and skips the next', () => {
    expect(placesAndPoints([['a', 'b'], ['c'], ['d']])).toEqual({
      a: { place: 1, points: 50 },
      b: { place: 1, points: 50 },
      c: { place: 3, points: 0 },
      d: { place: 4, points: 0 },
    })
  })

  it("gives every team member the team's place", () => {
    const teams = [['a', 'b'], ['c', 'd']]
    expect(placesAndPoints([teams[1], teams[0]], teams)).toEqual({
      c: { place: 1, points: 40 },
      d: { place: 1, points: 40 },
      a: { place: 2, points: 10 },
      b: { place: 2, points: 10 },
    })
  })
})
