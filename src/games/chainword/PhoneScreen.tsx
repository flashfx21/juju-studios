// ABOUTME: Chainword on a player's phone: chain progress, the guess grid filled from an on-screen keyboard, and results.
// ABOUTME: Shows how each finished word went before moving on, and says why a refused guess doesn't count.
import { useEffect, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import type { PlayerId } from '../types'
import {
  checkGuess,
  GUESSES_PER_WORD,
  MISSED_WORD_COST,
  totalGuesses,
  totalTime,
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
  /** Extra controls for the top bar, such as the playtest's chain code and End game. */
  topAction?: ReactNode
  /** Shown under the final total, such as the playtest's New chain button. */
  summaryAction?: ReactNode
}

const MARK_WORDS: Record<Mark, string> = {
  green: 'right spot',
  yellow: 'wrong spot',
  gray: 'not in the word',
}

const MARK_RANK: Record<Mark, number> = { gray: 1, yellow: 2, green: 3 }

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

function describeProblem(problem: GuessProblem, wordLength: number): string {
  switch (problem.kind) {
    case 'wrong-length':
      return `Guesses are ${wordLength} letters.`
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

function guessCount(n: number): string {
  return `${n} ${n === 1 ? 'guess' : 'guesses'}`
}

function isWordDone(attempt: WordAttempt): boolean {
  return attempt.solved || attempt.guesses.length === GUESSES_PER_WORD
}

/** The best mark each letter has earned in this word, for coloring the keyboard. */
function letterMarks(attempt: WordAttempt): Map<string, Mark> {
  const marks = new Map<string, Mark>()
  attempt.guesses.forEach((guess, g) => {
    ;[...guess].forEach((letter, i) => {
      const mark = attempt.marks[g][i]
      const known = marks.get(letter)
      if (!known || MARK_RANK[mark] > MARK_RANK[known]) marks.set(letter, mark)
    })
  })
  return marks
}

function Tile({ letter, mark }: { letter: string; mark?: Mark }) {
  return (
    <span className="cw-tile" data-mark={mark} data-filled={letter ? 'true' : undefined}>
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

interface GridProps {
  attempt: WordAttempt
  /** Letters typed so far, or null when the word is finished and nothing more can be typed. */
  typing: string | null
  wordLength: number
}

function Grid({ attempt, typing, wordLength }: GridProps) {
  const rowsLeft = GUESSES_PER_WORD - attempt.guesses.length
  const emptyRows = typing === null ? rowsLeft : rowsLeft - 1
  return (
    <ol
      className="cw-grid"
      aria-label="Your guesses"
      data-testid="cw-grid"
      style={{ '--cw-letters': wordLength } as CSSProperties}
    >
      {attempt.guesses.map((guess, i) => (
        <GuessRow key={i} guess={guess} marks={attempt.marks[i]} />
      ))}
      {typing !== null && rowsLeft > 0 && (
        <li
          className="cw-row"
          aria-label={typing ? `Typing ${[...typing].join(' ').toUpperCase()}` : 'Type your guess'}
          data-testid="cw-typing-row"
        >
          {Array.from({ length: wordLength }, (_, i) => (
            <Tile key={i} letter={typing[i] ?? ''} />
          ))}
        </li>
      )}
      {Array.from({ length: Math.max(emptyRows, 0) }, (_, row) => (
        <li key={`empty-${row}`} className="cw-row" aria-hidden="true">
          {Array.from({ length: wordLength }, (_, i) => (
            <Tile key={i} letter="" />
          ))}
        </li>
      ))}
    </ol>
  )
}

interface KeyboardProps {
  marks: Map<string, Mark>
  onLetter: (letter: string) => void
  onDelete: () => void
  onEnter: () => void
}

function Keyboard({ marks, onLetter, onDelete, onEnter }: KeyboardProps) {
  // Pointer taps shouldn't move focus onto a key, so a physical Enter still means "guess".
  const keepFocus = (event: PointerEvent) => event.preventDefault()
  return (
    <div className="cw-keys" role="group" aria-label="Keyboard" data-testid="cw-keyboard">
      {KEY_ROWS.map((row, r) => (
        <div key={row} className="cw-keys__row" data-row={r}>
          {r === 2 && (
            <button
              type="button"
              className="cw-key cw-key--wide"
              data-testid="cw-key-enter"
              onPointerDown={keepFocus}
              onClick={onEnter}
            >
              Enter
            </button>
          )}
          {[...row].map((letter) => {
            const mark = marks.get(letter)
            return (
              <button
                key={letter}
                type="button"
                className="cw-key"
                data-mark={mark}
                data-testid={`cw-key-${letter}`}
                aria-label={mark ? `${letter.toUpperCase()}, ${MARK_WORDS[mark]}` : letter.toUpperCase()}
                onPointerDown={keepFocus}
                onClick={() => onLetter(letter)}
              >
                {letter.toUpperCase()}
              </button>
            )
          })}
          {r === 2 && (
            <button
              type="button"
              className="cw-key cw-key--wide"
              aria-label="Delete letter"
              data-testid="cw-key-delete"
              onPointerDown={keepFocus}
              onClick={onDelete}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/** One segment per chain word: solved, missed, the one on screen, or still to come. */
function ChainProgress({ state, attempts, shown }: { state: ChainwordState; attempts: WordAttempt[]; shown: number }) {
  const finishedAll = shown >= state.chain.length
  return (
    <div className="cw-chain">
      <p className="cw-chain__label" data-testid="cw-progress">
        {finishedAll ? 'Chain done' : `Word ${shown + 1} of ${state.chain.length}`}
      </p>
      <ol className="cw-chain__bar" aria-hidden="true">
        {state.chain.map((_, i) => {
          const attempt = attempts[i]
          const done = attempt && isWordDone(attempt)
          const status = done ? (attempt.solved ? 'solved' : 'missed') : i === shown ? 'current' : 'todo'
          return <li key={i} className="cw-chain__step" data-status={status} />
        })}
      </ol>
    </div>
  )
}

function WordResults({ state, attempts }: { state: ChainwordState; attempts: WordAttempt[] }) {
  return (
    <ol className="cw-results" aria-label="Your words" data-testid="cw-results">
      {attempts.map((attempt, i) => (
        <li key={i} className="cw-results__item" data-solved={attempt.solved}>
          <span>Word {i + 1}</span>
          <span className="cw-results__word">{state.chain[i].toUpperCase()}</span>
          <span>
            {attempt.solved
              ? guessCount(attempt.guesses.length)
              : `${attempt.guesses.length === 0 ? 'Not played' : 'Missed'}, counts ${MISSED_WORD_COST}`}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** The game's name as the screen heading; arcade shows it as its neon logo. */
export function ChainwordTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Chainword
      </span>
      <h1 className="phone-top__title">Chainword</h1>
    </div>
  )
}

export function PhoneScreen({ state, player, onGuess, topAction, summaryAction }: PhoneScreenProps) {
  const [typing, setTyping] = useState('')
  const [message, setMessage] = useState('')
  /** The word whose result is on screen after its last guess, until the player moves on. */
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)

  const run = state.runs[player]
  const finished = run.finishedAt !== null
  const reviewed = reviewIndex !== null ? run.attempts[reviewIndex] : undefined
  const reviewing = reviewIndex !== null && reviewed !== undefined && isWordDone(reviewed)
  const shownIndex = reviewing ? reviewIndex : finished ? state.chain.length : run.attempts.length - 1
  const shown = run.attempts[shownIndex]
  const isLastWord = shownIndex === state.chain.length - 1
  const time = totalTime(state, run)

  function addLetter(letter: string) {
    setMessage('')
    setTyping((typed) => (typed.length < state.wordLength ? typed + letter : typed))
  }

  function deleteLetter() {
    setMessage('')
    setTyping((typed) => typed.slice(0, -1))
  }

  function submit() {
    const problem = checkGuess(state, player, typing)
    if (problem) {
      setMessage(describeProblem(problem, state.wordLength))
      return
    }
    setReviewIndex(run.attempts.length - 1)
    onGuess(typing)
    setTyping('')
    setMessage('')
  }

  function moveOn() {
    setReviewIndex(null)
  }

  // A physical keyboard types too (laptops, tablets with keyboards).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement
      const onButton = target instanceof HTMLButtonElement
      if (target instanceof HTMLInputElement) return
      if (reviewing) {
        if (event.key === 'Enter' && !onButton) {
          event.preventDefault()
          moveOn()
        }
        return
      }
      if (finished) return
      if (event.key === 'Enter' && !onButton) {
        event.preventDefault()
        submit()
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        deleteLetter()
      } else if (/^[a-z]$/i.test(event.key)) {
        addLetter(event.key.toLowerCase())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="cw-phone">
      <header className="cw-top">
        <div className="cw-top__row">
          <ChainwordTitle />
          {topAction && <div className="cw-top__action">{topAction}</div>}
        </div>
        <ChainProgress state={state} attempts={run.attempts} shown={shownIndex} />
      </header>

      {finished && !reviewing ? (
        <section className="cw-summary" aria-label="Your result" data-testid="cw-summary">
          <p className="cw-summary__big">{guessCount(totalGuesses(run))}</p>
          {time !== null && <p className="cw-summary__time">Time {formatTime(time)}</p>}
          <WordResults state={state} attempts={run.attempts} />
          {summaryAction && <div className="cw-summary__action">{summaryAction}</div>}
        </section>
      ) : (
        <>
          <div className="cw-board">
            <Grid attempt={shown} typing={reviewing ? null : typing} wordLength={state.wordLength} />
          </div>
          <p className="cw-message" role="status" data-testid="cw-message">
            {message}
          </p>
          {reviewing ? (
            <section className="cw-review" aria-label="How that word went" data-testid="cw-review">
              <p className="cw-review__result" data-solved={shown.solved}>
                {shown.solved
                  ? `Solved in ${guessCount(shown.guesses.length)}!`
                  : `Out of guesses. The word was ${state.chain[shownIndex].toUpperCase()}.`}
              </p>
              {!shown.solved && <p className="cw-review__note">It counts {MISSED_WORD_COST}.</p>}
              <button type="button" className="phone-button" data-testid="cw-next" autoFocus onClick={moveOn}>
                {isLastWord ? 'See your total' : 'Next word'}
              </button>
            </section>
          ) : (
            <Keyboard marks={letterMarks(shown)} onLetter={addLetter} onDelete={deleteLetter} onEnter={submit} />
          )}
        </>
      )}
    </div>
  )
}
