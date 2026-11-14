// ABOUTME: The leaderboard (#/leaderboard): every player's points, games and average, overall or per game, by total or average.
// ABOUTME: Signed-in players only (scores live behind sign-in). Players with fewer than 3 games sit apart when sorting by average.
import { useEffect, useState, type CSSProperties } from 'react'
import { leaderboard, MIN_GAMES_FOR_AVERAGE, type LeaderboardSort, type Standing } from '../engine/leaderboard'
import { watchProfiles, type Profile } from '../engine/net/profiles'
import { watchScores, type Scores } from '../engine/net/scores'
import { LINEUP } from '../games/lineup'
import { ROOM_GAMES } from '../games/room/roomPages'
import { OptionRow } from '../ui/OptionRow'
import { PhoneFrame } from '../ui/PhoneFrame'
import { inkOn, PLAYER_COLORS } from '../ui/playerColors'
import { PlayerSymbol } from '../ui/PlayerSymbol'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import '../ui/PhoneForm.css'
import { PlayerBadge } from './PlayerBadge'
import { goBack, href } from './useHashRoute'
import { useMe } from './useMe'
import './Leaderboard.css'

const TITLES: Record<LobbyStyleId, string> = { 'game-show': 'The standings', arcade: 'High scores', 'rec-room': 'Standings' }
const EMPTY: Record<LobbyStyleId, string> = {
  'game-show': 'No scores yet',
  arcade: 'No high scores yet',
  'rec-room': "Nobody's on the board yet",
}

/** Games that can be played in a room, so can have scores, in lineup order. */
const BOARD_GAMES = LINEUP.filter((game) => ROOM_GAMES.includes(game.id))
const GAME_FILTERS = ['all', ...BOARD_GAMES.map((game) => game.id)]
const GAME_NAMES: Record<string, string> = Object.fromEntries([['all', 'All games'], ...BOARD_GAMES.map((game) => [game.id, game.title])])
const SORTS: readonly LeaderboardSort[] = ['total', 'average']
const SORT_NAMES: Record<LeaderboardSort, string> = { total: 'Total', average: 'Average' }

function totalText(total: number, style: LobbyStyleId): string {
  const whole = Math.round(total)
  return style === 'arcade' ? String(Math.max(0, whole)).padStart(5, '0') : String(whole)
}

function averageText(average: number | null): string {
  return average === null ? '-' : average.toFixed(1)
}

function PlayerChip({ profile, style }: { profile: Profile | undefined; style: LobbyStyleId }) {
  const hex = PLAYER_COLORS[style][profile?.color ?? 'silver']
  if (style === 'arcade') {
    return (
      <span className="board-row__initials" style={{ color: hex }} aria-hidden="true">
        {profile?.initials ?? '?'}
      </span>
    )
  }
  return (
    <span className="board-row__dot" style={{ background: hex, color: inkOn(hex) } as CSSProperties} aria-hidden="true">
      {profile?.symbol && <PlayerSymbol symbol={profile.symbol} />}
    </span>
  )
}

function BoardRow({ standing, profile, isMe, style }: { standing: Standing; profile: Profile | undefined; isMe: boolean; style: LobbyStyleId }) {
  const name = profile?.username ?? 'Former player'
  return (
    <li className="board-row" data-rank={standing.rank ?? undefined} data-me={isMe || undefined} data-testid={`board-row-${standing.uid}`}>
      <span className="board-row__rank">{standing.rank ?? '-'}</span>
      <PlayerChip profile={profile} style={style} />
      <span className="board-row__who">
        <span className="board-row__name">
          {name}
          {isMe && <span className="board-row__you"> (you)</span>}
        </span>
        <span className="board-row__detail">
          {standing.games} {standing.games === 1 ? 'game' : 'games'} · avg {averageText(standing.average)}
        </span>
      </span>
      <span className="board-row__total" data-testid={`board-total-${standing.uid}`}>
        {totalText(standing.total, style)}
      </span>
    </li>
  )
}

function Board({ uid }: { uid: string }) {
  const style = useLobbyStyle()
  const [scores, setScores] = useState<Scores | null>(null)
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [problem, setProblem] = useState('')
  const [game, setGame] = useState('all')
  const [sort, setSort] = useState<LeaderboardSort>('total')

  useEffect(() => {
    const failed = (error: Error) => {
      console.error('Reading the leaderboard failed', error)
      setProblem("Couldn't load the leaderboard. Check you're online.")
    }
    const stopScores = watchScores(setScores, failed)
    const stopProfiles = watchProfiles(setProfiles, failed)
    return () => {
      stopScores()
      stopProfiles()
    }
  }, [])

  const board = scores ? leaderboard(scores.games, scores.adjustments, scores.resets, { game, sort }) : null
  const row = (standing: Standing) => <BoardRow key={standing.uid} standing={standing} profile={profiles[standing.uid]} isMe={standing.uid === uid} style={style} />

  return (
    <>
      <p className="board__facts" data-testid="board-facts">
        {GAME_NAMES[game]} · by {SORT_NAMES[sort].toLowerCase()}
      </p>
      <div className="board__filters">
        <OptionRow label="Game" options={GAME_FILTERS} names={GAME_NAMES} value={game} onChoose={setGame} />
        <OptionRow label="Sort" options={SORTS} names={SORT_NAMES} value={sort} onChoose={setSort} />
      </div>
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
      {!board && !problem && <p className="cue-card__text">Loading the standings...</p>}
      {board && board.ranked.length === 0 && board.unranked.length === 0 && (
        <div className="board__empty" data-testid="board-empty">
          <p className="board__empty-title">{EMPTY[style]}</p>
          <p className="cue-card__text">Play a game in a room and the standings start here.</p>
        </div>
      )}
      {board && board.ranked.length > 0 && (
        <ol className="board" aria-label={`${GAME_NAMES[game]}, by ${SORT_NAMES[sort].toLowerCase()}`} data-testid="board-ranked">
          {board.ranked.map(row)}
        </ol>
      )}
      {board && board.unranked.length > 0 && (
        <>
          <h2 className="board__unranked-heading">Fewer than {MIN_GAMES_FOR_AVERAGE} games: not ranked by average yet</h2>
          <ul className="board" aria-label="Not ranked by average yet" data-testid="board-unranked">
            {board.unranked.map(row)}
          </ul>
        </>
      )}
    </>
  )
}

export function Leaderboard() {
  const me = useMe()
  const style = useLobbyStyle()
  const signedIn = me.kind === 'signed-in' && me.profile

  return (
    <PhoneFrame label="Leaderboard" cardTag="Standings">
      <PlayerBadge />
      <div className="phone-top board__top">
        <h1 className="phone-top__title board__title">{TITLES[style]}</h1>
      </div>
      {me.kind === 'checking' ? null : signedIn ? (
        <Board uid={me.player.uid} />
      ) : (
        <>
          <p className="cue-card__text">Sign in to see the standings.</p>
          <a className="phone-button" href={href('sign-in')} data-testid="board-sign-in">
            Sign in
          </a>
        </>
      )}
      <div className="phone-actions">
        <button type="button" className="phone-link" data-testid="board-back" onClick={goBack}>
          Back
        </button>
        <a className="phone-link phone-link--quiet" href={href('home')} data-testid="board-home">
          Home
        </a>
      </div>
    </PhoneFrame>
  )
}
