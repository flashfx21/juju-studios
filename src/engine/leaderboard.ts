// ABOUTME: The leaderboard: each player's total points, games played and average, overall or for one game, ranked.
// ABOUTME: Counts saved results and admin score changes made since the player's last reset; averages rank players with 3+ games.

/** One saved game as the leaderboard needs it: which game, when, and each person's points. */
export interface ScoredGame {
  game: string
  at: number
  players: Record<string, { points: number }>
}

/** An admin's change to a player's points, with the reason shown in Admin. A game makes it count on that game's board too. */
export interface ScoreAdjustment {
  id: string
  uid: string
  points: number
  reason: string
  at: number
  game?: string
}

/** When scores were last reset, as times in milliseconds: for everyone (a new season) and per player. 0 means never. */
export interface ScoreResets {
  everyone: number
  players: Record<string, number>
}

export const NO_RESETS: ScoreResets = { everyone: 0, players: {} }

export type LeaderboardSort = 'total' | 'average'

/** Fewest games a player needs to be ranked by average. */
export const MIN_GAMES_FOR_AVERAGE = 3

export interface Standing {
  uid: string
  total: number
  games: number
  /** Points per game; null with no games. */
  average: number | null
  /** 1 is first; tied players share a rank. Null for players listed as unranked. */
  rank: number | null
}

export interface Leaderboard {
  ranked: Standing[]
  /** Sorting by average: players with fewer than 3 games, listed apart by total. */
  unranked: Standing[]
}

/** When this player's scores start counting: after their own reset or the last reset for everyone, whichever is later. */
export function countsFrom(uid: string, resets: ScoreResets): number {
  return Math.max(resets.everyone, resets.players[uid] ?? 0)
}

/** Every player's points since their reset, overall (game 'all') or for one game, unsorted. */
export function standings(games: readonly ScoredGame[], adjustments: readonly ScoreAdjustment[], resets: ScoreResets, game: string): Standing[] {
  const totals = new Map<string, { total: number; games: number }>()
  const entry = (uid: string) => {
    const existing = totals.get(uid)
    if (existing) return existing
    const fresh = { total: 0, games: 0 }
    totals.set(uid, fresh)
    return fresh
  }
  for (const played of games) {
    if (game !== 'all' && played.game !== game) continue
    for (const [uid, result] of Object.entries(played.players)) {
      if (played.at <= countsFrom(uid, resets)) continue
      const row = entry(uid)
      row.total += result.points
      row.games += 1
    }
  }
  for (const adjustment of adjustments) {
    if (game !== 'all' && adjustment.game !== game) continue
    if (adjustment.at <= countsFrom(adjustment.uid, resets)) continue
    entry(adjustment.uid).total += adjustment.points
  }
  return [...totals.entries()]
    .filter(([, row]) => row.games > 0 || row.total !== 0)
    .map(([uid, row]) => ({ uid, total: row.total, games: row.games, average: row.games > 0 ? row.total / row.games : null, rank: null }))
}

/** Gives each standing its rank by the sorted value; equal values share a rank (1, 1, 3). */
function withRanks(sorted: Standing[], value: (standing: Standing) => number): Standing[] {
  return sorted.map((standing, i) => {
    const firstEqual = sorted.findIndex((other) => value(other) === value(standing))
    return { ...standing, rank: firstEqual === -1 ? i + 1 : firstEqual + 1 }
  })
}

/** The board for one game (or 'all'), sorted by total or by average. */
export function leaderboard(
  games: readonly ScoredGame[],
  adjustments: readonly ScoreAdjustment[],
  resets: ScoreResets,
  { game, sort }: { game: string; sort: LeaderboardSort },
): Leaderboard {
  const rows = standings(games, adjustments, resets, game)
  const byTotal = (a: Standing, b: Standing) => b.total - a.total || b.games - a.games
  if (sort === 'total') return { ranked: withRanks([...rows].sort(byTotal), (s) => s.total), unranked: [] }
  const enough = rows.filter((row) => row.games >= MIN_GAMES_FOR_AVERAGE)
  const tooFew = rows.filter((row) => row.games < MIN_GAMES_FOR_AVERAGE)
  return {
    ranked: withRanks(
      [...enough].sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || byTotal(a, b)),
      (s) => s.average ?? 0,
    ),
    unranked: [...tooFew].sort(byTotal),
  }
}
