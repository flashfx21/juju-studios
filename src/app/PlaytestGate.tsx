// ABOUTME: Asks for the playtest code before showing an unfinished game; remembers the unlock on this device.
// ABOUTME: Wraps any game's playtest page, so every game in testing sits behind the same code.
import { useState, type FormEvent, type ReactNode } from 'react'
import { PhoneFrame } from '../ui/PhoneFrame'
import { TextField } from '../ui/TextField'
import { isPlaytestCode, isUnlocked, rememberUnlock } from './playtestCode'
import { href } from './useHashRoute'
import '../ui/PhoneForm.css'

export function PlaytestGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  if (unlocked) return children

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!isPlaytestCode(typed)) {
      setError("That code doesn't open playtests.")
      return
    }
    rememberUnlock()
    setUnlocked(true)
  }

  return (
    <PhoneFrame label="Playtest code" cardTag="Playtest">
      <div className="phone-top">
        <h1 className="phone-top__title">Playtest</h1>
      </div>
      <form className="phone-form" noValidate onSubmit={submit}>
        <div className="cue-card">
          <h2 className="cue-card__label">Still in testing</h2>
          <p className="cue-card__text">Enter the playtest code to play games that aren't finished yet.</p>
          <TextField
            id="playtest-code"
            label="Playtest code"
            autoComplete="off"
            value={typed}
            error={error}
            testId="playtest-code-input"
            onChange={(value) => {
              setTyped(value)
              setError('')
            }}
          />
        </div>
        <div className="phone-actions">
          <button type="submit" className="phone-button" data-testid="playtest-code-submit">
            Unlock
          </button>
          <a className="phone-link phone-link--quiet" href={href('home')}>
            Back
          </a>
        </div>
      </form>
    </PhoneFrame>
  )
}
