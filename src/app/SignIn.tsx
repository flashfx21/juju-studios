// ABOUTME: Phone sign-in and sign-up (one flow): Google or an emailed link, "check your email", finishing the link, "link expired".
// ABOUTME: A phone stays signed in, so a signed-in visitor sees who they are and can carry on or sign out.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { emailSignInLink, finishEmailSignIn, signInWithGoogle, signOutOfThisDevice } from '../engine/net/auth'
import { GoogleButton } from '../ui/GoogleButton'
import '../ui/PhoneForm.css'
import { PhoneFrame } from '../ui/PhoneFrame'
import { TextField } from '../ui/TextField'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { checkEmail } from './formRules'
import { clearPendingEmail, loadPendingEmail, savePendingEmail } from './pendingEmail'
import { takeAfterSignIn } from './afterSignIn'
import { PlayerBadge } from './PlayerBadge'
import { signInProblem } from './signInProblems'
import { goTo, href } from './useHashRoute'
import { useMe } from './useMe'

/** Seconds before "Resend link" can be used again (design placeholder). */
const RESEND_WAIT = 45

const EXPIRED_STAMP: Record<LobbyStyleId, string> = {
  'game-show': 'Expired',
  arcade: 'Link expired',
  'rec-room': 'Expired',
}

/** Where a freshly signed-in player goes: back to where they started (such as Join), or the lobby page. */
function goOnSignedIn() {
  goTo(takeAfterSignIn())
}

/** Sign up and sign in are the same steps (a new email makes an account); only the words differ. */
export function SignIn({ step, signingUp = false }: { step: string; signingUp?: boolean }) {
  const content =
    step === 'sent' ? (
      <LinkSent />
    ) : step === 'expired' ? (
      <LinkExpired />
    ) : step === 'finish' ? (
      <FinishLink />
    ) : (
      <SignInStart signingUp={signingUp} />
    )

  return (
    <PhoneFrame label={signingUp ? 'Sign up' : 'Sign in'} cardTag={signingUp ? 'Sign up' : 'Sign in'}>
      <PlayerBadge />
      <div className="phone-top">
        <span className="phone-top__logo" aria-hidden="true">
          JuJu
        </span>
        <h1 className="phone-top__title">{signingUp ? 'Sign up' : 'Sign in'}</h1>
        <p className="phone-top__tag">
          <span className="phone-top__tag-main">{signingUp ? 'New player' : 'Welcome back'}</span>
          <span className="phone-top__tag-note">{signingUp ? 'Under a minute' : 'Host or play'}</span>
        </p>
      </div>
      {content}
    </PhoneFrame>
  )
}

function SignInStart({ signingUp }: { signingUp: boolean }) {
  const me = useMe()
  if (me.kind === 'checking') return null
  return me.kind === 'signed-in' ? <SignedIn email={me.player.email} /> : <SignInForm signingUp={signingUp} />
}

function SignedIn({ email }: { email: string }) {
  return (
    <>
      <div className="cue-card cue-card--message cue-card--sent">
        <h2 className="cue-card__label">Signed in</h2>
        <p className="cue-card__text">This phone is signed in as</p>
        <p className="cue-card__email" data-testid="signed-in-email">
          {email}
        </p>
      </div>
      <div className="phone-actions">
        <button type="button" className="phone-button" data-testid="signed-in-continue" onClick={goOnSignedIn}>
          Continue
        </button>
        <button
          type="button"
          className="phone-link"
          data-testid="signed-in-sign-out"
          onClick={() => void signOutOfThisDevice()}
        >
          Not you? Sign out
        </button>
      </div>
    </>
  )
}

function SignInForm({ signingUp }: { signingUp: boolean }) {
  const [email, setEmail] = useState(loadPendingEmail)
  const [error, setError] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | ''>('')

  async function continueWithGoogle() {
    setProblem('')
    setBusy('google')
    const outcome = await signInWithGoogle()
    setBusy('')
    if (outcome === 'signed-in') goOnSignedIn()
    else setProblem(signInProblem(outcome))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const found = checkEmail(email)
    setError(found)
    setProblem('')
    if (found) {
      document.getElementById('sign-in-email')?.focus()
      return
    }
    setBusy('email')
    savePendingEmail(email.trim())
    const outcome = await emailSignInLink(email.trim())
    setBusy('')
    if (outcome === 'sent') goTo('sign-in', 'sent')
    else setProblem(signInProblem(outcome))
  }

  return (
    <form className="phone-form" noValidate onSubmit={submit}>
      <div className="cue-card">
        <h2 className="cue-card__label">{signingUp ? 'Make your account' : 'Sign in'}</h2>
        {signingUp && (
          <p className="cue-card__text">Use Google, or your email for a one-time link. Next you'll pick your name, color and symbol.</p>
        )}
        <GoogleButton busy={busy === 'google'} testId="sign-in-google" onClick={continueWithGoogle} />
        <p className="sign-in-or">or</p>
        <TextField
          id="sign-in-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={error}
          testId="sign-in-email"
          onChange={setEmail}
        />
        <p className="field__hint">
          We'll email you a sign-in link. Tap it on this phone and you're in. Check your spam folder.
        </p>
      </div>

      <div className="phone-actions">
        <button
          type="submit"
          className="phone-button"
          aria-disabled={busy !== '' || undefined}
          data-testid="sign-in-submit"
        >
          {busy === 'email' ? 'Sending' : 'Email me a link'}
        </button>
        <p className="preview-note" role="alert" data-testid="sign-in-problem">
          {problem}
        </p>
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
  const [problem, setProblem] = useState('')
  const [sending, setSending] = useState(false)
  const waiting = secondsLeft > 0 || sending || !email

  async function resend() {
    if (waiting) return
    setProblem('')
    setSending(true)
    const outcome = await emailSignInLink(email)
    setSending(false)
    if (outcome === 'sent') restart()
    else setProblem(signInProblem(outcome))
  }

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
          Open it on this phone. The link works once. Not there? Check your spam folder.
        </p>
      </div>
      <div className="phone-actions">
        <button
          type="button"
          className="phone-button phone-button--secondary"
          aria-disabled={waiting || undefined}
          data-testid="resend-link"
          onClick={resend}
        >
          {secondsLeft > 0 ? `Resend link in 0:${String(secondsLeft).padStart(2, '0')}` : 'Resend link'}
        </button>
        <p className="preview-note" role="alert" data-testid="sent-problem">
          {problem}
        </p>
        <a className="phone-link" href={href('sign-in')} data-testid="different-email">
          Use a different email
        </a>
      </div>
    </>
  )
}

/** The page the emailed link opens. Signs in with the email this phone remembers, or asks for it. */
function FinishLink() {
  const [remembered] = useState(loadPendingEmail)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [problem, setProblem] = useState('')
  const [working, setWorking] = useState(remembered !== '')
  const started = useRef(false)

  async function finish(address: string) {
    setProblem('')
    setWorking(true)
    const outcome = await finishEmailSignIn(address, window.location.href)
    setWorking(false)
    if (outcome === 'signed-in') {
      clearPendingEmail()
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      goOnSignedIn()
    } else if (outcome === 'expired') {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      goTo('sign-in', 'expired')
    } else {
      setProblem(signInProblem(outcome))
    }
  }

  useEffect(() => {
    if (started.current || !remembered) return
    started.current = true
    void finish(remembered)
  }, [remembered])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (working) return
    const found = checkEmail(email)
    setError(found)
    if (found) {
      document.getElementById('finish-email')?.focus()
      return
    }
    void finish(email.trim())
  }

  if (working) {
    return (
      <div className="cue-card cue-card--message cue-card--sent" role="status">
        <h2 className="cue-card__label">Sign-in link</h2>
        <p className="cue-card__heading">Signing you in</p>
      </div>
    )
  }

  return (
    <form className="phone-form" noValidate onSubmit={submit}>
      <div className="cue-card">
        <h2 className="cue-card__label">Sign-in link</h2>
        <p className="cue-card__text">
          This browser didn't send the link, so type the email it went to. That proves the link is yours.
        </p>
        <TextField
          id="finish-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={error}
          testId="finish-email"
          onChange={setEmail}
        />
      </div>
      <div className="phone-actions">
        <button type="submit" className="phone-button" data-testid="finish-submit">
          Sign in
        </button>
        <p className="preview-note" role="alert" data-testid="finish-problem">
          {problem}
        </p>
      </div>
    </form>
  )
}

function LinkExpired() {
  const style = useLobbyStyle()
  const email = loadPendingEmail()
  const [problem, setProblem] = useState('')
  const [sending, setSending] = useState(false)

  async function sendNewLink() {
    if (!email) {
      goTo('sign-in')
      return
    }
    if (sending) return
    setProblem('')
    setSending(true)
    const outcome = await emailSignInLink(email)
    setSending(false)
    if (outcome === 'sent') goTo('sign-in', 'sent')
    else setProblem(signInProblem(outcome))
  }

  return (
    <>
      <div className="cue-card cue-card--message cue-card--danger">
        <span className="cue-card__stamp">{EXPIRED_STAMP[style]}</span>
        <h2 className="cue-card__label">Sign-in link</h2>
        <p className="cue-card__heading">This link has expired</p>
        <p className="cue-card__text">
          Sign-in links work once and don't last long. We can send a new one
          {email ? ` to ${email}.` : '.'}
        </p>
      </div>
      <div className="phone-actions">
        <button
          type="button"
          className="phone-button"
          aria-disabled={sending || undefined}
          data-testid="send-new-link"
          onClick={sendNewLink}
        >
          Send a new link
        </button>
        <p className="preview-note" role="alert" data-testid="expired-problem">
          {problem}
        </p>
        <a className="phone-link" href={href('home')}>
          Back to start
        </a>
      </div>
    </>
  )
}
