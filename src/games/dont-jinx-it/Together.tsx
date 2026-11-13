// ABOUTME: Don't Jinx It on phones through a room: a rotating guesser, and everyone else writes clues on their own phone.
// ABOUTME: The host's phone runs the game; each phone gets only its own view, so the guesser's phone never receives the word.
import { useEffect, useRef, useState } from 'react'
import { loadDictionary, type Dictionary } from '../../engine/dictionary'
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
import { PLAYER_COLOR_IDS, type PlayerColorId } from '../../ui/playerColors'
import { botFor } from '../room/bots'
import { BackToLobby, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { FinishingOrder, PlayerId, RulesContext } from '../types'
import { manifest } from './manifest'
import { DontJinxItTitle, PhoneScreen } from './PhoneScreen'
import type { Seat } from './Pieces'
import { botClues, botGuess } from './roomBots'
import {
  cluesPerWriter,
  currentTurn,
  DEFAULT_SETTINGS,
  PACE_SECONDS,
  PACES,
  phaseSeconds,
  playerView,
  rules,
  SKIP_WINDOW_SECONDS,
  survivors,
  writersFor,
  type DontJinxItInput,
  type DontJinxItSettings,
  type DontJinxItState,
  type Pace,
  type Phase,
  type PlayerView,
} from './rules'

const PACE_NAMES: Record<Pace, string> = { quick: 'Quick', normal: 'Normal', relaxed: 'Relaxed' }
const LONG_GAME = ['off', 'on'] as const
const LONG_GAME_NAMES = { off: 'Once', on: 'Twice' }

/** Earliest and latest a bot sends its clues, as a share of the writing time. */
const BOT_WRITE_SHARE: [number, number] = [0.2, 0.6]
/** Earliest and latest a bot guesser answers, as a share of the guessing time. */
const BOT_GUESS_SHARE: [number, number] = [0.3, 0.6]

/** Moves sent to the host: clues, skips and guesses from players, or Next turn from the host. */
type RoomInput = DontJinxItInput | { type: 'next' }

/** What every phone may read from the room: who is playing and where the game is, never a word or a clue. */
interface SharedPlay {
  players: PlayerId[]
  phase: Phase
  turnIndex: number
  standings: FinishingOrder | null
}

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** When the current phase's timer runs out, or null once nothing is timed. */
function deadlineFor(state: DontJinxItState): number | null {
  const seconds = phaseSeconds(state)
  return seconds === null ? null : Date.now() + seconds * 1000
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Don't Jinx It"
      Title={DontJinxItTitle}
      intro="Take turns guessing a mystery word; everyone else writes a one-word clue on their own phone. One person starts a room and reads out the code."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <JinxWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function JinxWaitingRoom({ room, isHost, onLeave }: RoomScreenProps) {
  const [settings, setSettings] = useState<DontJinxItSettings>(DEFAULT_SETTINGS)
  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={DontJinxItTitle}
      minPlayers={manifest.players.min}
      onLeave={onLeave}
      onStart={(players) => {
        const state = rules.setup(players, settings, context())
        void publish(room, state, deadlineFor(state))
      }}
      settings={
        <>
          <OptionRow label="Pace" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(pace) => setSettings({ ...settings, pace })} />
          <OptionRow
            label="Everyone guesses"
            options={LONG_GAME}
            names={LONG_GAME_NAMES}
            value={settings.longGame ? 'on' : 'off'}
            onChoose={(choice) => setSettings({ ...settings, longGame: choice === 'on' })}
          />
        </>
      }
    />
  )
}

/**
 * Host only: saves the full game where only the host can read it, gives each person their own view,
 * and puts only who is playing and the phase in the room.
 */
async function publish(room: Room, state: DontJinxItState, deadline: number | null): Promise<void> {
  await writeHostGame(room.code, state)
  const now = Date.now()
  for (const player of state.players) {
    if (!botFor(player)) await writePlayerView(room.code, player, playerView(state, player, now))
  }
  const shared: SharedPlay = {
    players: [...state.players],
    phase: state.phase,
    turnIndex: state.turnIndex,
    standings: rules.isOver(state) ? rules.finishingOrder(state) : null,
  }
  await writePlay(room.code, shared, deadline)
}

/** How each player appears: people as their room entry, bots as their own look. */
function useSeats(room: Room, players: readonly PlayerId[]): Record<PlayerId, Seat> {
  const seats: Record<PlayerId, Seat> = {}
  for (const id of players) {
    const bot = botFor(id)
    const person = room.players[id]
    if (bot) seats[id] = { name: bot.look.name, color: bot.look.color }
    else {
      const color = person && PLAYER_COLOR_IDS.includes(person.color as PlayerColorId) ? (person.color as PlayerColorId) : 'silver'
      seats[id] = { name: person?.username ?? 'Player', color }
    }
  }
  return seats
}

function Game({ room, self, isHost, onLeave }: RoomScreenProps) {
  const shared = JSON.parse(room.play!.state) as SharedPlay
  const [view, setView] = useState<PlayerView | null>(null)
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  useEffect(() => watchPlayerView(room.code, self.uid, (mine) => setView(mine as PlayerView | null)), [room.code, self.uid])
  useEffect(() => {
    loadDictionary().then(setDictionary, () => setDictionary(null))
  }, [])
  const seats = useSeats(room, shared.players)
  const secondsLeft = useSecondsLeft(room.play!.deadline)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)

  if (!shared.players.includes(self.uid)) {
    return (
      <>
        <DontJinxItTitle />
        <p className="cue-card__text">This game started before you joined. You'll be in the next one.</p>
        <button type="button" className="phone-link" data-testid="room-leave" onClick={onLeave}>
          Leave room
        </button>
      </>
    )
  }

  if (!view) {
    return (
      <>
        <DontJinxItTitle />
        <p className="room-status" role="status">
          Dealing the words
        </p>
      </>
    )
  }

  const lastTurn = view.turnIndex === view.turnCount - 1
  return (
    <PhoneScreen
      view={view}
      player={self.uid}
      seats={seats}
      secondsLeft={secondsLeft}
      isKnownWord={dictionary ? (word) => dictionary.has(word) : null}
      standings={shared.standings}
      onClues={(words) => send({ type: 'clues', words })}
      onSkip={() => send({ type: 'skip' })}
      onGuess={(word) => send({ type: 'guess', word })}
      onPass={() => send({ type: 'pass' })}
      revealAction={
        isHost ? (
          <button type="button" className="phone-button" data-testid="djit-next" onClick={() => send({ type: 'next' })}>
            {lastTurn ? 'Final standings' : 'Next turn'}
          </button>
        ) : (
          <p className="room-status" role="status">
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

/** A random sequence for one bot on one turn and word, so a host that reloads gets the same moments and clues. */
function botRandom(code: string, state: DontJinxItState, id: PlayerId): () => number {
  return seededRandom(`${code}-${state.turnIndex}-${currentTurn(state).word}-${id}`)
}

/** When a bot moves: a share of the way through the phase, picked by its random sequence. */
function botMoment(deadline: number, seconds: number, [earliest, latest]: [number, number], random: () => number): number {
  return deadline - seconds * 1000 + seconds * 1000 * (earliest + (latest - earliest) * random())
}

/**
 * Bots whose moment has come move: writers send clues, a guesser answers from the surviving clues.
 * Once every person has sent their clues, bot writers go at once.
 */
function botsMove(code: string, state: DontJinxItState, deadline: number | null): DontJinxItState {
  if (deadline === null) return state
  const turn = currentTurn(state)
  if (state.phase === 'write') {
    const writers = writersFor(state, turn)
    const peopleDone = writers.every((id) => botFor(id) || id in turn.clues)
    let next = state
    for (const id of writers.filter((writer) => botFor(writer) && !(writer in turn.clues))) {
      const random = botRandom(code, state, id)
      const sendAt = botMoment(deadline, PACE_SECONDS[state.pace].write, BOT_WRITE_SHARE, random)
      if (!peopleDone && Date.now() < sendAt) continue
      const words = botClues(turn.word, cluesPerWriter(state.players.length), botFor(id)!.skill, random)
      next = rules.onInput(next, id, { type: 'clues', words }, context())
    }
    return next
  }
  const bot = botFor(turn.guesser)
  if (state.phase === 'guess' && bot) {
    const random = botRandom(code, state, turn.guesser)
    if (Date.now() < botMoment(deadline, PACE_SECONDS[state.pace].guess, BOT_GUESS_SHARE, random)) return state
    const move = botGuess(turn.word, survivors(state, turn).length, bot.skill, random)
    return rules.onInput(state, turn.guesser, move, context())
  }
  return state
}

/** True once the skip window has closed this turn, so phones should stop offering Skip word. */
function skipWindowClosed(state: DontJinxItState): boolean {
  return state.phase === 'write' && Date.now() - currentTurn(state).writeStartedAt >= SKIP_WINDOW_SECONDS * 1000
}

/**
 * Runs on the host's phone only: applies every move, moves on when time runs out or the host taps Next turn,
 * plays the bots, and publishes each change. After a reload it picks the full game back up from the host's save.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: DontJinxItState; deadline: number | null; skipClosedFor: number | null } | null>(null)
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

    function save(state: DontJinxItState) {
      const current = latest.current
      if (!current || state === current.state) return
      const samePhase = state.phase === current.state.phase && state.turnIndex === current.state.turnIndex
      const deadline = samePhase ? current.deadline : deadlineFor(state)
      latest.current = { ...current, state, deadline }
      void publish(seen.current, state, deadline)
    }

    void readHostGame(code).then((saved) => {
      if (stopped || !saved) return
      latest.current = { state: saved as DontJinxItState, deadline: seen.current.play?.deadline ?? null, skipClosedFor: null }

      stopInputs = takeInputs(code, (by, input) => {
        const current = latest.current
        if (!current) return
        const move = input as RoomInput
        if (move.type === 'next') {
          if (by === host && current.state.phase === 'reveal') save(rules.onTimer(current.state, context()))
          return
        }
        save(rules.onInput(current.state, by, move, context()))
      })

      timer = setInterval(() => {
        const current = latest.current
        if (!current || rules.isOver(current.state)) return
        const moved = botsMove(code, current.state, current.deadline)
        if (moved !== current.state) {
          save(moved)
          return
        }
        if (current.deadline !== null && Date.now() >= current.deadline) {
          save(rules.onTimer(current.state, context()))
          return
        }
        if (skipWindowClosed(current.state) && current.skipClosedFor !== current.state.turnIndex) {
          latest.current = { ...current, skipClosedFor: current.state.turnIndex }
          void publish(seen.current, current.state, current.deadline)
        }
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
