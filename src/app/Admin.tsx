// ABOUTME: The admin page (#/admin): your style, then tabs for players (profiles, Solo play, admins, points), scores, games and rooms.
// ABOUTME: Shown only to admins; the database rules refuse these changes from anyone else.
import { useEffect, useState, type FormEvent } from 'react'
import { standings } from '../engine/leaderboard'
import {
  closeRoom,
  deleteResult,
  resetProfile,
  setAdmin,
  setPlaytester,
  watchAdmins,
  watchOpenRooms,
  watchPlayers,
  type OpenRoom,
} from '../engine/net/admin'
import { saveProfile, type Profile } from '../engine/net/profiles'
import { LOBBY } from '../engine/net/rooms'
import { addScoreAdjustment, resetEveryonesScores, resetPlayerScores, watchScores, type Scores } from '../engine/net/scores'
import { LINEUP } from '../games/lineup'
import { MenuItems } from '../ui/FrameMenu'
import { CodeBoxes } from '../ui/CodeBoxes'
import { ColorSwatches } from '../ui/ColorSwatches'
import { ConfirmButton } from '../ui/ConfirmButton'
import { OptionRow } from '../ui/OptionRow'
import '../ui/PhoneForm.css'
import { PhoneFrame } from '../ui/PhoneFrame'
import { PLAYER_COLORS } from '../ui/playerColors'
import { StyleCards } from '../ui/StyleCards'
import { SymbolPicker } from '../ui/SymbolPicker'
import { TabPanel, Tabs } from '../ui/Tabs'
import { Field, TextField } from '../ui/TextField'
import { LOBBY_STYLES, type LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { PlayerBadge } from './PlayerBadge'
import { href } from './useHashRoute'
import { useMe } from './useMe'
import { useProfileDraft } from './useProfileDraft'
import './Admin.css'

interface AdminProps {
  style: LobbyStyleId
  onStyleChange: (style: LobbyStyleId) => void
}

export function Admin({ style, onStyleChange }: AdminProps) {
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
        <MenuItems>
          <a href={href('home')} data-testid="menu-home">
            Home
          </a>
        </MenuItems>
      </PhoneFrame>
    )
  }
  return <AdminPage selfUid={me.player.uid} style={style} onStyleChange={onStyleChange} />
}

type AdminTab = 'players' | 'scores' | 'games' | 'rooms'
const TABS: { id: AdminTab; label: string }[] = [
  { id: 'players', label: 'Players' },
  { id: 'scores', label: 'Scores' },
  { id: 'games', label: 'Games' },
  { id: 'rooms', label: 'Rooms' },
]

interface AdminData {
  profiles: Record<string, Profile>
  playtesters: Record<string, boolean>
  admins: Record<string, boolean>
  scores: Scores | null
  rooms: OpenRoom[]
}

/** Runs an admin change, turning a failure into a message on the page. */
type Run = (action: () => Promise<void>, failure: string) => Promise<void>

function gameTitle(id: string): string {
  if (id === LOBBY) return "Tonight's lobby"
  return LINEUP.find((game) => game.id === id)?.title ?? id
}

function dateText(at: number): string {
  return at ? new Date(at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'unknown time'
}

function nameOf(data: AdminData, uid: string): string {
  return data.profiles[uid]?.username ?? 'Former player'
}

function AdminPage({ selfUid, style, onStyleChange }: { selfUid: string } & AdminProps) {
  const [tab, setTab] = useState<AdminTab>('players')
  const [problem, setProblem] = useState('')
  const [data, setData] = useState<AdminData>({ profiles: {}, playtesters: {}, admins: {}, scores: null, rooms: [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const failed = (error: Error) => {
      console.error('Reading admin data failed', error)
      setProblem("Couldn't load everything. Check you're online.")
    }
    const stops = [
      watchPlayers((profiles, playtesters) => {
        setData((d) => ({ ...d, profiles, playtesters }))
        setLoaded(true)
      }, failed),
      watchAdmins((admins) => setData((d) => ({ ...d, admins })), failed),
      watchScores((scores) => setData((d) => ({ ...d, scores })), failed),
      watchOpenRooms((rooms) => setData((d) => ({ ...d, rooms })), failed),
    ]
    return () => stops.forEach((stop) => stop())
  }, [])

  const run: Run = async (action, failure) => {
    setProblem('')
    try {
      await action()
    } catch (error) {
      console.error(failure, error)
      setProblem(`${failure}. Check you're online and try again.`)
    }
  }

  return (
    <PhoneFrame label="Admin" cardTag="Admin">
      <PlayerBadge />
      <h1 className="phone-top__title">Admin</h1>
      <section className="admin-section" aria-labelledby="admin-style-heading">
        <h2 className="cue-card__label admin-section__heading" id="admin-style-heading">
          Your style
        </h2>
        <StyleCards current={style} size="phone" labelledBy="admin-style-heading" onPick={onStyleChange} />
      </section>
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
      <Tabs tabs={TABS} current={tab} idPrefix="admin" label="Admin sections" onChange={setTab} />
      <TabPanel idPrefix="admin" id={tab}>
        {!loaded && !problem && <p className="cue-card__text">Loading...</p>}
        {loaded && tab === 'players' && <PlayersPanel data={data} selfUid={selfUid} run={run} />}
        {loaded && tab === 'scores' && <ScoresPanel data={data} run={run} />}
        {loaded && tab === 'games' && <GamesPanel data={data} run={run} />}
        {loaded && tab === 'rooms' && <RoomsPanel data={data} run={run} />}
      </TabPanel>
      <MenuItems>
        <a href={href('home')} data-testid="admin-back">
          Home
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

// ---------- Players ----------

function PlayersPanel({ data, selfUid, run }: { data: AdminData; selfUid: string; run: Run }) {
  const totals = data.scores ? standings(data.scores.games, data.scores.adjustments, data.scores.resets, 'all') : []
  const rows = Object.entries(data.profiles).sort(([, a], [, b]) => a.username.localeCompare(b.username))
  return (
    <>
      <p className="cue-card__text">
        Everyone with a profile. Solo play lets a player into the games still in testing; admins always have it.
      </p>
      <ul className="admin-players" aria-label="Players">
        {rows.map(([uid, profile]) => (
          <PlayerRow
            key={uid}
            uid={uid}
            profile={profile}
            isSelf={uid === selfUid}
            playtester={data.playtesters[uid] === true}
            admin={data.admins[uid] === true}
            total={Math.round(totals.find((row) => row.uid === uid)?.total ?? 0)}
            selfUid={selfUid}
            run={run}
          />
        ))}
      </ul>
    </>
  )
}

interface PlayerRowProps {
  uid: string
  profile: Profile
  isSelf: boolean
  playtester: boolean
  admin: boolean
  total: number
  selfUid: string
  run: Run
}

function PlayerRow({ uid, profile, isSelf, playtester, admin, total, selfUid, run }: PlayerRowProps) {
  const style = useLobbyStyle()
  const [open, setOpen] = useState<'edit' | 'points' | null>(null)
  const short = uid.slice(0, 6)
  const toggle = (panel: 'edit' | 'points') => setOpen(open === panel ? null : panel)

  return (
    <li className="admin-player" data-testid={`admin-player-${short}`}>
      <div className="admin-player__who">
        <span className="admin-player__dot" style={{ background: PLAYER_COLORS[style][profile.color] }} aria-hidden="true" />
        <span className="admin-player__name">
          {profile.username}
          {isSelf ? ' (you)' : ''}
        </span>
        <span className="admin-player__total" data-testid={`admin-total-${short}`}>
          {total} pts
        </span>
      </div>
      <div className="admin-player__actions">
        <button
          type="button"
          className="admin-player__button"
          aria-pressed={playtester || isSelf || admin}
          aria-disabled={isSelf || admin || undefined}
          data-testid={`admin-solo-play-${short}`}
          onClick={() => {
            if (!isSelf && !admin) void run(() => setPlaytester(uid, !playtester), "Solo play didn't change")
          }}
        >
          Solo play {playtester || isSelf || admin ? 'on' : 'off'}
        </button>
        {isSelf ? (
          <button type="button" className="admin-player__button" aria-pressed="true" aria-disabled="true" data-testid={`admin-admin-${short}`}>
            Admin (you)
          </button>
        ) : admin ? (
          <ConfirmButton
            label="Admin: on"
            confirmLabel="Tap again to remove admin"
            className="admin-player__button admin-player__button--on"
            testId={`admin-admin-${short}`}
            onConfirm={() => void run(() => setAdmin(uid, false), "Admin didn't change")}
          />
        ) : (
          <ConfirmButton
            label="Make admin"
            confirmLabel="Tap again to make admin"
            className="admin-player__button"
            testId={`admin-admin-${short}`}
            onConfirm={() => void run(() => setAdmin(uid, true), "Admin didn't change")}
          />
        )}
        <button type="button" className="admin-player__button" aria-expanded={open === 'edit'} data-testid={`admin-edit-${short}`} onClick={() => toggle('edit')}>
          Edit profile
        </button>
        <button type="button" className="admin-player__button" aria-expanded={open === 'points'} data-testid={`admin-points-${short}`} onClick={() => toggle('points')}>
          Points
        </button>
        {!isSelf && (
          <ConfirmButton
            label="Reset profile"
            confirmLabel="Tap again to reset"
            className="admin-player__button"
            testId={`admin-reset-${short}`}
            onConfirm={() => void run(() => resetProfile(uid), "The profile didn't reset")}
          />
        )}
      </div>
      {open === 'edit' && <ProfileEditor uid={uid} profile={profile} run={run} onDone={() => setOpen(null)} />}
      {open === 'points' && <PointsEditor uid={uid} name={profile.username} total={total} selfUid={selfUid} run={run} />}
    </li>
  )
}

const STYLE_IDS = LOBBY_STYLES.map((s) => s.id)
const STYLE_NAMES = Object.fromEntries(LOBBY_STYLES.map((s) => [s.id, s.label])) as Record<LobbyStyleId, string>

/** Another player's name, initials, color, symbol and style, with the same checks as Profile. */
function ProfileEditor({ uid, profile, run, onDone }: { uid: string; profile: Profile; run: Run; onDone: () => void }) {
  const style = useLobbyStyle()
  const draft = useProfileDraft(profile)
  const [theirStyle, setTheirStyle] = useState<LobbyStyleId>(profile.style ?? 'game-show')
  const short = uid.slice(0, 6)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (draft.check(true)) return
    await run(() => saveProfile(uid, { ...draft.toProfile(), style: theirStyle }), "The profile didn't save")
    onDone()
  }

  return (
    <form className="cue-card admin-player__panel" noValidate onSubmit={save} aria-label={`Edit ${profile.username}`}>
      <TextField
        id={`admin-name-${short}`}
        label="Username"
        autoComplete="off"
        value={draft.username}
        error={draft.errors.username}
        testId={`admin-name-${short}`}
        onChange={draft.changeUsername}
      />
      <Field id={`admin-initials-${short}`} label="Initials" error={draft.errors.initials}>
        <CodeBoxes
          id={`admin-initials-${short}`}
          value={draft.initials}
          length={3}
          invalid={!!draft.errors.initials}
          describedBy={draft.errors.initials ? `admin-initials-${short}-error` : undefined}
          variant="initials"
          testId={`admin-initials-${short}`}
          onChange={draft.changeInitials}
        />
      </Field>
      <span className="field__label">Color</span>
      <ColorSwatches style={style} value={draft.color} testIdPrefix={`admin-color-${short}`} onPick={draft.setColor} />
      <span className="field__label">Symbol</span>
      <SymbolPicker colorHex={PLAYER_COLORS[style][draft.color]} value={draft.symbol} testIdPrefix={`admin-symbol-${short}`} onPick={draft.setSymbol} />
      <OptionRow label="Style" options={STYLE_IDS} names={STYLE_NAMES} value={theirStyle} onChoose={setTheirStyle} />
      <button type="submit" className="phone-button phone-button--secondary" data-testid={`admin-save-${short}`}>
        Save profile
      </button>
    </form>
  )
}

/** Add or take away points with a reason, or start this player again from 0. */
function PointsEditor({ uid, name, total, selfUid, run }: { uid: string; name: string; total: number; selfUid: string; run: Run }) {
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState({ points: '', reason: '' })
  const short = uid.slice(0, 6)

  async function add(event: FormEvent) {
    event.preventDefault()
    const value = Number(points)
    const found = {
      points: points.trim() === '' || !Number.isInteger(value) || value === 0 || Math.abs(value) > 1000 ? 'Enter a whole number from -1000 to 1000, not 0.' : '',
      reason: reason.trim() === '' ? 'Say why, so the change makes sense later.' : reason.trim().length > 80 ? 'Keep it to 80 letters.' : '',
    }
    setErrors(found)
    if (found.points || found.reason) return
    await run(() => addScoreAdjustment(uid, value, reason.trim(), selfUid), "The points didn't save")
    setPoints('')
    setReason('')
  }

  return (
    <form className="cue-card admin-player__panel" noValidate onSubmit={add} aria-label={`Points for ${name}`}>
      <p className="cue-card__text">
        {name} has {total} leaderboard points. Use a minus sign to take points away.
      </p>
      <TextField id={`admin-pts-${short}`} label="Points" autoComplete="off" value={points} error={errors.points} testId={`admin-pts-${short}`} onChange={setPoints} />
      <TextField id={`admin-why-${short}`} label="Reason" autoComplete="off" value={reason} error={errors.reason} testId={`admin-why-${short}`} onChange={setReason} />
      <button type="submit" className="phone-button phone-button--secondary" data-testid={`admin-add-points-${short}`}>
        Change points
      </button>
      <ConfirmButton
        label={`Reset ${name} to 0`}
        confirmLabel="Tap again to reset to 0"
        className="phone-link"
        testId={`admin-zero-${short}`}
        onConfirm={() => void run(() => resetPlayerScores(uid), "The reset didn't save")}
      />
    </form>
  )
}

// ---------- Scores ----------

function ScoresPanel({ data, run }: { data: AdminData; run: Run }) {
  const changes = [...(data.scores?.adjustments ?? [])].sort((a, b) => b.at - a.at)
  const season = data.scores?.resets.everyone ?? 0
  return (
    <>
      <p className="cue-card__text">
        {season ? `This season started ${dateText(season)}.` : 'No season reset yet: every saved game counts.'} A new season starts everyone at 0; saved games stay in the
        database.
      </p>
      <ConfirmButton
        label="Start a new season"
        confirmLabel="Tap again: everyone back to 0"
        className="phone-button phone-button--secondary"
        testId="admin-new-season"
        onConfirm={() => void run(() => resetEveryonesScores(), "The new season didn't start")}
      />
      <h2 className="cue-card__label admin-section__heading">Point changes</h2>
      {changes.length === 0 ? (
        <p className="cue-card__text">No point changes yet. Add one from a player's Points button.</p>
      ) : (
        <ul className="admin-list" aria-label="Point changes, newest first" data-testid="admin-changes">
          {changes.map((change) => (
            <li key={change.id} className="admin-list__row">
              <span className="admin-list__main">
                {nameOf(data, change.uid)} {change.points > 0 ? `+${change.points}` : change.points}
              </span>
              <span className="admin-list__detail">
                {change.reason} · {dateText(change.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ---------- Games ----------

function GamesPanel({ data, run }: { data: AdminData; run: Run }) {
  const games = [...(data.scores?.games ?? [])].sort((a, b) => b.at - a.at)
  return (
    <>
      <p className="cue-card__text">Every saved game, newest first. Delete a bad or test game and it stops counting on the leaderboard.</p>
      {games.length === 0 ? (
        <p className="cue-card__text">No saved games yet.</p>
      ) : (
        <ul className="admin-list" aria-label="Saved games, newest first" data-testid="admin-games">
          {games.map((game) => (
            <li key={game.id} className="admin-list__row" data-testid={`admin-game-${game.id}`}>
              <span className="admin-list__main">
                {gameTitle(game.game)} · {dateText(game.at)}
              </span>
              <span className="admin-list__detail">
                Room {game.room} ·{' '}
                {Object.entries(game.players)
                  .sort(([, a], [, b]) => a.place - b.place)
                  .map(([uid, result]) => `${nameOf(data, uid)} ${Math.round(result.points)}`)
                  .join(', ')}
              </span>
              <ConfirmButton
                label="Delete game"
                confirmLabel="Tap again to delete"
                className="admin-player__button"
                testId={`admin-delete-${game.id}`}
                onConfirm={() => void run(() => deleteResult(game.id), "The game didn't delete")}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ---------- Rooms ----------

function RoomsPanel({ data, run }: { data: AdminData; run: Run }) {
  return (
    <>
      <p className="cue-card__text">Rooms stay open until someone closes them. Close a stuck or finished room; anyone still in it sees the room is gone, with a Back button.</p>
      {data.rooms.length === 0 ? (
        <p className="cue-card__text">No open rooms.</p>
      ) : (
        <ul className="admin-list" aria-label="Open rooms, newest first" data-testid="admin-rooms">
          {data.rooms.map((room) => (
            <li key={room.code} className="admin-list__row" data-testid={`admin-room-${room.code}`}>
              <span className="admin-list__main">
                {room.code} · {room.lobby ? `Tonight's lobby${room.game !== LOBBY ? `, playing ${gameTitle(room.game)}` : ''}` : gameTitle(room.game)}
              </span>
              <span className="admin-list__detail">
                Host {nameOf(data, room.host)} · {room.players.length} {room.players.length === 1 ? 'player' : 'players'} · opened {dateText(room.createdAt)}
              </span>
              <ConfirmButton
                label="Close room"
                confirmLabel="Tap again to close"
                className="admin-player__button"
                testId={`admin-close-${room.code}`}
                onConfirm={() => void run(() => closeRoom(room.code), "The room didn't close")}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
