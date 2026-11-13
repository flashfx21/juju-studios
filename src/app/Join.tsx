// ABOUTME: Phone Join screen, which is also profile setup: room code, username and color (arcade adds initials).
// ABOUTME: A phone not signed in yet also signs in here, with Google or an emailed link; the room code isn't checked yet.
import { useState, type FormEvent } from 'react'
import { emailSignInLink, signInWithGoogle } from '../engine/net/auth'
import { saveProfile, type Profile } from '../engine/net/profiles'
import { CodeBoxes } from '../ui/CodeBoxes'
import { ColorSwatches } from '../ui/ColorSwatches'
import { GoogleButton } from '../ui/GoogleButton'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Field, TextField } from '../ui/TextField'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { checkEmail, checkRoomCode, INITIALS_LENGTH, ROOM_CODE_LENGTH } from './formRules'
import { savePendingEmail } from './pendingEmail'
import { clearPendingProfile, savePendingProfile } from './pendingProfile'
import { PlayerBadge } from './PlayerBadge'
import { signInProblem } from './signInProblems'
import { goTo } from './useHashRoute'
import { useMe } from './useMe'
import { useProfileDraft } from './useProfileDraft'
import './Join.css'

const JOIN_LABELS: Record<LobbyStyleId, string> = {
  'game-show': 'Join',
  arcade: 'Press start',
  'rec-room': 'Pull up a chair',
}

export function Join() {
  const me = useMe()
  if (me.kind === 'checking' || (me.kind === 'signed-in' && me.profile === undefined)) {
    return <PhoneFrame label="Join a game" cardTag="Under a minute" />
  }
  const signedIn = me.kind === 'signed-in' ? { uid: me.player.uid, profile: me.profile ?? null } : null
  return <JoinForm key={signedIn?.uid ?? 'signed-out'} signedIn={signedIn} />
}

interface JoinFormProps {
  /** Null when this phone still has to sign in. */
  signedIn: { uid: string; profile: Profile | null } | null
}

function JoinForm({ signedIn }: JoinFormProps) {
  const style = useLobbyStyle()
  const asksInitials = style === 'arcade'
  const draft = useProfileDraft(signedIn?.profile ?? null)
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({ code: '', email: '' })
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | 'join' | ''>('')

  /** Checks the fields (the email only when it will be used) and focuses the first bad one. */
  function fieldsAreGood(withEmail: boolean): boolean {
    const found = { code: checkRoomCode(code), email: withEmail ? checkEmail(email) : '' }
    setErrors(found)
    setProblem('')
    const badProfileField = draft.check(asksInitials)
    const firstBad = found.code ? 'code' : badProfileField || (found.email ? 'email' : '')
    if (firstBad) document.getElementById(`join-${firstBad}`)?.focus()
    return !firstBad
  }

  async function saveAndGo(uid: string) {
    try {
      await saveProfile(uid, draft.toProfile())
      goTo('lobby')
    } catch (error) {
      console.error('Saving the profile failed', error)
      setProblem("Your profile didn't save. Check you're online and try again.")
    }
  }

  async function joinWithGoogle() {
    if (busy || !fieldsAreGood(false)) return
    setBusy('google')
    // Saved as soon as sign-in finishes (see MeProvider), so profile setup never flashes up in between.
    savePendingProfile(draft.toProfile())
    const outcome = await signInWithGoogle()
    setBusy('')
    if (outcome === 'signed-in') {
      goTo('lobby')
      return
    }
    clearPendingProfile()
    setProblem(signInProblem(outcome))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !fieldsAreGood(signedIn === null)) return
    if (signedIn) {
      setBusy('join')
      await saveAndGo(signedIn.uid)
      setBusy('')
      return
    }
    setBusy('email')
    savePendingEmail(email.trim())
    const outcome = await emailSignInLink(email.trim())
    setBusy('')
    if (outcome !== 'sent') {
      setProblem(signInProblem(outcome))
      return
    }
    savePendingProfile(draft.toProfile())
    goTo('sign-in', 'sent')
  }

  return (
    <PhoneFrame label="Join a game" cardTag="Under a minute">
      <PlayerBadge />
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
            value={draft.username}
            error={draft.errors.username}
            testId="join-username"
            onChange={draft.changeUsername}
          />
          {asksInitials && (
            <Field id="join-initials" label="Initials" error={draft.errors.initials}>
              <CodeBoxes
                id="join-initials"
                value={draft.initials}
                length={INITIALS_LENGTH}
                invalid={!!draft.errors.initials}
                describedBy={draft.errors.initials ? 'join-initials-error' : undefined}
                variant="initials"
                testId="join-initials"
                onChange={draft.changeInitials}
              />
            </Field>
          )}
          <fieldset className="join-colors">
            <legend className="field__label">Your color</legend>
            <ColorSwatches style={style} value={draft.color} testIdPrefix="join-color" onPick={draft.setColor} />
          </fieldset>
        </div>

        {signedIn === null && (
          <div className="cue-card join-card join-sign-in">
            <h2 className="cue-card__label">Sign in once</h2>
            <GoogleButton busy={busy === 'google'} testId="join-google" onClick={joinWithGoogle} />
            <p className="sign-in-or">or</p>
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
              Join below and we'll email you a sign-in link. Tap it once and this phone remembers you. Check your spam
              folder.
            </p>
          </div>
        )}

        <div className="phone-actions join-actions">
          <button
            type="submit"
            className="phone-button join-submit"
            aria-disabled={busy !== '' || undefined}
            data-testid="join-submit"
          >
            <span className="join-submit__dome">{JOIN_LABELS[style]}</span>
          </button>
          <p className="join-caption" aria-hidden="true">
            Hit the buzzer
          </p>
          <p className="preview-note" role="alert" data-testid="join-problem">
            {problem}
          </p>
          <p className="preview-note">Preview: rooms aren't connected yet, so the room code isn't checked.</p>
        </div>
      </form>
    </PhoneFrame>
  )
}
