// ABOUTME: Everything the leaderboard counts: saved results, admin score changes (scoreAdjustments) and resets (scoreResets).
// ABOUTME: Any verified player reads them; only admins write changes and resets. Saved results are never edited, only deleted by an admin.

import { onValue, push, ref, serverTimestamp, set } from 'firebase/database'
import type { ScoreAdjustment, ScoreResets } from '../leaderboard'
import { firebaseBackend } from './firebase'
import { asResults, type GameResult } from './results'

export interface Scores {
  games: GameResult[]
  adjustments: ScoreAdjustment[]
  resets: ScoreResets
}

function asAdjustments(value: unknown): ScoreAdjustment[] {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value as Record<string, Partial<ScoreAdjustment>>)
    .filter(([, a]) => a && typeof a.uid === 'string' && typeof a.points === 'number' && typeof a.at === 'number')
    .map(([id, a]) => ({
      id,
      uid: a.uid!,
      points: a.points!,
      at: a.at!,
      reason: typeof a.reason === 'string' ? a.reason : '',
      ...(typeof a.game === 'string' ? { game: a.game } : {}),
    }))
}

function asResets(value: unknown): ScoreResets {
  const stored = (value && typeof value === 'object' ? value : {}) as { everyone?: unknown; players?: Record<string, unknown> }
  const players: Record<string, number> = {}
  for (const [uid, at] of Object.entries(stored.players ?? {})) if (typeof at === 'number') players[uid] = at
  return { everyone: typeof stored.everyone === 'number' ? stored.everyone : 0, players }
}

/** Results, score changes and resets, kept up to date. Calls back once all three have loaded. Returns a stop function. */
export function watchScores(onChange: (scores: Scores) => void, onError: (error: Error) => void): () => void {
  const { database } = firebaseBackend()
  const loaded: Partial<Scores> = {}
  const changed = () => {
    if (loaded.games && loaded.adjustments && loaded.resets) onChange({ games: loaded.games, adjustments: loaded.adjustments, resets: loaded.resets })
  }
  const stops = [
    onValue(ref(database, 'results'), (s) => ((loaded.games = asResults(s.val())), changed()), onError),
    onValue(ref(database, 'scoreAdjustments'), (s) => ((loaded.adjustments = asAdjustments(s.val())), changed()), onError),
    onValue(ref(database, 'scoreResets'), (s) => ((loaded.resets = asResets(s.val())), changed()), onError),
  ]
  return () => stops.forEach((stop) => stop())
}

/** Admin only: adds or takes away points for a player, with a reason. */
export async function addScoreAdjustment(uid: string, points: number, reason: string, by: string): Promise<void> {
  await set(push(ref(firebaseBackend().database, 'scoreAdjustments')), { uid, points, reason, by, at: serverTimestamp() })
}

/** Admin only: this player's leaderboard starts again from 0 now. Their saved games stay in the database. */
export function resetPlayerScores(uid: string): Promise<void> {
  return set(ref(firebaseBackend().database, `scoreResets/players/${uid}`), serverTimestamp())
}

/** Admin only: a new season. Everyone's leaderboard starts again from 0 now. */
export function resetEveryonesScores(): Promise<void> {
  return set(ref(firebaseBackend().database, 'scoreResets/everyone'), serverTimestamp())
}
