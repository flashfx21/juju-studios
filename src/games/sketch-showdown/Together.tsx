// ABOUTME: Sketch Showdown on phones through a room: two teams, one drawer each, and each team's guessers watch only their own drawer.
// ABOUTME: The host's phone runs the game; strokes and guesses go to it as inputs, and each phone gets only its own view.
import { useEffect, useRef, useState } from 'react'
import { loadDictionary } from '../../engine/dictionary'
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
import type { PlayerId, RulesContext } from '../types'
import { Gallery } from './Gallery'
import { manifest } from './manifest'
import { PhoneScreen, SketchShowdownTitle } from './PhoneScreen'
import { botRacePlan, splitTeams } from './roomTeams'
import {
  currentRound,
  DEFAULT_SETTINGS,
  OPTIONS_PER_PICK,
  PACES,
  PICK_SECONDS,
  phaseSeconds,
  playerView,
  RACE_SECONDS,
  sketchShowdownRules,
  teamOf,
  TEAM_INDEXES,
  TURNS,
  tvView,
  type Pace,
  type Phase,
  type PlayerView,
  type SketchShowdownInput,
  type SketchShowdownSettings,
  type SketchShowdownState,
  type Stroke,
  type Turns,
  type TvView,
} from './rules'

const TURN_NAMES: Record<Turns, string> = { once: 'Draw once', twice: 'Draw twice' }
const PACE_NAMES: Record<Pace, string> = { quick: '90 s', normal: '2 min', relaxed: '3 min' }

/** Setting up deals no guesses, so it needs no word list. */
const DEALER = sketchShowdownRules(() => false)

/** Earliest and latest a bot drawer picks its clue, as a share of the pick time. */
const BOT_PICK_SHARE: [number, number] = [0.15, 0.5]

/** Moves sent to the host: the game's own, Next from the host at the reveal, or End round from the host during the race. */
type RoomInput = SketchShowdownInput | { type: 'next' } | { type: 'end' }

type Rules = ReturnType<typeof sketchShowdownRules>

/** What every phone may read from the room: the teams and where the game is. Drawings only once the game is over. */
interface SharedPlay {
  teams: [PlayerId[], PlayerId[]]
  phase: Phase
  roundNumber: number
  gallery: TvView['gallery']
}

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

function deadlineFor(state: SketchShowdownState): number | null {
  const seconds = phaseSeconds(state)
  return seconds === null ? null : Date.now() + seconds * 1000
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Sketch Showdown"
      Title={SketchShowdownTitle}
      intro="Two teams, one clue, two drawers. Each team watches only its own drawer and races to guess first. One person starts a room and reads out the code."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <SketchWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function SketchWaitingRoom({ room, isHost, onLeave }: RoomScreenProps) {
  const [settings, setSettings] = useState<SketchShowdownSettings>(DEFAULT_SETTINGS)
  const [problem, setProblem] = useState('')
  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={SketchShowdownTitle}
      minPlayers={manifest.players.min}
      onLeave={onLeave}
      onStart={(players) => {
        const split = splitTeams(players, Math.random)
        if ('problem' in split) {
          setProblem(split.problem)
          return
        }
        setProblem('')
        const state = DEALER.setup(players, settings, context(), split.teams)
        void publish(room, state, deadlineFor(state))
      }}
      settings={
        <>
          <OptionRow label="Turns" options={TURNS} names={TURN_NAMES} value={settings.turns} onChoose={(turns) => setSettings({ ...settings, turns })} />
          <OptionRow label="Pace" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(pace) => setSettings({ ...settings, pace })} />
          <p className="room-status">Teams are picked at random when the game starts. Bots can't draw, so they play as their own team.</p>
          {problem && (
            <p className="room-status" role="alert" data-testid="sst-team-problem">
              {problem}
            </p>
          )}
        </>
      }
    />
  )
}

/**
 * Host only: saves the full game where only the host can read it, gives each person their own view,
 * and puts only the teams and the phase in the room (every drawing once the game is over).
 */
async function publish(room: Room, state: SketchShowdownState, deadline: number | null): Promise<void> {
  await writeHostGame(room.code, state)
  for (const player of [...state.teams[0], ...state.teams[1]]) {
    if (!botFor(player)) await writePlayerView(room.code, player, playerView(state, player))
  }
  const shared: SharedPlay = {
    teams: state.teams,
    phase: state.phase,
    roundNumber: state.rounds.length,
    gallery: state.phase === 'over' ? tvView(state).gallery : null,
  }
  await writePlay(room.code, shared, deadline)
}

/**
 * Publishes the latest game, one write at a time. Strokes can arrive faster than a publish finishes,
 * so games waiting behind one in flight are skipped for the newest.
 */
function latestPublisher(room: () => Room) {
  let next: { state: SketchShowdownState; deadline: number | null } | null = null
  let running = false
  return (state: SketchShowdownState, deadline: number | null) => {
    next = { state, deadline }
    if (running) return
    running = true
    void (async () => {
      while (next) {
        const job = next
        next = null
        try {
          await publish(room(), job.state, job.deadline)
        } catch {
          // A failed write is retried by the next change.
        }
      }
      running = false
    })()
  }
}

/** The drawer's own strokes, drawn at once on their phone while the host catches up. Starts again each round. */
function useOwnDrawing(view: PlayerView | null) {
  const [own, setOwn] = useState<{ round: number; strokes: Stroke[] } | null>(null)
  const drawing = view?.phase === 'race' && view.role === 'drawer'
  if (!view || !drawing) return { strokes: null, change: () => {} }
  const current = own?.round === view.roundNumber ? own.strokes : (view.drawings[view.team] ?? [])
  const change = (edit: (strokes: Stroke[]) => Stroke[]) => setOwn({ round: view.roundNumber, strokes: edit(current) })
  return { strokes: current, change }
}

function Game({ room, self, isHost, onLeave }: RoomScreenProps) {
  const shared = JSON.parse(room.play!.state) as SharedPlay
  const [view, setView] = useState<PlayerView | null>(null)
  useEffect(() => watchPlayerView(room.code, self.uid, (mine) => setView(mine as PlayerView | null)), [room.code, self.uid])
  const players = [...shared.teams[0], ...shared.teams[1]]
  const looks = usePlayerLooks(room, players)
  const names = Object.fromEntries(players.map((id) => [id, looks[id]?.name ?? 'Player']))
  const secondsLeft = useSecondsLeft(room.play!.deadline)
  const own = useOwnDrawing(view)
  const send = (input: RoomInput) => void sendInput(room.code, self.uid, input)

  if (!players.includes(self.uid)) {
    return (
      <>
        <SketchShowdownTitle />
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
        <SketchShowdownTitle />
        <p className="room-status" role="status">
          Picking teams
        </p>
      </>
    )
  }

  const shown: PlayerView = own.strokes ? { ...view, drawings: view.team === 0 ? [own.strokes, null] : [null, own.strokes] } : view
  return (
    <PhoneScreen
      view={shown}
      player={self.uid}
      names={names}
      teammates={shared.teams[view.team]}
      isHost={isHost}
      secondsLeft={view.phase === 'reveal' || view.phase === 'over' ? null : secondsLeft}
      onPick={(option) => send({ type: 'pick', option })}
      onStroke={(stroke) => {
        own.change((strokes) => [...strokes, stroke])
        send({ type: 'stroke', stroke })
      }}
      onUndo={() => {
        own.change((strokes) => strokes.slice(0, -1))
        send({ type: 'undo' })
      }}
      onClear={() => {
        own.change(() => [])
        send({ type: 'clear' })
      }}
      onGuess={(text) => send({ type: 'guess', text })}
      onVote={(nominee) => send({ type: 'vote', nominee })}
      onNext={() => send({ type: 'next' })}
      raceAction={isHost && <EndRound onEnd={() => send({ type: 'end' })} />}
      summaryAction={
        <>
          {shared.gallery && <Gallery items={shared.gallery} />}
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

/** The host ends the round with nobody getting it: one tap asks, a second confirms. */
function EndRound({ onEnd }: { onEnd: () => void }) {
  const [asking, setAsking] = useState(false)
  return (
    <button
      type="button"
      className="phone-link phone-link--quiet"
      data-testid="sst-end-round"
      onClick={() => {
        if (asking) onEnd()
        setAsking(!asking)
      }}
      onBlur={() => setAsking(false)}
    >
      {asking ? 'Tap again to end the round' : 'End round'}
    </button>
  )
}

/** A random sequence for one bot on one round, so a host that reloads gets the same moments. */
function botRandom(code: string, state: SketchShowdownState, what: string): () => number {
  return seededRandom(`${code}-${state.rounds.length}-${what}`)
}

/**
 * Bots whose moment has come move: a bot drawer picks a clue, and a team of bots guesses the clue at the moment its plan
 * says (if it solves it at all). Bot drawers never draw; their team is all bots, so nobody is left watching an empty canvas.
 */
function botsMove(code: string, rules: Rules, state: SketchShowdownState, deadline: number | null): SketchShowdownState {
  const round = currentRound(state)
  const now = Date.now()
  if (state.phase === 'pick' && deadline !== null) {
    let next = state
    for (const drawer of round.drawers.filter((id) => botFor(id) && !(id in round.picks))) {
      const random = botRandom(code, state, `${drawer}-pick`)
      const [earliest, latest] = BOT_PICK_SHARE
      const pickAt = deadline - PICK_SECONDS * 1000 + PICK_SECONDS * 1000 * (earliest + (latest - earliest) * random())
      if (now < pickAt) continue
      next = rules.onInput(next, drawer, { type: 'pick', option: Math.floor(random() * OPTIONS_PER_PICK) }, context())
    }
    return next
  }
  if (state.phase === 'race' && round.winner === null && round.startedAt !== null && round.clue) {
    for (const team of TEAM_INDEXES) {
      const guessers = state.teams[team].filter((id) => id !== round.drawers[team])
      if (guessers.length === 0 || !guessers.every((id) => botFor(id))) continue
      const plan = botRacePlan(botFor(guessers[0])!.skill, botRandom(code, state, `team-${team}`))
      if (!plan.solves || now < round.startedAt + RACE_SECONDS[state.settings.pace] * 1000 * plan.share) continue
      return rules.onInput(state, guessers[0], { type: 'guess', text: round.clue.answer }, context())
    }
  }
  return state
}

/**
 * Runs on the host's phone only: applies every move, moves on when time runs out or the host taps Next or End round,
 * plays the bots, and publishes each change. After a reload it picks the full game back up from the host's save.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: SketchShowdownState; deadline: number | null } | null>(null)
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
    const push = latestPublisher(() => seen.current)

    function save(state: SketchShowdownState) {
      const current = latest.current
      if (!current || state === current.state) return
      const samePhase = state.phase === current.state.phase && state.rounds.length === current.state.rounds.length
      const deadline = samePhase ? current.deadline : deadlineFor(state)
      latest.current = { state, deadline }
      push(state, deadline)
    }

    void Promise.all([loadDictionary(), readHostGame(code)]).then(([dictionary, saved]) => {
      if (stopped || !saved) return
      const rules = sketchShowdownRules((word) => dictionary.has(word))
      latest.current = { state: saved as SketchShowdownState, deadline: seen.current.play?.deadline ?? null }

      stopInputs = takeInputs(code, (by, input) => {
        const current = latest.current
        if (!current) return
        const move = input as RoomInput
        if (move.type === 'next' || move.type === 'end') {
          const phase = move.type === 'next' ? 'reveal' : 'race'
          if (by === host && current.state.phase === phase) save(rules.onTimer(current.state, context()))
          return
        }
        if (teamOf(current.state, by) === null) return
        save(rules.onInput(current.state, by, move, context()))
      })

      timer = setInterval(() => {
        const current = latest.current
        if (!current || rules.isOver(current.state)) return
        const moved = botsMove(code, rules, current.state, current.deadline)
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
