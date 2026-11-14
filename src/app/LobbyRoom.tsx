// ABOUTME: Tonight's lobby on a phone (#/room): the room code, who's in, how many games the night has, and a vote on the next one.
// ABOUTME: The host starts their pick (or the leading game); every phone follows into it, and back here after. The last game ends in a recap.
import { useState, type CSSProperties } from 'react'
import {
  castVote,
  endSession,
  LOBBY,
  planSession,
  sessionGames,
  sessionOver,
  switchGame,
  type Room,
} from '../engine/net/rooms'
import { rememberRoom } from '../engine/rememberedRoom'
import { LINEUP } from '../games/lineup'
import { PlayerDot, RoomHeader, RoomPage, type RoomScreenProps } from '../games/room/RoomPage'
import { roomPageFor } from '../games/room/roomPages'
import { usePlayerLooks } from '../games/room/usePlayerLooks'
import { GAME_TILE_COLORS } from '../ui/gameTileColors'
import { OptionRow } from '../ui/OptionRow'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { pickerState } from './pickerGames'
import { PlayerBadge } from './PlayerBadge'
import { goTo } from './useHashRoute'
import { useMe } from './useMe'
import './GameVote.css'
import './LobbyRoom.css'

function LobbyTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        JuJu
      </span>
      <h1 className="phone-top__title">Tonight's lobby</h1>
    </div>
  )
}

export function LobbyRoom() {
  return (
    <RoomPage
      gameId={LOBBY}
      gameName="Tonight's lobby"
      Title={LobbyTitle}
      cardTag="Game night"
      intro="Start a room for the night and read out the code; everyone joins once, then votes on each game."
    >
      {(props) => <LobbyScreen {...props} />}
    </RoomPage>
  )
}

/** The game the host would start: the host's own vote, or else the game with the most votes. */
function nextGame(room: Room, games: string[]): string | null {
  const hostVote = room.votes[room.host]
  if (hostVote && games.includes(hostVote)) return hostVote
  const counts = games.map((id) => ({ id, votes: Object.values(room.votes).filter((v) => v === id).length }))
  const best = counts.reduce((a, b) => (b.votes > a.votes ? b : a), { id: '', votes: 0 })
  return best.votes > 0 ? best.id : null
}

/** Games a host can plan for the night. */
const NIGHT_LENGTHS = [3, 5, 7] as const
type NightLength = (typeof NIGHT_LENGTHS)[number]
const NIGHT_LENGTH_NAMES: Record<NightLength, string> = { 3: '3', 5: '5', 7: '7' }

function pointsText(points: number): string {
  const whole = Math.round(points)
  return `${whole} ${whole === 1 ? 'point' : 'points'}`
}

/** The night's totals, best first, and each game's winners. */
function Recap({ room, onLeave }: { room: Room; onLeave: () => void }) {
  const looks = usePlayerLooks(room)
  const games = sessionGames(room.session)
  const totals = new Map<string, number>()
  for (const game of games) {
    for (const [uid, points] of Object.entries(game.points)) totals.set(uid, (totals.get(uid) ?? 0) + points)
  }
  const table = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const placeOf = (index: number) => 1 + table.findIndex(([, points]) => Math.round(points) === Math.round(table[index][1]))
  const nameOf = (uid: string) => looks[uid]?.name ?? 'A player who left'

  return (
    <section className="lobby-recap" aria-labelledby="lobby-recap-heading" data-testid="lobby-recap">
      <h2 className="lobby-room__heading" id="lobby-recap-heading">
        That's the night
      </h2>
      <p className="cue-card__text">
        {games.length} {games.length === 1 ? 'game' : 'games'} played. Every game was worth 100 points.
      </p>
      {table.length > 0 && (
        <ol className="lobby-recap__table" aria-label="The night's totals">
          {table.map(([uid, points], i) => (
            <li key={uid} className="lobby-recap__row" data-testid={`lobby-recap-${uid}`}>
              <span className="lobby-recap__place">{placeOf(i)}</span>
              {looks[uid] && <PlayerDot look={looks[uid]} />}
              <span className="lobby-recap__name">{nameOf(uid)}</span>
              <span className="lobby-recap__points">{pointsText(points)}</span>
            </li>
          ))}
        </ol>
      )}
      {games.length > 0 && (
        <>
          <h3 className="lobby-recap__subheading">Game by game</h3>
          <ol className="lobby-recap__games">
            {games.map((game, i) => {
              const best = Math.max(...Object.values(game.points), 0)
              const winners = Object.entries(game.points)
                .filter(([, points]) => best > 0 && points === best)
                .map(([uid]) => nameOf(uid))
              const title = LINEUP.find((entry) => entry.id === game.game)?.title ?? game.game
              return (
                <li key={i}>
                  {title}: {winners.length > 0 ? `${winners.join(' and ')} won` : 'no points for people'}
                </li>
              )
            })}
          </ol>
        </>
      )}
      <p className="cue-card__text">Want to keep playing? Start a new lobby from the home screen.</p>
      <button type="button" className="phone-button" data-testid="room-leave" onClick={onLeave}>
        Leave room
      </button>
    </section>
  )
}

function LobbyScreen({ room, self, isHost, onLeave }: RoomScreenProps) {
  const me = useMe()
  const style = useLobbyStyle()
  const canPlaytest = me.kind === 'signed-in' && me.canPlaytest
  const looks = usePlayerLooks(room)
  const games = LINEUP.filter((game) => roomPageFor(game.id) && pickerState(game, canPlaytest) === 'ready')
  const myVote = room.votes[self.uid]
  const pick = nextGame(
    room,
    games.map((game) => game.id),
  )
  const pickTitle = LINEUP.find((game) => game.id === pick)?.title
  const running = room.game !== LOBBY ? LINEUP.find((game) => game.id === room.game) : undefined
  const [nightLength, setNightLength] = useState<NightLength>(3)
  const planned = room.session.planned
  const played = Object.keys(room.session.games).length
  const [confirmingEnd, setConfirmingEnd] = useState(false)

  if (!running && sessionOver(room.session)) {
    return (
      <div className="room-waiting lobby-room">
        <PlayerBadge />
        <LobbyTitle />
        <Recap room={room} onLeave={onLeave} />
      </div>
    )
  }

  async function start(game: string) {
    if (planned === null) await planSession(room.code, nightLength)
    await switchGame(room.code, game)
  }

  return (
    <div className="room-waiting lobby-room">
      <PlayerBadge />
      <LobbyTitle />
      <RoomHeader room={room} looks={looks} />

      {running ? (
        <div className="cue-card">
          <p className="cue-card__text">This room is playing {running.title} right now.</p>
          <button
            type="button"
            className="phone-button"
            data-testid="lobby-rejoin"
            onClick={() => {
              const page = roomPageFor(running.id)
              if (!page) return
              // Exit game made this phone forget the game's room; remember it again so the game page opens in it.
              rememberRoom(running.id, room.code)
              goTo('playtest', page)
            }}
          >
            Rejoin {running.title}
          </button>
        </div>
      ) : (
        <>
          {planned !== null ? (
            <p className="lobby-room__night" data-testid="lobby-night">
              Game {played + 1} of {planned}
            </p>
          ) : isHost ? (
            <OptionRow label="Games tonight" options={NIGHT_LENGTHS} names={NIGHT_LENGTH_NAMES} value={nightLength} onChoose={setNightLength} />
          ) : (
            <p className="lobby-room__night" data-testid="lobby-night">
              The host picks how many games tonight
            </p>
          )}
          <h2 className="lobby-room__heading">Vote for the next game</h2>
          {games.length === 0 ? (
            <p className="cue-card__text">No games are ready for a room yet. Games in testing open for playtesters.</p>
          ) : (
            <ul className="game-vote__rows" aria-label="Games to vote for">
              {games.map((game) => {
                const voters = Object.entries(room.votes)
                  .filter(([, vote]) => vote === game.id)
                  .map(([uid]) => uid)
                const colors = GAME_TILE_COLORS[style][game.id]
                return (
                  <li key={game.id}>
                    <button
                      type="button"
                      className="game-vote__row lobby-room__row"
                      aria-pressed={myVote === game.id}
                      aria-label={`${game.title}: ${voters.length} ${voters.length === 1 ? 'vote' : 'votes'}${myVote === game.id ? ', your vote' : ''}`}
                      data-testid={`lobby-vote-${game.id}`}
                      style={colors ? ({ '--row-bg': colors.bg, '--row-ink': colors.ink } as CSSProperties) : undefined}
                      onClick={() => void castVote(room.code, self.uid, game.id)}
                    >
                      <span className="game-vote__number">{game.number}</span>
                      <span className="game-vote__row-text">
                        <span className="game-vote__row-title">{game.title}</span>
                        <span className="lobby-room__voters" data-testid={`lobby-voters-${game.id}`}>
                          {voters.map((uid) => looks[uid] && <PlayerDot key={uid} look={looks[uid]} />)}
                          <span className="lobby-room__count">
                            {voters.length} {voters.length === 1 ? 'vote' : 'votes'}
                          </span>
                        </span>
                      </span>
                      {myVote === game.id && <span className="game-vote__mark">My vote</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {isHost ? (
            <button
              type="button"
              className="phone-button"
              aria-disabled={pick ? undefined : 'true'}
              data-testid="lobby-start"
              onClick={() => pick && void start(pick)}
            >
              {pickTitle ? `Start ${pickTitle}` : 'Vote to pick a game'}
            </button>
          ) : (
            <p className="room-status" role="status">
              {pickTitle ? `The host will start ${pickTitle} or their own pick` : 'Vote, then the host starts a game'}
            </p>
          )}
        </>
      )}

      {isHost && !running && played > 0 && (
        <button
          type="button"
          className="phone-button phone-button--secondary"
          data-testid="lobby-end-night"
          onClick={() => {
            if (!confirmingEnd) {
              setConfirmingEnd(true)
              return
            }
            void endSession(room.code)
          }}
          onBlur={() => setConfirmingEnd(false)}
        >
          {confirmingEnd ? 'Tap again to end the night' : 'End the night'}
        </button>
      )}
      <button type="button" className="phone-link phone-link--quiet" data-testid="room-leave" onClick={onLeave}>
        Leave room
      </button>
    </div>
  )
}
