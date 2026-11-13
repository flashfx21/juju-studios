// ABOUTME: Phone Join screen: type the room code from the host and go into that game's room.
// ABOUTME: A phone not signed in yet signs up first (name, color, symbol), then comes back here for the code.
import { useState, type FormEvent } from 'react'
import { LOBBY, roomGame } from '../engine/net/rooms'
import { rememberRoom } from '../engine/rememberedRoom'
import { roomPageFor } from '../games/room/roomPages'
import { CodeBoxes } from '../ui/CodeBoxes'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Field } from '../ui/TextField'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { saveAfterSignIn } from './afterSignIn'
import { checkRoomCode, ROOM_CODE_LENGTH } from './formRules'
import { PlayerBadge } from './PlayerBadge'
import { goTo, href } from './useHashRoute'
import { useMe } from './useMe'
import './Join.css'

const JOIN_LABELS: Record<LobbyStyleId, string> = {
  'game-show': 'Join',
  arcade: 'Press start',
  'rec-room': 'Pull up a chair',
}

function JoinTop() {
  return (
    <div className="join-top">
      <h1 className="join-top__logo">
        JuJu<span className="join-top__logo-rest"> Studios</span>
      </h1>
      <p className="join-top__tag">
        <span className="join-top__tag-main">Tonight's contestant · under a minute</span>
        <span className="join-top__tag-arcade">
          Player entry
          <span className="join-top__tag-note">Under 1 minute</span>
        </span>
      </p>
    </div>
  )
}

export function Join() {
  const me = useMe()
  if (me.kind === 'checking' || (me.kind === 'signed-in' && me.profile === undefined)) {
    return <PhoneFrame label="Join a game" cardTag="Under a minute" />
  }
  return me.kind === 'signed-in' ? <CodeScreen /> : <SignUpFirst />
}

/** Step one for a new phone: sign up, then come back to the code screen. */
function SignUpFirst() {
  function goSign(screen: 'sign-up' | 'sign-in') {
    saveAfterSignIn('join')
    goTo(screen)
  }

  return (
    <PhoneFrame label="Join a game" cardTag="Under a minute">
      <JoinTop />
      <div className="cue-card join-card">
        <h2 className="cue-card__label">Step 1 of 2</h2>
        <p className="cue-card__heading">Sign up first</p>
        <p className="cue-card__text">
          Pick your name, color and symbol. It takes a minute, and this phone remembers you after that. Then you'll type
          the room code.
        </p>
      </div>
      <div className="phone-actions">
        <button type="button" className="phone-button" data-testid="join-sign-up" onClick={() => goSign('sign-up')}>
          Sign up
        </button>
        <button type="button" className="phone-link" data-testid="join-sign-in" onClick={() => goSign('sign-in')}>
          Already signed up? Sign in
        </button>
        <a className="phone-link phone-link--quiet" href={href('home')}>
          Back
        </a>
      </div>
    </PhoneFrame>
  )
}

function CodeScreen() {
  const style = useLobbyStyle()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const found = checkRoomCode(code)
    setError(found)
    if (found) {
      document.getElementById('join-code')?.focus()
      return
    }
    setBusy(true)
    try {
      const game = await roomGame(code)
      if (game === LOBBY) {
        rememberRoom(LOBBY, code)
        goTo('room')
        return
      }
      const page = game ? roomPageFor(game) : undefined
      if (game && page) {
        rememberRoom(game, code)
        goTo('playtest', page)
        return
      }
      setError(game ? "That room's game can't be joined from here yet." : "There's no room with that code.")
    } catch (problem) {
      console.error('Looking up the room failed', problem)
      setError("Couldn't check the code. Check you're online and try again.")
    }
    setBusy(false)
    document.getElementById('join-code')?.focus()
  }

  return (
    <PhoneFrame label="Join a game" cardTag="Under a minute">
      <PlayerBadge />
      <JoinTop />
      <form className="phone-form" noValidate onSubmit={submit}>
        <div className="cue-card join-card">
          <h2 className="cue-card__label">Room code</h2>
          <Field id="join-code" label="Room code from the host" error={error}>
            <CodeBoxes
              id="join-code"
              value={code}
              length={ROOM_CODE_LENGTH}
              invalid={!!error}
              describedBy={error ? 'join-code-error' : undefined}
              testId="join-code"
              onChange={setCode}
            />
          </Field>
        </div>
        <div className="phone-actions join-actions">
          <button
            type="submit"
            className="phone-button join-submit"
            aria-disabled={busy || undefined}
            data-testid="join-submit"
          >
            <span className="join-submit__dome">{JOIN_LABELS[style]}</span>
          </button>
          <p className="join-caption" aria-hidden="true">
            Hit the buzzer
          </p>
          <a className="phone-link phone-link--quiet" href={href('home')}>
            Back
          </a>
        </div>
      </form>
    </PhoneFrame>
  )
}
