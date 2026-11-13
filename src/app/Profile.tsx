// ABOUTME: The phone Profile screen: initials in your color, username, email, color picker, your style, and stats.
// ABOUTME: "Your style" is not in the design; it extends the Host settings style cards (everyone picks their own style).
import { useState, type CSSProperties } from 'react'
import { PhoneFrame } from '../ui/PhoneFrame'
import { inkOn, PLAYER_COLOR_IDS, PLAYER_COLOR_NAMES, PLAYER_COLORS, type PlayerColorId } from '../ui/playerColors'
import { StyleCards } from '../ui/StyleCards'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import '../ui/PhoneForm.css'
import { signOutOfThisDevice } from '../engine/net/auth'
import { clearProfile, loadProfile, saveProfile } from './localProfile'
import { goTo, href } from './useHashRoute'
import './Profile.css'

interface ProfileCopy {
  title: string
  color: string
  style: string
  save: string
}

const COPY: Record<LobbyStyleId, ProfileCopy> = {
  'game-show': { title: 'Your profile', color: 'Your color', style: 'Your style', save: 'Save and go back' },
  arcade: { title: 'Player profile', color: 'Color', style: 'Style', save: 'Save + go back' },
  'rec-room': { title: 'Your profile', color: 'Your color', style: 'Your style', save: 'Save and go back' },
}

interface ProfileProps {
  style: LobbyStyleId
  onStyleChange: (style: LobbyStyleId) => void
}

export function Profile({ style, onStyleChange }: ProfileProps) {
  const copy = COPY[style]
  const [profile] = useState(loadProfile)
  const [color, setColor] = useState<PlayerColorId>(profile?.color ?? 'red')
  const colorHex = PLAYER_COLORS[style][color]
  const initials = profile ? profile.initials || profile.username.slice(0, 3).toUpperCase() : ''

  function saveAndGoBack() {
    if (profile) saveProfile({ ...profile, color })
    goTo('home')
  }

  function signOut() {
    clearProfile()
    void signOutOfThisDevice()
    goTo('join')
  }

  return (
    <PhoneFrame label="Your profile" cardTag="Game night">
      <h1 className="profile__title">{copy.title}</h1>

      {profile ? (
        <>
          <div className="profile__id">
            <span
              className="profile__avatar"
              style={{ '--player': colorHex, '--player-ink': inkOn(colorHex) } as CSSProperties}
              aria-hidden="true"
              data-testid="profile-avatar"
            >
              <span className="profile__initials-2">{initials.slice(0, 2)}</span>
              <span className="profile__initials-3">{initials}</span>
            </span>
            <div className="profile__who">
              <p className="profile__name" data-testid="profile-name">
                {profile.username}
              </p>
              {profile.email && <p className="profile__email">{profile.email}</p>}
            </div>
          </div>

          <fieldset className="profile__group">
            <legend className="profile__label">{copy.color}</legend>
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
                    data-testid={`profile-color-${id}`}
                    onClick={() => setColor(id)}
                  >
                    {selected ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </>
      ) : (
        <div className="cue-card profile__empty" data-testid="profile-empty">
          <p className="cue-card__heading">No profile on this phone yet</p>
          <p className="cue-card__text">Join a game to pick your username and color. You can still choose your style below.</p>
          <a className="phone-button profile__join" href={href('join')}>
            Join a game
          </a>
        </div>
      )}

      <section className="profile__group" aria-labelledby="your-style-heading">
        <h2 className="profile__label" id="your-style-heading">
          {copy.style}
        </h2>
        <StyleCards current={style} size="phone" labelledBy="your-style-heading" onPick={onStyleChange} />
      </section>

      {profile && (
        <dl className="profile__stats">
          <div className="profile__stat">
            <dt>Games played</dt>
            <dd>0</dd>
          </div>
          <div className="profile__stat">
            <dt>Total points</dt>
            <dd>{style === 'arcade' ? '00000' : '0'}</dd>
          </div>
          <div className="profile__stat">
            <dt>Average</dt>
            <dd>-</dd>
          </div>
        </dl>
      )}

      <div className="phone-actions">
        {profile ? (
          <>
            <button type="button" className="phone-button" data-testid="profile-save" onClick={saveAndGoBack}>
              {copy.save}
            </button>
            <button type="button" className="phone-link" data-testid="profile-sign-out" onClick={signOut}>
              Sign out of this phone
            </button>
          </>
        ) : (
          <a className="phone-link" href={href('home')} data-testid="profile-back">
            Back
          </a>
        )}
      </div>
    </PhoneFrame>
  )
}
