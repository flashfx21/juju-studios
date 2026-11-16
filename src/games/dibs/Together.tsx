// ABOUTME: Dibs on phones through a room: everyone races the same category and letter on their own phone, first claim keeps it.
// ABOUTME: The host's phone runs the game; the room shows a masked state, and each phone gets back only its own answer, Taken note and vote.
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
import { OptionRow } from '../../ui/OptionRow'
import { EndGameEarly } from '../room/EndGameEarly'
import { BackToLobby, PracticeNote, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { isPractice, saveFinishedGame } from '../room/saveFinishedGame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import { DibsTitle, PhoneScreen } from './PhoneScreen'
import { privateView, publicState, stateForPhone, type PrivateView } from './roomViews'
import {
  CATEGORY_CHOICES,
  CATEGORY_SECONDS,
  currentRound,
  dealAgain,
  DEFAULT_SETTINGS,
  PACE_SECONDS,
  PACES,
  REVIEW_SECONDS,
  ROUND_COUNTS,
  rules,
  VERDICT_SECONDS,
  VOTE_SECONDS,
  type CategoryChoice,
  type DibsInput,
  type DibsSettings,
  type DibsState,
  type Phase,
  type RoundCount,
} from './rules'

const PACE_NAMES = paceLabels(PACE_SECONDS)
const ROUND_NAMES: Record<RoundCount, string> = { 5: '5', 7: '7', 9: '9' }
const CATEGORY_NAMES: Record<CategoryChoice, string> = {
  family: 'Family only',
  everything: 'Everything',
}

/** Moves sent to the host: a player's race, challenge and vote moves, or the host's Next, Deal again and End game. */
type RoomInput = DibsInput | { type: 'next' } | { type: 'deal-again' } | { type: 'end-game' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

function secondsFor(state: DibsState): number | null {
  const seconds: Partial<Record<Phase, number>> = {
    category: CATEGORY_SECONDS,
    race: PACE_SECONDS[state.settings.pace],
    review: REVIEW_SECONDS,
    vote: VOTE_SECONDS,
    verdict: VERDICT_SECONDS,
  }
  return seconds[state.phase] ?? null
}

function deadlineFor(state: DibsState, now: number): number | null {
  const seconds = secondsFor(state)
  return seconds === null ? null : now + seconds * 1000
}

/** A new step, or a new letter, starts a new clock. */
function stepOf(state: DibsState): string {
  const round = currentRound(state)
  return `${state.roundIndex}-${state.phase}-${round.voteIndex}-${round.letter}`
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Dibs"
      Title={DibsTitle}
      intro="A category, then a letter: race to claim an answer on your own phone. One person starts a room and reads out the code."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <HostRunner room={props.room} />}
          {props.room.play ? <Game {...props} /> : <DibsWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function DibsWaitingRoom({ room, isHost }: RoomScreenProps) {
  const [settings, setSettings] = useState<DibsSettings>(DEFAULT_SETTINGS)
  const choose = <K extends keyof DibsSettings>(key: K, value: DibsSettings[K]) => setSettings({ ...settings, [key]: value })

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={DibsTitle}
      minPlayers={manifest.players.min}
      bots={false}
      onStart={(players) => {
        const state = rules.setup(players, settings, {
          ...context(),
          recent: recentlyDealt(manifest.id),
        })
        rememberDealt(
          manifest.id,
          state.rounds.map((round) => round.category.id),
        )
        void publish(room, state, deadlineFor(state, Date.now()), new Map(), true)
      }}
      settings={
        <>
          <OptionRow label="Pace" options={PACES} names={PACE_NAMES} value={settings.pace} onChoose={(v) => choose('pace', v)} />
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={settings.rounds} onChoose={(v) => choose('rounds', v)} />
          <OptionRow
            label="Categories"
            options={CATEGORY_CHOICES}
            names={CATEGORY_NAMES}
            value={settings.categories}
            onChoose={(v) => choose('categories', v)}
          />
          <PracticeNote room={room} />
        </>
      }
    />
  )
}

/**
 * Host only: saves the full game where only the host can read it, gives each person their own view back, and puts
 * the masked game in the room for every phone. Views are written only when they change (`sent` remembers the last
 * one per player), all at once, so a Taken reaches the phone as fast as it can. A finished game is saved unless it's practice.
 */
async function publish(room: Room, state: DibsState, deadline: number | null, sent: Map<string, string>, starting = false): Promise<void> {
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
  const shared = JSON.parse(room.play!.state) as DibsState
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
        <DibsTitle />
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
        onDealAgain={() => send({ type: 'deal-again' })}
        onNext={() => send({ type: 'next' })}
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

/**
 * Runs on the host's phone only: applies every move in the order it arrives (so claim times are the host's), moves on
 * when each step's time runs out, takes the host's Next and Deal again, and publishes each change.
 * After a reload it picks the full game back up from the host's save.
 */
function HostRunner({ room }: { room: Room }) {
  const latest = useRef<{ state: DibsState; deadline: number | null } | null>(null)
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

    function save(state: DibsState) {
      const current = latest.current
      if (!current || state === current.state) return
      const deadline = stepOf(state) === stepOf(current.state) ? current.deadline : deadlineFor(state, Date.now())
      latest.current = { state, deadline }
      void publish(seen.current, state, deadline, sent)
    }

    void readHostGame(code).then((saved) => {
      if (stopped || !saved) return
      latest.current = {
        state: saved as DibsState,
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
        if (move.type === 'next') {
          if (by === host && current.state.phase === 'scores') save(rules.onTimer(current.state, context()))
          return
        }
        if (move.type === 'deal-again') {
          if (by === host) save(dealAgain(current.state, context()))
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
