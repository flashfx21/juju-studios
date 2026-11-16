// ABOUTME: Chainword on phones through a room: everyone races the same hidden chain on their own phone, with live standings.
// ABOUTME: Only a chain code goes through the room; each phone shares word results, and its guesses once a word is done.
import { useEffect, useMemo, useRef, useState } from 'react'
import { clearPlay, startPlay, writePlay, writeProgress, type Room } from '../../engine/net/rooms'
import { sharedNow } from '../../engine/net/clock'
import { recentlyDealt, rememberDealt } from '../../engine/recentlyDealt'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { BackToLobby, PlayerDot, PracticeNote, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { EndGameEarly } from '../room/EndGameEarly'
import { isPractice, saveFinishedGame } from '../room/saveFinishedGame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { PlayerId } from '../types'
import { chainFor, freshChainCode, readChainCode } from './chainCode'
import { manifest } from './manifest'
import { ChainwordTitle, PhoneScreen, type OtherPlayer } from './PhoneScreen'
import {
  botProgress,
  chainTimeLimitMs,
  everyoneFinished,
  finishingOrderOf,
  progressOf,
  standings,
  type Progress,
} from './roomProgress'
import { CHAIN_LENGTHS, DEFAULT_SETTINGS, endGame, rules, WORD_LENGTHS, type ChainwordSettings, type ChainwordState } from './rules'
import './Playtest.css'
import './Together.css'

/** What the host writes to the room: the chain code (never the words), who plays, and when it started or was ended. */
interface ChainPlay {
  chainCode: string
  players: PlayerId[]
  startedAt: number
  endedAt: number | null
}

/** When the chain's clock runs out. */
function deadlineOf(play: ChainPlay): number {
  return play.startedAt + chainTimeLimitMs(readChainCode(play.chainCode)!.settings.chainLength)
}

/** Phones get a few seconds after the clock runs out to share their last word before the game counts as over. */
const REPORT_GRACE_MS = 5000

/**
 * When the game stopped for everyone still playing: the host's End game, or the clock running out.
 * Null while the game is still on.
 */
function stoppedAt(play: ChainPlay, now: number): number | null {
  if (play.endedAt !== null) return play.endedAt
  const deadline = deadlineOf(play)
  return now >= deadline ? deadline : null
}

/** Over once everyone has finished, or (for anyone whose phone has gone quiet) a moment after the game stopped. */
function gameOver(play: ChainPlay, shared: Record<PlayerId, Progress>, now: number): boolean {
  const stopped = stoppedAt(play, now)
  return everyoneFinished(play.players, shared) || (stopped !== null && now >= stopped + REPORT_GRACE_MS)
}

/** The shared clock, ticking once a second: every phone sees the same time left, and finish times compare fairly. */
function useNow(): number {
  const [now, setNow] = useState(() => sharedNow())
  useEffect(() => {
    const timer = setInterval(() => setNow(sharedNow()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

const WORD_LENGTH_NAMES = { 4: '4', 5: '5', 6: '6', 7: '7' }
const CHAIN_LENGTH_NAMES = { 3: '3', 5: '5' }
const HARD_MODE_NAMES = { off: 'Off', on: 'On' }

function placeText(place: number): string {
  const suffix = place % 10 === 1 && place !== 11 ? 'st' : place % 10 === 2 && place !== 12 ? 'nd' : place % 10 === 3 && place !== 13 ? 'rd' : 'th'
  return `${place}${suffix}`
}

function timeText(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Every player's shared progress, read from the room. */
function sharedProgress(room: Room): Record<PlayerId, Progress> {
  const shared: Record<PlayerId, Progress> = {}
  for (const [id, json] of Object.entries(room.progress)) {
    try {
      shared[id] = JSON.parse(json) as Progress
    } catch {
      // A garbled entry is left out.
    }
  }
  return shared
}

export function Together() {
  return (
    <RoomPage
      gameId={manifest.id}
      gameName="Chainword"
      Title={ChainwordTitle}
      intro="Race the same hidden chain on your own phones. One person starts a room and reads out the code; everyone else joins with it."
    >
      {(props) => (
        <>
          {props.isHost && props.room.play && <BotRunner room={props.room} />}
          {props.isHost && props.room.play && <ResultSaver room={props.room} />}
          {props.room.play ? <Game key={props.room.play.state} {...props} /> : <ChainwordWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function ChainwordWaitingRoom({ room, isHost }: RoomScreenProps) {
  const [settings, setSettings] = useState<ChainwordSettings>(DEFAULT_SETTINGS)

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={ChainwordTitle}
      minPlayers={manifest.players.min}
      onStart={(players) => {
        const chainCode = freshChainCode(settings, Math.random, recentlyDealt(manifest.id))
        rememberDealt(manifest.id, chainFor(chainCode))
        const play: ChainPlay = { chainCode, players, startedAt: sharedNow(), endedAt: null }
        void startPlay(room.code, play, null)
      }}
      settings={
        <>
          <p className="room-status">
            The chain has a clock: {Math.round(chainTimeLimitMs(settings.chainLength) / 60_000 * 10) / 10} minutes for {settings.chainLength} words.
          </p>
          <OptionRow
            label="Letters"
            options={WORD_LENGTHS}
            names={WORD_LENGTH_NAMES}
            value={settings.wordLength}
            onChoose={(wordLength) => setSettings({ ...settings, wordLength })}
          />
          <OptionRow
            label="Words"
            options={CHAIN_LENGTHS}
            names={CHAIN_LENGTH_NAMES}
            value={settings.chainLength}
            onChoose={(chainLength) => setSettings({ ...settings, chainLength })}
          />
          <OptionRow
            label="Hard mode"
            options={['off', 'on'] as const}
            names={HARD_MODE_NAMES}
            value={settings.hardMode ? 'on' : 'off'}
            onChoose={(choice) => setSettings({ ...settings, hardMode: choice === 'on' })}
          />
          <PracticeNote room={room} />
        </>
      }
    />
  )
}

/** This phone's own game, kept on the device so a refresh carries on where it was. */
function storageKey(code: string, chainCode: string): string {
  return `juju.chainword.${code}.${chainCode}`
}

function loadOwnGame(key: string): ChainwordState | null {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as ChainwordState) : null
  } catch {
    return null
  }
}

function saveOwnGame(key: string, state: ChainwordState) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // Storage blocked: a refresh starts this phone's chain again.
  }
}

function Game({ room, self, isHost }: RoomScreenProps) {
  const play = JSON.parse(room.play!.state) as ChainPlay
  const key = storageKey(room.code, play.chainCode)
  const playing = play.players.includes(self.uid)
  const others = useOthers(room, play, self.uid)
  const [state, setState] = useState<ChainwordState | null>(() => {
    if (!playing) return null
    const shared = readChainCode(play.chainCode)!
    return loadOwnGame(key) ?? rules.setup([self.uid], shared.settings, { now: play.startedAt, random: shared.random })
  })

  function update(next: ChainwordState) {
    setState(next)
    saveOwnGame(key, next)
    void writeProgress(room.code, self.uid, progressOf(next, self.uid))
  }

  // Share where this phone is as soon as the game opens, so the standings list it from the start.
  const shared = useRef(false)
  useEffect(() => {
    if (!state || shared.current) return
    shared.current = true
    saveOwnGame(key, state)
    void writeProgress(room.code, self.uid, progressOf(state, self.uid))
  }, [state, key, room.code, self.uid])

  // The host ended the game or the clock ran out: anyone still playing stops, with the rest of their chain counted as missed.
  const now = useNow()
  const over = gameOver(play, sharedProgress(room), now)
  const endedAt = stoppedAt(play, now)
  const endedEarly = state !== null && endedAt !== null && state.runs[self.uid].finishedAt === null
  const shown = useMemo(
    () => (state && endedEarly && endedAt !== null ? endGame(state, { now: endedAt, random: Math.random }) : state),
    [state, endedEarly, endedAt],
  )
  useEffect(() => {
    if (!endedEarly || !shown) return
    saveOwnGame(key, shown)
    void writeProgress(room.code, self.uid, progressOf(shown, self.uid))
  }, [endedEarly, shown, key, room.code, self.uid])

  if (!state || !shown) {
    return (
      <>
        <ChainwordTitle />
        <p className="cue-card__text">This game started before you joined. You'll be in the next one.</p>
      </>
    )
  }

  return (
    <>
      {isHost && play.endedAt === null && !over && (
        <EndGameEarly room={room} onSave={() => void writePlay(room.code, { ...play, endedAt: sharedNow() }, null)} />
      )}
      <PhoneScreen
        state={shown}
        player={self.uid}
        onGuess={(word) => update(rules.onInput(state, self.uid, { type: 'guess', word }, { now: sharedNow(), random: Math.random }))}
        infoLine={<InfoLine room={room} play={play} />}
        others={over ? others : undefined}
        summaryAction={<Results room={room} play={play} isHost={isHost} />}
      />
    </>
  )
}

/** The chain's clock and how many have finished. Places stay hidden until the game is over. */
function InfoLine({ room, play }: { room: Room; play: ChainPlay }) {
  const shared = sharedProgress(room)
  const finished = play.players.filter((id) => shared[id]?.finished).length
  const secondsLeft = useSecondsLeft(play.endedAt === null ? deadlineOf(play) : null)

  return (
    <p className="cwt-info" data-testid="cwt-info">
      {secondsLeft !== null && (
        <span role="timer" aria-live={secondsLeft <= 30 && secondsLeft % 10 === 0 ? 'polite' : 'off'} data-testid="cwt-clock">
          {timeText(secondsLeft * 1000)} left
        </span>
      )}
      <span role="status" data-testid="cwt-finished">
        {finished} of {play.players.length} done
      </span>
    </p>
  )
}

/** The other players' finished words, for the phone to show once this player has finished the same word. */
function useOthers(room: Room, play: ChainPlay, self: PlayerId): OtherPlayer[] {
  const looks = usePlayerLooks(room, play.players)
  const shared = sharedProgress(room)
  return play.players
    .filter((id) => id !== self)
    .map((id) => ({
      id,
      name: looks[id]?.name ?? 'Player',
      badge: looks[id] ? <PlayerDot look={looks[id]} /> : undefined,
      words: shared[id]?.words ?? [],
    }))
}

/** After your chain: who has finished while the game runs, then the final standings and the host's Play again. */
function Results({ room, play, isHost }: { room: Room; play: ChainPlay; isHost: boolean }) {
  const shared = sharedProgress(room)
  // While the game runs the list keeps the room's order, so it gives nothing away about who is ahead.
  const ranked = standings(play.players, shared)
  const looks = usePlayerLooks(room, play.players)
  const now = useNow()
  const over = gameOver(play, shared, now)

  return (
    <div className="cwt-results">
      <p className="cwt-results__heading" role="status">
        {over ? 'Final standings' : "Who's finished"}
      </p>
      <ol className="cwt-standings" aria-label={over ? 'Final standings' : "Who's finished"}>
        {(over ? ranked : [...ranked].sort((a, b) => play.players.indexOf(a.player) - play.players.indexOf(b.player))).map(({ player, place, progress }) => (
          <li key={player} className="cwt-standings__row" data-testid={`cwt-standing-${player}`}>
            {over && <span className="cwt-standings__place">{placeText(place)}</span>}
            {looks[player] && <PlayerDot look={looks[player]} />}
            <span className="cwt-standings__name">{looks[player]?.name ?? 'Player'}</span>
            <span className="cwt-standings__score">
              {!over
                ? progress.finished
                  ? 'Finished'
                  : 'Still playing'
                : progress.finished
                  ? `${progress.totalGuesses} guesses · ${timeText(progress.timeMs ?? 0)}`
                  : `word ${progress.words.length + 1} of ${readChainCode(play.chainCode)!.settings.chainLength}`}
            </span>
          </li>
        ))}
      </ol>
      {!over && <p className="cwt-results__note">Waiting for everyone to finish{isHost ? ', or end the game from the menu' : ''}.</p>}
      {over && isPractice(play.players) && <PracticeNote room={room} over />}
      {isHost && over && (
        <button type="button" className="phone-button" data-testid="room-play-again" onClick={() => void clearPlay(room.code)}>
          Play again
        </button>
      )}
      {over && <BackToLobby room={room} isHost={isHost} />}
    </div>
  )
}

/** Runs on the host's phone only: once the game is over, saves the final standings as the game's result. */
function ResultSaver({ room }: { room: Room }) {
  const play = JSON.parse(room.play!.state) as ChainPlay
  const shared = sharedProgress(room)
  const now = useNow()
  const over = gameOver(play, shared, now)
  useEffect(() => {
    if (over && !isPractice(play.players)) saveFinishedGame(room, manifest.id, finishingOrderOf(standings(play.players, shared)))
  })
  return null
}

/**
 * Runs on the host's phone only: plays the bots by sharing their progress as time passes.
 * Each bot's game is fixed by the room, chain and bot, so a host that reloads shows the same bots.
 */
function BotRunner({ room }: { room: Room }) {
  const play = JSON.parse(room.play!.state) as ChainPlay
  const chainLength = readChainCode(play.chainCode)!.settings.chainLength
  const bots = play.players.filter((id) => botFor(id))
  const written = useRef<Record<PlayerId, string>>({})

  useEffect(() => {
    if (bots.length === 0) return
    function tick() {
      for (const id of bots) {
        const stopped = play.endedAt ?? deadlineOf(play)
        const progress = botProgress(`${room.code}-${play.chainCode}-${id}`, botFor(id)!.skill, chainLength, sharedNow() - play.startedAt, stopped - play.startedAt)
        const json = JSON.stringify(progress)
        if (written.current[id] === json) continue
        written.current[id] = json
        void writeProgress(room.code, id, progress)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [room.code, play.chainCode, play.startedAt, play.endedAt, chainLength, bots.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
