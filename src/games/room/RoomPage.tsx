// ABOUTME: The room around any phones-only game: start a room or join one by code, the waiting room, and what each player looks like.
// ABOUTME: A game supplies its title, setup choices and game screen; bots can fill seats; a lobby room moves every phone between games.
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { goTo, href } from '../../app/useHashRoute'
import { useMe } from '../../app/useMe'
import { createRoom, joinRoom, LOBBY, playerIds, switchGame, watchRoom, type Room } from '../../engine/net/rooms'
import { rememberedRoom, rememberRoom } from '../../engine/rememberedRoom'
import { CodeBoxes } from '../../ui/CodeBoxes'
import { MenuItems } from '../../ui/FrameMenu'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { inkOn, type PlayerColorId } from '../../ui/playerColors'
import { PlayerSymbol } from '../../ui/PlayerSymbol'
import { Field } from '../../ui/TextField'
import type { PlayerId } from '../types'
import { allBotIds, BOT_SKILLS } from './bots'
import { BotPicker } from './BotPicker'
import { roomPageFor } from './roomPages'
import { usePlayerLooks, type PlayerLook } from './usePlayerLooks'
import '../../ui/PhoneForm.css'
import './RoomPage.css'

/** This phone's player, as the room shows them. */
export interface RoomSelf {
  uid: string
  username: string
  initials: string
  color: PlayerColorId
  symbol?: string
}

export interface RoomScreenProps {
  room: Room
  self: RoomSelf
  isHost: boolean
  onLeave: () => void
}

interface RoomPageProps {
  /** The game's id, as stored on the room and in the lineup. */
  gameId: string
  /** The game's name in messages, such as "That room isn't playing Pin Drop." */
  gameName: string
  Title: ComponentType
  /** A line under the title on the start-or-join screen. */
  intro: string
  /** What to show inside the room: usually the waiting room, then the game once the host starts it. */
  children: (props: RoomScreenProps) => ReactNode
  /** The small tag on the rec room's card. */
  cardTag?: string
}

export function RoomPage({ gameId, gameName, Title, intro, children, cardTag = 'Solo play' }: RoomPageProps) {
  const me = useMe()
  // This phone's room (also set by the home Join screen), so a refresh goes straight back in.
  const [code, setCode] = useState(() => rememberedRoom(gameId))

  function enter(next: string) {
    rememberRoom(gameId, next)
    setCode(next)
  }

  if (me.kind === 'checking' || (me.kind === 'signed-in' && !me.profile)) return <PhoneFrame label={gameName} cardTag={cardTag} />
  if (me.kind !== 'signed-in' || !me.profile) {
    return (
      <PhoneFrame label={gameName} cardTag={cardTag}>
        <Title />
        <p className="cue-card__text">Sign in to start or join a room.</p>
        <a className="phone-button" href={href('sign-in')} data-testid="room-sign-in">
          Sign in
        </a>
        <MenuItems>
          <a href={href('home')} data-testid="room-home">
            Home
          </a>
        </MenuItems>
      </PhoneFrame>
    )
  }
  const self: RoomSelf = { uid: me.player.uid, ...me.profile }

  return (
    <PhoneFrame label={gameId === LOBBY ? gameName : `${gameName} with others`} cardTag={cardTag} fit={code !== '' && gameId !== LOBBY}>
      {code ? (
        <InRoom key={code} code={code} gameId={gameId} self={self} Title={Title} onLeave={() => enter('')}>
          {children}
        </InRoom>
      ) : (
        <StartOrJoin gameId={gameId} gameName={gameName} Title={Title} intro={intro} self={self} onEnter={enter} />
      )}
    </PhoneFrame>
  )
}

interface StartOrJoinProps {
  gameId: string
  gameName: string
  Title: ComponentType
  intro: string
  self: RoomSelf
  onEnter: (code: string) => void
}

function StartOrJoin({ gameId, gameName, Title, intro, self, onEnter }: StartOrJoinProps) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function start() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      onEnter(await createRoom(self.uid, gameId, self))
    } catch (problem) {
      console.error('Starting a room failed', problem)
      setError("The room didn't open. Check you're online and try again.")
      setBusy(false)
    }
  }

  async function join() {
    if (busy) return
    if (typed.length !== 4) {
      setError('Enter the 4-letter room code.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const outcome = await joinRoom(typed, self.uid, gameId, self)
      if (outcome === 'joined') onEnter(typed)
      else setError(outcome === 'no-room' ? "There's no room with that code." : `That room isn't playing ${gameName}.`)
    } catch (problem) {
      console.error('Joining the room failed', problem)
      setError("Couldn't join. Check you're online and try again.")
    }
    setBusy(false)
  }

  return (
    <>
      <Title />
      <p className="cue-card__text">{intro}</p>
      <button type="button" className="phone-button" aria-disabled={busy || undefined} data-testid="room-start-room" onClick={start}>
        Start a room
      </button>
      <div className="cue-card">
        <Field id="room-code" label="Got a room code?" error={error}>
          <CodeBoxes
            id="room-code"
            value={typed}
            length={4}
            invalid={!!error}
            describedBy={error ? 'room-code-error' : undefined}
            testId="room-code-input"
            onChange={setTyped}
          />
        </Field>
        <button
          type="button"
          className="phone-button phone-button--secondary"
          aria-disabled={busy || undefined}
          data-testid="room-join"
          onClick={join}
        >
          Join
        </button>
      </div>
      {gameId === LOBBY && (
        <MenuItems>
          <a href={href('home')} data-testid="room-home">
            Home
          </a>
        </MenuItems>
      )}
    </>
  )
}

interface InRoomProps {
  code: string
  gameId: string
  self: RoomSelf
  Title: ComponentType
  onLeave: () => void
  children: (props: RoomScreenProps) => ReactNode
}

function InRoom({ code, gameId, self, Title, onLeave, children }: InRoomProps) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [problem, setProblem] = useState('')

  useEffect(
    () =>
      watchRoom(code, setRoom, (error) => {
        console.error('Watching the room failed', error)
        setProblem("Lost touch with the room. Check you're online.")
      }),
    [code],
  )

  // Back in after a refresh, or the room forgot this player: join again.
  const inRoom = room ? self.uid in room.players : true
  useEffect(() => {
    if (room && !inRoom) void joinRoom(code, self.uid, gameId, self)
  }, [room, inRoom, code, gameId, self])

  // A lobby room moves every phone along with it: game pages follow it back to the lobby or on to another game;
  // the lobby screen follows it into a game the host starts while the phone is watching.
  const lastGame = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!room) return
    const before = lastGame.current
    lastGame.current = room.game
    if (!room.lobby || room.game === gameId) return
    const switchedNow = before !== undefined && before !== room.game
    if (gameId === LOBBY && !switchedNow) return
    if (room.game === LOBBY) {
      rememberRoom(LOBBY, code)
      goTo('room')
      return
    }
    const page = roomPageFor(room.game)
    if (!page) return
    rememberRoom(room.game, code)
    goTo('playtest', page)
  }, [room, gameId, code])

  if (room === undefined) return <p className="cue-card__text">Opening room {code}...</p>
  if (room === null) {
    return (
      <>
        <Title />
        <p className="cue-card__text">Room {code} is gone.</p>
        <button type="button" className="phone-button" data-testid="room-leave" onClick={onLeave}>
          Back
        </button>
      </>
    )
  }

  return (
    <>
      {children({ room, self, isHost: room.host === self.uid, onLeave })}
      <MenuItems>
        <button type="button" data-menu-last="true" data-testid="room-leave" onClick={onLeave}>
          Leave room
        </button>
      </MenuItems>
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
    </>
  )
}

/** In a lobby room, the host's way back to the lobby for the next vote, in the top-left menu; every phone follows. */
export function BackToLobby({ room, isHost }: { room: Room; isHost: boolean }) {
  if (!room.lobby || !isHost) return null
  return (
    <MenuItems>
      <button type="button" data-testid="room-back-to-lobby" onClick={() => void switchGame(room.code, LOBBY)}>
        Everyone back to lobby
      </button>
    </MenuItems>
  )
}

/**
 * For games where 2 people make a practice game: in the waiting room it shows while only 2 are in the room;
 * `over` says so at the end of a practice game.
 */
export function PracticeNote({ room, over = false }: { room: Room; over?: boolean }) {
  if (!over && playerIds(room).length > 2) return null
  return (
    <p className="room-status" data-testid="room-practice-note">
      {over ? 'Practice game: not saved to the leaderboard.' : 'With 2 people this is a practice game: not saved to the leaderboard.'}
    </p>
  )
}

/** The room code and everyone in it, with any extra rows (such as bots) after them. */
export function RoomHeader({ room, looks, extra = [] }: { room: Room; looks: Record<PlayerId, PlayerLook>; extra?: PlayerId[] }) {
  const ids = playerIds(room)
  return (
    <>
      <p className="room-code" data-testid="room-code">
        <span className="room-code__label">Room code</span>
        <span className="room-code__letters">{room.code}</span>
      </p>
      <ul className="room-players" aria-label="Players in the room">
        {ids.map((uid) => (
          <li key={uid} className="room-players__row">
            <PlayerDot look={looks[uid]} />
            {looks[uid].name}
            {uid === room.host ? ' (host)' : ''}
          </li>
        ))}
        {extra.map((id) => (
          <li key={id} className="room-players__row">
            <PlayerDot look={looks[id]} />
            {looks[id].name} (bot)
          </li>
        ))}
      </ul>
    </>
  )
}

/** A player's color circle with their symbol in it (initials when there's no symbol, as in arcade). Size is in pixels, for the TV. */
export function PlayerDot({ look, size }: { look: PlayerLook; size?: number }) {
  const sized: CSSProperties = size ? { width: size, height: size, fontSize: Math.round(size * 0.36) } : {}
  return (
    <span
      className="room-players__dot"
      style={{ background: look.color, '--player': look.color, color: inkOn(look.color), ...sized } as CSSProperties}
      aria-hidden="true"
    >
      {look.symbol ? <PlayerSymbol symbol={look.symbol} /> : <span className="room-players__initials">{look.initials}</span>}
    </span>
  )
}

interface WaitingRoomProps {
  room: Room
  isHost: boolean
  Title: ComponentType
  /** The fewest players (bots count) the game needs. */
  minPlayers: number
  /** Games whose bots can't play (they'd have no answers to give) leave the bot picker out. */
  bots?: boolean
  /** The game's own setup choices, shown to the host above the bot choices. */
  settings?: ReactNode
  /** Starts the game with these players: everyone in the room, then the chosen bots. */
  onStart: (players: PlayerId[]) => void
}

/** The room code, who has joined, and (for the host) the game's choices, bots and Start game. */
export function WaitingRoom({ room, isHost, Title, minPlayers, bots: botsPlay = true, settings, onStart }: WaitingRoomProps) {
  const [chosenBots, setChosenBots] = useState<PlayerId[]>([])
  const ids = playerIds(room)
  const bots = isHost ? chosenBots : []
  const looks = usePlayerLooks(room, BOT_SKILLS.flatMap(allBotIds))
  const enough = ids.length + bots.length >= minPlayers

  return (
    <div className="room-waiting">
      <Title />
      <RoomHeader room={room} looks={looks} extra={bots} />
      {isHost ? (
        <>
          {settings}
          {botsPlay && <BotPicker chosen={chosenBots} looks={looks} onChange={setChosenBots} />}
          <button
            type="button"
            className="phone-button"
            aria-disabled={enough ? undefined : 'true'}
            data-testid="room-start-game"
            onClick={() => enough && onStart([...ids, ...bots])}
          >
            Start game
          </button>
          {!enough && (
            <p className="room-status">
              Waiting for at least {minPlayers} players.{botsPlay ? ' Bots count.' : ''}
            </p>
          )}
        </>
      ) : (
        <p className="room-status" role="status">
          Waiting for the host to start
        </p>
      )}
      <BackToLobby room={room} isHost={isHost} />
    </div>
  )
}
