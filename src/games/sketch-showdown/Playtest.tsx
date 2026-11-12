// ABOUTME: Sketch Showdown solo playtest on one phone: you draw every round for Pencils (you plus two bots) against
// ABOUTME: three bots on Crayons. No room or server; a dev box stands in for the bots' guesses and the engine timer.
import { useEffect, useState } from 'react'
import { loadDictionary, type Dictionary } from '../../engine/dictionary'
import { PhoneFrame } from '../../ui/PhoneFrame'
import type { PlayerId, RulesContext } from '../types'
import { PhoneScreen, SketchShowdownTitle } from './PhoneScreen'
import {
  currentRound,
  DEFAULT_SETTINGS,
  guessProblem,
  playerView,
  sketchShowdownRules,
  TURNS,
  tvView,
  PACES,
  type SketchShowdownSettings,
  type SketchShowdownState,
} from './rules'
import { SketchCanvas } from './SketchCanvas'
import { TEAM_LOOKS } from './teams'
import '../../ui/PhoneForm.css'
import '../../ui/PlaytestDev.css'
import './Playtest.css'

const YOU = 'you'
const TEAMS: PlayerId[][] = [
  [YOU, 'bot-a', 'bot-b'],
  ['bot-c', 'bot-d', 'bot-e'],
]
const NAMES: Record<PlayerId, string> = {
  you: 'You',
  'bot-a': 'Bot A',
  'bot-b': 'Bot B',
  'bot-c': 'Bot C',
  'bot-d': 'Bot D',
  'bot-e': 'Bot E',
}
const WRONG_WORDS = ['banana', 'robot', 'cloud', 'shoe', 'kite', 'tree', 'moon', 'boat', 'spoon', 'lamp']
const PROBLEM_TEXT = {
  'locked-out': 'Locked out for 2 seconds after a wrong guess',
  'already-guessed': 'Already guessed',
  empty: 'Type a guess',
  'not-guessing': 'Not guessing right now',
}

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** Drawer-only test: you draw every regular round for your team. */
function youAlwaysDraw(state: SketchShowdownState): SketchShowdownState {
  const drawOrder: SketchShowdownState['drawOrder'] = [state.drawOrder[0].map(() => YOU), state.drawOrder[1]]
  const rounds = [...state.rounds]
  rounds[0] = { ...rounds[0], drawers: [YOU, rounds[0].drawers[1]] }
  return { ...state, drawOrder, rounds }
}

export function Playtest() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [failed, setFailed] = useState(false)
  const [state, setState] = useState<SketchShowdownState | null>(null)

  useEffect(() => {
    loadDictionary().then(setDictionary, () => setFailed(true))
  }, [])

  if (!dictionary) {
    return (
      <PhoneFrame label="Sketch Showdown playtest" cardTag="Playtest">
        <SketchShowdownTitle />
        <p className="cue-card__text" role="status">
          {failed ? "The word list didn't load. Reload the page to try again." : 'Loading the word list...'}
        </p>
      </PhoneFrame>
    )
  }

  const rules = sketchShowdownRules((word) => dictionary.has(word))

  if (!state) {
    return (
      <PhoneFrame label="Sketch Showdown playtest" cardTag="Playtest">
        <Start onStart={(settings) => setState(youAlwaysDraw(rules.setup(TEAMS.flat(), settings, context(), TEAMS)))} />
      </PhoneFrame>
    )
  }

  const apply = (change: (current: SketchShowdownState) => SketchShowdownState) => setState((current) => current && change(current))
  const input = (player: PlayerId, value: Parameters<typeof rules.onInput>[2]) => apply((s) => rules.onInput(s, player, value, context()))

  return (
    <PhoneFrame label="Sketch Showdown playtest" cardTag="Playtest" fit>
      <PhoneScreen
        view={playerView(state, YOU)}
        player={YOU}
        names={NAMES}
        teammates={TEAMS[0]}
        isHost
        onPick={(option) => input(YOU, { type: 'pick', option })}
        onStroke={(stroke) => input(YOU, { type: 'stroke', stroke })}
        onUndo={() => input(YOU, { type: 'undo' })}
        onClear={() => input(YOU, { type: 'clear' })}
        onVote={(nominee) => input(YOU, { type: 'vote', nominee })}
        onNext={() => apply((s) => rules.onTimer(s, context()))}
        summaryAction={
          <>
            <Gallery state={state} />
            <button type="button" className="phone-button" data-testid="ss-play-again" onClick={() => setState(null)}>
              Play again
            </button>
          </>
        }
      />
      <DevBar state={state} rules={rules} onChange={apply} />
    </PhoneFrame>
  )
}

function Start({ onStart }: { onStart: (settings: SketchShowdownSettings) => void }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  return (
    <>
      <SketchShowdownTitle />
      <p className="cue-card__text">
        Drawer test: you draw every round for {TEAM_LOOKS[0].name} (you, Bot A, Bot B) against {TEAM_LOOKS[1].name} (three
        bots). Use the dev box to send your teammates' guesses, let the other team win, or run out the clock.
      </p>
      <div className="ss-option" role="group" aria-label="Turns">
        <span className="ss-option__label">Turns</span>
        <div className="ss-option__buttons">
          {TURNS.map((turns) => (
            <button
              key={turns}
              type="button"
              className="ss-option__button"
              aria-pressed={settings.turns === turns}
              data-testid={`ss-turns-${turns}`}
              onClick={() => setSettings({ ...settings, turns })}
            >
              {turns === 'once' ? 'Draw once (3 rounds)' : 'Draw twice (6)'}
            </button>
          ))}
        </div>
      </div>
      <div className="ss-option" role="group" aria-label="Pace">
        <span className="ss-option__label">Pace</span>
        <div className="ss-option__buttons">
          {PACES.map((pace) => (
            <button
              key={pace}
              type="button"
              className="ss-option__button"
              aria-pressed={settings.pace === pace}
              data-testid={`ss-pace-${pace}`}
              onClick={() => setSettings({ ...settings, pace })}
            >
              {pace[0].toUpperCase() + pace.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="phone-button" data-testid="ss-start" onClick={() => onStart(settings)}>
        Start
      </button>
      <p className="preview-note">Playtest: nothing is saved. There's no clock; the dev box ends each step.</p>
    </>
  )
}

/** Stands in for the TV's game-over gallery: page through every round's two drawings. */
function Gallery({ state }: { state: SketchShowdownState }) {
  const gallery = tvView(state).gallery ?? []
  const [index, setIndex] = useState(0)
  if (gallery.length === 0) return null
  const item = gallery[Math.min(index, gallery.length - 1)]
  return (
    <section className="ss-gallery" aria-label="Gallery">
      <p className="ss-gallery__title">
        Round {index + 1} of {gallery.length}: {item.clue.answer}
      </p>
      <div className="ss-pair">
        {item.drawings.map((strokes, team) => (
          <SketchCanvas key={team} label={`${TEAM_LOOKS[team].name} drawing`} strokes={strokes} />
        ))}
      </div>
      <div className="playtest-dev__buttons">
        <button type="button" className="playtest-dev__button" disabled={index === 0} data-testid="ss-gallery-prev" onClick={() => setIndex(index - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="playtest-dev__button"
          disabled={index >= gallery.length - 1}
          data-testid="ss-gallery-next"
          onClick={() => setIndex(index + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}

interface DevBarProps {
  state: SketchShowdownState
  rules: ReturnType<typeof sketchShowdownRules>
  onChange: (change: (current: SketchShowdownState) => SketchShowdownState) => void
}

/** Controls a real game gets from the other phones and the engine timer. */
function DevBar({ state, rules, onChange }: DevBarProps) {
  const [typed, setTyped] = useState('')
  const [note, setNote] = useState('')
  if (state.phase === 'reveal' || state.phase === 'over') return null
  const round = currentRound(state)
  const otherDrawer = round.drawers[1]
  const timer = () => onChange((s) => rules.onTimer(s, context()))

  /** A teammate (Bot A, then Bot B if A is locked out) sends this guess. */
  const teammateGuesses = (text: string) => {
    const now = Date.now()
    const sender = ['bot-a', 'bot-b'].find((bot) => !guessProblem(state, bot, text, now))
    if (!sender) {
      const problems = ['bot-a', 'bot-b'].map((bot) => guessProblem(state, bot, text, now) ?? 'not-guessing')
      setNote(PROBLEM_TEXT[problems.includes('already-guessed') ? 'already-guessed' : problems[0]])
      return
    }
    setNote('')
    onChange((s) => rules.onInput(s, sender, { type: 'guess', text }, context()))
  }

  return (
    <section className="playtest-dev ss-dev" aria-label="Playtest controls">
      <h2 className="playtest-dev__heading">Dev</h2>
      {state.phase === 'race' && (
        <form
          className="ss-dev__guess"
          onSubmit={(event) => {
            event.preventDefault()
            teammateGuesses(typed)
            setTyped('')
          }}
        >
          <label className="visually-hidden" htmlFor="ss-dev-guess">
            A teammate guesses
          </label>
          <input
            id="ss-dev-guess"
            className="ss-dev__input"
            placeholder="Teammate guesses..."
            autoComplete="off"
            value={typed}
            data-testid="ss-dev-guess"
            onChange={(event) => setTyped(event.target.value)}
          />
          <button type="submit" className="playtest-dev__button" data-testid="ss-dev-send">
            Send
          </button>
        </form>
      )}
      {note && (
        <p className="ss-dev__note" role="status" data-testid="ss-dev-note">
          {note}
        </p>
      )}
      <div className="playtest-dev__buttons">
        {state.phase === 'pick' && !(otherDrawer in round.picks) && (
          <button
            type="button"
            className="playtest-dev__button"
            data-testid="ss-dev-bot-pick"
            onClick={() => onChange((s) => rules.onInput(s, otherDrawer, { type: 'pick', option: Math.floor(Math.random() * 3) }, context()))}
          >
            Bot picks
          </button>
        )}
        {state.phase === 'race' && (
          <>
            <button
              type="button"
              className="playtest-dev__button"
              data-testid="ss-dev-wrong"
              onClick={() => teammateGuesses(WRONG_WORDS[Math.floor(Math.random() * WRONG_WORDS.length)])}
            >
              Wrong guess
            </button>
            <button
              type="button"
              className="playtest-dev__button"
              data-testid="ss-dev-other-wins"
              onClick={() => onChange((s) => rules.onInput(s, 'bot-d', { type: 'guess', text: currentRound(s).clue!.answer }, context()))}
            >
              Other team got it
            </button>
          </>
        )}
        <button type="button" className="playtest-dev__button" data-testid="ss-dev-timer" onClick={timer}>
          {{ pick: "Time's up", countdown: 'Go', race: "Time's up", vote: 'Votes in' }[state.phase]}
        </button>
      </div>
    </section>
  )
}
