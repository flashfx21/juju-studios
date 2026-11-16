// ABOUTME: Zero In on a player's phone: the question with a number box and Lock it in, the reveal with everyone's guesses,
// ABOUTME: round points and totals under the host's one Next button, the final round's don't-go-over warning, and the final standings.
import { useState, type FormEvent, type ReactNode } from 'react'
import type { PlayerId } from '../types'
import { amountText, distanceText, placeText, readGuess, tidyTyped } from './format'
import { currentRound, finalIsNext, rules, totals, type Question, type RoundResult, type ZeroInState } from './rules'
import '../../ui/PhoneForm.css'
import './PhoneScreen.css'

interface PhoneScreenProps {
  state: ZeroInState
  player: PlayerId
  /** Display names by player id. */
  names: Record<PlayerId, string>
  /** The host's phone gets the one button that moves on from the reveal: Next question, Final round or Final standings. */
  isHost: boolean
  /** Seconds left to guess. Null or missing when nothing is timed. */
  secondsLeft?: number | null
  /** The guess as typed so far, so it still counts if time runs out before Lock it in. */
  onDraft: (value: number) => void
  onLock: (value: number) => void
  onNext: () => void
  /** Shown under the final standings, such as Play again. */
  summaryAction?: ReactNode
}

const LANE_NAMES = { price: 'Price Tag', year: 'What Year', number: 'By the Numbers' }

function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

export function ZeroInTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Zero In
      </span>
      <h1 className="phone-top__title">Zero In</h1>
    </div>
  )
}

function FinalBanner() {
  return (
    <p className="zi-final" data-testid="zi-final-banner">
      <strong>Final round: don't go over</strong>
      <span>Double points. Over the answer is a bust.</span>
    </p>
  )
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="cue-card zi-question" data-testid="zi-question">
      <p className="zi-question__lane">
        {LANE_NAMES[question.lane]} · {question.topic}
      </p>
      <p className="zi-question__prompt">{question.prompt}</p>
    </div>
  )
}

interface GuessEntryProps {
  question: Question
  /** The guess this phone already sent, after a refresh. */
  start: number | undefined
  onDraft: (value: number) => void
  onLock: (value: number) => void
}

/** The number box with the unit in place, commas as you type, and Lock it in. */
function GuessEntry({ question, start, onDraft, onLock }: GuessEntryProps) {
  const [typed, setTyped] = useState(start === undefined ? '' : tidyTyped(String(start), question))
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = readGuess(typed)
    if (value === null) {
      setError('Type a whole number.')
      return
    }
    onLock(value)
  }

  const unit = question.unit && <span className="zi-entry__unit">{question.unit}</span>
  return (
    <form className="zi-entry" noValidate onSubmit={submit}>
      <div className="cue-card zi-entry__card">
        {/* The question above says what to guess, so the label is for screen readers only. */}
        <label className="visually-hidden" htmlFor="zi-guess">
          Your guess
        </label>
        <div className="field__box zi-entry__box">
          {question.unitPosition === 'before' && unit}
          <input
            id="zi-guess"
            className="field__input zi-entry__input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            value={typed}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'zi-guess-error' : undefined}
            data-testid="zi-guess-input"
            onChange={(event) => {
              const tidy = tidyTyped(event.target.value, question)
              setTyped(tidy)
              setError('')
              const value = readGuess(tidy)
              if (value !== null) onDraft(value)
            }}
          />
          {question.unitPosition === 'after' && unit}
        </div>
        {error && (
          <p className="field__error" id="zi-guess-error">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="phone-button zi-entry__lock" data-testid="zi-lock-in">
        Lock it in
      </button>
    </form>
  )
}

function Guessing({ state, player, onDraft, onLock }: PhoneScreenProps) {
  const round = currentRound(state)
  const locked = round.locked.includes(player)
  const mine = round.guesses[player]
  return (
    <>
      {round.final && <FinalBanner />}
      <QuestionCard question={round.question} />
      {locked && mine !== undefined ? (
        <p className="zi-headline" data-testid="zi-locked">
          Locked in: {amountText(mine, round.question)}
        </p>
      ) : (
        <GuessEntry key={state.roundIndex} question={round.question} start={mine} onDraft={onDraft} onLock={onLock} />
      )}
    </>
  )
}

function HostNext({ isHost, onNext, label }: { isHost: boolean; onNext: () => void; label: string }) {
  if (isHost) {
    return (
      <button type="button" className="phone-button" data-testid="zi-next" onClick={onNext}>
        {label}
      </button>
    )
  }
  return (
    <p className="zi-status" role="status">
      Waiting for the host
    </p>
  )
}

function resultText(result: RoundResult, question: Question): string {
  if (result.guess === null) return 'No guess'
  if (result.bust) return 'Bust'
  return distanceText(result.distance!, question)
}

/**
 * Everyone's guess for the round, places first, then busts, then no guess, with this round's points.
 * From round 2 on, a Total column sits beside the round's points, so one screen is both the reveal and the standings.
 */
function RoundTable({ state, names, player }: Pick<PhoneScreenProps, 'state' | 'names' | 'player'>) {
  const round = currentRound(state)
  const results = round.results!
  const scores = totals(state)
  const showTotal = state.roundIndex > 0
  const order = [...state.players].sort((a, b) => {
    const rank = (r: RoundResult) => (r.place ?? (r.bust ? 1000 : 2000))
    return rank(results[a]) - rank(results[b]) || (results[a].distance ?? 0) - (results[b].distance ?? 0)
  })
  return (
    <table className="zi-table" data-testid="zi-table">
      <caption className="visually-hidden">Round {state.roundIndex + 1} results{showTotal ? ' and totals' : ''}</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">Place</span>
          </th>
          <th scope="col">
            <span className="visually-hidden">Player</span>
          </th>
          <th scope="col">Guess</th>
          <th scope="col" className="zi-table__num">
            {showTotal ? 'Round' : 'Points'}
          </th>
          {showTotal && (
            <th scope="col" className="zi-table__num zi-table__total">
              Total
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {order.map((id) => {
          const result = results[id]
          return (
            <tr key={id} data-me={id === player ? 'true' : undefined} data-testid={`zi-round-${id}`}>
              <td className="zi-table__place">{result.place === null ? '-' : placeText(result.place)}</td>
              <th scope="row" className="zi-table__name">
                {names[id]}
              </th>
              <td>
                <span className="zi-table__guess">{result.guess === null ? '' : amountText(result.guess, round.question)}</span>
                <span className="zi-table__how" data-bust={result.bust ? 'true' : undefined}>
                  {resultText(result, round.question)}
                </span>
              </td>
              <td className="zi-table__num">{showTotal ? `+${result.points}` : result.points}</td>
              {showTotal && (
                <td className="zi-table__num zi-table__total" data-testid={`zi-total-${id}`}>
                  {scores[id].points}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Reveal(props: PhoneScreenProps) {
  const { state, player, isHost, onNext } = props
  const round = currentRound(state)
  const mine = round.results![player]
  const everyoneBust = round.final && state.players.every((id) => round.results![id].bust || round.results![id].guess === null)
  let headline: string
  if (!mine) headline = 'The answer'
  else if (mine.guess === null) headline = "Time's up: no guess"
  else if (mine.bust) headline = `Bust! ${amountText(mine.guess, round.question)} went over`
  else if (mine.exact) headline = `On the Mark! ${pointsText(mine.points)}`
  else headline = `${distanceText(mine.distance!, round.question)}: ${mine.place === null ? '' : placeText(mine.place) + ', '}${pointsText(mine.points)}`

  return (
    <>
      <p className="zi-answer" data-testid="zi-answer">
        <span className="zi-answer__label">{round.final ? 'Final answer' : 'The answer'}</span>
        <span className="zi-answer__value">{amountText(round.question.answer, round.question)}</span>
      </p>
      {round.question.fact && <p className="zi-fact">{round.question.fact}</p>}
      <p className="zi-headline" role="status" data-testid="zi-result" data-exact={mine?.exact ? 'true' : undefined}>
        {headline}
      </p>
      {everyoneBust && (
        <p className="zi-status" data-testid="zi-everyone-bust">
          Everybody busted! Nobody scores this round.
        </p>
      )}
      <RoundTable {...props} />
      {finalIsNext(state) && (
        <p className="zi-final" data-testid="zi-final-next">
          <strong>Next: the final round</strong>
          <span>Don't go over. Double points.</span>
        </p>
      )}
      <HostNext isHost={isHost} onNext={onNext} label={round.final ? 'Final standings' : finalIsNext(state) ? 'Final round' : 'Next question'} />
    </>
  )
}

/** 1 plus everyone in better places, so two tied for 1st are followed by 3rd. */
function rankOf(places: PlayerId[][], index: number): number {
  return 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
}

function StandingsList({ state, names, player }: Pick<PhoneScreenProps, 'state' | 'names' | 'player'>) {
  const scores = totals(state)
  const places = rules.finishingOrder(state)
  return (
    <ol className="zi-list" aria-label="Final standings">
      {places.map((place, i) =>
        place.map((id) => (
          <li key={id} className="zi-list__row" data-me={id === player ? 'true' : undefined} data-testid={`zi-standing-${id}`}>
            <span className="zi-list__place">{place.length > 1 ? `=${rankOf(places, i)}` : rankOf(places, i)}</span>
            <span className="zi-list__name">{names[id]}</span>
            <span className="zi-list__points">{scores[id].points}</span>
          </li>
        )),
      )}
    </ol>
  )
}

function Final(props: PhoneScreenProps) {
  return (
    <>
      <p className="zi-headline">Final standings</p>
      <StandingsList {...props} />
      {props.summaryAction}
    </>
  )
}

function GuessingInfo({ state, secondsLeft }: Pick<PhoneScreenProps, 'state' | 'secondsLeft'>) {
  return (
    <p className="zi-info" data-testid="zi-info">
      {secondsLeft !== undefined && secondsLeft !== null && (
        <span role="timer" aria-live={secondsLeft <= 5 ? 'polite' : 'off'} data-testid="zi-clock">
          {secondsLeft} s left
        </span>
      )}
      <span role="status" data-testid="zi-locked-count">
        {currentRound(state).locked.length} of {state.players.length} locked in
      </span>
    </p>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { state } = props
  const round = state.phase === 'over' ? null : currentRound(state)
  return (
    <div className="zi-phone">
      <div className="zi-top">
        <ZeroInTitle />
        {round && (
          <span className="zi-top__round" data-testid="zi-round">
            {round.final ? 'Final round' : `Round ${state.roundIndex + 1} of ${state.rounds.length}`}
          </span>
        )}
      </div>
      {state.phase === 'guessing' && <GuessingInfo state={state} secondsLeft={props.secondsLeft} />}
      {state.phase === 'guessing' && <Guessing {...props} />}
      {state.phase === 'reveal' && <Reveal {...props} />}
      {state.phase === 'over' && <Final {...props} />}
    </div>
  )
}
