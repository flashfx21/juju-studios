// ABOUTME: Don't Jinx It interface playtest: you plus bots, no room or server, for checking the screens.
// ABOUTME: On a phone it shows your phone; in a TV-shaped window it shows the TV, your phone and the dev box side by side.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { loadDictionary, type Dictionary } from '../../engine/dictionary'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { useScreenKind } from '../../ui/useScreenKind'
import type { PlayerId, RulesContext } from '../types'
import { Instructions } from './Instructions'
import { DontJinxItTitle, PhoneScreen } from './PhoneScreen'
import type { Seat } from './Pieces'
import {
  clueProblems,
  cluesPerWriter,
  currentTurn,
  DEFAULT_SETTINGS,
  phaseSeconds,
  playerView,
  rules,
  tvView,
  writersFor,
  type DontJinxItInput,
  type DontJinxItSettings,
  type DontJinxItState,
} from './rules'
import { TvScreen } from './TvScreen'
import '../../ui/PhoneForm.css'
import './Playtest.css'

const YOU = 'you'

/** You first, so you guess on turn 1 and write on every turn after. */
const SEATS: Record<PlayerId, Seat> = {
  you: { name: 'You', color: 'gold' },
  'bot-a': { name: 'Bot A', color: 'red' },
  'bot-b': { name: 'Bot B', color: 'teal' },
  'bot-c': { name: 'Bot C', color: 'blue' },
  'bot-d': { name: 'Bot D', color: 'pink' },
  'bot-e': { name: 'Bot E', color: 'olive' },
  'bot-f': { name: 'Bot F', color: 'red' },
}

const PLAYER_COUNTS = [3, 5, 7]

/** A short list of everyday words, so bots dealt clues at random often jinx each other. */
const BOT_CLUE_WORDS = ['fun', 'big', 'hot', 'cold', 'water', 'food', 'home', 'happy', 'loud', 'green', 'fast', 'summer']

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** Random everyday words that pass the clue checks for this mystery word. */
function dealBotClues(count: number, word: string): string[] {
  const allowed = BOT_CLUE_WORDS.filter((clue) => clueProblems([clue], word)[0] === null)
  const picks: string[] = []
  while (picks.length < count && picks.length < allowed.length) {
    const clue = allowed[Math.floor(Math.random() * allowed.length)]
    if (!picks.includes(clue)) picks.push(clue)
  }
  return picks
}

interface Play {
  game: DontJinxItState
  /** When the current phase began, for the countdown. */
  phaseStartedAt: number
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])
  return now
}

const STAGE_WIDTH = 1280
const STAGE_HEIGHT = 720

/** The 1280x720 TV screen scaled to fill its box, for the side-by-side desk view. */
function TvPreview({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useEffect(() => {
    const element = box.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="dji-desk__tv" ref={box}>
      <div className="dji-desk__stage" style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}>
        <div
          className="dji-desk__screen"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function Playtest() {
  const [play, setPlay] = useState<Play | null>(null)
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [settings, setSettings] = useState<DontJinxItSettings>(DEFAULT_SETTINGS)
  const [playerCount, setPlayerCount] = useState(5)
  const now = useNow()
  const screen = useScreenKind()

  useEffect(() => {
    loadDictionary().then(setDictionary, () => setDictionary(null))
  }, [])

  function apply(next: DontJinxItState) {
    setPlay((previous) => {
      if (!previous) return previous
      const newPhase = next.phase !== previous.game.phase || next.turnIndex !== previous.game.turnIndex
      return { game: next, phaseStartedAt: newPhase ? Date.now() : previous.phaseStartedAt }
    })
  }

  function start(count: number, chosen: DontJinxItSettings) {
    const players = Object.keys(SEATS).slice(0, count)
    setPlay({ game: rules.setup(players, chosen, context()), phaseStartedAt: Date.now() })
  }

  if (!play && screen === 'tv') {
    return (
      <main className="dji-desk" aria-label="Don't Jinx It playtest">
        <TvPreview>
          <Instructions
            playerCount={playerCount}
            settings={settings}
            onChange={setSettings}
            onStart={() => start(playerCount, settings)}
          />
        </TvPreview>
        <div className="dji-desk__side">
          <div className="dji-desk__phone">
            <DontJinxItTitle />
            <p className="cue-card__text">Interface test: you plus bots. Set the game up on the TV, then Start game.</p>
          </div>
          <section className="dji-dev" aria-label="Playtest controls">
            <h2 className="dji-dev__heading">Dev · players</h2>
            <div className="dji-dev__buttons">
              {PLAYER_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className="dji-dev__button"
                  aria-pressed={count === playerCount}
                  data-testid={`dji-dev-players-${count}`}
                  onClick={() => setPlayerCount(count)}
                >
                  {count} players
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (!play) {
    return (
      <PhoneFrame label="Don't Jinx It playtest" cardTag="Playtest">
        <Start onStart={(count) => start(count, DEFAULT_SETTINGS)} />
      </PhoneFrame>
    )
  }

  const { game, phaseStartedAt } = play
  const seconds = phaseSeconds(game)
  const secondsLeft = seconds === null ? null : Math.max(0, seconds - Math.floor((now - phaseStartedAt) / 1000))
  const send = (input: DontJinxItInput) => apply(rules.onInput(game, YOU, input, context()))
  const timeUp = () => apply(rules.onTimer(game, context()))

  const phone = (
    <PhoneScreen
        view={playerView(game, YOU, now)}
        player={YOU}
        seats={SEATS}
        secondsLeft={secondsLeft}
        isKnownWord={dictionary ? (word) => dictionary.has(word) : null}
        standings={rules.isOver(game) ? rules.finishingOrder(game) : null}
        onClues={(words) => send({ type: 'clues', words })}
        onSkip={() => send({ type: 'skip' })}
        onGuess={(word) => send({ type: 'guess', word })}
        onPass={() => send({ type: 'pass' })}
        summaryAction={
          <button type="button" className="phone-button" data-testid="dji-play-again" onClick={() => setPlay(null)}>
            Play again
          </button>
        }
      />
  )

  if (screen === 'tv') {
    return (
      <main className="dji-desk" aria-label="Don't Jinx It playtest">
        <TvPreview>
          <TvScreen
            view={tvView(game)}
            seats={SEATS}
            secondsLeft={secondsLeft}
            standings={rules.isOver(game) ? rules.finishingOrder(game) : null}
            onNext={timeUp}
          />
        </TvPreview>
        <div className="dji-desk__side">
          <div className="dji-desk__phone">{phone}</div>
          <DevBox game={game} onChange={apply} />
        </div>
      </main>
    )
  }

  return (
    <PhoneFrame label="Don't Jinx It playtest" cardTag="Playtest" fit>
      {phone}
      <DevBox game={game} onChange={apply} />
    </PhoneFrame>
  )
}

function Start({ onStart }: { onStart: (count: number) => void }) {
  return (
    <>
      <DontJinxItTitle />
      <p className="cue-card__text">
        Interface test: you plus bots. You guess first, then write clues on every other turn. Use the dev box to send
        the bots' clues and guesses and to stand in for the timer.
      </p>
      {PLAYER_COUNTS.map((count) => (
        <button
          key={count}
          type="button"
          className="phone-button"
          data-testid={`dji-start-${count}`}
          onClick={() => onStart(count)}
        >
          Play with {count} players
        </button>
      ))}
      <p className="preview-note">Playtest: nothing is saved.</p>
    </>
  )
}

interface DevBoxProps {
  game: DontJinxItState
  onChange: (game: DontJinxItState) => void
}

const TIMER_LABELS = {
  write: "Time's up",
  pile: 'Pile done',
  guess: "Time's up",
  verdict: 'Show reveal',
  reveal: 'Next turn',
  over: '',
}

/** Controls a real game gets from other phones and the engine timer. Never shows the word. */
function DevBox({ game, onChange }: DevBoxProps) {
  const [typed, setTyped] = useState<Record<PlayerId, string>>({})
  const [botGuess, setBotGuess] = useState('')
  const [note, setNote] = useState('')
  if (game.phase === 'over') return null

  const turn = currentTurn(game)
  const botsWriting = writersFor(game, turn).filter((player) => player !== YOU && !(player in turn.clues))
  const botGuesser = turn.guesser !== YOU ? turn.guesser : null
  const timerUp = () => onChange(rules.onTimer(game, context()))

  function botsSend() {
    const count = cluesPerWriter(game.players.length)
    let next = game
    const refused: string[] = []
    for (const bot of botsWriting) {
      const own = (typed[bot] ?? '').split(/[\s,]+/).filter(Boolean)
      const words = own.length > 0 ? own : dealBotClues(count, turn.word)
      const after = rules.onInput(next, bot, { type: 'clues', words }, context())
      if (after === next) refused.push(SEATS[bot].name)
      next = after
    }
    setTyped({})
    setNote(refused.length ? `Refused: ${refused.join(', ')} (check the clue rules)` : '')
    onChange(next)
  }

  function botSends(input: DontJinxItInput) {
    if (!botGuesser) return
    setBotGuess('')
    onChange(rules.onInput(game, botGuesser, input, context()))
  }

  return (
    <section className="dji-dev" aria-label="Playtest controls">
      <h2 className="dji-dev__heading">Dev</h2>
      {game.phase === 'write' && botsWriting.length > 0 && (
        <>
          <p className="dji-dev__hint">Type a bot's clue, or leave it blank to deal one.</p>
          <div className="dji-dev__fields">
            {botsWriting.map((bot) => (
              <label key={bot} className="dji-dev__field">
                <span>{SEATS[bot].name}</span>
                <input
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  value={typed[bot] ?? ''}
                  data-testid={`dji-dev-clue-${bot}`}
                  onChange={(event) => setTyped({ ...typed, [bot]: event.target.value })}
                />
              </label>
            ))}
          </div>
        </>
      )}
      {game.phase === 'guess' && botGuesser && (
        <label className="dji-dev__field">
          <span>{SEATS[botGuesser].name}'s guess</span>
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            value={botGuess}
            data-testid="dji-dev-guess"
            onChange={(event) => setBotGuess(event.target.value)}
          />
        </label>
      )}
      {note && <p className="dji-dev__hint">{note}</p>}
      <div className="dji-dev__buttons">
        {game.phase === 'write' && botsWriting.length > 0 && (
          <button type="button" className="dji-dev__button" data-testid="dji-dev-bots" onClick={botsSend}>
            Bots send
          </button>
        )}
        {game.phase === 'guess' && botGuesser && (
          <>
            <button
              type="button"
              className="dji-dev__button"
              data-testid="dji-dev-bot-guess"
              onClick={() => botSends({ type: 'guess', word: botGuess })}
            >
              Bot guesses
            </button>
            <button
              type="button"
              className="dji-dev__button"
              data-testid="dji-dev-bot-right"
              onClick={() => botSends({ type: 'guess', word: turn.word })}
            >
              Guess right
            </button>
            <button
              type="button"
              className="dji-dev__button"
              data-testid="dji-dev-bot-pass"
              onClick={() => botSends({ type: 'pass' })}
            >
              Pass
            </button>
          </>
        )}
        <button type="button" className="dji-dev__button" data-testid="dji-dev-timer" onClick={timerUp}>
          {TIMER_LABELS[game.phase]}
        </button>
      </div>
    </section>
  )
}
