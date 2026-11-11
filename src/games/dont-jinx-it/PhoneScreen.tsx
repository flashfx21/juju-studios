// ABOUTME: Don't Jinx It on a player's phone (individual mode), laid out from docs/handoffs/design_handoff_dont_jinx_it:
// ABOUTME: writing clues, the guesser's wait, the pile, survivors and the guess, the verdict, your result, final standings.
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Field } from '../../ui/TextField'
import { inkOn, PLAYER_COLORS, type PlayerColorId } from '../../ui/playerColors'
import { useLobbyStyle } from '../../ui/themes/useLobbyStyle'
import type { FinishingOrder, PlayerId } from '../types'
import { clueProblems, type ClueProblem, type GuessResult, type PileClue, type PlayerView } from './rules'
import '../../ui/PhoneForm.css'
import './PhoneScreen.css'

/** How a player appears on screen. */
export interface Seat {
  name: string
  color: PlayerColorId
}

interface PhoneScreenProps {
  view: PlayerView
  player: PlayerId
  seats: Record<PlayerId, Seat>
  /** Seconds left on the engine's timer for this phase, or null when nothing is timed. */
  secondsLeft: number | null
  /** True if the word is in the dictionary. Null until the dictionary loads; clues are then taken as written. */
  isKnownWord: ((word: string) => boolean) | null
  /** Final standings, once the game is over. */
  standings: FinishingOrder | null
  onClues: (words: string[]) => void
  onSkip: () => void
  onGuess: (word: string) => void
  onPass: () => void
  /** Shown under the final standings, such as the playtest's Play again button. */
  summaryAction?: ReactNode
}

const PROBLEM_TEXT: Record<ClueProblem, string> = {
  empty: 'Write one word',
  'not-letters': 'Letters only',
  'mystery-word': "That's the mystery word",
  'part-of-word': "That's part of the mystery word",
  'clues-match': 'Your two clues match',
}

/** One step of the pile every this many milliseconds, about 10 s for a whole turn's pile on the TV. */
const PILE_STEP_MS = 1700

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')
  return `${n}${suffix}`
}

/** "Bo", "Bo and Cy", "Bo, Cy and Di". */
function nameList(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

function useReducedMotion(): boolean {
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  return reduced
}

export function DontJinxItTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Don't Jinx It
      </span>
      <h1 className="phone-top__title">Don't Jinx It</h1>
    </div>
  )
}

/** A player's color circle with their initials. Decorative: the name always sits beside it. */
function Chip({ seat, size = 'small' }: { seat: Seat; size?: 'small' | 'large' }) {
  const style = useLobbyStyle()
  const background = PLAYER_COLORS[style][seat.color]
  return (
    <span className={`dji-chip dji-chip--${size}`} style={{ background, color: inkOn(background) }} aria-hidden="true">
      {initials(seat.name)}
    </span>
  )
}

const TILE_GAP = 4
const TILE_SIZES = { small: { width: 24, room: 190 }, medium: { width: 36, room: 250 } }

/** The word in letter tiles, shrunk to fit long words. Screen readers get the word once, not letter by letter. */
function WordTiles({ word, size = 'medium' }: { word: string; size?: 'small' | 'medium' }) {
  const { width, room } = TILE_SIZES[size]
  const tile = Math.min(width, Math.floor((room + TILE_GAP) / word.length) - TILE_GAP)
  return (
    <span className="dji-tiles" style={{ '--tile': `${tile}px` } as CSSProperties} data-testid="dji-word">
      <span className="visually-hidden">{word}</span>
      {[...word].map((letter, i) => (
        <span key={i} className="dji-tiles__tile" aria-hidden="true">
          {letter}
        </span>
      ))}
    </span>
  )
}

function Timer({ label, secondsLeft }: { label: string; secondsLeft: number | null }) {
  if (secondsLeft === null) return null
  return (
    <div className="dji-timer">
      <span className="dji-label">{label}</span>
      <span className="dji-tote" role="timer" aria-label={`${label}: ${secondsLeft} seconds`} data-testid="dji-timer">
        {clock(secondsLeft)}
      </span>
    </div>
  )
}

function Loader() {
  return (
    <span className="dji-loader" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function inCount(view: PlayerView): string {
  return `${view.progress.filter((writer) => writer.submitted).length} of ${view.progress.length} in`
}

// ---------- P3: write clues ----------

interface WriteProps {
  view: PlayerView
  word: string
  secondsLeft: number | null
  isKnownWord: PhoneScreenProps['isKnownWord']
  onClues: (words: string[]) => void
  onSkip: () => void
}

function Write({ view, word, secondsLeft, isKnownWord, onClues, onSkip }: WriteProps) {
  const count = view.cluesNeeded
  const [values, setValues] = useState<string[]>(() => Array(count).fill(''))
  const [problems, setProblems] = useState<(ClueProblem | null)[]>(() => Array(count).fill(null))
  const [kept, setKept] = useState<string[]>([])
  const [unknown, setUnknown] = useState<string | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function send(keptWords: string[]) {
    const found = clueProblems(values, word)
    setProblems(found)
    const firstBad = found.findIndex((problem) => problem !== null)
    if (firstBad >= 0) {
      inputs.current[firstBad]?.focus()
      return
    }
    const words = values.map((value) => value.trim().toLowerCase())
    const strange = isKnownWord ? words.find((w) => !isKnownWord(w) && !keptWords.includes(w)) : undefined
    if (strange) {
      setUnknown(strange)
      return
    }
    onClues(words)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    send(kept)
  }

  const skipLabel = { open: 'Skip word', used: 'Skip word · used', closed: 'Skip word · expired' }[view.skip]

  return (
    <form className="dji-write" noValidate onSubmit={submit}>
      <div className="dji-word-row">
        <div>
          <span className="dji-label">The word</span>
          <WordTiles word={word} />
        </div>
        <Timer label="Time" secondsLeft={secondsLeft} />
      </div>
      <div className="cue-card">
        <h2 className="cue-card__label">{count === 1 ? 'Write a clue' : `Write ${count} clues`}</h2>
        <p className="cue-card__text">One word{count > 1 ? ' each' : ''}. Any word written twice gets jinxed.</p>
        {values.map((value, i) => {
          const id = `dji-clue-${i + 1}`
          const problem = problems[i]
          return (
            <Field key={id} id={id} label={count === 1 ? 'Your clue' : `Clue ${i + 1}`} error="">
              <div className="field__box">
                <input
                  id={id}
                  ref={(element) => {
                    inputs.current[i] = element
                  }}
                  className="field__input dji-input"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={value}
                  aria-invalid={problem ? true : undefined}
                  aria-describedby={problem ? `${id}-error` : undefined}
                  data-testid={id}
                  onChange={(event) => {
                    setValues(values.map((v, j) => (j === i ? event.target.value : v)))
                    setProblems(problems.map((p, j) => (j === i ? null : p)))
                    setUnknown(null)
                  }}
                />
              </div>
              {problem && (
                <p className="dji-error" id={`${id}-error`} role="alert" data-testid={`${id}-error`}>
                  <span aria-hidden="true">✕ </span>
                  {PROBLEM_TEXT[problem]}
                </p>
              )}
            </Field>
          )
        })}
      </div>
      {unknown && (
        <div className="dji-name-check" role="alertdialog" aria-labelledby="dji-name-q" data-testid="dji-name-check">
          <p className="dji-name-check__question" id="dji-name-q">
            Is “{unknown}” a name?
          </p>
          <p className="dji-name-check__text">It isn't in our word list. Names and places are fine; check the spelling.</p>
          <div className="dji-name-check__buttons">
            <button
              type="button"
              className="phone-button"
              data-testid="dji-name-use"
              onClick={() => {
                const next = [...kept, unknown]
                setKept(next)
                setUnknown(null)
                send(next)
              }}
            >
              Use it
            </button>
            <button
              type="button"
              className="phone-button phone-button--secondary"
              data-testid="dji-name-edit"
              onClick={() => {
                const i = values.findIndex((value) => value.trim().toLowerCase() === unknown)
                setUnknown(null)
                inputs.current[Math.max(0, i)]?.focus()
              }}
            >
              Edit
            </button>
          </div>
        </div>
      )}
      <div className="dji-actions">
        <button type="submit" className="phone-button" data-testid="dji-submit">
          Submit
        </button>
        <button
          type="button"
          className="phone-button phone-button--secondary dji-skip"
          aria-disabled={view.skip !== 'open' ? true : undefined}
          data-testid="dji-skip"
          onClick={() => {
            if (view.skip === 'open') onSkip()
          }}
        >
          {skipLabel}
          <span className="dji-skip__note">New word · first 15 s, once per turn</span>
        </button>
      </div>
    </form>
  )
}

function Submitted({ view, word, secondsLeft }: { view: PlayerView; word: string; secondsLeft: number | null }) {
  return (
    <>
      <div className="dji-word-row">
        <div>
          <span className="dji-label">The word</span>
          <WordTiles word={word} />
        </div>
        <Timer label="Time" secondsLeft={secondsLeft} />
      </div>
      <div className="dji-in">
        <span className="dji-stamp dji-stamp--in">You're in</span>
        <ul className="dji-word-chips" aria-label="Your clues">
          {view.myClues?.map((clue) => (
            <li key={clue} className="dji-word-chip">
              {clue}
            </li>
          ))}
        </ul>
        <p className="dji-note">Keep it to yourself. The pile opens when everyone's in.</p>
        <p className="dji-count" role="status" data-testid="dji-in-count">
          {inCount(view)}
        </p>
        <Loader />
      </div>
    </>
  )
}

// ---------- P5: the guesser waits ----------

function GuesserWait({ view, seat }: { view: PlayerView; seat: Seat }) {
  return (
    <div className="dji-wait" data-testid="dji-guesser-wait">
      <Chip seat={seat} size="large" />
      <h2 className="dji-headline">You're guessing</h2>
      <p className="dji-wait__text">Don't look at anyone's phone.</p>
      {view.phase === 'write' && (
        <p className="dji-tote dji-tote--count" role="status" data-testid="dji-in-count">
          {inCount(view)}
        </p>
      )}
      <p className="dji-label dji-wait__status" role="status">
        {view.phase === 'write' ? 'Clues are coming in' : 'Clues are getting jinxed…'}
      </p>
      <Loader />
    </div>
  )
}

// ---------- P6: the pile ----------

/** 0 every clue, 1 matches found, 2 jinxed clues stamped, 3 only the survivors. Reduced motion jumps to 3. */
function usePileStep(): number {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (reduced || step >= 3) return
    const timeout = setTimeout(() => setStep(step + 1), PILE_STEP_MS)
    return () => clearTimeout(timeout)
  }, [step, reduced])
  return reduced ? 3 : step
}

/** Exact matches name every writer of the word in turn order, so matching rows carry the same stamp. */
function jinxText(clue: PileClue, seats: Record<PlayerId, Seat>, turnOrder: PlayerId[]): string {
  if (clue.fate === 'close-call') {
    return `JINXED! · close call with ${nameList(clue.matchedWith.map((id) => seats[id].name))}`
  }
  const writers = turnOrder.filter((id) => id === clue.by || clue.matchedWith.includes(id))
  return `JINXED! · ${writers.map((id) => seats[id].name).join(' + ')}`
}

interface PileRowProps {
  clue: PileClue
  seats: Record<PlayerId, Seat>
  turnOrder: PlayerId[]
  step: number
}

function PileRow({ clue, seats, turnOrder, step }: PileRowProps) {
  const removed = clue.fate !== 'survived'
  const state = !removed || step === 0 ? 'clean' : step === 1 ? 'match' : 'jinxed'
  const tag =
    state === 'match'
      ? clue.fate === 'close-call'
        ? '? Close call'
        : `Match ×${clue.matchedWith.length + 1}`
      : null
  return (
    <li className={`dji-pile__row dji-pile__row--${state}`} data-fate={clue.fate} data-testid="dji-pile-row">
      <div className="dji-pile__line">
        <Chip seat={seats[clue.by]} />
        <span className="dji-pile__word">{clue.word}</span>
        <span className="dji-pile__by">{seats[clue.by].name}</span>
        {tag && <span className={`dji-tag dji-tag--${clue.fate}`}>{tag}</span>}
      </div>
      {state === 'jinxed' && <span className="dji-pile__stamp">{jinxText(clue, seats, turnOrder)}</span>}
    </li>
  )
}

function Pile({ view, word, seats }: { view: PlayerView; word: string; seats: Record<PlayerId, Seat> }) {
  const step = usePileStep()
  const pile = view.pile ?? []
  const kept = pile.filter((clue) => clue.fate === 'survived')
  const shown = step === 3 ? kept : pile
  const jinxedWords = [...new Set(pile.filter((clue) => clue.fate !== 'survived').map((clue) => clue.word))]

  let status: string
  if (step === 0) status = `All ${pile.length} clues are in`
  else if (step === 1) status = jinxedWords.length ? 'Checking for matches…' : 'No matches'
  else if (step === 2) status = jinxedWords.length ? `Jinxed: ${jinxedWords.join(', ')}` : 'Nothing jinxed'
  else status = kept.length ? `${kept.length} of ${pile.length} survived` : 'Shutout! Nothing survived'

  return (
    <div className="dji-pile">
      <div className="dji-word-row">
        <div>
          <span className="dji-label">The word</span>
          <WordTiles word={word} size="small" />
        </div>
        <h2 className="dji-pile__title">{step === 3 ? "What's left" : 'The pile'}</h2>
      </div>
      {shown.length > 0 ? (
        <ol className="dji-pile__list" aria-label="Every clue" data-testid="dji-pile">
          {shown.map((clue) => (
            <PileRow
              key={`${clue.by}-${clue.word}`}
              clue={clue}
              seats={seats}
              turnOrder={view.progress.map((writer) => writer.player)}
              step={step}
            />
          ))}
        </ol>
      ) : (
        <div className="dji-shutout" data-testid="dji-shutout">
          <span className="dji-shutout__head">Shutout</span>
          <span>Nothing survived</span>
        </div>
      )}
      <p className="dji-statusbar" role="status" data-testid="dji-pile-status">
        {status}
      </p>
    </div>
  )
}

// ---------- P7 / P8: survivors, the guess and the verdict ----------

const VERDICT_STAMP: Record<GuessResult, string> = { correct: 'Correct!', miss: 'Miss!', pass: 'Pass' }

function Verdict({ view, seats }: { view: PlayerView; seats: Record<PlayerId, Seat> }) {
  const guesserName = view.isGuesser ? 'You' : seats[view.guesser].name
  const result = view.result ?? 'pass'
  return (
    <div className="dji-verdict" role="status" data-testid="dji-verdict">
      <span className={`dji-stamp dji-stamp--${result}`}>{VERDICT_STAMP[result]}</span>
      <p className="dji-verdict__line">
        {view.guess ? (
          <>
            {guesserName} guessed “{view.guess}”
          </>
        ) : (
          `${guesserName} passed`
        )}
      </p>
      <p className="dji-verdict__points">
        {result === 'correct' ? `${guesserName} +2 · surviving clues +1` : 'No points this turn'}
      </p>
    </div>
  )
}

function GuessForm({ onGuess, onPass }: { onGuess: (word: string) => void; onPass: () => void }) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const guess = typed.trim().toLowerCase()
    if (!guess) setError('Write one word')
    else if (!/^[a-z]+$/.test(guess)) setError('Letters only')
    else onGuess(guess)
  }

  return (
    <form className="dji-guess" noValidate onSubmit={submit}>
      <div className="dji-guess__row">
        <label className="visually-hidden" htmlFor="dji-guess">
          Your guess
        </label>
        <input
          id="dji-guess"
          className="dji-guess__input"
          type="text"
          placeholder="Your guess"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={typed}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'dji-guess-error' : undefined}
          data-testid="dji-guess-input"
          onChange={(event) => {
            setTyped(event.target.value)
            setError('')
          }}
        />
        <button type="submit" className="phone-button dji-guess__button" data-testid="dji-guess">
          Guess
        </button>
      </div>
      {error && (
        <p className="dji-error dji-error--dark" id="dji-guess-error" role="alert">
          <span aria-hidden="true">✕ </span>
          {error}
        </p>
      )}
      <button type="button" className="dji-pass" data-testid="dji-pass" onClick={onPass}>
        Pass
      </button>
    </form>
  )
}

interface SurvivorsProps {
  view: PlayerView
  seats: Record<PlayerId, Seat>
  secondsLeft: number | null
  onGuess: (word: string) => void
  onPass: () => void
}

function Survivors({ view, seats, secondsLeft, onGuess, onPass }: SurvivorsProps) {
  const words = view.survivors ?? []
  const clueCount = view.progress.filter((writer) => writer.submitted).length * view.cluesNeeded
  const guessing = view.phase === 'guess'
  const size = view.isGuesser && guessing ? 'compact' : words.length > 4 ? 'compact' : 'roomy'
  return (
    <div className="dji-survivors">
      <div className="dji-word-row">
        <div>
          <span className="dji-label">Survived</span>
          <span className="dji-survived-count" data-testid="dji-survived-count">
            {words.length} of {clueCount}
          </span>
        </div>
        {guessing && <Timer label="Guess closes" secondsLeft={secondsLeft} />}
      </div>
      {words.length > 0 ? (
        <ul className={`dji-cards dji-cards--${size}`} aria-label="Surviving clues" data-testid="dji-survivors">
          {words.map((word, i) => (
            <li key={`${word}-${i}`} className="dji-card">
              {word}
            </li>
          ))}
        </ul>
      ) : (
        <div className="dji-shutout" data-testid="dji-shutout">
          <span className="dji-shutout__head">Shutout</span>
          <span>
            Nothing survived · {view.isGuesser ? 'you' : seats[view.guesser].name} can guess blind or pass
          </span>
        </div>
      )}
      {guessing && view.isGuesser && <GuessForm onGuess={onGuess} onPass={onPass} />}
      {guessing && !view.isGuesser && <p className="dji-quiet">No hints, no faces.</p>}
      {view.phase === 'verdict' && <Verdict view={view} seats={seats} />}
    </div>
  )
}

// ---------- P10: your result ----------

function myClueLine(clue: PileClue, seats: Record<PlayerId, Seat>): ReactNode {
  const others = nameList(clue.matchedWith.filter((id) => id !== clue.by).map((id) => seats[id].name))
  if (clue.fate === 'survived') return <>Your clue <b>{clue.word}</b> survived</>
  if (clue.fate === 'jinxed') return <><b>{clue.word}</b> got jinxed: {others || 'you'} wrote it too</>
  return <><b>{clue.word}</b> got jinxed: close call with {others || 'your other clue'}</>
}

function whoWroteLine(clue: PileClue, seats: Record<PlayerId, Seat>): ReactNode {
  const others = nameList(clue.matchedWith.filter((id) => id !== clue.by).map((id) => seats[id].name))
  const fate =
    clue.fate === 'survived' ? 'survived' : clue.fate === 'jinxed' ? `jinxed with ${others}` : `close call with ${others}`
  return (
    <>
      <b>{clue.word}</b> · {seats[clue.by].name} · {fate}
    </>
  )
}

/** A player's place by points (1 plus everyone ahead) and whether anyone shares it. */
function standingOf(scores: Record<PlayerId, number>, player: PlayerId): { place: number; tied: boolean } {
  const points = Object.values(scores)
  return {
    place: 1 + points.filter((p) => p > scores[player]).length,
    tied: points.filter((p) => p === scores[player]).length > 1,
  }
}

function ScoreBar({ view, player }: { view: PlayerView; player: PlayerId }) {
  const { place, tied } = standingOf(view.scores, player)
  return (
    <p className="dji-scorebar" data-testid="dji-scorebar">
      <span className="dji-label">Score</span>
      <span>
        You {view.scores[player]} · {tied ? 'tied ' : ''}
        {ordinal(place)}
      </span>
    </p>
  )
}

const RESULT_TEXT: Record<GuessResult, string> = { correct: 'Correct', miss: 'Miss', pass: 'Pass' }

function Result({ view, player, seats }: { view: PlayerView; player: PlayerId; seats: Record<PlayerId, Seat> }) {
  const pile = view.pile ?? []
  const mine = pile.filter((clue) => clue.by === player)
  return (
    <div className="dji-result" data-testid="dji-result">
      <h2 className="dji-headline dji-headline--left">{view.isGuesser ? 'Here is what happened' : 'Your result'}</h2>
      <div className="dji-result__word">
        {view.word && <WordTiles word={view.word} size="small" />}
        <span className="dji-label">{RESULT_TEXT[view.result ?? 'pass']}</span>
      </div>
      {view.isGuesser ? (
        <>
          <span className="dji-label">Who wrote what</span>
          <ul className="dji-lines" aria-label="Who wrote what">
            {pile.map((clue) => (
              <li key={`${clue.by}-${clue.word}`} className="dji-lines__line">
                {whoWroteLine(clue, seats)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="dji-lines" aria-label="Your clues">
          {mine.length > 0 ? (
            mine.map((clue) => (
              <li key={clue.word} className="dji-lines__line dji-lines__line--boxed">
                {myClueLine(clue, seats)}
              </li>
            ))
          ) : (
            <li className="dji-lines__line dji-lines__line--boxed">You didn't send a clue in time.</li>
          )}
        </ul>
      )}
      <ScoreBar view={view} player={player} />
    </div>
  )
}

// ---------- P11: game over ----------

function GameOver({ view, player, seats, standings, summaryAction }: PhoneScreenProps) {
  const places = standings ?? []
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  const mine = standingOf(view.scores, player)
  return (
    <div className="dji-over" data-testid="dji-over">
      <h2 className="dji-headline dji-headline--left">Game over</h2>
      <p className="dji-over__you">
        {mine.tied ? 'You tied for' : 'You placed'} {ordinal(mine.place)}
        <span className="dji-tote">{pointsText(view.scores[player])}</span>
      </p>
      <ol className="dji-standings" aria-label="Final standings">
        {places.map((place, i) =>
          place.map((id) => (
            <li key={id} className="dji-standings__row" data-testid={`dji-final-${id}`}>
              <Chip seat={seats[id]} />
              <span>
                {place.length > 1 ? `Tied ${ordinal(rankOf(i))}` : ordinal(rankOf(i))} · {seats[id].name}
              </span>
              <span>{pointsText(view.scores[id])}</span>
            </li>
          )),
        )}
      </ol>
      {summaryAction}
    </div>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { view, player, seats, secondsLeft, isKnownWord, onClues, onSkip, onGuess, onPass } = props
  const word = view.word

  let body: ReactNode
  if (view.phase === 'over') body = <GameOver {...props} />
  else if (view.phase === 'reveal') body = <Result view={view} player={player} seats={seats} />
  else if (view.phase === 'guess' || view.phase === 'verdict')
    body = <Survivors view={view} seats={seats} secondsLeft={secondsLeft} onGuess={onGuess} onPass={onPass} />
  else if (view.isGuesser || word === null) body = <GuesserWait view={view} seat={seats[player]} />
  else if (view.phase === 'pile') body = <Pile key={view.turnIndex} view={view} word={word} seats={seats} />
  else if (view.myClues) body = <Submitted view={view} word={word} secondsLeft={secondsLeft} />
  else
    body = (
      <Write
        key={`${view.turnIndex}-${word}`}
        view={view}
        word={word}
        secondsLeft={secondsLeft}
        isKnownWord={isKnownWord}
        onClues={onClues}
        onSkip={onSkip}
      />
    )

  return (
    <div className="dji-phone">
      <div className="dji-top">
        <span className="dji-top__game">Don't Jinx It</span>
        {view.phase !== 'over' && (
          <span className="dji-top__turn" data-testid="dji-turn">
            Turn {view.turnIndex + 1} of {view.turnCount}
          </span>
        )}
      </div>
      {body}
    </div>
  )
}
