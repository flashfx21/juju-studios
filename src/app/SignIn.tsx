// ABOUTME: Phone sign-in in four states: email link form, password form, "check your email", and "link expired".
// ABOUTME: Not connected to a backend yet: forms check their fields, then move on; nothing is sent.
import { useEffect, useState, type FormEvent } from 'react'
import { PhoneFrame } from '../ui/PhoneFrame'
import { TextField } from '../ui/TextField'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { checkEmail, checkPassword } from './formRules'
import { loadPendingEmail, savePendingEmail } from './pendingEmail'
import { goTo, href } from './useHashRoute'

/** Seconds before "Resend link" can be used again (design placeholder). */
const RESEND_WAIT = 45

const EXPIRED_STAMP: Record<LobbyStyleId, string> = {
  'game-show': 'Expired',
  arcade: 'Link expired',
  'rec-room': 'Expired',
}

export function SignIn({ step }: { step: string }) {
  const content =
    step === 'sent' ? (
      <LinkSent />
    ) : step === 'expired' ? (
      <LinkExpired />
    ) : (
      <SignInForm withPassword={step === 'password'} />
    )

  return (
    <PhoneFrame label="Sign in" cardTag="Host sign-in">
      <div className="phone-top">
        <span className="phone-top__logo" aria-hidden="true">
          JuJu
        </span>
        <h1 className="phone-top__title">Sign in</h1>
        <p className="phone-top__tag">
          <span className="phone-top__tag-main">Host login</span>
          <span className="phone-top__tag-note">To host a room</span>
        </p>
      </div>
      {content}
    </PhoneFrame>
  )
}

function SignInForm({ withPassword }: { withPassword: boolean }) {
  const [email, setEmail] = useState(loadPendingEmail)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [notConnected, setNotConnected] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = { email: checkEmail(email), password: withPassword ? checkPassword(password) : '' }
    setErrors(found)
    if (found.email || found.password) {
      document.getElementById(found.email ? 'sign-in-email' : 'sign-in-password')?.focus()
      return
    }
    savePendingEmail(email.trim())
    if (withPassword) setNotConnected(true)
    else goTo('sign-in', 'sent')
  }

  return (
    <form className="phone-form" noValidate onSubmit={submit}>
      <div className="cue-card">
        <h2 className="cue-card__label">Host sign-in</h2>
        <TextField
          id="sign-in-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          testId="sign-in-email"
          onChange={setEmail}
        />
        {withPassword ? (
          <TextField
            id="sign-in-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            testId="sign-in-password"
            onChange={setPassword}
          />
        ) : (
          <p className="field__hint">
            We'll email you a sign-in link. Tap it on this phone and you're in. Check your spam folder.
          </p>
        )}
      </div>

      <div className="phone-actions">
        <button type="submit" className="phone-button" data-testid="sign-in-submit">
          {withPassword ? 'Sign in' : 'Email me a link'}
        </button>
        <p className="preview-note" role="status">
          {notConnected
            ? "Sign-in isn't connected yet, so you can't sign in with a password today."
            : "Preview: sign-in isn't connected yet, so no email is sent."}
        </p>
        <a
          className="phone-link"
          href={withPassword ? href('sign-in') : href('sign-in', 'password')}
          data-testid="sign-in-switch"
        >
          {withPassword ? 'Email me a link instead' : 'Use a password instead'}
        </a>
        <a className="phone-link phone-link--quiet" href={href('home')}>
          Back
        </a>
      </div>
    </form>
  )
}

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  return [left, () => setLeft(seconds)] as const
}

function LinkSent() {
  const email = loadPendingEmail()
  const [secondsLeft, restart] = useCountdown(RESEND_WAIT)
  const waiting = secondsLeft > 0

  return (
    <>
      <div className="cue-card cue-card--message cue-card--sent">
        <h2 className="cue-card__label">Link sent</h2>
        <p className="cue-card__heading">Check your email</p>
        <p className="cue-card__text">We sent a sign-in link to</p>
        <p className="cue-card__email" data-testid="sent-email">
          {email || 'your email'}
        </p>
        <p className="cue-card__text">
          Open it on this phone. The link works once and expires in 15 minutes. Not there? Check your spam folder.
        </p>
      </div>
      <div className="phone-actions">
        <button
          type="button"
          className="phone-button phone-button--secondary"
          aria-disabled={waiting || undefined}
          data-testid="resend-link"
          onClick={() => {
            if (!waiting) restart()
          }}
        >
          {waiting ? `Resend link in 0:${String(secondsLeft).padStart(2, '0')}` : 'Resend link'}
        </button>
        <p className="preview-note">Preview: sign-in isn't connected yet, so no email was actually sent.</p>
        <a className="phone-link" href={href('sign-in')} data-testid="different-email">
          Use a different email
        </a>
      </div>
    </>
  )
}

function LinkExpired() {
  const style = useLobbyStyle()
  const email = loadPendingEmail()

  return (
    <>
      <div className="cue-card cue-card--message cue-card--danger">
        <span className="cue-card__stamp">{EXPIRED_STAMP[style]}</span>
        <h2 className="cue-card__label">Sign-in link</h2>
        <p className="cue-card__heading">This link has expired</p>
        <p className="cue-card__text">
          Sign-in links work once and expire after 15 minutes. We can send a new one
          {email ? ` to ${email}.` : '.'}
        </p>
      </div>
      <div className="phone-actions">
        <button
          type="button"
          className="phone-button"
          data-testid="send-new-link"
          onClick={() => goTo('sign-in', email ? 'sent' : undefined)}
        >
          Send a new link
        </button>
        <a className="phone-link" href={href('home')}>
          Back to start
        </a>
      </div>
    </>
  )
}
