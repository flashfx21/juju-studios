// ABOUTME: Pin Drop on phones, no TV: one player starts a room and shares its code, others join, bots can fill in.
// ABOUTME: The host's phone runs the rules and the round timer; every phone shows the photo above its own map.
import { useEffect, useRef, useState } from 'react'
import { clearPlay, sendInput, takeInputs, writePlay, type Room } from '../../engine/net/rooms'
import { seededRandom } from '../../engine/seededRandom'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { usePlayerLooks } from '../room/usePlayerLooks'
import type { RulesContext } from '../types'
import { botGuess } from './bots'
import { manifest } from './manifest'
import { RoundPhoto } from './Pieces'
import { PhoneScreen, PinDropTitle } from './PhoneScreen'
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
import './Together.css'

/** How long the reveal shows before the standings. */
const REVEAL_SECONDS = 10

const SCORING_NAMES = { match: 'Match play', stroke: 'Stroke play' }
const UNIT_NAMES = { mi: 'Miles', km: 'Kilometers' }
const PACE_NAMES = { 45: '45 s', 60: '60 s', 90: '90 s' }
const ROUND_NAMES = { 5: '5', 7: '7', 9: '9' }

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
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Pin Drop"
      Title={PinDropTitle}
      intro="Play on two or more phones, no TV. One person starts a room and reads out the code; everyone else joins with it."
    >
      {(props) => (
        <>
          {props.isHost && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <PinDropWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function PinDropWaitingRoom({ room, isHost, onLeave }: RoomScreenProps) {
  const [settings, setSettings] = useState<PinDropSettings>(DEFAULT_SETTINGS)
  const choose = <K extends keyof PinDropSettings>(key: K, value: PinDropSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }))

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={PinDropTitle}
      minPlayers={manifest.players.min}
      onLeave={onLeave}
      onStart={(players) => {
        const ctx = context()
        const state = rules.setup(players, settings, ctx)
        void writePlay(room.code, state, deadlineFor(state, ctx.now))
      }}
      settings={
        <>
          <OptionRow label="Scoring" options={SCORINGS} names={SCORING_NAMES} value={settings.scoring} onChoose={(v) => choose('scoring', v)} />
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={settings.rounds} onChoose={(v) => choose('rounds', v)} />
          <OptionRow label="Seconds" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(v) => choose('pace', v)} />
          <OptionRow label="Units" options={UNITS} names={UNIT_NAMES} value={settings.units} onChoose={(v) => choose('units', v)} />
        </>
      }
    />
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

function Game({ room, self, isHost, onLeave }: RoomScreenProps) {
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
        <button type="button" className="phone-link" data-testid="room-leave" onClick={onLeave}>
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
            <button type="button" className="phone-button" data-testid="room-play-again" onClick={() => void clearPlay(room.code)}>
              Play again
            </button>
          )}
          <button type="button" className="phone-link" data-testid="room-leave" onClick={onLeave}>
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
