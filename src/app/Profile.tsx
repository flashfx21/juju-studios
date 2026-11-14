// ABOUTME: The phone Profile screen: your symbol in your color, then two tabs: Profile (name, color, symbol, style) and Stats.
// ABOUTME: A signed-in player with no profile yet sees it as setup; "Your style" is saved to the profile too.
import { useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { signOutOfThisDevice } from '../engine/net/auth'
import { saveProfile, type Profile as SavedProfile } from '../engine/net/profiles'
import { CodeBoxes } from '../ui/CodeBoxes'
import { ColorSwatches } from '../ui/ColorSwatches'
import { PhoneFrame } from '../ui/PhoneFrame'
import { inkOn, PLAYER_COLORS } from '../ui/playerColors'
import { PlayerSymbol } from '../ui/PlayerSymbol'
import { StyleCards } from '../ui/StyleCards'
import { SymbolPicker } from '../ui/SymbolPicker'
import { Field, TextField } from '../ui/TextField'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import '../ui/PhoneForm.css'
import { INITIALS_LENGTH } from './formRules'
import { ProfileStats } from './ProfileStats'
import { goTo, href } from './useHashRoute'
import { useMe } from './useMe'
import { useProfileDraft } from './useProfileDraft'
import './Profile.css'

interface ProfileCopy {
  title: string
  setupTitle: string
  color: string
  style: string
  save: string
}

const COPY: Record<LobbyStyleId, ProfileCopy> = {
  'game-show': {
    title: 'Your profile',
    setupTitle: 'Set up your profile',
    color: 'Your color',
    style: 'Your style',
    save: 'Save and go back',
  },
  arcade: { title: 'Player profile', setupTitle: 'New player', color: 'Color', style: 'Style', save: 'Save + go back' },
  'rec-room': {
    title: 'Your profile',
    setupTitle: 'Set up your profile',
    color: 'Your color',
    style: 'Your style',
    save: 'Save and go back',
  },
}

interface ProfileProps {
  style: LobbyStyleId
  onStyleChange: (style: LobbyStyleId) => void
}

export function Profile({ style, onStyleChange }: ProfileProps) {
  const me = useMe()

  if (me.kind === 'checking' || (me.kind === 'signed-in' && me.profile === undefined)) {
    return (
      <PhoneFrame label="Your profile" cardTag="Game night">
        <p className="cue-card__text" role="status">
          Loading your profile...
        </p>
      </PhoneFrame>
    )
  }

  if (me.kind === 'signed-out') return <SignedOutProfile style={style} onStyleChange={onStyleChange} />

  return (
    <ProfileForm
      key={me.player.uid}
      uid={me.player.uid}
      email={me.player.email}
      saved={me.profile ?? null}
      style={style}
      onStyleChange={onStyleChange}
    />
  )
}

function SignedOutProfile({ style, onStyleChange }: ProfileProps) {
  const copy = COPY[style]
  return (
    <PhoneFrame label="Your profile" cardTag="Game night">
      <h1 className="profile__title">{copy.title}</h1>
      <div className="cue-card profile__empty" data-testid="profile-signed-out">
        <p className="cue-card__heading">You're not signed in</p>
        <p className="cue-card__text">Sign in to set up your username and color. You can still choose your style below.</p>
        <a className="phone-button profile__join" href={href('sign-in')} data-testid="profile-sign-in">
          Sign in
        </a>
      </div>
      <StyleGroup style={style} onStyleChange={onStyleChange} />
      <div className="phone-actions">
        <a className="phone-link" href={href('home')} data-testid="profile-back">
          Back
        </a>
      </div>
    </PhoneFrame>
  )
}

function StyleGroup({ style, onStyleChange }: ProfileProps) {
  return (
    <section className="profile__group" aria-labelledby="your-style-heading">
      <h2 className="profile__label" id="your-style-heading">
        {COPY[style].style}
      </h2>
      <StyleCards current={style} size="phone" labelledBy="your-style-heading" onPick={onStyleChange} />
    </section>
  )
}

interface ProfileFormProps extends ProfileProps {
  uid: string
  email: string
  /** Null when this player is setting up their profile for the first time. */
  saved: SavedProfile | null
}

function ProfileForm({ uid, email, saved, style, onStyleChange }: ProfileFormProps) {
  const copy = COPY[style]
  const settingUp = saved === null
  const asksInitials = style === 'arcade'
  const draft = useProfileDraft(saved)
  const [problem, setProblem] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<ProfileTab>('profile')
  const colorHex = PLAYER_COLORS[style][draft.color]
  const initials = draft.toProfile().initials

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setProblem('')
    const firstBad = draft.check(asksInitials)
    if (firstBad) {
      document.getElementById(`profile-${firstBad}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await saveProfile(uid, draft.toProfile())
      // Setup shows in place of whatever screen the player was heading to (such as Join); once saved, that
      // screen appears by itself. Only setup opened from Profile itself moves on, to the lobby page.
      if (!settingUp) goTo('home')
      else if (window.location.hash.startsWith(href('profile'))) goTo('lobby')
    } catch (error) {
      console.error('Saving the profile failed', error)
      setProblem("Your profile didn't save. Check you're online and try again.")
      setSaving(false)
    }
  }

  function signOut() {
    void signOutOfThisDevice()
    goTo('home')
  }

  return (
    <PhoneFrame label={settingUp ? 'Set up your profile' : 'Your profile'} cardTag="Game night">
      <h1 className="profile__title">{settingUp ? copy.setupTitle : copy.title}</h1>

      <div className="profile__id">
        <span
          className="profile__avatar"
          style={{ '--player': colorHex, '--player-ink': inkOn(colorHex) } as CSSProperties}
          aria-hidden="true"
          data-testid="profile-avatar"
        >
          {draft.symbol && style !== 'arcade' ? (
            <PlayerSymbol symbol={draft.symbol} />
          ) : (
            <>
              <span className="profile__initials-2">{initials.slice(0, 2)}</span>
              <span className="profile__initials-3">{initials}</span>
            </>
          )}
        </span>
        <div className="profile__who">
          <p className="profile__name" data-testid="profile-name">
            {draft.username.trim() || 'New player'}
          </p>
          <p className="profile__email" data-testid="profile-email">
            {email}
          </p>
        </div>
      </div>

      {!settingUp && <ProfileTabs tab={tab} onChange={setTab} />}

      {tab === 'stats' ? (
        <div className="profile__panel" role="tabpanel" id="profile-panel-stats" aria-labelledby="profile-tab-stats">
          <ProfileStats uid={uid} style={style} />
        </div>
      ) : (
        <form
          className="phone-form"
          noValidate
          onSubmit={submit}
          role={settingUp ? undefined : 'tabpanel'}
          id="profile-panel-profile"
          aria-labelledby={settingUp ? undefined : 'profile-tab-profile'}
        >
          {settingUp && (
            <p className="cue-card__text">You're signed in. Pick the name and color everyone sees in games.</p>
          )}

          <div className="cue-card">
            <TextField
              id="profile-username"
              label="Username"
              autoComplete="nickname"
              value={draft.username}
              error={draft.errors.username}
              testId="profile-username"
              onChange={draft.changeUsername}
            />
            {asksInitials && (
              <Field id="profile-initials" label="Initials" error={draft.errors.initials}>
                <CodeBoxes
                  id="profile-initials"
                  value={draft.initials}
                  length={INITIALS_LENGTH}
                  invalid={!!draft.errors.initials}
                  describedBy={draft.errors.initials ? 'profile-initials-error' : undefined}
                  variant="initials"
                  testId="profile-initials"
                  onChange={draft.changeInitials}
                />
              </Field>
            )}
          </div>

          <fieldset className="profile__group">
            <legend className="profile__label">{copy.color}</legend>
            <ColorSwatches style={style} value={draft.color} testIdPrefix="profile-color" onPick={draft.setColor} />
          </fieldset>

          <fieldset className="profile__group">
            <legend className="profile__label">Your symbol</legend>
            <SymbolPicker colorHex={colorHex} value={draft.symbol} testIdPrefix="profile-symbol" onPick={draft.setSymbol} />
          </fieldset>

          {!settingUp && <StyleGroup style={style} onStyleChange={onStyleChange} />}

          <div className="phone-actions">
            <button
              type="submit"
              className="phone-button"
              aria-disabled={saving || undefined}
              data-testid="profile-save"
            >
              {settingUp ? 'Save' : copy.save}
            </button>
            <p className="preview-note" role="alert" data-testid="profile-problem">
              {problem}
            </p>
            <button type="button" className="phone-link" data-testid="profile-sign-out" onClick={signOut}>
              Sign out of this phone
            </button>
          </div>
        </form>
      )}
    </PhoneFrame>
  )
}

type ProfileTab = 'profile' | 'stats'

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'stats', label: 'Stats' },
]

/** Profile and Stats tabs. Arrow keys, Home and End move between them, as screen reader users expect. */
function ProfileTabs({ tab, onChange }: { tab: ProfileTab; onChange: (tab: ProfileTab) => void }) {
  const buttons = useRef<Partial<Record<ProfileTab, HTMLButtonElement | null>>>({})

  function onKeyDown(event: KeyboardEvent) {
    const index = TABS.findIndex((t) => t.id === tab)
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(TABS[next].id)
    buttons.current[TABS[next].id]?.focus()
  }

  return (
    <div className="profile__tabs" role="tablist" aria-label="Profile sections" onKeyDown={onKeyDown}>
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          ref={(element) => {
            buttons.current[id] = element
          }}
          type="button"
          role="tab"
          id={`profile-tab-${id}`}
          className="profile__tab"
          aria-selected={tab === id}
          aria-controls={`profile-panel-${id}`}
          tabIndex={tab === id ? 0 : -1}
          data-testid={`profile-tab-${id}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
