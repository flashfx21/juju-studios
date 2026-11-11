// ABOUTME: Don't Jinx It on the big screen (individual mode), laid out from docs/handoffs/design_handoff_dont_jinx_it:
// ABOUTME: turn intro, writing progress, the clue drop, survivors, the verdict, the full reveal and final standings.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { TvHeader } from '../../ui/TvHeader'
import type { FinishingOrder, PlayerId } from '../types'
import { clock, jinxedBy, ordinal, pointsText } from './format'
import { Chip, WordTiles, type Seat } from './Pieces'
import type { GuessResult, TvCard, TvView } from './rules'
import { LAST_PILE_STEP, usePileStep } from './usePileStep'
import './TvScreen.css'

interface TvScreenProps {
  view: TvView
  seats: Record<PlayerId, Seat>
  /** Seconds left on the engine's timer for this phase, or null when nothing is timed. */
  secondsLeft: number | null
  /** Final standings, once the game is over. */
  standings: FinishingOrder | null
  /** The host's Next on the full reveal. */
  onNext: () => void
}

/** How long the turn intro shows at the start of writing, while the guesser looks up at the TV. */
const INTRO_MS = 5000
const PANEL_WIDTH = 1120
const CARD_GAP = 18

function namesOf(seats: Record<PlayerId, Seat>): Record<PlayerId, string> {
  return Object.fromEntries(Object.entries(seats).map(([id, seat]) => [id, seat.name]))
}

/** Players by points, most first; ties keep turn order. */
function leaders(scores: Record<PlayerId, number>, count: number): PlayerId[] {
  return Object.keys(scores)
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, count)
}

function clueCount(view: TvView): number {
  return view.progress.filter((writer) => writer.submitted).length * view.cluesNeeded
}

function ScoreRows({ view, seats, count }: { view: TvView; seats: Record<PlayerId, Seat>; count: number }) {
  return (
    <ol className="dji-tv-scores" aria-label="Top scores">
      {leaders(view.scores, count).map((id) => (
        <li key={id} className="dji-tv-scores__row">
          <Chip seat={seats[id]} size={36} />
          <span className="dji-tv-scores__name">{seats[id].name}</span>
          <span className="dji-tv-tote dji-tv-scores__points">{view.scores[id]}</span>
        </li>
      ))}
    </ol>
  )
}

// ---------- T3: turn intro ----------

function TurnIntro({ view, seats }: { view: TvView; seats: Record<PlayerId, Seat> }) {
  const guesser = seats[view.guesser]
  return (
    <div className="dji-tv-intro" data-testid="dji-tv-intro">
      <div className="dji-tv-intro__main">
        <span className="dji-tv-label">Now guessing</span>
        <div className="dji-tv-intro__who">
          <Chip seat={guesser} size={140} ringed />
          <span className="dji-tv-intro__name">{guesser.name}</span>
        </div>
        <p className="dji-tv-strip dji-tv-strip--solid">{guesser.name}: eyes on the TV.</p>
        <p className="dji-tv-strip dji-tv-strip--outline">Everyone else: check your phone.</p>
      </div>
      <div className="dji-tv-intro__side">
        <span className="dji-tv-label">Score</span>
        <ScoreRows view={view} seats={seats} count={4} />
      </div>
    </div>
  )
}

// ---------- T4: writing ----------

function Writing({ view, seats, secondsLeft }: Pick<TvScreenProps, 'view' | 'seats' | 'secondsLeft'>) {
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => setIntro(false), INTRO_MS)
    return () => clearTimeout(timeout)
  }, [])
  if (intro) return <TurnIntro view={view} seats={seats} />

  const sent = clueCount(view)
  const total = view.progress.length * view.cluesNeeded
  const guesser = seats[view.guesser]
  return (
    <div className="dji-tv-writing" data-testid="dji-tv-writing">
      <div className="dji-tv-writing__side">
        <span className="dji-tv-label">Writing closes</span>
        {secondsLeft !== null && (
          <span className="dji-tv-tote dji-tv-writing__timer" role="timer">
            {clock(secondsLeft)}
          </span>
        )}
        <p className="dji-tv-writing__count" data-testid="dji-tv-count">
          Clues {sent} of {total}
        </p>
        <p className="dji-tv-writing__note">Ends early when everyone's in.</p>
      </div>
      <div className="dji-tv-writing__lane">
        <span className="dji-tv-label">Writing clues</span>
        <ul className="dji-tv-writers" aria-label="Who has sent their clues">
          <li className="dji-tv-writer">
            <span className="dji-tv-writer__who">
              <Chip seat={guesser} size={36} />
              <span className="dji-tv-writer__name">{guesser.name}</span>
            </span>
            <span className="dji-tv-writer__guessing">Guessing</span>
            <span className="dji-tv-writer__note">Eyes on the TV</span>
          </li>
          {view.progress.map(({ player, submitted }) => (
            <li key={player} className="dji-tv-writer" data-testid={`dji-tv-writer-${player}`}>
              <span className="dji-tv-writer__who">
                <Chip seat={seats[player]} size={36} />
                <span className="dji-tv-writer__name">{seats[player].name}</span>
              </span>
              <span className="dji-tv-ticks" aria-label={submitted ? 'Sent' : 'Writing'}>
                {Array.from({ length: view.cluesNeeded }, (_, i) => (
                  <span key={i} className="dji-tv-tick" data-done={submitted || undefined} aria-hidden="true">
                    {submitted ? '✓' : ''}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ---------- T6: the clue drop ----------

function cardSize(count: number): { width: number; height: number } {
  const width = Math.min(172, Math.floor((PANEL_WIDTH - CARD_GAP * (count - 1)) / count))
  return { width, height: Math.round((width * 236) / 172) }
}

interface DropCardProps {
  card: TvCard
  index: number
  step: number
  names: Record<PlayerId, string>
  turnOrder: readonly PlayerId[]
}

/** A face-down clue card. It never carries the clue's word; stamps show who jinxed it. */
function DropCard({ card, index, step, names, turnOrder }: DropCardProps) {
  const removed = card.fate !== 'survived'
  const stamped = removed && step >= 2
  return (
    <li
      className="dji-tv-card"
      data-fate={card.fate}
      data-faded={removed && step >= LAST_PILE_STEP ? 'true' : undefined}
      style={{ '--i': index } as CSSProperties}
      data-testid="dji-tv-card"
    >
      {card.fate === 'close-call' && step >= 1 && (
        <span className="dji-tv-card__close">
          <span aria-hidden="true">?</span> Close call
        </span>
      )}
      <span className="dji-tv-card__number">{index + 1}</span>
      <span className="dji-tv-card__label">Clue</span>
      {stamped && (
        <span className="dji-tv-card__stamp">
          <span className="dji-tv-card__stamp-head">JINXED!</span>
          <span className="dji-tv-card__stamp-by">{cardJinxedBy(card, names, turnOrder)}</span>
        </span>
      )}
    </li>
  )
}

/** Who jinxed a TV card, in the same words the phones use. Only called for jinxed cards, which name their writer. */
function cardJinxedBy(card: TvCard, names: Record<PlayerId, string>, turnOrder: readonly PlayerId[]): string {
  return jinxedBy({ word: '', by: card.by ?? '', fate: card.fate, matchedWith: card.matchedWith }, names, turnOrder)
}

function ClueDrop({ view, seats }: { view: TvView; seats: Record<PlayerId, Seat> }) {
  const step = usePileStep()
  const cards = view.cards ?? []
  const kept = cards.filter((card) => card.fate === 'survived').length
  const removed = cards.length - kept
  const closeCalls = cards.filter((card) => card.fate === 'close-call').length
  const { width, height } = cardSize(Math.max(cards.length, 1))
  const names = namesOf(seats)
  const writers = view.progress.map((writer) => writer.player)

  let head: string
  let sub: string
  if (step === 0) [head, sub] = ['Clues are in', `${cards.length} face down · no peeking`]
  else if (step === 1)
    [head, sub] = ['Checking for matches…', closeCalls ? `${closeCalls} close ${closeCalls === 1 ? 'call' : 'calls'}` : '']
  else if (step === 2) [head, sub] = removed ? ['Jinxed!', `${removed} of ${cards.length} wiped out`] : ['No jinxes!', 'Every clue is safe']
  else if (kept) [head, sub] = [`${kept} of ${cards.length} survived`, `Over to ${seats[view.guesser].name}`]
  else [head, sub] = ['Shutout!', `${seats[view.guesser].name} can guess blind or pass`]

  return (
    <div className="dji-tv-drop" data-testid="dji-tv-drop">
      <div className="dji-tv-drop__top">
        <span className="dji-tv-label">The clue drop · {cards.length} clues</span>
        <span className="dji-tv-drop__secret">No words until the reveal</span>
      </div>
      <ol
        className="dji-tv-cards"
        aria-label="Face-down clue cards"
        style={{ '--card-w': `${width}px`, '--card-h': `${height}px` } as CSSProperties}
      >
        {cards.map((card, i) => (
          <DropCard key={i} card={card} index={i} step={step} names={names} turnOrder={writers} />
        ))}
      </ol>
      <div className="dji-tv-caption" role="status" data-testid="dji-tv-caption">
        <span className="dji-tv-caption__head">{head}</span>
        {sub && <span className="dji-tv-caption__sub">{sub}</span>}
      </div>
    </div>
  )
}

// ---------- T7 / T8: survivors and the verdict ----------

const VERDICT_STAMP: Record<GuessResult, string> = { correct: 'Correct!', miss: 'Miss!', pass: 'Pass' }

function Verdict({ view, seats }: { view: TvView; seats: Record<PlayerId, Seat> }) {
  const name = seats[view.guesser].name
  const result = view.result ?? 'pass'
  return (
    <div className="dji-tv-verdict" role="status" data-testid="dji-tv-verdict">
      <span className={`dji-tv-stamp dji-tv-stamp--${result}`}>{VERDICT_STAMP[result]}</span>
      {view.guess ? (
        <div className="dji-tv-verdict__guess">
          <span className="dji-tv-label">{name} guessed</span>
          <WordTiles word={view.guess} tile={62} room={900} />
        </div>
      ) : (
        <span className="dji-tv-verdict__line">{name} passed</span>
      )}
      <span className="dji-tv-verdict__points">
        {result === 'correct' ? `${name} +2 · surviving clues +1` : 'No points this turn'}
      </span>
    </div>
  )
}

function Survivors({ view, seats, secondsLeft }: Pick<TvScreenProps, 'view' | 'seats' | 'secondsLeft'>) {
  const words = view.survivors ?? []
  const size = words.length <= 4 ? 'large' : words.length <= 6 ? 'medium' : 'small'
  return (
    <div className="dji-tv-guess" data-testid="dji-tv-guess">
      <div className="dji-tv-guess__top">
        <div>
          <span className="dji-tv-label">Survived</span>
          <span className="dji-tv-guess__count">
            {words.length} of {clueCount(view)}
          </span>
        </div>
        {secondsLeft !== null && (
          <div className="dji-tv-guess__timer">
            <span className="dji-tv-label">Guess closes</span>
            <span className="dji-tv-tote" role="timer">
              {clock(secondsLeft)}
            </span>
          </div>
        )}
      </div>
      {words.length > 0 ? (
        <ul className={`dji-tv-survivors dji-tv-survivors--${size}`} aria-label="Surviving clues">
          {words.map((word, i) => (
            <li key={`${word}-${i}`} className="dji-tv-survivor" style={{ '--i': i } as CSSProperties}>
              {word}
            </li>
          ))}
        </ul>
      ) : (
        <div className="dji-tv-shutout">
          <span className="dji-tv-shutout__head">Shutout</span>
          <span>Nothing survived · {seats[view.guesser].name} can guess blind or pass</span>
        </div>
      )}
      <p className="dji-tv-quiet">Quiet! No hints.</p>
    </div>
  )
}

// ---------- T9: the full reveal ----------

const RESULT_LINE: Record<GuessResult, string> = { correct: 'Correct', miss: 'Miss', pass: 'Pass' }

function Reveal({ view, seats }: { view: TvView; seats: Record<PlayerId, Seat> }) {
  const cards = view.cards ?? []
  const names = namesOf(seats)
  const writers = view.progress.map((writer) => writer.player)
  const rows = Math.max(1, Math.ceil(cards.length / 3))
  const result = view.result ?? 'pass'
  return (
    <div className="dji-tv-reveal" data-testid="dji-tv-reveal">
      <div className="dji-tv-reveal__side">
        <span className="dji-tv-label">The word was</span>
        {view.word && <WordTiles word={view.word} tile={54} room={270} />}
        <span className="dji-tv-label">This turn</span>
        <span className="dji-tv-reveal__result">
          {seats[view.guesser].name} · {RESULT_LINE[result]}
          {result === 'correct' ? ' +2' : ''}
        </span>
        <span className="dji-tv-label">Score</span>
        <ScoreRows view={view} seats={seats} count={3} />
      </div>
      <ul className="dji-tv-reveal__cards" aria-label="Who wrote what" style={{ '--rows': rows } as CSSProperties}>
        {cards.map((card, i) => {
          const writer = seats[card.by ?? '']
          return (
            <li key={i} className="dji-tv-reveal-card" data-fate={card.fate}>
              {writer && (
                <span className="dji-tv-reveal-card__who">
                  <Chip seat={writer} size={28} />
                  {writer.name} wrote
                </span>
              )}
              <span className="dji-tv-reveal-card__word">{card.word}</span>
              {card.fate === 'survived' ? (
                <span className="dji-tv-tag dji-tv-tag--survived">✓ Survived</span>
              ) : (
                <span className="dji-tv-tag dji-tv-tag--jinxed">JINXED! · {cardJinxedBy(card, names, writers)}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ---------- T10: game over ----------

function GameOver({ view, seats, standings }: Pick<TvScreenProps, 'view' | 'seats' | 'standings'>) {
  const places = standings ?? []
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  return (
    <div className="dji-tv-over" data-testid="dji-tv-over">
      <ol className="dji-tv-standings" aria-label="Final standings">
        {places.map((place, i) =>
          place.map((id) => (
            <li key={id} className="dji-tv-standings__row" data-top={i === 0 || undefined}>
              <span className="dji-tv-standings__place">
                {place.length > 1 ? `Tied ${ordinal(rankOf(i))}` : ordinal(rankOf(i))}
              </span>
              <Chip seat={seats[id]} size={30} />
              <span className="dji-tv-standings__name">{seats[id].name}</span>
              <span className="dji-tv-standings__points">{pointsText(view.scores[id])}</span>
            </li>
          )),
        )}
      </ol>
    </div>
  )
}

// ---------- The screen ----------

function hostStatus(view: TvView, secondsLeft: number | null): string {
  const left = secondsLeft === null ? '' : ` · ${clock(secondsLeft)}`
  switch (view.phase) {
    case 'write':
      return `Writing · ${view.progress.filter((writer) => writer.submitted).length} of ${view.progress.length} in`
    case 'pile':
      return 'The pile · about 10 s'
    case 'guess':
      return `Guessing${left}`
    case 'verdict':
      return 'Verdict'
    case 'reveal':
      return `Full reveal · next in${left}`
    case 'over':
      return 'Game over'
  }
}

export function TvScreen({ view, seats, secondsLeft, standings, onNext }: TvScreenProps) {
  let body: ReactNode
  if (view.phase === 'write') body = <Writing key={view.turnIndex} view={view} seats={seats} secondsLeft={secondsLeft} />
  else if (view.phase === 'pile') body = <ClueDrop key={view.turnIndex} view={view} seats={seats} />
  else if (view.phase === 'guess') body = <Survivors view={view} seats={seats} secondsLeft={secondsLeft} />
  else if (view.phase === 'verdict') body = <Verdict view={view} seats={seats} />
  else if (view.phase === 'reveal') body = <Reveal view={view} seats={seats} />
  else body = <GameOver view={view} seats={seats} standings={standings} />

  return (
    <div className="tv-screen dji-tv">
      <TvHeader title={view.phase === 'over' ? 'Game over' : "Don't Jinx It"}>
        {view.phase !== 'over' && (
          <span className="dji-tv-turn" data-testid="dji-tv-turn">
            Turn {view.turnIndex + 1} of {view.turnCount}
          </span>
        )}
      </TvHeader>
      <section className="dji-tv-panel" aria-label="Game">
        {body}
      </section>
      <footer className="dji-tv-hostbar">
        <span className="dji-tv-hostbar__status" data-testid="dji-tv-status">
          {hostStatus(view, secondsLeft)}
        </span>
        {view.phase === 'reveal' && (
          <button type="button" className="dji-tv-button dji-tv-button--primary" data-testid="dji-tv-next" onClick={onNext}>
            Next
          </button>
        )}
      </footer>
    </div>
  )
}
