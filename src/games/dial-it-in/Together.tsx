// ABOUTME: Dial It In on phones through a room: people take turns giving the clue, everyone guesses on their own dial.
// ABOUTME: The host's phone runs the game; the room shows a masked state, and each phone gets only its own secrets.
import { useEffect, useRef, useState } from 'react'
import {
  clearPlay,
  readHostGame,
  sendInput,
  takeInputs,
  watchPlayerView,
  writeHostGame,
  writePlay,
  writePlayerView,
  type Room,
} from '../../engine/net/rooms'
import { seededRandom } from '../../engine/seededRandom'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { BackToLobby, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import { DialItInTitle, PhoneScreen } from './PhoneScreen'
import { botDialGuess, privateView, publicState, stateForPhone, type PrivateView } from './roomViews'
import {
  currentRound,
  DEFAULT_SETTINGS,
  DIAL_RANGES,
  guessersFor,
  rules,
  TURNS_EACH,
  type DialItInInput,
  type DialItInSettings,
  type DialItInState,
  type TurnsEach,
} from './rules'
import './Together.css'

/** Seconds to guess before the round reveals anyway. */
const PACES = [60, 90, 120] as const
type Pace = (typeof PACES)[number]
const PACE_NAMES: Record<Pace, string> = { 60: '60 s', 90: '90 s', 120: '2 min' }
const RANGE_NAMES = { 50: '1 to 50', 100: '1 to 100' }
const TURN_NAMES: Record<TurnsEach, string> = { 1: '1', 2: '2', 3: '3' }

/** Earliest and latest a bot locks in its guess, as a share of the guessing time. */
const BOT_GUESS_SHARE: [number, number] = [0.25, 0.7]

/** Moves sent to the host: a guess from anyone, or Next round from the host. */
type RoomInput = DialItInInput | { type: 'next' }

/** What the host writes to the room besides the masked game: how long guessing lasts. */
interface RoomGame {
  state: DialItInState
  pace: Pace
}

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Dial It In"
      Title={DialItInTitle}
      intro="Take turns giving a clue; everyone else guesses on their own dial. One person starts a room and reads out the code."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <DialWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function DialWaitingRoom({ room, isHost, onLeave }: RoomScreenProps) {
  const [settings, setSettings] = useState<DialItInSettings>(DEFAULT_SETTINGS)
  const [turnsEach, setTurnsEach] = useState<TurnsEach>(2)
  const [pace, setPace] = useState<Pace>(90)

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={DialItInTitle}
      minPlayers={manifest.players.min}
      onLeave={onLeave}
      onStart={(players) => {
        // People give the clues; bots only guess.
        const clueGivers = players.filter((id) => !botFor(id))
        const state = rules.setup(players, { ...settings, clueGivers, turnsEach }, context())
        void publish(room, { state, pace }, Date.now() + pace * 1000)
      }}
      settings={
        <>
          <OptionRow label="Range" options={DIAL_RANGES} names={RANGE_NAMES} value={settings.range} onChoose={(range) => setSettings({ ...settings, range })} />
          <OptionRow label="Turns each" options={TURNS_EACH} names={TURN_NAMES} value={turnsEach} onChoose={setTurnsEach} />
          <OptionRow label="Seconds" options={PACES} names={PACE_NAMES} value={pace} onChoose={setPace} />
        </>
      }
    />
  )
}

/**
 * Host only: saves the full game where only the host can read it, gives each person their own secrets,
 * and puts the masked game in the room for every phone.
 */
async function publish(room: Room, game: RoomGame, deadline: number | null): Promise<void> {
  await writeHostGame(room.code, game)
  for (const player of game.state.players) {
    if (!botFor(player)) await writePlayerView(room.code, player, privateView(game.state, player))
  }
  await writePlay(room.code, { state: publicState(game.state), pace: game.pace }, deadline)
}

function Game({ room, self, isHost, onLeave }: RoomScreenProps) {
  const shared = (JSON.parse(room.play!.state) as RoomGame).state
  const [mine, setMine] = useState<PrivateView | null>(null)
  useEffect(() => watchPlayerView(room.code, self.uid, (view) => setMine(view as PrivateView | null)), [room.code, self.uid])
  const state = stateForPhone(shared, mine, self.uid)
  const looks = usePlayerLooks(room, state.players)
  const names = Object.fromEntries(state.players.map((id) => [id, looks[id]?.name ?? 'Player']))
  const secondsLeft = useSecondsLeft(state.phase === 'guessing' ? room.play!.deadline : null)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)

  if (!state.players.includes(self.uid)) {
    return (
      <>
        <DialItInTitle />
        <p className="cue-card__text">This game started before you joined. You'll be in the next one.</p>
        <button type="button" className="phone-link" data-testid="room-leave" onClick={onLeave}>
          Leave room
        </button>
      </>
    )
  }

  const lastRound = state.roundIndex === state.rounds.length - 1
  return (
    <PhoneScreen
      state={state}
      player={self.uid}
      names={names}
      onGuess={(value) => send({ type: 'guess', value })}
      guessingNote={
        secondsLeft !== null && (
          <p className="diit-clock" role="timer" aria-live={secondsLeft <= 10 ? 'polite' : 'off'} data-testid="diit-clock">
            {secondsLeft} s left
          </p>
        )
      }
      revealAction={
        isHost ? (
          <button type="button" className="phone-button" data-testid="diit-next" onClick={() => send({ type: 'next' })}>
            {lastRound ? 'Final standings' : 'Next round'}
          </button>
        ) : (
          <p className="diit-wait" role="status">
            Waiting for the host
          </p>
        )
      }
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

/**
 * Bots whose moment has come lock in a guess. Each bot's moment and guess come from a random sequence seeded by
 * the room, round and bot, so a host that reloads gets the same ones. Once every person has guessed, bots go at once.
 */
function botsGuess(code: string, game: RoomGame, deadline: number | null): DialItInState {
  const { state, pace } = game
  const round = currentRound(state)
  const waiting = guessersFor(state, round).filter((id) => botFor(id) && !(id in round.guesses))
  if (waiting.length === 0 || deadline === null) return state
  const peopleDone = guessersFor(state, round).every((id) => botFor(id) || id in round.guesses)
  const startedAt = deadline - pace * 1000
  let next = state
  for (const id of waiting) {
    const random = seededRandom(`${code}-${state.roundIndex}-${id}`)
    const [earliest, latest] = BOT_GUESS_SHARE
    const guessAt = startedAt + pace * 1000 * (earliest + (latest - earliest) * random())
    if (!peopleDone && Date.now() < guessAt) continue
    const value = botDialGuess(round.target, state.range, botFor(id)!.skill, random)
    next = rules.onInput(next, id, { type: 'guess', value }, context())
  }
  return next
}

/**
 * Runs on the host's phone only: applies every guess, moves on when time runs out or the host taps Next round,
 * plays the bots, and publishes each change. After a reload it picks the full game back up from the host's save.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ game: RoomGame; deadline: number | null } | null>(null)
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

    function save(state: DialItInState) {
      const current = latest.current
      if (!current || state === current.game.state) return
      const samePhase = state.phase === current.game.state.phase && state.roundIndex === current.game.state.roundIndex
      const deadline = state.phase !== 'guessing' ? null : samePhase ? current.deadline : Date.now() + current.game.pace * 1000
      latest.current = { game: { ...current.game, state }, deadline }
      void publish(seen.current, latest.current.game, deadline)
    }

    void readHostGame(code).then((saved) => {
      if (stopped || !saved) return
      latest.current = { game: saved as RoomGame, deadline: seen.current.play?.deadline ?? null }

      stopInputs = takeInputs(code, (by, input) => {
        const current = latest.current
        if (!current) return
        const move = input as RoomInput
        if (move.type === 'next') {
          if (by === host && current.game.state.phase === 'reveal') save(rules.onTimer(current.game.state, context()))
          return
        }
        save(rules.onInput(current.game.state, by, move, context()))
      })

      timer = setInterval(() => {
        const current = latest.current
        if (!current || current.game.state.phase !== 'guessing') return
        const moved = botsGuess(code, current.game, current.deadline)
        if (moved !== current.game.state) {
          save(moved)
          return
        }
        if (current.deadline !== null && Date.now() >= current.deadline) save(rules.onTimer(current.game.state, context()))
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
