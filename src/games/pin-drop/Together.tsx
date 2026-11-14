// ABOUTME: Pin Drop on phones, no TV: one player starts a room and shares its code, others join, bots can fill in.
// ABOUTME: The host's phone runs the rules and the round timer; every phone shows the photo above its own map.
import { useEffect, useRef, useState } from 'react'
import { clearPlay, sendInput, startPlay, takeInputs, writePlay, type Room } from '../../engine/net/rooms'
import { seededRandom } from '../../engine/seededRandom'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { BackToLobby, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { saveFinishedGame } from '../room/saveFinishedGame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
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

/** Moves sent to the host: the game's own, or the host's Next on the reveal and the standings. */
type RoomInput = PinDropInput | { type: 'next' }

const SCORING_NAMES = { match: 'Match play', stroke: 'Stroke play' }
const UNIT_NAMES = { mi: 'Miles', km: 'Kilometers' }
const PACE_NAMES = { 45: '45 s', 60: '60 s', 90: '90 s' }
const ROUND_NAMES = { 5: '5', 7: '7', 9: '9' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** When the timer for this phase runs out: guessing uses the pace; the reveal and standings wait for the host's Next. */
function deadlineFor(state: PinDropState, now: number): number | null {
  return state.phase === 'guessing' ? now + state.settings.pace * 1000 : null
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
        void startPlay(room.code, state, deadlineFor(state, ctx.now))
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

function Game({ room, self, isHost, onLeave }: RoomScreenProps) {
  const play = room.play!
  const state = JSON.parse(play.state) as PinDropState
  const looks = usePlayerLooks(room, state.players)
  const secondsLeft = useSecondsLeft(state.phase === 'guessing' ? play.deadline : null)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)
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
      secondsLeft={secondsLeft}
      onPin={(pin) => send({ type: 'pin', ...pin })}
      onLock={(pin) => send({ type: 'lock', ...pin })}
      onFlag={() => send({ type: 'flag' })}
      onNext={() => send({ type: 'next' })}
      above={<RoundPhoto key={round.photo.id} photo={round.photo} />}
      summaryAction={
        <>
          {isHost && (
            <button type="button" className="phone-button" data-testid="room-play-again" onClick={() => void clearPlay(room.code)}>
              Play again
            </button>
          )}
          <BackToLobby room={room} isHost={isHost} />
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
 * timer runs out, and writes each new state back to the room for every phone to show. It reads the game
 * from the room once when the game starts (or the host reloads) and keeps its own copy after that, so an
 * input is never applied to a state the room hasn't caught up on yet.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: PinDropState; deadline: number | null } | null>(null)
  // The room as last seen: where the runner picks the game up, and what a saved result is filed under.
  const seen = useRef(room)
  useEffect(() => {
    seen.current = room
  }, [room])
  const hasPlay = room.play !== null
  const { code, host } = room

  useEffect(() => {
    if (!hasPlay) return
    const play = seen.current.play
    latest.current = play ? { state: JSON.parse(play.state) as PinDropState, deadline: play.deadline } : null

    function save(next: PinDropState, keepDeadline: boolean) {
      const current = latest.current
      if (!current || next === current.state) return
      const samePhase = next.phase === current.state.phase && next.roundIndex === current.state.roundIndex
      const deadline = keepDeadline && samePhase ? current.deadline : deadlineFor(next, Date.now())
      latest.current = { state: next, deadline }
      void writePlay(code, next, deadline)
      if (rules.isOver(next)) saveFinishedGame(seen.current, manifest.id, rules.finishingOrder(next))
    }

    const stopInputs = takeInputs(code, (by, input) => {
      const current = latest.current
      if (!current) return
      const move = input as RoomInput
      if (move.type === 'next') {
        const phase = current.state.phase
        if (by === host && (phase === 'reveal' || phase === 'standings')) save(rules.onTimer(current.state, context()), false)
        return
      }
      save(rules.onInput(current.state, by, move, context()), true)
    })

    const timer = setInterval(() => {
      const current = latest.current
      if (!current) return
      if (current.state.phase === 'guessing') {
        const moved = botsMove(code, current.state, current.deadline)
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
  }, [hasPlay, code, host])

  return null
}
