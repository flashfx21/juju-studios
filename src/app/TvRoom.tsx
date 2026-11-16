// ABOUTME: The TV page (#/tv): type a room code and this screen shows that room, following it from the lobby into games and back.
// ABOUTME: Display only: it never joins as a player or runs a game. The room is remembered, so a refresh keeps showing it.
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { LOBBY, playerIds, roomGame, watchRoom, type Room } from '../engine/net/rooms'
import { rememberedRoom, rememberRoom } from '../engine/rememberedRoom'
import { LINEUP } from '../games/lineup'
import { PlayerDot } from '../games/room/RoomPage'
import { TvFrame } from '../games/room/TvFrame'
import { TvGameScreen } from '../games/room/TvGameScreen'
import { hasTvScreen } from '../games/room/tvGames'
import { TvRoomContext } from '../games/room/tvRoomContext'
import { usePlayerLooks } from '../games/room/usePlayerLooks'
import { CodeBoxes } from '../ui/CodeBoxes'
import { TvStage } from '../ui/TvStage'
import { saveAfterSignIn } from './afterSignIn'
import { ROOM_CODE_LENGTH } from './formRules'
import { LobbyTv } from './LobbyTv'
import { siteAddress } from './siteAddress'
import { goTo } from './useHashRoute'
import { useMe } from './useMe'
import '../ui/PhoneForm.css'
import './TvRoom.css'

/** The TV's remembered room, kept apart from the rooms this device plays in. */
const TV_ROOM = 'tv'

function SignInFirst() {
  return (
    <TvFrame title="Show a room on this TV" status="This screen needs to be signed in to show a room">
      <div className="tv-connect">
        <div className="tv-connect__steps">
          <p className="tv-connect__lead">Sign in on this computer once. The TV only shows the room; nobody plays from it.</p>
        </div>
        <div className="tv-connect__form">
          <button
            type="button"
            className="tv-button"
            data-testid="tv-sign-in"
            onClick={() => {
              saveAfterSignIn('tv')
              goTo('sign-in')
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </TvFrame>
  )
}

function Connect({ onShow }: { onShow: (code: string) => void }) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (typed.length !== ROOM_CODE_LENGTH) {
      setError('Type the 4-letter room code.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if ((await roomGame(typed)) === null) setError("There's no room with that code.")
      else onShow(typed)
    } catch (problem) {
      console.error('Checking the room failed', problem)
      setError("Couldn't reach the room. Check this computer is online.")
    }
    setBusy(false)
  }

  return (
    <TvFrame title="Show a room on this TV" status="Type the room code from the host's phone">
      <div className="tv-connect">
        <ol className="tv-connect__steps">
          <li>
            On the host's phone, go to <strong>{siteAddress()}</strong> and tap <strong>Start hosting</strong> for tonight's lobby.
          </li>
          <li>Everyone joins on their phone with the room code.</li>
          <li>Type the same code here. This screen follows the room into each game.</li>
        </ol>
        <form className="cue-card tv-connect__form" noValidate onSubmit={submit}>
          <label className="tv-label" htmlFor="tv-code">
            Room code
          </label>
          <CodeBoxes
            id="tv-code"
            value={typed}
            length={ROOM_CODE_LENGTH}
            invalid={!!error}
            describedBy={error ? 'tv-code-error' : undefined}
            testId="tv-code-input"
            onChange={setTyped}
          />
          {error && (
            <p className="field__error" id="tv-code-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="tv-button" aria-disabled={busy || undefined} data-testid="tv-show">
            Show on this TV
          </button>
        </form>
      </div>
    </TvFrame>
  )
}

/** A game without a TV screen yet: what's on, and who's playing. */
function PlayingOnPhones({ room }: { room: Room }) {
  const looks = usePlayerLooks(room)
  const title = LINEUP.find((game) => game.id === room.game)?.title ?? 'A game'
  return (
    <TvFrame title={title} status="This game plays on your phones for now">
      <div className="tv-connect" data-testid="tv-phones-only">
        <div className="tv-connect__steps">
          <p className="tv-connect__lead">{title} is on. It doesn't have a TV screen yet, so play it on your phones.</p>
          <p className="tv-connect__lead">This screen comes back to the lobby when the host does.</p>
        </div>
        <ul className="lobby-tv__players" aria-label="Who's in">
          {playerIds(room).map((uid) => (
            <li key={uid} className="lobby-tv__player">
              <PlayerDot look={looks[uid]} size={36} />
              <span className="lobby-tv__name">{looks[uid]?.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </TvFrame>
  )
}

function Watching({ code }: { code: string }) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [problem, setProblem] = useState('')
  useEffect(
    () =>
      watchRoom(code, setRoom, (error) => {
        console.error('Watching the room failed', error)
        setProblem("Lost touch with the room. Check this computer is online.")
      }),
    [code],
  )

  if (problem) {
    return (
      <TvFrame title="Room trouble" status={problem}>
        <p className="tv-connect__lead">{problem}</p>
      </TvFrame>
    )
  }
  if (room === undefined) {
    return (
      <TvFrame title="Opening the room" status={`Room ${code}`}>
        <p className="tv-connect__lead">Opening room {code}...</p>
      </TvFrame>
    )
  }
  if (room === null) {
    return (
      <TvFrame title="Room closed" status={`Room ${code} is gone`}>
        <p className="tv-connect__lead" data-testid="tv-room-gone">
          Room {code} is gone. Tap Change room to show another one.
        </p>
      </TvFrame>
    )
  }
  if (room.game === LOBBY) return <LobbyTv room={room} />
  if (!hasTvScreen(room.game)) return <PlayingOnPhones room={room} />
  return (
    <Suspense
      fallback={
        <TvFrame title="Loading the game" status="Loading">
          <p className="tv-connect__lead">Loading the game...</p>
        </TvFrame>
      }
    >
      <TvGameScreen room={room} />
    </Suspense>
  )
}

export function TvRoom() {
  const me = useMe()
  const [code, setCode] = useState(() => rememberedRoom(TV_ROOM))

  function show(next: string) {
    rememberRoom(TV_ROOM, next)
    setCode(next)
  }

  let screen = null
  if (me.kind === 'signed-out') screen = <SignInFirst />
  else if (me.kind === 'signed-in') screen = code ? <Watching key={code} code={code} /> : <Connect onShow={show} />

  return (
    <TvStage label="TV">
      <TvRoomContext.Provider value={code && me.kind === 'signed-in' ? { code, onChangeRoom: () => show('') } : null}>
        {screen ?? <div className="tv-screen" />}
      </TvRoomContext.Provider>
    </TvStage>
  )
}
