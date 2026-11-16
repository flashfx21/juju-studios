// ABOUTME: Zero In on phones through a room: everyone guesses the same question on their own phone, closest wins.
// ABOUTME: The host's phone runs the game; the room shows a masked state, and each phone gets back only its own guess.
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
import { paceLabels } from '../../engine/pace'
import { recentlyDealt, rememberDealt } from '../../engine/recentlyDealt'
import { seededRandom } from '../../engine/seededRandom'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { EndGameEarly } from '../room/EndGameEarly'
import { BackToLobby, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { saveFinishedGame } from '../room/saveFinishedGame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import { PhoneScreen, ZeroInTitle } from './PhoneScreen'
import { botGuess, privateView, publicState, stateForPhone, type PrivateView } from './roomViews'
import {
  currentRound,
  DEFAULT_SETTINGS,
  LANE_CHOICES,
  PACE_SECONDS,
  PACES,
  ROUND_COUNTS,
  rules,
  type LaneChoice,
  type RoundCount,
  type ZeroInInput,
  type ZeroInSettings,
  type ZeroInState,
} from './rules'

const PACE_NAMES = paceLabels(PACE_SECONDS)
const ROUND_NAMES: Record<RoundCount, string> = { 5: '5', 10: '10', 15: '15' }
const LANE_NAMES: Record<LaneChoice, string> = { mix: 'Mix', price: 'Prices', year: 'Years', number: 'Numbers' }

/** Earliest and latest a bot locks in, as a share of the guessing time. */
const BOT_LOCK_SHARE: [number, number] = [0.3, 0.85]
/** A typed guess waits this long for the next keypress before it goes to the host as a draft. */
const DRAFT_DELAY_MS = 400

/** Moves sent to the host: a guess from anyone, or Next and End game from the host. */
type RoomInput = ZeroInInput | { type: 'next' } | { type: 'end-game' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** Guessing has the pace's clock; the reveal waits for the host's Next. */
function deadlineFor(state: ZeroInState, now: number): number | null {
  return state.phase === 'guessing' ? now + PACE_SECONDS[state.settings.pace] * 1000 : null
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Zero In"
      Title={ZeroInTitle}
      intro="Guess a price, year or number on your own phone; closest wins. One person starts a room and reads out the code."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <ZeroInWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function ZeroInWaitingRoom({ room, isHost }: RoomScreenProps) {
  const [settings, setSettings] = useState<ZeroInSettings>(DEFAULT_SETTINGS)
  const choose = <K extends keyof ZeroInSettings>(key: K, value: ZeroInSettings[K]) => setSettings({ ...settings, [key]: value })

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={ZeroInTitle}
      minPlayers={manifest.players.min}
      onStart={(players) => {
        const state = rules.setup(players, settings, { ...context(), recent: recentlyDealt(manifest.id) })
        rememberDealt(
          manifest.id,
          state.rounds.map((round) => round.question.id),
        )
        void publish(room, state, deadlineFor(state, Date.now()), true)
      }}
      settings={
        <>
          <OptionRow label="Pace" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(v) => choose('pace', v)} />
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={settings.rounds} onChoose={(v) => choose('rounds', v)} />
          <OptionRow label="Lanes" options={LANE_CHOICES} names={LANE_NAMES} value={settings.lanes} onChoose={(v) => choose('lanes', v)} />
        </>
      }
    />
  )
}

/**
 * Host only: saves the full game where only the host can read it, gives each person their own guess back,
 * and puts the masked game in the room for every phone. `starting` stamps a new game's start; a finished game is saved.
 */
async function publish(room: Room, state: ZeroInState, deadline: number | null, starting = false): Promise<void> {
  await writeHostGame(room.code, state)
  for (const player of state.players) {
    if (!botFor(player)) await writePlayerView(room.code, player, privateView(state, player))
  }
  await (starting ? startPlay : writePlay)(room.code, publicState(state), deadline)
  if (rules.isOver(state)) saveFinishedGame(room, manifest.id, rules.finishingOrder(state))
}

/** Sends the typed guess as a draft once typing pauses, so a burst of keypresses is one write. */
function useDraftSender(send: (input: RoomInput) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return {
    draft(value: number) {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => send({ type: 'draft', value }), DRAFT_DELAY_MS)
    },
    lock(value: number) {
      clearTimeout(timer.current)
      send({ type: 'lock', value })
    },
  }
}

function Game({ room, self, isHost }: RoomScreenProps) {
  const shared = JSON.parse(room.play!.state) as ZeroInState
  const [mine, setMine] = useState<PrivateView | null>(null)
  useEffect(() => watchPlayerView(room.code, self.uid, (view) => setMine(view as PrivateView | null)), [room.code, self.uid])
  const state = stateForPhone(shared, mine, self.uid)
  const looks = usePlayerLooks(room, state.players)
  const names = Object.fromEntries(state.players.map((id) => [id, looks[id]?.name ?? 'Player']))
  const secondsLeft = useSecondsLeft(state.phase === 'guessing' ? room.play!.deadline : null)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)
  const guesses = useDraftSender(send)

  if (!state.players.includes(self.uid)) {
    return (
      <>
        <ZeroInTitle />
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
        onDraft={guesses.draft}
        onLock={guesses.lock}
        onNext={() => send({ type: 'next' })}
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
 * Bots whose moment has come lock in a guess. Each bot's moment and guess come from a random sequence seeded by
 * the room, round and bot, so a host that reloads gets the same ones. Once every person has locked in, bots go at once.
 */
function botsGuess(code: string, state: ZeroInState, deadline: number | null): ZeroInState {
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
    const value = botGuess(round.question, round.final, botFor(id)!.skill, random)
    next = rules.onInput(next, id, { type: 'lock', value }, context())
  }
  return next
}

/**
 * Runs on the host's phone only: applies every guess, moves on when time runs out or the host taps Next,
 * plays the bots, and publishes each change. After a reload it picks the full game back up from the host's save.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: ZeroInState; deadline: number | null } | null>(null)
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

    function save(state: ZeroInState) {
      const current = latest.current
      if (!current || state === current.state) return
      const samePhase = state.phase === current.state.phase && state.roundIndex === current.state.roundIndex
      const deadline = samePhase ? current.deadline : deadlineFor(state, Date.now())
      latest.current = { state, deadline }
      void publish(seen.current, state, deadline)
    }

    void readHostGame(code).then((saved) => {
      if (stopped || !saved) return
      latest.current = { state: saved as ZeroInState, deadline: seen.current.play?.deadline ?? null }

      stopInputs = takeInputs(code, (by, input) => {
        const current = latest.current
        if (!current) return
        const move = input as RoomInput
        if (move.type === 'end-game') {
          if (by === host && !rules.isOver(current.state)) save({ ...current.state, phase: 'over' })
          return
        }
        if (move.type === 'next') {
          const phase = current.state.phase
          if (by === host && phase === 'reveal') save(rules.onTimer(current.state, context()))
          return
        }
        save(rules.onInput(current.state, by, move, context()))
      })

      timer = setInterval(() => {
        const current = latest.current
        if (!current || current.state.phase !== 'guessing') return
        const moved = botsGuess(code, current.state, current.deadline)
        if (moved !== current.state) {
          save(moved)
          return
        }
        if (current.deadline !== null && Date.now() >= current.deadline) save(rules.onTimer(current.state, context()))
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
