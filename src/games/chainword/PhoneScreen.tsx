// ABOUTME: Chainword on a player's phone: the current word's guess grid, a guess box, and the results of finished words.
// ABOUTME: Checks each guess with the rules first and says why a refused guess doesn't count.
import { useState, type FormEvent } from 'react'
import type { PlayerId } from '../types'
import {
  checkGuess,
  GUESSES_PER_WORD,
  MISSED_WORD_COST,
  totalGuesses,
  totalTime,
  WORD_LENGTH,
  type ChainwordState,
  type GuessProblem,
  type Mark,
  type WordAttempt,
} from './rules'
import '../../ui/PhoneForm.css'
import './PhoneScreen.css'

interface PhoneScreenProps {
  state: ChainwordState
  player: PlayerId
  onGuess: (word: string) => void
}

const MARK_WORDS: Record<Mark, string> = {
  green: 'right spot',
  yellow: 'wrong spot',
  gray: 'not in the word',
}

function describeProblem(problem: GuessProblem): string {
  switch (problem.kind) {
    case 'wrong-length':
      return `Guesses are ${WORD_LENGTH} letters.`
    case 'not-a-word':
      return "That's not in the word list."
    case 'keep-green':
      return `Keep ${problem.letter.toUpperCase()} in spot ${problem.position + 1}.`
    case 'use-letter':
      return problem.count > 1
        ? `Use ${problem.letter.toUpperCase()} ${problem.count} times.`
        : `Your guess needs the ${problem.letter.toUpperCase()}.`
    case 'not-playing':
      return "You've finished this chain."
  }
}

function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function Tile({ letter, mark }: { letter: string; mark?: Mark }) {
  return (
    <span className="cw-tile" data-mark={mark}>
      {letter.toUpperCase()}
    </span>
  )
}

function GuessRow({ guess, marks }: { guess: string; marks: Mark[] }) {
  const spoken = [...guess].map((letter, i) => `${letter.toUpperCase()} ${MARK_WORDS[marks[i]]}`).join(', ')
  return (
    <li className="cw-row" aria-label={spoken}>
      {[...guess].map((letter, i) => (
        <Tile key={i} letter={letter} mark={marks[i]} />
      ))}
    </li>
  )
}

function Grid({ attempt, typing }: { attempt: WordAttempt; typing: string }) {
  const emptyRows = GUESSES_PER_WORD - attempt.guesses.length - 1
  const typed = typing.slice(0, WORD_LENGTH).padEnd(WORD_LENGTH, ' ')
  return (
    <ol className="cw-grid" aria-label="Your guesses" data-testid="cw-grid">
      {attempt.guesses.map((guess, i) => (
        <GuessRow key={i} guess={guess} marks={attempt.marks[i]} />
      ))}
      <li className="cw-row" aria-hidden="true">
        {[...typed].map((letter, i) => (
          <Tile key={i} letter={letter.trim()} />
        ))}
      </li>
      {Array.from({ length: Math.max(emptyRows, 0) }, (_, row) => (
        <li key={`empty-${row}`} className="cw-row" aria-hidden="true">
          {Array.from({ length: WORD_LENGTH }, (_, i) => (
            <Tile key={i} letter="" />
          ))}
        </li>
      ))}
    </ol>
  )
}

function WordResults({ state, attempts }: { state: ChainwordState; attempts: WordAttempt[] }) {
  if (attempts.length === 0) return null
  return (
    <ol className="cw-results" aria-label="Finished words" data-testid="cw-results">
      {attempts.map((attempt, i) => (
        <li key={i} className="cw-results__item" data-solved={attempt.solved}>
          <span>Word {i + 1}</span>
          <span className="cw-results__word">{state.chain[i].toUpperCase()}</span>
          <span>
            {attempt.solved
              ? `${attempt.guesses.length} ${attempt.guesses.length === 1 ? 'guess' : 'guesses'}`
              : `Missed, counts ${MISSED_WORD_COST}`}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function PhoneScreen({ state, player, onGuess }: PhoneScreenProps) {
  const [typing, setTyping] = useState('')
  const [message, setMessage] = useState('')
  const run = state.runs[player]
  const finished = run.finishedAt !== null
  const doneAttempts = finished ? run.attempts : run.attempts.slice(0, -1)
  const current = run.attempts[run.attempts.length - 1]
  const time = totalTime(state, run)

  function submit(event: FormEvent) {
    event.preventDefault()
    const problem = checkGuess(state, player, typing)
    if (problem) {
      setMessage(describeProblem(problem))
      return
    }
    onGuess(typing)
    setTyping('')
    setMessage('')
  }

  return (
    <div className="cw-phone">
      <div className="phone-top">
        <span className="phone-top__logo" aria-hidden="true">
          Chainword
        </span>
        <h1 className="phone-top__title">Chainword</h1>
      </div>
      <p className="cw-progress" data-testid="cw-progress">
        {finished ? 'Chain done' : `Word ${run.attempts.length} of ${state.chain.length}`}
      </p>

      {finished ? (
        <section className="cw-summary" aria-label="Your result" data-testid="cw-summary">
          <p className="cw-summary__big">{totalGuesses(run)} guesses</p>
          {time !== null && <p className="cw-summary__time">Time {formatTime(time)}</p>}
        </section>
      ) : (
        <>
          <p className="cw-hint">
            Guess {current.guesses.length + 1} of {GUESSES_PER_WORD}. Hard mode: keep green letters in place and
            reuse yellow ones.
          </p>
          <Grid attempt={current} typing={typing} />
          <form className="cw-form" onSubmit={submit} noValidate>
            <label className="field__label" htmlFor="cw-guess">
              Your guess
            </label>
            <div className="cw-form__row">
              <input
                id="cw-guess"
                className="field__input cw-form__input"
                value={typing}
                maxLength={WORD_LENGTH}
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                aria-describedby="cw-message"
                data-testid="cw-guess-input"
                onChange={(event) => {
                  setTyping(event.target.value.replace(/[^a-z]/gi, '').toLowerCase())
                  setMessage('')
                }}
              />
              <button type="submit" className="phone-button cw-form__submit" data-testid="cw-guess-submit">
                Guess
              </button>
            </div>
            <p id="cw-message" className="cw-message" role="status" data-testid="cw-message">
              {message}
            </p>
          </form>
        </>
      )}

      <WordResults state={state} attempts={doneAttempts} />
    </div>
  )
}
