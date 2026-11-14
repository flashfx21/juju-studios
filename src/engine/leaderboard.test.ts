// ABOUTME: Tests for the leaderboard: totals, games and averages overall and per game, shared ranks for ties,
// ABOUTME: the 3-game rule for averages, admin score changes, and resets for one player or everyone.
import { describe, expect, it } from 'vitest'
import { leaderboard, NO_RESETS, standings, type ScoredGame, type ScoreAdjustment } from './leaderboard'

const game = (name: string, at: number, points: Record<string, number>): ScoredGame => ({
  game: name,
  at,
  players: Object.fromEntries(Object.entries(points).map(([uid, p]) => [uid, { points: p }])),
})

const GAMES: ScoredGame[] = [
  game('pin-drop', 10, { ann: 100, bob: 0 }),
  game('pin-drop', 20, { ann: 60, bob: 40 }),
  game('chainword', 30, { ann: 0, bob: 100, cat: 0 }),
  game('chainword', 40, { bob: 50, cat: 50 }),
]

const row = (rows: { uid: string }[], uid: string) => rows.find((r) => r.uid === uid)

describe('standings', () => {
  it('adds up points and games overall', () => {
    const rows = standings(GAMES, [], NO_RESETS, 'all')
    expect(row(rows, 'ann')).toMatchObject({ total: 160, games: 3 })
    expect(row(rows, 'bob')).toMatchObject({ total: 190, games: 4 })
    expect(row(rows, 'cat')).toMatchObject({ total: 50, games: 2, average: 25 })
  })

  it('counts only one game when filtered', () => {
    const rows = standings(GAMES, [], NO_RESETS, 'pin-drop')
    expect(rows.map((r) => r.uid).sort()).toEqual(['ann', 'bob'])
    expect(row(rows, 'bob')).toMatchObject({ total: 40, games: 2 })
  })

  it('adds admin score changes without counting them as games', () => {
    const changes: ScoreAdjustment[] = [
      { id: 'a1', uid: 'cat', points: 25, reason: 'Missed save', at: 50 },
      { id: 'a2', uid: 'dan', points: 10, reason: 'Welcome', at: 50, game: 'pin-drop' },
    ]
    const all = standings(GAMES, changes, NO_RESETS, 'all')
    expect(row(all, 'cat')).toMatchObject({ total: 75, games: 2 })
    expect(row(all, 'dan')).toMatchObject({ total: 10, games: 0, average: null })
    expect(row(standings(GAMES, changes, NO_RESETS, 'chainword'), 'dan')).toBeUndefined()
    expect(row(standings(GAMES, changes, NO_RESETS, 'pin-drop'), 'dan')).toMatchObject({ total: 10 })
  })

  it("a player's reset drops everything before it, for that player only", () => {
    const rows = standings(GAMES, [{ id: 'a', uid: 'bob', points: 5, reason: '', at: 25 }], { everyone: 0, players: { bob: 30 } }, 'all')
    expect(row(rows, 'bob')).toMatchObject({ total: 50, games: 1 })
    expect(row(rows, 'ann')).toMatchObject({ total: 160, games: 3 })
  })

  it('a reset for everyone starts a new season', () => {
    const rows = standings(GAMES, [], { everyone: 35, players: {} }, 'all')
    expect(rows.map((r) => r.uid).sort()).toEqual(['bob', 'cat'])
    expect(row(rows, 'bob')).toMatchObject({ total: 50, games: 1 })
  })
})

describe('leaderboard', () => {
  it('ranks by total, ties sharing a rank', () => {
    const tied = [...GAMES, game('pin-drop', 60, { cat: 140 })]
    const board = leaderboard(tied, [], NO_RESETS, { game: 'all', sort: 'total' })
    expect(board.ranked.map((s) => [s.uid, s.rank])).toEqual([
      ['bob', 1],
      ['cat', 1],
      ['ann', 3],
    ])
    expect(board.unranked).toEqual([])
  })

  it('ranks by average only players with 3 or more games', () => {
    const board = leaderboard(GAMES, [], NO_RESETS, { game: 'all', sort: 'average' })
    expect(board.ranked.map((s) => s.uid)).toEqual(['ann', 'bob'])
    expect(board.ranked[0].average).toBeCloseTo(53.33, 1)
    expect(board.unranked.map((s) => [s.uid, s.rank])).toEqual([['cat', null]])
  })

  it('is empty with no games', () => {
    expect(leaderboard([], [], NO_RESETS, { game: 'all', sort: 'total' })).toEqual({ ranked: [], unranked: [] })
  })
})
