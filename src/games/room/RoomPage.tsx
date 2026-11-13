// ABOUTME: The room around any phones-only game: start a room or join one by code, the waiting room, and what each player looks like.
// ABOUTME: A game supplies its title, its setup choices and the screen to show once the host starts; bots can fill seats.
import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { useMe } from '../../app/useMe'
import { createRoom, joinRoom, playerIds, watchRoom, type Room } from '../../engine/net/rooms'
import { rememberedRoom, rememberRoom } from '../../engine/rememberedRoom'
import { CodeBoxes } from '../../ui/CodeBoxes'
import { OptionRow } from '../../ui/OptionRow'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { inkOn, type PlayerColorId } from '../../ui/playerColors'
import { PlayerSymbol } from '../../ui/PlayerSymbol'
import { Field } from '../../ui/TextField'
import type { PlayerId } from '../types'
import { BOT_COUNT_NAMES, BOT_COUNTS, BOT_SKILL_NAMES, BOT_SKILLS, botIds, type BotCount, type BotSkill } from './bots'
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
}

export function RoomPage({ gameId, gameName, Title, intro, children }: RoomPageProps) {
  const me = useMe()
  // This phone's room (also set by the home Join screen), so a refresh goes straight back in.
  const [code, setCode] = useState(() => rememberedRoom(gameId))

  function enter(next: string) {
    rememberRoom(gameId, next)
    setCode(next)
  }

  if (me.kind !== 'signed-in' || !me.profile) return <PhoneFrame label={gameName} cardTag="Solo play" />
  const self: RoomSelf = { uid: me.player.uid, ...me.profile }

  return (
    <PhoneFrame label={`${gameName} with others`} cardTag="Solo play" fit={code !== ''}>
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
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
    </>
  )
}

/** A player's color circle with their symbol in it. */
export function PlayerDot({ look }: { look: PlayerLook }) {
  return (
    <span
      className="room-players__dot"
      style={{ background: look.color, '--player': look.color, color: inkOn(look.color) } as CSSProperties}
      aria-hidden="true"
    >
      {look.symbol && <PlayerSymbol symbol={look.symbol} />}
    </span>
  )
}

interface WaitingRoomProps {
  room: Room
  isHost: boolean
  Title: ComponentType
  /** The fewest players (bots count) the game needs. */
  minPlayers: number
  /** The game's own setup choices, shown to the host above the bot choices. */
  settings?: ReactNode
  /** Starts the game with these players: everyone in the room, then the chosen bots. */
  onStart: (players: PlayerId[]) => void
  onLeave: () => void
}

/** The room code, who has joined, and (for the host) the game's choices, bots and Start game. */
export function WaitingRoom({ room, isHost, Title, minPlayers, settings, onStart, onLeave }: WaitingRoomProps) {
  const [botCount, setBotCount] = useState<BotCount>(0)
  const [botSkill, setBotSkill] = useState<BotSkill>('casual')
  const ids = playerIds(room)
  const bots = isHost ? botIds(botCount, botSkill) : []
  const looks = usePlayerLooks(room, bots)
  const enough = ids.length + bots.length >= minPlayers

  return (
    <div className="room-waiting">
      <Title />
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
        {bots.map((id) => (
          <li key={id} className="room-players__row">
            <PlayerDot look={looks[id]} />
            {looks[id].name} (bot)
          </li>
        ))}
      </ul>
      {isHost ? (
        <>
          {settings}
          <OptionRow label="Bots" options={BOT_COUNTS} names={BOT_COUNT_NAMES} value={botCount} onChoose={setBotCount} />
          {botCount > 0 && (
            <OptionRow label="Bot skill" options={BOT_SKILLS} names={BOT_SKILL_NAMES} value={botSkill} onChoose={setBotSkill} />
          )}
          <button
            type="button"
            className="phone-button"
            aria-disabled={enough ? undefined : 'true'}
            data-testid="room-start-game"
            onClick={() => enough && onStart([...ids, ...bots])}
          >
            Start game
          </button>
          {!enough && <p className="room-status">Waiting for at least {minPlayers} players. Bots count.</p>}
        </>
      ) : (
        <p className="room-status" role="status">
          Waiting for the host to start
        </p>
      )}
      <button type="button" className="phone-link phone-link--quiet" data-testid="room-leave" onClick={onLeave}>
        Leave room
      </button>
    </div>
  )
}
