// ABOUTME: Pin Drop on phones, no TV: one player starts a room and shares its code, others join, bots can fill in.
// ABOUTME: The host's phone runs the rules and the round timer; every phone shows the photo above its own map.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createRoom, joinRoom, playerIds, sendInput, takeInputs, watchRoom, writePlay, clearPlay, type Room } from '../../engine/net/rooms'
import { useMe } from '../../app/useMe'
import { rememberedRoom, rememberRoom } from '../../engine/rememberedRoom'
import { CodeBoxes } from '../../ui/CodeBoxes'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { inkOn, PLAYER_COLORS, type PlayerColorId } from '../../ui/playerColors'
import { PlayerSymbol } from '../../ui/PlayerSymbol'
import { isPlayerSymbolId } from '../../ui/playerSymbols'
import { Field } from '../../ui/TextField'
import { useLobbyStyle } from '../../ui/themes/useLobbyStyle'
import { seededRandom } from '../../engine/seededRandom'
import type { PlayerId, RulesContext } from '../types'
import { BOT_SKILLS, botFor, botGuess, botIds, type BotSkill } from './bots'
import { manifest } from './manifest'
import { OptionRow, RoundPhoto } from './Pieces'
import { PhoneScreen, PinDropTitle, type PlayerLook } from './PhoneScreen'
import {
  currentRound,
  DEFAULT_SETTINGS,
  PACES,
  ROUND_COUNTS,
  rules,
  SCORINGS,
  UNITS,
  type PinDropInput,
  type PinDropSettings,
  type PinDropState,
} from './rules'
import '../../ui/PhoneForm.css'
import './Together.css'

/** How long the reveal shows before the standings. */
const REVEAL_SECONDS = 10

const SCORING_NAMES = { match: 'Match play', stroke: 'Stroke play' }
const UNIT_NAMES = { mi: 'Miles', km: 'Kilometers' }
const PACE_NAMES = { 45: '45 s', 60: '60 s', 90: '90 s' }
const ROUND_NAMES = { 5: '5', 7: '7', 9: '9' }
const BOT_COUNTS = [0, 1, 2, 3] as const
const BOT_COUNT_NAMES = { 0: 'None', 1: '1', 2: '2', 3: '3' }
const BOT_SKILL_NAMES: Record<BotSkill, string> = { casual: 'Casual', sharp: 'Sharp' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** When the timer for this phase runs out: guessing uses the pace, the reveal a fixed time, standings wait for Next. */
function deadlineFor(state: PinDropState, now: number): number | null {
  if (state.phase === 'guessing') return now + state.settings.pace * 1000
  if (state.phase === 'reveal') return now + REVEAL_SECONDS * 1000
  return null
}

export function Together() {
  const me = useMe()
  // This phone's room (also set by the home Join screen), so a refresh goes straight back in.
  const [code, setCode] = useState(() => rememberedRoom(manifest.id))

  function enter(next: string) {
    rememberRoom(manifest.id, next)
    setCode(next)
  }

  if (me.kind !== 'signed-in' || !me.profile) return <PhoneFrame label="Pin Drop" cardTag="Solo play" />
  const self = { uid: me.player.uid, ...me.profile }

  return (
    <PhoneFrame label="Pin Drop with others" cardTag="Solo play" fit={code !== ''}>
      {code ? <InRoom key={code} code={code} self={self} onLeave={() => enter('')} /> : <StartOrJoin self={self} onEnter={enter} />}
    </PhoneFrame>
  )
}

interface Self {
  uid: string
  username: string
  initials: string
  color: PlayerColorId
  symbol?: string
}

function StartOrJoin({ self, onEnter }: { self: Self; onEnter: (code: string) => void }) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function start() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      onEnter(await createRoom(self.uid, manifest.id, self))
    } catch (problem) {
      console.error('Starting a room failed', problem)
      setError("The room didn't open. Check you're online and try again.")
      setBusy(false)
    }
  }

  async function join() {
    if (busy) return
    if (typed.length !== 4) {
      setError('Enter the 4-letter room code.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const outcome = await joinRoom(typed, self.uid, manifest.id, self)
      if (outcome === 'joined') onEnter(typed)
      else setError(outcome === 'no-room' ? "There's no room with that code." : "That room isn't playing Pin Drop.")
    } catch (problem) {
      console.error('Joining the room failed', problem)
      setError("Couldn't join. Check you're online and try again.")
    }
    setBusy(false)
  }

  return (
    <>
      <PinDropTitle />
      <p className="cue-card__text">
        Play on two or more phones, no TV. One person starts a room and reads out the code; everyone else joins with it.
      </p>
      <button type="button" className="phone-button" aria-disabled={busy || undefined} data-testid="pdt-start-room" onClick={start}>
        Start a room
      </button>
      <div className="cue-card">
        <Field id="pdt-code" label="Got a room code?" error={error}>
          <CodeBoxes
            id="pdt-code"
            value={typed}
            length={4}
            invalid={!!error}
            describedBy={error ? 'pdt-code-error' : undefined}
            testId="pdt-code"
            onChange={setTyped}
          />
        </Field>
        <button
          type="button"
          className="phone-button phone-button--secondary"
          aria-disabled={busy || undefined}
          data-testid="pdt-join"
          onClick={join}
        >
          Join
        </button>
      </div>
    </>
  )
}

function InRoom({ code, self, onLeave }: { code: string; self: Self; onLeave: () => void }) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [problem, setProblem] = useState('')

  useEffect(
    () =>
      watchRoom(code, setRoom, (error) => {
        console.error('Watching the room failed', error)
        setProblem("Lost touch with the room. Check you're online.")
      }),
    [code],
  )

  // Back in after a refresh, or the room forgot this player: join again.
  const inRoom = room ? self.uid in room.players : true
  useEffect(() => {
    if (room && !inRoom) void joinRoom(code, self.uid, manifest.id, self)
  }, [room, inRoom, code, self])

  if (room === undefined) return <p className="cue-card__text">Opening room {code}...</p>
  if (room === null) {
    return (
      <>
        <PinDropTitle />
        <p className="cue-card__text">Room {code} is gone.</p>
        <button type="button" className="phone-button" data-testid="pdt-leave" onClick={onLeave}>
          Back
        </button>
      </>
    )
  }

  const isHost = room.host === self.uid
  return (
    <>
      {isHost && <HostRunner room={room} />}
      {room.play ? (
        <Game room={room} self={self} isHost={isHost} onLeave={onLeave} />
      ) : (
        <WaitingRoom room={room} isHost={isHost} onLeave={onLeave} />
      )}
      {problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
    </>
  )
}

/** Names, colors and symbols for everyone in the room, plus any bots in the game. */
function usePlayerLooks(room: Room, gamePlayers: readonly PlayerId[] = []): Record<PlayerId, PlayerLook> {
  const style = useLobbyStyle()
  const looks: Record<PlayerId, PlayerLook> = {}
  for (const id of gamePlayers) {
    const bot = botFor(id)
    if (!bot) continue
    const { name, initials, color, symbol } = bot.look
    looks[id] = { name, initials, color: PLAYER_COLORS[style][color], symbol: style === 'arcade' ? undefined : symbol }
  }
  for (const [uid, player] of Object.entries(room.players)) {
    const color = PLAYER_COLORS[style][player.color as PlayerColorId] ?? PLAYER_COLORS[style].silver
    // Arcade keeps initials for its high-score look.
    const symbol = style !== 'arcade' && isPlayerSymbolId(player.symbol) ? player.symbol : undefined
    looks[uid] = { name: player.username, initials: player.initials, color, symbol }
  }
  return looks
}

function WaitingRoom({ room, isHost, onLeave }: { room: Room; isHost: boolean; onLeave: () => void }) {
  const [settings, setSettings] = useState<PinDropSettings>(DEFAULT_SETTINGS)
  const [botCount, setBotCount] = useState<(typeof BOT_COUNTS)[number]>(0)
  const [botSkill, setBotSkill] = useState<BotSkill>('casual')
  const ids = playerIds(room)
  const bots = isHost ? botIds(botCount, botSkill) : []
  const looks = usePlayerLooks(room, bots)
  const enough = ids.length + bots.length >= manifest.players.min
  const choose = <K extends keyof PinDropSettings>(key: K, value: PinDropSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }))

  function startGame() {
    if (!enough) return
    const ctx = context()
    const state = rules.setup([...ids, ...bots], settings, ctx)
    void writePlay(room.code, state, deadlineFor(state, ctx.now))
  }

  return (
    <div className="pdt-waiting">
      <PinDropTitle />
      <p className="pdt-code" data-testid="pdt-room-code">
        <span className="pdt-code__label">Room code</span>
        <span className="pdt-code__letters">{room.code}</span>
      </p>
      <ul className="pdt-players" aria-label="Players in the room">
        {ids.map((uid) => (
          <li key={uid} className="pdt-players__row">
            <PlayerDot look={looks[uid]} />
            {looks[uid].name}
            {uid === room.host ? ' (host)' : ''}
          </li>
        ))}
        {bots.map((id) => (
          <li key={id} className="pdt-players__row">
            <PlayerDot look={looks[id]} />
            {looks[id].name} (bot)
          </li>
        ))}
      </ul>
      {isHost ? (
        <>
          <OptionRow label="Scoring" options={SCORINGS} names={SCORING_NAMES} value={settings.scoring} onChoose={(v) => choose('scoring', v)} />
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={settings.rounds} onChoose={(v) => choose('rounds', v)} />
          <OptionRow label="Seconds" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(v) => choose('pace', v)} />
          <OptionRow label="Units" options={UNITS} names={UNIT_NAMES} value={settings.units} onChoose={(v) => choose('units', v)} />
          <OptionRow label="Bots" options={BOT_COUNTS} names={BOT_COUNT_NAMES} value={botCount} onChoose={setBotCount} />
          {botCount > 0 && (
            <OptionRow label="Bot skill" options={BOT_SKILLS} names={BOT_SKILL_NAMES} value={botSkill} onChoose={setBotSkill} />
          )}
          <button
            type="button"
            className="phone-button"
            aria-disabled={enough ? undefined : 'true'}
            data-testid="pdt-start-game"
            onClick={startGame}
          >
            Start game
          </button>
          {!enough && <p className="pd-status">Waiting for at least {manifest.players.min} players. Bots count.</p>}
        </>
      ) : (
        <p className="pd-status" role="status">
          Waiting for the host to start
        </p>
      )}
      <button type="button" className="phone-link phone-link--quiet" data-testid="pdt-leave" onClick={onLeave}>
        Leave room
      </button>
    </div>
  )
}

function PlayerDot({ look }: { look: PlayerLook }) {
  return (
    <span
      className="pdt-players__dot"
      style={{ background: look.color, '--player': look.color, color: inkOn(look.color) } as CSSProperties}
      aria-hidden="true"
    >
      {look.symbol && <PlayerSymbol symbol={look.symbol} />}
    </span>
  )
}

/** Seconds left until the deadline, ticking. Null when there is no deadline. */
function useSecondsLeft(deadline: number | null): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (deadline === null) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [deadline])
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
}

function Game({ room, self, isHost, onLeave }: { room: Room; self: Self; isHost: boolean; onLeave: () => void }) {
  const play = room.play!
  const state = JSON.parse(play.state) as PinDropState
  const looks = usePlayerLooks(room, state.players)
  const secondsLeft = useSecondsLeft(state.phase === 'guessing' ? play.deadline : null)
  const send = (input: PinDropInput) => void sendInput(room.code, self.uid, input)
  const round = currentRound(state)
  const playing = state.players.includes(self.uid)

  if (!playing) {
    return (
      <>
        <PinDropTitle />
        <p className="cue-card__text">This game started before you joined. You'll be in the next one.</p>
        <button type="button" className="phone-link" data-testid="pdt-leave" onClick={onLeave}>
          Leave room
        </button>
      </>
    )
  }

  return (
    <PhoneScreen
      state={state}
      player={self.uid}
      looks={looks}
      isHost={isHost}
      onPin={(pin) => send({ type: 'pin', ...pin })}
      onLock={() => send({ type: 'lock' })}
      onFlag={() => send({ type: 'flag' })}
      onNext={() => {
        const next = rules.onTimer(state, context())
        void writePlay(room.code, next, deadlineFor(next, Date.now()))
      }}
      above={
        <>
          {secondsLeft !== null && (
            <p className="pdt-clock" role="timer" aria-live={secondsLeft <= 10 ? 'polite' : 'off'} data-testid="pdt-clock">
              {secondsLeft} s left
            </p>
          )}
          <RoundPhoto key={round.photo.id} photo={round.photo} />
        </>
      }
      summaryAction={
        <>
          {isHost && (
            <button type="button" className="phone-button" data-testid="pdt-play-again" onClick={() => void clearPlay(room.code)}>
              Play again
            </button>
          )}
          <button type="button" className="phone-link" data-testid="pdt-leave" onClick={onLeave}>
            Leave room
          </button>
        </>
      }
    />
  )
}

/** Earliest and latest a bot locks in, as a share of the round's time. */
const BOT_LOCK_SHARE: [number, number] = [0.3, 0.85]

/**
 * Bots whose moment has come drop their pin and lock in. Each bot's moment and guess come from a random
 * sequence seeded by the room, round and bot, so a host that reloads mid-round gets the same ones. Once
 * every real player has locked in, the bots don't keep them waiting.
 */
function botsMove(code: string, state: PinDropState, deadline: number | null): PinDropState {
  const round = currentRound(state)
  const waiting = state.players.filter((id) => botFor(id) && !round.locked.includes(id))
  if (waiting.length === 0 || deadline === null) return state
  const peopleDone = state.players.every((id) => botFor(id) || round.locked.includes(id))
  const roundMs = state.settings.pace * 1000
  const startedAt = deadline - roundMs
  let next = state
  for (const id of waiting) {
    const random = seededRandom(`${code}-${state.roundIndex}-${id}`)
    const [earliest, latest] = BOT_LOCK_SHARE
    const lockAt = startedAt + roundMs * (earliest + (latest - earliest) * random())
    if (!peopleDone && Date.now() < lockAt) continue
    const pin = botGuess(round.photo, botFor(id)!.skill, random)
    next = rules.onInput(next, id, { type: 'pin', ...pin }, context())
    next = rules.onInput(next, id, { type: 'lock' }, context())
  }
  return next
}

/**
 * Runs on the host's phone only: applies every player's input to the state, moves the game on when a
 * timer runs out, and writes each new state back to the room for every phone to show.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: PinDropState; deadline: number | null } | null>(null)
  const hasPlay = room.play !== null

  // Keep the newest state from the room (the host's own writes come back here too).
  useEffect(() => {
    latest.current = room.play ? { state: JSON.parse(room.play.state) as PinDropState, deadline: room.play.deadline } : null
  }, [room.play])

  useEffect(() => {
    if (!hasPlay) return

    function save(next: PinDropState, keepDeadline: boolean) {
      const current = latest.current
      if (!current || next === current.state) return
      const deadline = keepDeadline && next.phase === current.state.phase ? current.deadline : deadlineFor(next, Date.now())
      latest.current = { state: next, deadline }
      void writePlay(room.code, next, deadline)
    }

    const stopInputs = takeInputs(room.code, (by, input) => {
      const current = latest.current
      if (!current) return
      save(rules.onInput(current.state, by, input as PinDropInput, context()), true)
    })

    const timer = setInterval(() => {
      const current = latest.current
      if (!current) return
      if (current.state.phase === 'guessing') {
        const moved = botsMove(room.code, current.state, current.deadline)
        if (moved !== current.state) {
          save(moved, true)
          return
        }
      }
      if (current.deadline === null || Date.now() < current.deadline) return
      save(rules.onTimer(current.state, context()), false)
    }, 500)

    return () => {
      stopInputs()
      clearInterval(timer)
    }
  }, [hasPlay, room.code])

  return null
}
