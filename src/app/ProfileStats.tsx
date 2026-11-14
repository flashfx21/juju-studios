// ABOUTME: The Profile screen's Stats tab: games played, total and average points, and a log of every saved game.
// ABOUTME: Counts the same way as the leaderboard: games since the player's last reset, plus admin score changes.
import { useEffect, useState } from 'react'
import { countsFrom, standings } from '../engine/leaderboard'
import { watchScores, type Scores } from '../engine/net/scores'
import { LINEUP } from '../games/lineup'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { href } from './useHashRoute'

function placeText(place: number): string {
  const suffix = place % 10 === 1 && place !== 11 ? 'st' : place % 10 === 2 && place !== 12 ? 'nd' : place % 10 === 3 && place !== 13 ? 'rd' : 'th'
  return `${place}${suffix}`
}

function dateText(at: number): string {
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ProfileStats({ uid, style }: { uid: string; style: LobbyStyleId }) {
  const [scores, setScores] = useState<Scores | null>(null)
  const [problem, setProblem] = useState('')

  useEffect(
    () =>
      watchScores(setScores, (error) => {
        console.error('Reading game results failed', error)
        setProblem("Couldn't load your stats. Check you're online.")
      }),
    [uid],
  )

  const since = scores ? countsFrom(uid, scores.resets) : 0
  const mine = (scores?.games ?? [])
    .filter((result) => uid in result.players && result.at > since)
    .sort((a, b) => b.at - a.at)
    .map((result) => ({ result, me: result.players[uid] }))
  const own = scores ? standings(scores.games, scores.adjustments, scores.resets, 'all').find((row) => row.uid === uid) : undefined
  const total = Math.round(own?.total ?? 0)
  const average = own?.average != null ? Math.round(own.average) : null

  return (
    <>
      <dl className="profile__stats">
        <div className="profile__stat">
          <dt>Games played</dt>
          <dd data-testid="stats-games">{mine.length}</dd>
        </div>
        <div className="profile__stat">
          <dt>Total points</dt>
          <dd data-testid="stats-total">{style === 'arcade' ? String(total).padStart(5, '0') : total}</dd>
        </div>
        <div className="profile__stat">
          <dt>Average</dt>
          <dd data-testid="stats-average">{average ?? '-'}</dd>
        </div>
      </dl>
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
      {scores === null && !problem && <p className="cue-card__text">Loading your games...</p>}
      {scores !== null && mine.length === 0 && (
        <p className="cue-card__text">No games saved yet. Finish a game in a room and it shows up here.</p>
      )}
      {mine.length > 0 && (
        <ol className="profile__log" aria-label="Your games, newest first" data-testid="stats-log">
          {mine.map(({ result, me }) => (
            <li key={result.id} className="profile__log-row">
              <span className="profile__log-game">{LINEUP.find((game) => game.id === result.game)?.title ?? result.game}</span>
              <span>
                {placeText(me.place)} of {result.size ?? Object.keys(result.players).length}
              </span>
              <span>{Math.round(me.points)} pts</span>
              <span className="profile__log-date">{dateText(result.at)}</span>
            </li>
          ))}
        </ol>
      )}
      <a className="phone-link" href={href('leaderboard')} data-testid="stats-leaderboard">
        See the leaderboard
      </a>
    </>
  )
}
