// ABOUTME: Tonight's lobby on a phone (#/room): the room code, who's in, how many games the night has, and a vote on the next one.
// ABOUTME: The host starts the game with the most votes (a tie: Random starts one of them); every phone follows into it, and back here after. The last game ends in a recap.
import { useState, type CSSProperties } from 'react'
import {
  castVote,
  endSession,
  LOBBY,
  planSession,
  sessionGames,
  sessionTotals,
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
import { MenuItems } from '../ui/FrameMenu'
import { OptionRow } from '../ui/OptionRow'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { HowToPlayButton } from './HowToPlay'
import { mostVoted, randomPick } from './lobbyPick'
import { roomGames } from './pickerGames'
import { PlayerBadge } from './PlayerBadge'
import { goTo, href } from './useHashRoute'
import { siteAddress } from './siteAddress'
import './GameVote.css'
import './LobbyRoom.css'

/** Tonight's lobby's places to go, in the top-left menu (the room adds Leave room). */
function LobbyMenu() {
  return (
    <MenuItems>
      <a href={href('home')} data-testid="lobby-home">
        Home
      </a>
      <a href={href('leaderboard')} data-testid="lobby-leaderboard">
        Leaderboard
      </a>
      <a href={href('how-to-play')} data-testid="lobby-how-to-play">
        How to play
      </a>
    </MenuItems>
  )
}

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

/** Games a host can plan for the night. */
const NIGHT_LENGTHS = [3, 5, 7] as const
type NightLength = (typeof NIGHT_LENGTHS)[number]
const NIGHT_LENGTH_NAMES: Record<NightLength, string> = { 3: '3', 5: '5', 7: '7' }

function pointsText(points: number): string {
  const whole = Math.round(points)
  return `${whole} ${whole === 1 ? 'point' : 'points'}`
}

/** The night's totals, best first, and each game's winners. */
function Recap({ room }: { room: Room }) {
  const looks = usePlayerLooks(room)
  const games = sessionGames(room.session)
  const table = sessionTotals(room.session)
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
    </section>
  )
}

function LobbyScreen({ room, self, isHost }: RoomScreenProps) {
  const style = useLobbyStyle()
  const looks = usePlayerLooks(room)
  const games = roomGames(room)
  const myVote = room.votes[self.uid]
  const leaders = mostVoted(
    room.votes,
    games.map((game) => game.id),
  )
  // One clear winner gets a Start button; a tie gets the host's Random button instead.
  const pick = leaders.length === 1 ? leaders[0] : null
  const tied = leaders.length > 1 ? leaders : []
  const titleOf = (id: string) => LINEUP.find((game) => game.id === id)?.title ?? id
  const pickTitle = pick ? titleOf(pick) : undefined
  const running = room.game !== LOBBY ? LINEUP.find((game) => game.id === room.game) : undefined
  const [nightLength, setNightLength] = useState<NightLength>(3)
  const planned = room.session.planned
  const played = Object.keys(room.session.games).length
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  // Start and Random switch the whole room, so a second tap while the first is on its way is ignored.
  const [starting, setStarting] = useState(false)

  if (!running && sessionOver(room.session)) {
    return (
      <div className="room-waiting lobby-room">
        <LobbyMenu />
        <PlayerBadge />
        <LobbyTitle />
        <Recap room={room} />
      </div>
    )
  }

  async function start(game: string) {
    if (starting) return
    setStarting(true)
    try {
      if (planned === null) await planSession(room.code, nightLength)
      await switchGame(room.code, game)
    } catch (problem) {
      console.error('Starting the game failed', problem)
      setStarting(false)
    }
  }

  return (
    <div className="room-waiting lobby-room">
      <LobbyMenu />
      <PlayerBadge />
      <LobbyTitle />
      <RoomHeader room={room} looks={looks} />
      {isHost && !running && (
        <p className="room-status" data-testid="lobby-tv-hint">
          Got a TV or computer? Open {siteAddress()}, tap Host on this screen and type {room.code}.
        </p>
      )}

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
            <p className="cue-card__text" data-testid="lobby-no-games">
              No games are ready for this room yet. Games in testing open when a playtester hosts.
            </p>
          ) : (
            <ul className="game-vote__rows" aria-label="Games to vote for">
              {games.map((game) => {
                const voters = Object.entries(room.votes)
                  .filter(([, vote]) => vote === game.id)
                  .map(([uid]) => uid)
                const colors = GAME_TILE_COLORS[style][game.id]
                return (
                  <li key={game.id} className="how-to-play__row">
                    <button
                      type="button"
                      className="game-vote__row lobby-room__row"
                      aria-pressed={myVote === game.id}
                      aria-label={`${game.title}: ${voters.length} ${voters.length === 1 ? 'vote' : 'votes'}${myVote === game.id ? ', your vote' : ''}`}
                      data-testid={`lobby-vote-${game.id}`}
                      style={colors ? ({ '--row-bg': colors.bg, '--row-ink': colors.ink } as CSSProperties) : undefined}
                      onClick={() => void castVote(room.code, self.uid, game.id)}
                    >
                      <span className="game-vote__row-text">
                        <span className="game-vote__row-title">{game.title}</span>
                        <span className="lobby-room__voters" data-testid={`lobby-voters-${game.id}`}>
                          {myVote === game.id && <span className="lobby-room__mine">My vote</span>}
                          <span className="lobby-room__count">
                            {voters.length} {voters.length === 1 ? 'vote' : 'votes'}
                          </span>
                          {voters.map((uid) => looks[uid] && <PlayerDot key={uid} look={looks[uid]} />)}
                        </span>
                      </span>
                    </button>
                    {isHost && pick === game.id && (
                      <button
                        type="button"
                        className="lobby-room__start"
                        aria-label={`Start ${game.title}`}
                        data-testid="lobby-start"
                        onClick={() => void start(game.id)}
                      >
                        Start
                      </button>
                    )}
                    <HowToPlayButton gameId={game.id} />
                  </li>
                )
              })}
            </ul>
          )}
          {tied.length > 0 && (
            <div className="lobby-room__tie" data-testid="lobby-tie">
              <p className="lobby-room__tie-text">It's a tie between {tied.map(titleOf).join(' and ')}!</p>
              {isHost && (
                <button
                  type="button"
                  className="phone-button"
                  aria-disabled={starting || undefined}
                  data-testid="lobby-random"
                  onClick={() => void start(randomPick(tied, Math.random))}
                >
                  Random
                </button>
              )}
            </div>
          )}
          <p className="room-status" role="status" data-testid="lobby-status">
            {pickTitle
              ? isHost
                ? `Tap Start on ${pickTitle} when everyone's ready`
                : `The host will start ${pickTitle}`
              : tied.length > 0
                ? isHost
                  ? 'Tap Random to start one of them'
                  : 'The host will start one of them at random'
                : 'Vote, then the host starts the game with the most votes'}
          </p>
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
    </div>
  )
}
