// ABOUTME: Chainword on phones through a room: everyone races the same hidden chain on their own phone, with live standings.
// ABOUTME: Only a chain code goes through the room, never the words; each phone shares word results and guess counts.
import { useEffect, useMemo, useRef, useState } from 'react'
import { clearPlay, writePlay, writeProgress, type Room } from '../../engine/net/rooms'
import { OptionRow } from '../../ui/OptionRow'
import { botFor } from '../room/bots'
import { PlayerDot, RoomPage, WaitingRoom, type RoomScreenProps } from '../room/RoomPage'
import { usePlayerLooks } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { makeChainCode, readChainCode } from './chainCode'
import { manifest } from './manifest'
import { ChainwordTitle, PhoneScreen } from './PhoneScreen'
import { botProgress, everyoneFinished, progressOf, standings, type Progress } from './roomProgress'
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
          {props.room.play ? <Game key={props.room.play.state} {...props} /> : <ChainwordWaitingRoom {...props} />}
        </>
      )}
    </RoomPage>
  )
}

function ChainwordWaitingRoom({ room, isHost, onLeave }: RoomScreenProps) {
  const [settings, setSettings] = useState<ChainwordSettings>(DEFAULT_SETTINGS)

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      Title={ChainwordTitle}
      minPlayers={manifest.players.min}
      onLeave={onLeave}
      onStart={(players) => {
        const play: ChainPlay = { chainCode: makeChainCode(settings, Math.random), players, startedAt: Date.now(), endedAt: null }
        void writePlay(room.code, play, null)
      }}
      settings={
        <>
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

function Game({ room, self, isHost, onLeave }: RoomScreenProps) {
  const play = JSON.parse(room.play!.state) as ChainPlay
  const key = storageKey(room.code, play.chainCode)
  const playing = play.players.includes(self.uid)
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

  // The host ended the game: anyone still playing stops, with the rest of their chain counted as missed.
  const endedAt = play.endedAt
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
        <button type="button" className="phone-link" data-testid="room-leave" onClick={onLeave}>
          Leave room
        </button>
      </>
    )
  }

  return (
    <PhoneScreen
      state={shown}
      player={self.uid}
      onGuess={(word) => update(rules.onInput(state, self.uid, { type: 'guess', word }, { now: Date.now(), random: Math.random }))}
      topAction={<TopBar room={room} play={play} self={self.uid} isHost={isHost} />}
      summaryAction={<Results room={room} play={play} isHost={isHost} onLeave={onLeave} />}
    />
  )
}

/** While playing: your place so far, and for the host, End game (a second tap confirms). */
function TopBar({ room, play, self, isHost }: { room: Room; play: ChainPlay; self: PlayerId; isHost: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const table = standings(play.players, sharedProgress(room))
  const mine = table.find((row) => row.player === self)

  return (
    <>
      {mine && (
        <span className="cwt-place" data-testid="cwt-place">
          {placeText(mine.place)} of {table.length}
        </span>
      )}
      {isHost && play.endedAt === null && (
        <button
          type="button"
          className="cw-playing__end"
          data-testid="cwt-end"
          onClick={() => {
            if (!confirming) {
              setConfirming(true)
              return
            }
            void writePlay(room.code, { ...play, endedAt: Date.now() }, null)
          }}
          onBlur={() => setConfirming(false)}
        >
          {confirming ? 'Tap again to end' : 'End game'}
        </button>
      )}
    </>
  )
}

/** After your chain: everyone's standing, live until the last player finishes, then the host's Play again. */
function Results({ room, play, isHost, onLeave }: { room: Room; play: ChainPlay; isHost: boolean; onLeave: () => void }) {
  const shared = sharedProgress(room)
  const table = standings(play.players, shared)
  const looks = usePlayerLooks(room, play.players)
  const over = everyoneFinished(play.players, shared)

  return (
    <div className="cwt-results">
      <p className="cwt-results__heading" role="status">
        {over ? 'Final standings' : 'Standings so far'}
      </p>
      <ol className="cwt-standings" aria-label={over ? 'Final standings' : 'Standings so far'}>
        {table.map(({ player, place, progress }) => (
          <li key={player} className="cwt-standings__row" data-testid={`cwt-standing-${player}`}>
            <span className="cwt-standings__place">{placeText(place)}</span>
            {looks[player] && <PlayerDot look={looks[player]} />}
            <span className="cwt-standings__name">{looks[player]?.name ?? 'Player'}</span>
            <span className="cwt-standings__score">
              {progress.finished
                ? `${progress.totalGuesses} guesses · ${timeText(progress.timeMs ?? 0)}`
                : `word ${progress.words.length + 1} of ${readChainCode(play.chainCode)!.settings.chainLength}`}
            </span>
          </li>
        ))}
      </ol>
      {!over && <p className="cwt-results__note">Waiting for everyone to finish{isHost ? ', or end the game from the top bar' : ''}.</p>}
      {isHost && over && (
        <button type="button" className="phone-button" data-testid="room-play-again" onClick={() => void clearPlay(room.code)}>
          Play again
        </button>
      )}
      <button type="button" className="phone-link" data-testid="room-leave" onClick={onLeave}>
        Leave room
      </button>
    </div>
  )
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
        const progress = botProgress(`${room.code}-${play.chainCode}-${id}`, botFor(id)!.skill, chainLength, Date.now() - play.startedAt, play.endedAt === null ? null : play.endedAt - play.startedAt)
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
