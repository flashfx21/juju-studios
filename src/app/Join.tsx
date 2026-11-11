// ABOUTME: Phone Join screen, which is also profile setup: room code, username, email and color (arcade adds initials).
// ABOUTME: Not connected yet: valid entries move on to "Check your email"; no room is checked and nothing is sent.
import { useState, type FormEvent } from 'react'
import { CodeBoxes } from '../ui/CodeBoxes'
import { PhoneFrame } from '../ui/PhoneFrame'
import { inkOn, PLAYER_COLOR_IDS, PLAYER_COLOR_NAMES, PLAYER_COLORS, type PlayerColorId } from '../ui/playerColors'
import { Field, TextField } from '../ui/TextField'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import {
  checkEmail,
  checkInitials,
  checkRoomCode,
  checkUsername,
  INITIALS_LENGTH,
  lettersOnly,
  ROOM_CODE_LENGTH,
} from './formRules'
import { saveProfile } from './localProfile'
import { savePendingEmail } from './pendingEmail'
import { goTo } from './useHashRoute'
import './Join.css'

const JOIN_LABELS: Record<LobbyStyleId, string> = {
  'game-show': 'Join',
  arcade: 'Press start',
  'rec-room': 'Pull up a chair',
}

const NO_ERRORS = { code: '', username: '', initials: '', email: '' }

export function Join() {
  const style = useLobbyStyle()
  const asksInitials = style === 'arcade'
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [initials, setInitials] = useState('')
  const [initialsEdited, setInitialsEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [color, setColor] = useState<PlayerColorId>('red')
  const [errors, setErrors] = useState(NO_ERRORS)

  function changeUsername(name: string) {
    setUsername(name)
    if (!initialsEdited) setInitials(lettersOnly(name, INITIALS_LENGTH))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      code: checkRoomCode(code),
      username: checkUsername(username),
      initials: asksInitials ? checkInitials(initials) : '',
      email: checkEmail(email),
    }
    setErrors(found)
    const firstBad = (Object.keys(found) as (keyof typeof found)[]).find((field) => found[field])
    if (firstBad) {
      document.getElementById(`join-${firstBad}`)?.focus()
      return
    }
    savePendingEmail(email.trim())
    saveProfile({
      username: username.trim(),
      initials: initials || lettersOnly(username, INITIALS_LENGTH),
      color,
      email: email.trim(),
    })
    goTo('sign-in', 'sent')
  }

  return (
    <PhoneFrame label="Join a game" cardTag="Under a minute">
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

      <form className="phone-form" noValidate onSubmit={submit}>
        <div className="cue-card join-card">
          <h2 className="cue-card__label">Cue card #1</h2>
          <Field id="join-code" label="Room code" error={errors.code}>
            <CodeBoxes
              id="join-code"
              value={code}
              length={ROOM_CODE_LENGTH}
              invalid={!!errors.code}
              describedBy={errors.code ? 'join-code-error' : undefined}
              testId="join-code"
              onChange={setCode}
            />
          </Field>
          <TextField
            id="join-username"
            label="Username"
            autoComplete="nickname"
            value={username}
            error={errors.username}
            testId="join-username"
            onChange={changeUsername}
          />
          {asksInitials && (
            <Field id="join-initials" label="Initials" error={errors.initials}>
              <CodeBoxes
                id="join-initials"
                value={initials}
                length={INITIALS_LENGTH}
                invalid={!!errors.initials}
                describedBy={errors.initials ? 'join-initials-error' : undefined}
                variant="initials"
                testId="join-initials"
                onChange={(value) => {
                  setInitials(value)
                  setInitialsEdited(true)
                }}
              />
            </Field>
          )}
          <TextField
            id="join-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            testId="join-email"
            onChange={setEmail}
          />
          <p className="field__hint">
            We'll email you a sign-in link. Tap it once and this phone remembers you. Check your spam folder.
          </p>
          <fieldset className="join-colors">
            <legend className="field__label">Your color</legend>
            <div className="swatches">
              {PLAYER_COLOR_IDS.map((id) => {
                const hex = PLAYER_COLORS[style][id]
                const selected = id === color
                return (
                  <button
                    key={id}
                    type="button"
                    className="swatch"
                    style={{ background: hex, color: inkOn(hex) }}
                    aria-label={PLAYER_COLOR_NAMES[id]}
                    aria-pressed={selected}
                    data-testid={`join-color-${id}`}
                    onClick={() => setColor(id)}
                  >
                    {selected ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="phone-actions join-actions">
          <button type="submit" className="phone-button join-submit" data-testid="join-submit">
            <span className="join-submit__dome">{JOIN_LABELS[style]}</span>
          </button>
          <p className="join-caption" aria-hidden="true">
            Hit the buzzer
          </p>
          <p className="preview-note">Preview: joining isn't connected yet, so no room is checked and no email is sent.</p>
        </div>
      </form>
    </PhoneFrame>
  )
}
