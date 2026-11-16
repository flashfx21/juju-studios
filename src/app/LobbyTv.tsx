// ABOUTME: Tonight's lobby on the TV: where to join and the room code, who's in, the night's game count, and the vote
// ABOUTME: as it comes in from the phones; after the last game, the night's totals. Display only: phones vote and start games.
import { LOBBY, playerIds, sessionGames, sessionOver, sessionTotals, type Room } from '../engine/net/rooms'
import { LINEUP } from '../games/lineup'
import { PlayerDot } from '../games/room/RoomPage'
import { roomPageFor } from '../games/room/roomPages'
import { TvFrame } from '../games/room/TvFrame'
import { usePlayerLooks } from '../games/room/usePlayerLooks'
import { mostVoted } from './lobbyPick'
import { pickerState } from './pickerGames'
import { siteAddress } from './siteAddress'
import { useMe } from './useMe'
import './LobbyTv.css'

function pointsText(points: number): string {
  const whole = Math.round(points)
  return `${whole} ${whole === 1 ? 'point' : 'points'}`
}

function NightOver({ room }: { room: Room }) {
  const looks = usePlayerLooks(room)
  const table = sessionTotals(room.session)
  const played = sessionGames(room.session).length
  return (
    <TvFrame title="That's the night" status={`${played} ${played === 1 ? 'game' : 'games'} played · start a new lobby to keep going`}>
      <ol className="lobby-tv__totals" aria-label="The night's totals" data-testid="lobby-tv-recap">
        {table.map(([uid, points], i) => (
          <li key={uid} className="lobby-tv__total" data-top={i === 0 || undefined}>
            {looks[uid] && <PlayerDot look={looks[uid]} size={44} />}
            <span className="lobby-tv__name">{looks[uid]?.name ?? 'A player who left'}</span>
            <span className="lobby-tv__points">{pointsText(points)}</span>
          </li>
        ))}
      </ol>
    </TvFrame>
  )
}

export function LobbyTv({ room }: { room: Room }) {
  const me = useMe()
  const looks = usePlayerLooks(room)
  if (sessionOver(room.session) && room.game === LOBBY) return <NightOver room={room} />

  const canPlaytest = me.kind === 'signed-in' && me.canPlaytest
  const games = LINEUP.filter((game) => roomPageFor(game.id) && pickerState(game, canPlaytest) === 'ready')
  const leaders = mostVoted(
    room.votes,
    games.map((game) => game.id),
  )
  const titleOf = (id: string) => LINEUP.find((game) => game.id === id)?.title ?? id
  const planned = room.session.planned
  const played = Object.keys(room.session.games).length
  const status =
    leaders.length === 1
      ? `${titleOf(leaders[0])} is winning · the host starts it on their phone`
      : leaders.length > 1
        ? `It's a tie: ${leaders.map(titleOf).join(' and ')} · the host can pick at random`
        : 'Vote on your phone for the next game'

  return (
    <TvFrame title="Tonight's lobby" aside={planned === null ? undefined : `Game ${played + 1} of ${planned}`} status={status}>
      <div className="lobby-tv" data-testid="lobby-tv">
        <div className="lobby-tv__join">
          <span className="tv-label">Join on your phone</span>
          <span className="lobby-tv__site">{siteAddress()}</span>
          <span className="tv-label">Room code</span>
          <span className="lobby-tv__code" data-testid="lobby-tv-code">
            {room.code}
          </span>
          <ul className="lobby-tv__players" aria-label="Who's in">
            {playerIds(room).map((uid) => (
              <li key={uid} className="lobby-tv__player">
                <PlayerDot look={looks[uid]} size={36} />
                <span className="lobby-tv__name">{looks[uid]?.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lobby-tv__votes">
          <span className="tv-label">The vote</span>
          <ul className="lobby-tv__games" aria-label="Votes for the next game">
            {games.map((game) => {
              const voters = Object.entries(room.votes)
                .filter(([, vote]) => vote === game.id)
                .map(([uid]) => uid)
              return (
                <li key={game.id} className="lobby-tv__game" data-leading={leaders.includes(game.id) || undefined} data-testid={`lobby-tv-game-${game.id}`}>
                  <span className="lobby-tv__game-title">{game.title}</span>
                  <span className="lobby-tv__voters">{voters.map((uid) => looks[uid] && <PlayerDot key={uid} look={looks[uid]} size={30} />)}</span>
                  <span className="lobby-tv__count">{voters.length}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </TvFrame>
  )
}
