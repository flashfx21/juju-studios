// ABOUTME: Pin Drop on phones, no TV: one player starts a room and shares its code, others join, bots can fill in.
// ABOUTME: The host's phone runs the rules and the round timer; the room shows a masked game, and each phone gets back only its own pin.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  clearPlay,
  readHostGame,
  sendInput,
  startPlay,
  takeInputs,
  watchPlayerView,
  writeHostGame,
  writePlay,
  writePlayerView,
  type Room,
} from '../../engine/net/rooms'
import { recentlyDealt, rememberDealt } from '../../engine/recentlyDealt'
import { paceLabels } from '../../engine/pace'
import { seededRandom } from '../../engine/seededRandom'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { BackToLobby, PracticeNote, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { EndGameEarly } from '../room/EndGameEarly'
import { isPractice, saveFinishedGame } from '../room/saveFinishedGame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { RulesContext } from '../types'
import { botGuess } from './bots'
import { manifest } from './manifest'
import { RoundPhoto } from './Pieces'
import { PhoneScreen, PinDropTitle } from './PhoneScreen'
import { privateView, publicState, stateForPhone, type PrivateView } from './roomViews'
import {
  currentRound,
  DEFAULT_SETTINGS,
  PACE_SECONDS,
  PACES,
  ROUND_COUNTS,
  rules,
  SCORINGS,
  UNITS,
  type PinDropInput,
  type PinDropSettings,
  type PinDropState,
  type Phase,
} from './rules'

/**
 * Moves sent to the host: the game's own, or the host's Next on the reveal and the standings, or End game.
 * Each names the round (and Next the screen) it was made on, so one that arrives late changes nothing.
 */
type RoomInput = (PinDropInput & { round: number }) | { type: 'next'; round: number; phase: Phase } | { type: 'end-game' }

const SCORING_NAMES = { match: 'Match play', stroke: 'Stroke play' }
const UNIT_NAMES = { mi: 'Miles', km: 'Kilometers' }
const PACE_NAMES = paceLabels(PACE_SECONDS)
const ROUND_NAMES = { 5: '5', 7: '7', 9: '9' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** When the timer for this phase runs out: guessing uses the pace; the reveal and standings wait for the host's Next. */
function deadlineFor(state: PinDropState, now: number): number | null {
  return state.phase === 'guessing' ? now + PACE_SECONDS[state.settings.pace] * 1000 : null
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
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <PinDropWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function PinDropWaitingRoom({ room, isHost }: RoomScreenProps) {
  const [settings, setSettings] = useState<PinDropSettings>(DEFAULT_SETTINGS)
  const choose = <K extends keyof PinDropSettings>(key: K, value: PinDropSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }))

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={PinDropTitle}
      minPlayers={manifest.players.min}
      onStart={(players) => {
        const ctx = context()
        const state = rules.setup(players, settings, { ...ctx, recent: recentlyDealt(manifest.id) })
        rememberDealt(
          manifest.id,
          state.rounds.map((round) => round.photo.id),
        )
        void publish(room, state, deadlineFor(state, ctx.now), new Map(), true)
      }}
      settings={
        <>
          <OptionRow label="Scoring" options={SCORINGS} names={SCORING_NAMES} value={settings.scoring} onChoose={(v) => choose('scoring', v)} />
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={settings.rounds} onChoose={(v) => choose('rounds', v)} />
          <OptionRow label="Pace" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(v) => choose('pace', v)} />
          <OptionRow label="Units" options={UNITS} names={UNIT_NAMES} value={settings.units} onChoose={(v) => choose('units', v)} />
          <PracticeNote room={room} />
        </>
      }
    />
  )
}

/** What the room last got: each player's view and the public game, so only what changed is written again. */
type Sent = Map<string, string>
const PUBLIC = 'public game'

/**
 * Host only: saves the full game where only the host can read it, gives each person their own pin back, and puts the
 * masked game in the room for every phone. Only what changed is written. A finished game is saved unless it's practice.
 */
async function publish(room: Room, state: PinDropState, deadline: number | null, sent: Sent, starting = false): Promise<void> {
  const views = state.players.flatMap((player) => {
    if (botFor(player)) return []
    const view = JSON.stringify(privateView(state, player))
    if (sent.get(player) === view) return []
    sent.set(player, view)
    return [writePlayerView(room.code, player, JSON.parse(view))]
  })
  await Promise.all([writeHostGame(room.code, state), ...views])
  const shown = publicState(state)
  const shownKey = `${deadline} ${JSON.stringify(shown)}`
  if (starting || sent.get(PUBLIC) !== shownKey) {
    sent.set(PUBLIC, shownKey)
    await (starting ? startPlay : writePlay)(room.code, shown, deadline)
  }
  if (rules.isOver(state) && !isPractice(state.players)) saveFinishedGame(room, manifest.id, rules.finishingOrder(state))
}

function Game({ room, self, isHost }: RoomScreenProps) {
  const play = room.play!
  const shared = useMemo(() => JSON.parse(play.state) as PinDropState, [play.state])
  const [mine, setMine] = useState<PrivateView | null>(null)
  useEffect(() => watchPlayerView(room.code, self.uid, (view) => setMine(view as PrivateView | null)), [room.code, self.uid])
  const state = useMemo(() => stateForPhone(shared, mine, self.uid), [shared, mine, self.uid])
  const looks = usePlayerLooks(room, state.players)
  const secondsLeft = useSecondsLeft(state.phase === 'guessing' ? play.deadline : null)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)
  const round = state.roundIndex
  const photo = currentRound(state).photo
  const playing = state.players.includes(self.uid)

  if (!playing) {
    return (
      <>
        <PinDropTitle />
        <p className="cue-card__text">This game started before you joined. You'll be in the next one.</p>
      </>
    )
  }

  return (
    <>
      {isHost && state.phase !== 'over' && <EndGameEarly room={room} onSave={() => send({ type: 'end-game' })} />}
      <PhoneScreen
        state={state}
        player={self.uid}
        looks={looks}
        isHost={isHost}
        secondsLeft={secondsLeft}
        onPin={(pin) => send({ type: 'pin', round, ...pin })}
        onLock={(pin) => send({ type: 'lock', round, ...pin })}
        onFlag={() => send({ type: 'flag', round })}
        onNext={() => send({ type: 'next', round, phase: state.phase })}
        above={<RoundPhoto key={photo.id} photo={photo} />}
        summaryAction={
          <>
            {isPractice(state.players) && <PracticeNote room={room} over />}
            {isHost && (
              <button type="button" className="phone-button" data-testid="room-play-again" onClick={() => void clearPlay(room.code)}>
                Play again
              </button>
            )}
            <BackToLobby room={room} isHost={isHost} />
          </>
        }
      />
    </>
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
  const roundMs = PACE_SECONDS[state.settings.pace] * 1000
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
 * timer runs out, and publishes each new state. It reads the full game from the host's save once when the
 * game starts (or the host reloads) and keeps its own copy after that, so an input is never applied to a
 * state the room hasn't caught up on yet.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: PinDropState; deadline: number | null } | null>(null)
  // The room as last seen: where the runner picks the deadline up, and what a saved result is filed under.
  const seen = useRef(room)
  useEffect(() => {
    seen.current = room
  }, [room])
  const hasPlay = room.play !== null
  const { code, host } = room

  useEffect(() => {
    if (!hasPlay) return
    let stopped = false
    let stopInputs = () => {}
    let timer: ReturnType<typeof setInterval> | undefined
    const sent: Sent = new Map()

    function save(next: PinDropState, keepDeadline: boolean) {
      const current = latest.current
      if (!current || next === current.state) return
      const samePhase = next.phase === current.state.phase && next.roundIndex === current.state.roundIndex
      const deadline = keepDeadline && samePhase ? current.deadline : deadlineFor(next, Date.now())
      latest.current = { state: next, deadline }
      publish(seen.current, next, deadline, sent).catch((error) => console.error('Publishing the game failed', error))
    }

    void readHostGame(code).then((saved) => {
      if (stopped || !saved) return
      latest.current = { state: saved as PinDropState, deadline: seen.current.play?.deadline ?? null }

      stopInputs = takeInputs(code, (by, input) => {
        const current = latest.current
        if (!current) return
        const move = input as RoomInput
        if (move.type === 'end-game') {
          if (by === host && !rules.isOver(current.state)) save({ ...current.state, phase: 'over' }, false)
          return
        }
        if (move.round !== current.state.roundIndex) return
        if (move.type === 'next') {
          const phase = current.state.phase
          if (by === host && move.phase === phase && (phase === 'reveal' || phase === 'standings')) save(rules.onTimer(current.state, context()), false)
          return
        }
        save(rules.onInput(current.state, by, move, context()), true)
      })

      timer = setInterval(() => {
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
    })

    return () => {
      stopped = true
      stopInputs()
      if (timer) clearInterval(timer)
    }
  }, [hasPlay, code, host])

  return null
}
