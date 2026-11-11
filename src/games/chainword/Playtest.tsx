// ABOUTME: Chainword playtest on one phone, no room or server: join a shared chain by code, make one, or play solo.
// ABOUTME: Everyone who types the same chain code gets the same words; players compare totals out loud at the end.
import { useRef, useState, type FormEvent } from 'react'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { TextField } from '../../ui/TextField'
import { makeChainCode, readChainCode } from './chainCode'
import { ChainwordTitle, PhoneScreen } from './PhoneScreen'
import {
  CHAIN_LENGTHS,
  DEFAULT_SETTINGS,
  endGame,
  MISSED_WORD_COST,
  rules,
  WORD_LENGTHS,
  type ChainwordSettings,
  type ChainwordState,
} from './rules'
import '../../ui/PhoneForm.css'
import './Playtest.css'

const PLAYER = 'you'

type Stage =
  | { kind: 'start' }
  | { kind: 'code'; code: string; settings: ChainwordSettings }
  | { kind: 'play'; state: ChainwordState; code: string | null }

function describeSettings(settings: ChainwordSettings): string {
  return `${settings.wordLength} letters, ${settings.chainLength} words${settings.hardMode ? ', hard mode' : ''}`
}

function startGame(settings: ChainwordSettings, random: () => number, code: string | null): Stage {
  return { kind: 'play', state: rules.setup([PLAYER], settings, { now: Date.now(), random }), code }
}

function startShared(code: string): Stage {
  const shared = readChainCode(code)!
  return startGame(shared.settings, shared.random, shared.code)
}

export function Playtest() {
  const [stage, setStage] = useState<Stage>({ kind: 'start' })

  return (
    <PhoneFrame label="Chainword playtest" cardTag="Playtest" fit={stage.kind === 'play'}>
      {stage.kind === 'start' && (
        <StartChoices
          onJoin={(code) => setStage(startShared(code))}
          onMakeCode={(settings) =>
            setStage({ kind: 'code', code: makeChainCode(settings, Math.random), settings })
          }
          onSolo={(settings) => setStage(startGame(settings, Math.random, null))}
        />
      )}
      {stage.kind === 'code' && (
        <CodeToShare
          code={stage.code}
          settings={stage.settings}
          onStart={() => setStage(startShared(stage.code))}
          onBack={() => setStage({ kind: 'start' })}
        />
      )}
      {stage.kind === 'play' && (
        <Playing
          key={stage.state.startedAt}
          state={stage.state}
          code={stage.code}
          onChange={(state) => setStage({ ...stage, state })}
          onNewChain={() => setStage({ kind: 'start' })}
        />
      )}
      {stage.kind !== 'play' && (
        <p className="preview-note">Playtest: each phone plays on its own and nothing is saved.</p>
      )}
    </PhoneFrame>
  )
}

interface StartChoicesProps {
  onJoin: (code: string) => void
  onMakeCode: (settings: ChainwordSettings) => void
  onSolo: (settings: ChainwordSettings) => void
}

function StartChoices({ onJoin, onMakeCode, onSolo }: StartChoicesProps) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  function join(event: FormEvent) {
    event.preventDefault()
    const shared = readChainCode(typed)
    if (!shared) {
      setError('Chain codes are 4 letters and 2 numbers, sometimes with an H, like KPDT53 or KPDT53H.')
      return
    }
    onJoin(shared.code)
  }

  return (
    <>
      <ChainwordTitle />
      <p className="cw-start__rules">6 guesses per word. Fewest guesses in the whole chain wins.</p>

      <form className="phone-form cw-start__join" noValidate onSubmit={join}>
        <div className="cue-card">
          <h2 className="cue-card__label">Got a chain code?</h2>
          <TextField
            id="chain-code"
            label="Chain code"
            autoComplete="off"
            value={typed}
            error={error}
            testId="cw-code-input"
            onChange={(value) => {
              setTyped(value)
              setError('')
            }}
          />
        </div>
        <button type="submit" className="phone-button" data-testid="cw-code-join">
          Join this chain
        </button>
      </form>

      <section className="cw-start__new" aria-labelledby="cw-new-chain">
        <h2 className="cw-start__heading" id="cw-new-chain">
          Or start a new chain
        </h2>
        <ChoiceRow
          id="cw-letters"
          name="Letters per word"
          options={WORD_LENGTHS}
          value={settings.wordLength}
          onSelect={(wordLength) => setSettings({ ...settings, wordLength })}
        />
        <ChoiceRow
          id="cw-words"
          name="Words in the chain"
          options={CHAIN_LENGTHS}
          value={settings.chainLength}
          onSelect={(chainLength) => setSettings({ ...settings, chainLength })}
        />
        <ChoiceRow
          id="cw-hard"
          name="Hard mode"
          options={['off', 'on'] as const}
          value={settings.hardMode ? 'on' : 'off'}
          onSelect={(choice) => setSettings({ ...settings, hardMode: choice === 'on' })}
        />
        <p className="cw-start__rules">Hard mode: green letters stay in place, and letters you find must be used again.</p>
        <button type="button" className="phone-button" data-testid="cw-make-code" onClick={() => onMakeCode(settings)}>
          Make a code for everyone
        </button>
        <button
          type="button"
          className="phone-button phone-button--secondary"
          data-testid="cw-solo"
          onClick={() => onSolo(settings)}
        >
          Play solo
        </button>
      </section>
    </>
  )
}

interface ChoiceRowProps<Value extends string | number> {
  id: string
  name: string
  options: readonly Value[]
  value: Value
  onSelect: (value: Value) => void
}

/** A labelled row of pressed/unpressed choice buttons. */
function ChoiceRow<Value extends string | number>({ id, name, options, value, onSelect }: ChoiceRowProps<Value>) {
  return (
    <div className="cw-choice" role="group" aria-labelledby={`${id}-name`}>
      <span className="cw-choice__name" id={`${id}-name`}>
        {name}
      </span>
      <div className="cw-choice__options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="cw-choice__option"
            aria-pressed={option === value}
            data-testid={`${id}-${option}`}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

interface CodeToShareProps {
  code: string
  settings: ChainwordSettings
  onStart: () => void
  onBack: () => void
}

function CodeToShare({ code, settings, onStart, onBack }: CodeToShareProps) {
  return (
    <>
      <ChainwordTitle />
      <div className="cue-card cw-share">
        <h2 className="cue-card__label">Your chain code</h2>
        <p className="cw-share__code" data-testid="cw-share-code" aria-label={[...code].join(' ')}>
          {code}
        </p>
        <p className="cue-card__text">{describeSettings(settings)}</p>
        <p className="cue-card__text">
          Everyone types this code on their own phone. Say go, and start together.
        </p>
      </div>
      <button type="button" className="phone-button" data-testid="cw-share-start" onClick={onStart}>
        Start
      </button>
      <button type="button" className="phone-link" onClick={onBack}>
        Back
      </button>
    </>
  )
}

interface PlayingProps {
  state: ChainwordState
  code: string | null
  onChange: (state: ChainwordState) => void
  onNewChain: () => void
}

function Playing({ state, code, onChange, onNewChain }: PlayingProps) {
  const endDialog = useRef<HTMLDialogElement>(null)
  const over = rules.isOver(state)
  const now = () => ({ now: Date.now(), random: Math.random })

  const topAction = (
    <>
      {code && (
        <span className="cw-playing__code" data-testid="cw-playing-code" aria-label={`Chain code ${code}`}>
          {code}
        </span>
      )}
      {!over && (
        <button
          type="button"
          className="cw-playing__end"
          data-testid="cw-end"
          onClick={() => endDialog.current?.showModal()}
        >
          End game
        </button>
      )}
    </>
  )

  return (
    <>
      <PhoneScreen
        state={state}
        player={PLAYER}
        topAction={topAction}
        summaryAction={
          <button type="button" className="phone-button" data-testid="cw-new-chain" onClick={onNewChain}>
            New chain
          </button>
        }
        onGuess={(word) => onChange(rules.onInput(state, PLAYER, { type: 'guess', word }, now()))}
      />
      <dialog ref={endDialog} className="cw-end" aria-labelledby="cw-end-question">
        <p className="cw-end__question" id="cw-end-question">
          End the game now? The word you're on and any words left count {MISSED_WORD_COST} each.
        </p>
        <button
          type="button"
          className="phone-button"
          data-testid="cw-end-confirm"
          onClick={() => {
            endDialog.current?.close()
            onChange(endGame(state, now()))
          }}
        >
          Yes, end the game
        </button>
        <button
          type="button"
          className="phone-button phone-button--secondary"
          data-testid="cw-end-cancel"
          onClick={() => endDialog.current?.close()}
        >
          Keep playing
        </button>
      </dialog>
    </>
  )
}
