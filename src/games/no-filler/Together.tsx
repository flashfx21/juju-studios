// ABOUTME: No Filler on phones through a room: the speaker picks and talks, everyone else votes Clean or Filler on their own phone.
// ABOUTME: The host's phone runs the game; the room shows a masked state (no piles, no votes before the verdict) and each phone gets back only its own vote.
import { useEffect, useRef, useState } from 'react'
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
import { OptionRow } from '../../ui/OptionRow'
import { EndGameEarly } from '../room/EndGameEarly'
import { BackToLobby, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { isPractice, saveFinishedGame } from '../room/saveFinishedGame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import { NoFillerTitle, PhoneScreen } from './PhoneScreen'
import { privateView, publicState, stateForPhone, type PrivateView } from './roomViews'
import {
  DEFAULT_SETTINGS,
  hostedBy,
  REVEAL_SECONDS,
  rules,
  TARGET_SCORES,
  TIMER_SECONDS,
  VOTE_SECONDS,
  type NoFillerInput,
  type NoFillerSettings,
  type NoFillerState,
  type Phase,
  type TargetScore,
  type TimerSeconds,
} from './rules'

const TIMER_NAMES: Record<TimerSeconds, string> = { 5: '5 s', 10: '10 s', 15: '15 s' }
const TARGET_NAMES: Record<TargetScore, string> = { 10: '10 points', 15: '15 points' }

/** Moves sent to the host: a player's pick, Done and vote, or the host's Void turn, Skip turn and End game. */
type RoomInput = NoFillerInput | { type: 'end-game' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** The pick isn't timed: the speaker flips the card when they're ready. */
function secondsFor(state: NoFillerState): number | null {
  const seconds: Partial<Record<Phase, number>> = {
    speak: state.settings.timer,
    vote: VOTE_SECONDS,
    reveal: REVEAL_SECONDS,
  }
  return seconds[state.phase] ?? null
}

function deadlineFor(state: NoFillerState, now: number): number | null {
  const seconds = secondsFor(state)
  return seconds === null ? null : now + seconds * 1000
}

/** A new step of a turn starts a new clock. */
function stepOf(state: NoFillerState): string {
  return `${state.turnCount}-${state.phase}`
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="No Filler"
      Title={NoFillerTitle}
      intro="Name 3 out loud with no um, uh, er or like; everyone else votes on their phone. One person starts a room and reads out the code."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <NoFillerWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function NoFillerWaitingRoom({ room, isHost }: RoomScreenProps) {
  const [settings, setSettings] = useState<NoFillerSettings>(DEFAULT_SETTINGS)
  const choose = <K extends keyof NoFillerSettings>(key: K, value: NoFillerSettings[K]) => setSettings({ ...settings, [key]: value })

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={NoFillerTitle}
      minPlayers={manifest.players.min}
      bots={false}
      onStart={(players) => {
        const dealt = rules.setup(players, settings, { ...context(), recent: recentlyDealt(manifest.id) })
        const state = hostedBy(dealt, room.host)
        void publish(room, state, deadlineFor(state, Date.now()), new Map(), true)
      }}
      settings={
        <>
          <OptionRow label="Timer" options={TIMER_SECONDS} names={TIMER_NAMES} value={settings.timer} onChoose={(v) => choose('timer', v)} />
          <OptionRow label="Target" options={TARGET_SCORES} names={TARGET_NAMES} value={settings.target} onChoose={(v) => choose('target', v)} />
        </>
      }
    />
  )
}

/**
 * Host only: saves the full game where only the host can read it, gives each person their own view back, and puts
 * the masked game in the room for every phone and the TV. Views are written only when they change (`sent` remembers
 * the last one per player). A finished game is saved unless it's practice.
 */
async function publish(room: Room, state: NoFillerState, deadline: number | null, sent: Map<string, string>, starting = false): Promise<void> {
  const views = state.players.flatMap((player) => {
    const view = JSON.stringify(privateView(state, player))
    if (sent.get(player) === view) return []
    sent.set(player, view)
    return [writePlayerView(room.code, player, JSON.parse(view))]
  })
  await Promise.all([writeHostGame(room.code, state), ...views])
  await (starting ? startPlay : writePlay)(room.code, publicState(state), deadline)
  if (rules.isOver(state) && !isPractice(state.players)) saveFinishedGame(room, manifest.id, rules.finishingOrder(state))
}

function Game({ room, self, isHost }: RoomScreenProps) {
  const shared = JSON.parse(room.play!.state) as NoFillerState
  const [mine, setMine] = useState<PrivateView | null>(null)
  useEffect(() => watchPlayerView(room.code, self.uid, (view) => setMine(view as PrivateView | null)), [room.code, self.uid])
  const state = stateForPhone(shared, mine, self.uid)
  const looks = usePlayerLooks(room, state.players)
  const names = Object.fromEntries(state.players.map((id) => [id, looks[id]?.name ?? 'Player']))
  const secondsLeft = useSecondsLeft(room.play!.deadline)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)

  if (!state.players.includes(self.uid)) {
    return (
      <>
        <NoFillerTitle />
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
        names={names}
        isHost={isHost}
        secondsLeft={secondsLeft}
        onInput={send}
        summaryAction={
          <>
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

/**
 * Runs on the host's phone only: applies every move in the order it arrives, moves on when each step's time runs out,
 * takes the host's Void turn, Skip turn and End game, and publishes each change. Each card dealt is remembered on this
 * phone so later games deal the others first. After a reload it picks the full game back up from the host's save.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: NoFillerState; deadline: number | null } | null>(null)
  // The room as last seen, for picking the game back up after a reload without restarting on every change.
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
    const sent = new Map<string, string>()

    function save(state: NoFillerState) {
      const current = latest.current
      if (!current || state === current.state) return
      const deadline = stepOf(state) === stepOf(current.state) ? current.deadline : deadlineFor(state, Date.now())
      const card = state.turn.card
      if (card && card.id !== current.state.turn.card?.id) rememberDealt(manifest.id, [card.id])
      latest.current = { state, deadline }
      void publish(seen.current, state, deadline, sent)
    }

    void readHostGame(code).then((saved) => {
      if (stopped || !saved) return
      latest.current = {
        // The room's host is the one whose Void turn and Skip turn count, also after the room changes hands.
        state: hostedBy(saved as NoFillerState, host),
        deadline: seen.current.play?.deadline ?? null,
      }

      stopInputs = takeInputs(code, (by, input) => {
        const current = latest.current
        if (!current) return
        const move = input as RoomInput
        if (move.type === 'end-game') {
          if (by === host && !rules.isOver(current.state)) save({ ...current.state, phase: 'over' })
          return
        }
        save(rules.onInput(current.state, by, move, context()))
      })

      timer = setInterval(() => {
        const current = latest.current
        if (!current || current.deadline === null || Date.now() < current.deadline) return
        save(rules.onTimer(current.state, context()))
      }, 250)
    })

    return () => {
      stopped = true
      stopInputs()
      if (timer) clearInterval(timer)
    }
  }, [hasPlay, code, host])

  return null
}
