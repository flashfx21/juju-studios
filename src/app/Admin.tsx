// ABOUTME: The admin page (#/admin): every player with a profile, who may use Solo play, and rename or reset a profile.
// ABOUTME: Shown only to admins; the database rules refuse these changes from anyone else.
import { useEffect, useState, type FormEvent } from 'react'
import { resetProfile, setPlaytester, watchPlayers } from '../engine/net/admin'
import { saveProfile, type Profile } from '../engine/net/profiles'
import '../ui/PhoneForm.css'
import { PhoneFrame } from '../ui/PhoneFrame'
import { PLAYER_COLORS } from '../ui/playerColors'
import { TextField } from '../ui/TextField'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { checkUsername } from './formRules'
import { PlayerBadge } from './PlayerBadge'
import { href } from './useHashRoute'
import { useMe } from './useMe'
import './Admin.css'

export function Admin() {
  const me = useMe()
  if (me.kind === 'checking' || (me.kind === 'signed-in' && me.profile === undefined)) {
    return <PhoneFrame label="Admin" cardTag="Admin" />
  }
  if (me.kind !== 'signed-in' || !me.isAdmin) {
    return (
      <PhoneFrame label="Admin" cardTag="Admin">
        <h1 className="phone-top__title">Admin</h1>
        <p className="cue-card__text" data-testid="admin-only">
          This page is for admins.
        </p>
        <a className="phone-link" href={href('home')}>
          Back
        </a>
      </PhoneFrame>
    )
  }
  return <PlayerList selfUid={me.player.uid} />
}

function PlayerList({ selfUid }: { selfUid: string }) {
  const [players, setPlayers] = useState<{ profiles: Record<string, Profile>; playtesters: Record<string, boolean> }>()
  const [problem, setProblem] = useState('')

  useEffect(
    () =>
      watchPlayers(
        (profiles, playtesters) => setPlayers({ profiles, playtesters }),
        (error) => {
          console.error('Reading the players failed', error)
          setProblem("Couldn't load the players. Check you're online.")
        },
      ),
    [],
  )

  const rows = players
    ? Object.entries(players.profiles).sort(([, a], [, b]) => a.username.localeCompare(b.username))
    : []

  return (
    <PhoneFrame label="Admin" cardTag="Admin">
      <PlayerBadge />
      <h1 className="phone-top__title">Admin</h1>
      <p className="cue-card__text">
        Everyone with a profile. Solo play lets a player into the games still in testing; admins always have it.
      </p>
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
      {players === undefined && !problem && <p className="cue-card__text">Loading players...</p>}
      <ul className="admin-players" aria-label="Players">
        {rows.map(([uid, profile]) => (
          <PlayerRow
            key={uid}
            uid={uid}
            profile={profile}
            isSelf={uid === selfUid}
            playtester={players?.playtesters[uid] === true}
            onProblem={setProblem}
          />
        ))}
      </ul>
      <div className="phone-actions">
        <a className="phone-link" href={href('home')} data-testid="admin-back">
          Back
        </a>
      </div>
    </PhoneFrame>
  )
}

interface PlayerRowProps {
  uid: string
  profile: Profile
  isSelf: boolean
  playtester: boolean
  onProblem: (message: string) => void
}

function PlayerRow({ uid, profile, isSelf, playtester, onProblem }: PlayerRowProps) {
  const style = useLobbyStyle()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(profile.username)
  const [nameError, setNameError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const short = uid.slice(0, 6)

  async function run(action: () => Promise<void>, failure: string) {
    onProblem('')
    try {
      await action()
    } catch (error) {
      console.error(failure, error)
      onProblem(`${failure}. Check you're online and try again.`)
    }
  }

  async function rename(event: FormEvent) {
    event.preventDefault()
    const found = checkUsername(name)
    setNameError(found)
    if (found) return
    await run(() => saveProfile(uid, { ...profile, username: name.trim() }), "The new name didn't save")
    setRenaming(false)
  }

  return (
    <li className="admin-player" data-testid={`admin-player-${short}`}>
      <div className="admin-player__who">
        <span className="admin-player__dot" style={{ background: PLAYER_COLORS[style][profile.color] }} aria-hidden="true" />
        <span className="admin-player__name">
          {profile.username}
          {isSelf ? ' (you)' : ''}
        </span>
      </div>
      <div className="admin-player__actions">
        <button
          type="button"
          className="admin-player__button"
          aria-pressed={playtester || isSelf}
          aria-disabled={isSelf || undefined}
          data-testid={`admin-solo-play-${short}`}
          onClick={() => {
            if (!isSelf) void run(() => setPlaytester(uid, !playtester), "Solo play didn't change")
          }}
        >
          Solo play {playtester || isSelf ? 'on' : 'off'}
        </button>
        <button
          type="button"
          className="admin-player__button"
          aria-expanded={renaming}
          data-testid={`admin-rename-${short}`}
          onClick={() => {
            setName(profile.username)
            setNameError('')
            setRenaming(!renaming)
          }}
        >
          Rename
        </button>
        {!isSelf && (
          <button
            type="button"
            className="admin-player__button"
            data-testid={`admin-reset-${short}`}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true)
                return
              }
              setConfirmReset(false)
              void run(() => resetProfile(uid), "The profile didn't reset")
            }}
            onBlur={() => setConfirmReset(false)}
          >
            {confirmReset ? 'Tap again to reset' : 'Reset profile'}
          </button>
        )}
      </div>
      {renaming && (
        <form className="cue-card admin-player__rename" noValidate onSubmit={rename}>
          <TextField
            id={`admin-name-${short}`}
            label={`New name for ${profile.username}`}
            autoComplete="off"
            value={name}
            error={nameError}
            testId={`admin-name-${short}`}
            onChange={setName}
          />
          <button type="submit" className="phone-button phone-button--secondary" data-testid={`admin-save-name-${short}`}>
            Save name
          </button>
        </form>
      )}
    </li>
  )
}
