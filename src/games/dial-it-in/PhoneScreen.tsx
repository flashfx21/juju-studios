// ABOUTME: Dial It In on a player's phone: the spectrum card, the secret target for the clue giver,
// ABOUTME: a safe-style dial (with typing as a backup) for guessers, the round reveal and the final standings.
import { useState, type FormEvent, type ReactNode } from 'react'
import { Field } from '../../ui/TextField'
import type { PlayerId } from '../types'
import { GuessDial } from './GuessDial'
import {
  currentRound,
  guessersFor,
  rules,
  totalScores,
  type DialItInState,
  type Round,
} from './rules'
import '../../ui/PhoneForm.css'
import './PhoneScreen.css'

interface PhoneScreenProps {
  state: DialItInState
  player: PlayerId
  /** Display names by player id. */
  names: Record<PlayerId, string>
  onGuess: (value: number) => void
  /** Shown under the final standings, such as the playtest's Play again button. */
  summaryAction?: ReactNode
  /** Shown under a round's reveal, such as the room host's Next round. */
  revealAction?: ReactNode
  /** Shown while guessing, above the spectrum, such as a room's countdown. */
  guessingNote?: ReactNode
  /** This round's clue when the phone knows it, such as a bot's clue in solo play. People say theirs out loud. */
  clue?: string
}

function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

export function DialItInTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Dial It In
      </span>
      <h1 className="phone-top__title">Dial It In</h1>
    </div>
  )
}

interface SpectrumProps {
  round: Round
  range: number
  /** Numbers to mark on the dial, each with a short name for screen readers. */
  marks: { value: number; kind: 'target' | 'guess'; label: string }[]
}

/** The card's two opposites with the dial between them, 1 on the left and the range on the right. */
function Spectrum({ round, range, marks }: SpectrumProps) {
  return (
    <div className="dii-spectrum" data-testid="dii-spectrum">
      <div className="dii-spectrum__ends">
        <span data-testid="dii-left">{round.card.left}</span>
        <span data-testid="dii-right">{round.card.right}</span>
      </div>
      <div className="dii-spectrum__dial" aria-hidden="true">
        {marks.map((mark) => (
          <span
            key={mark.kind}
            className={`dii-spectrum__mark dii-spectrum__mark--${mark.kind}`}
            style={{ left: `${((mark.value - 1) / (range - 1)) * 100}%` }}
          />
        ))}
      </div>
      <div className="dii-spectrum__scale" aria-hidden="true">
        <span>1</span>
        <span>{range}</span>
      </div>
      {marks.length > 0 && (
        <p className="visually-hidden">{marks.map((mark) => `${mark.label}: ${mark.value}`).join('. ')}</p>
      )}
    </div>
  )
}

interface GuessFormProps {
  range: number
  onGuess: (value: number) => void
}

/** The typed text as a guess, or null if it isn't a whole number from 1 to range. */
function readGuess(typed: string, range: number): number | null {
  const value = Number(typed.trim())
  return typed.trim() !== '' && Number.isInteger(value) && value >= 1 && value <= range ? value : null
}

/** The dial and the typed box always show the same guess; the dial starts in the middle. */
function GuessForm({ range, onGuess }: GuessFormProps) {
  const [dialed, setDialed] = useState(Math.round(range / 2))
  const [typed, setTyped] = useState(String(Math.round(range / 2)))
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = readGuess(typed, range)
    if (value === null) {
      setError(`Enter a whole number from 1 to ${range}.`)
      return
    }
    onGuess(value)
  }

  return (
    <form className="dii-guess" noValidate onSubmit={submit}>
      <GuessDial
        value={dialed}
        range={range}
        label={`Dial your guess, 1 to ${range}`}
        onChange={(value) => {
          setDialed(value)
          setTyped(String(value))
          setError('')
        }}
      />
      {/* Inside a cue card, like every shared field: the field takes its text color from the card. */}
      <div className="cue-card">
        <Field id="dii-guess" label={`Or type your guess, 1 to ${range}`} error={error}>
          <div className="field__box">
            <input
              id="dii-guess"
              className="field__input dii-guess__input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={typed}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'dii-guess-error' : undefined}
              data-testid="dii-guess-input"
              onChange={(event) => {
                setTyped(event.target.value)
                setError('')
                const value = readGuess(event.target.value, range)
                if (value !== null) setDialed(value)
              }}
            />
          </div>
        </Field>
      </div>
      <button type="submit" className="phone-button" data-testid="dii-lock-in">
        Lock in
      </button>
    </form>
  )
}

/** The clue as the clue giver said it. */
function SpokenClue({ name, clue }: { name: string; clue: string }) {
  return (
    <div className="cue-card dii-clue" data-testid="dii-clue">
      <p className="cue-card__label">{name} says</p>
      <p className="dii-clue__text">"{clue}"</p>
    </div>
  )
}

function Guessing({ state, player, names, onGuess, clue }: PhoneScreenProps) {
  const round = currentRound(state)
  const guessers = guessersFor(state, round)
  const lockedIn = guessers.filter((guesser) => guesser in round.guesses).length
  const waiting = `${lockedIn} of ${guessers.length} locked in`

  if (player === round.clueGiver) {
    return (
      <>
        <p className="dii-role" data-testid="dii-role">
          You give the clue
        </p>
        <Spectrum round={round} range={state.range} marks={[{ value: round.target, kind: 'target', label: 'Target' }]} />
        <div className="dii-target">
          <span className="dii-target__label">Secret target</span>
          <span className="dii-target__value" data-testid="dii-target">
            {round.target}
          </span>
        </div>
        <p className="dii-hint">Say a clue out loud that lands near {round.target}. Don't say the number.</p>
        <p className="dii-status" role="status" data-testid="dii-status">
          {waiting}
        </p>
      </>
    )
  }

  const myGuess = round.guesses[player]
  return (
    <>
      <p className="dii-role" data-testid="dii-role">
        {names[round.clueGiver]} gives the clue
      </p>
      {clue && <SpokenClue name={names[round.clueGiver]} clue={clue} />}
      <Spectrum
        round={round}
        range={state.range}
        marks={myGuess === undefined ? [] : [{ value: myGuess, kind: 'guess', label: 'Your guess' }]}
      />
      {myGuess === undefined ? (
        <GuessForm key={state.roundIndex} range={state.range} onGuess={onGuess} />
      ) : (
        <>
          <p className="dii-locked" data-testid="dii-locked">
            Locked in: {myGuess}
          </p>
          <p className="dii-status" role="status" data-testid="dii-status">
            {waiting}
          </p>
        </>
      )}
    </>
  )
}

function Reveal({ state, player, names, revealAction, clue }: PhoneScreenProps) {
  const round = currentRound(state)
  const myGuess = round.guesses[player]
  const marks: SpectrumProps['marks'] = [{ value: round.target, kind: 'target', label: 'Target' }]
  if (myGuess !== undefined) marks.push({ value: myGuess, kind: 'guess', label: 'Your guess' })

  let headline: string
  if (player === round.clueGiver) headline = 'You gave the clue'
  else if (myGuess === undefined) headline = 'No guess: 0 points'
  else headline = `You guessed ${myGuess}: ${pointsText(round.points[player])}`

  return (
    <>
      <p className="dii-role">Target: {round.target}</p>
      {clue && <SpokenClue name={names[round.clueGiver]} clue={clue} />}
      <Spectrum round={round} range={state.range} marks={marks} />
      <p className="dii-headline" role="status" data-testid="dii-reveal">
        {headline}
      </p>
      <ul className="dii-list" aria-label="This round">
        {guessersFor(state, round).map((guesser) => (
          <li key={guesser} className="dii-list__row" data-testid={`dii-round-${guesser}`}>
            <span>{names[guesser]}</span>
            <span>{round.guesses[guesser] ?? 'No guess'}</span>
            <span>{pointsText(round.points[guesser])}</span>
          </li>
        ))}
      </ul>
      {revealAction}
    </>
  )
}

function Standings({ state, names, summaryAction }: PhoneScreenProps) {
  const totals = totalScores(state)
  const places = rules.finishingOrder(state)
  /** 1 plus everyone in better places, so two tied for 1st are followed by 3rd. */
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  return (
    <>
      <p className="dii-role">Final standings</p>
      <ol className="dii-list" aria-label="Final standings">
        {places.map((place, i) =>
          place.map((player) => (
            <li key={player} className="dii-list__row" data-testid={`dii-final-${player}`}>
              <span>
                {place.length > 1 ? `Tied ${rankOf(i)}` : rankOf(i)}. {names[player]}
              </span>
              <span>{pointsText(totals[player])}</span>
            </li>
          )),
        )}
      </ol>
      {summaryAction}
    </>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { state } = props
  return (
    <div className="dii-phone">
      <div className="dii-top">
        <DialItInTitle />
        {state.phase !== 'over' && (
          <span className="dii-top__round" data-testid="dii-round">
            Round {state.roundIndex + 1} of {state.rounds.length}
          </span>
        )}
      </div>
      {state.phase === 'guessing' && props.guessingNote}
      {state.phase === 'guessing' && <Guessing {...props} />}
      {state.phase === 'reveal' && <Reveal {...props} />}
      {state.phase === 'over' && <Standings {...props} />}
    </div>
  )
}
