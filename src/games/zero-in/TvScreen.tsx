// ABOUTME: Zero In on the TV: the question with lock lights, the final round's intro card, the ring reveal on a number line
// ABOUTME: with round points and totals, the final round's climb reveal (safe or bust), and the final standings.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { amountText, numberText, placeText } from './format'
import { howToPlay } from './howToPlay'
import { layoutLine, type LinePoint } from './numberLine'
import { currentRound, roundOrder, rules, totals, type Question, type ZeroInState } from './rules'
import '../../ui/TvGame.css'
import './TvScreen.css'

interface TvScreenProps {
  /** The room's public state: no answers or guesses until the reveal. */
  state: ZeroInState
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left to guess, or null when nothing is timed. */
  secondsLeft: number | null
}

const LANE_NAMES = { price: 'Price Tag', year: 'What Year', number: 'By the Numbers' }
/** How long the final round's intro card shows before the question. */
const FINAL_INTRO_MS = 4000
/** Time between reveal steps: the answer drop, then each place lighting up. */
const STEP_MS = 900
/** How long the final round's count takes to climb to the answer. */
const CLIMB_MS = 3500

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Counts from 0 up to `last`, one step every STEP_MS; straight to the end with reduced motion. */
function useSteps(last: number): number {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? last : 0))
  useEffect(() => {
    if (step >= last) return
    const timer = setTimeout(() => setStep(step + 1), STEP_MS)
    return () => clearTimeout(timer)
  }, [step, last])
  return step
}

function unitHint(question: Question): string {
  if (question.lane === 'year') return 'Answer with a year'
  if (question.unit === '$') return 'Answer in dollars'
  return question.unit ? `Answer in ${question.unit}` : 'Answer with a number'
}

function Chip({ look, size = 44 }: { look: PlayerLook; size?: number }) {
  return <PlayerDot look={look} size={size} />
}

// ---------- Question and guessing ----------

function FinalIntro() {
  return (
    <div className="zi-tv-intro" data-testid="zi-tv-final-intro">
      <span className="zi-tv-intro__kicker">Final round</span>
      <span className="zi-tv-intro__title">Don't Go Over</span>
      <span className="zi-tv-intro__rule">Closest without going over wins. Over the answer is a bust. Double points.</span>
    </div>
  )
}

function Guessing({ state, looks, secondsLeft }: TvScreenProps) {
  const round = currentRound(state)
  const [intro, setIntro] = useState(round.final)
  useEffect(() => {
    if (!intro) return
    const timer = setTimeout(() => setIntro(false), FINAL_INTRO_MS)
    return () => clearTimeout(timer)
  }, [intro])
  if (intro) return <FinalIntro />

  return (
    <div className="zi-tv-guessing" data-testid="zi-tv-guessing">
      <div className="zi-tv-guessing__main">
        {round.final && <p className="zi-tv-final-strip">Final round · don't go over · double points</p>}
        <span className="tv-label">
          {LANE_NAMES[round.question.lane]} · {round.question.topic}
        </span>
        <p className="zi-tv-question" data-testid="zi-tv-question">
          {round.question.prompt}
        </p>
        <span className="zi-tv-hint">{unitHint(round.question)} · guess on your phone</span>
      </div>
      <div className="zi-tv-guessing__side">
        {secondsLeft !== null && (
          <span className="tv-tote zi-tv-clock" role="timer" data-testid="zi-tv-clock">
            {secondsLeft}
          </span>
        )}
        <span className="tv-label">
          Locked in · {round.locked.length} of {state.players.length}
        </span>
        <ul className="zi-tv-locks" aria-label="Who has locked in">
          {state.players.map((id) => {
            const locked = round.locked.includes(id)
            return (
              <li key={id} className="zi-tv-lock" data-locked={locked || undefined} data-testid={`zi-tv-lock-${id}`}>
                <Chip look={looks[id]} size={36} />
                <span className="zi-tv-lock__name">{looks[id]?.name}</span>
                <span className="zi-tv-lock__state">{locked ? '✓ In' : '…'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ---------- The reveal: number line, then points and totals ----------

function LineChip({ point, look, lit, label }: { point: LinePoint; look: PlayerLook; lit: boolean; label: string }) {
  return (
    <li
      className="zi-tv-chip"
      data-lit={lit || undefined}
      data-way-off={point.wayOff ?? undefined}
      style={{ '--x': point.position, '--row': point.row } as CSSProperties}
      data-testid={`zi-tv-chip-${point.id}`}
    >
      <Chip look={look} size={40} />
      <span className="zi-tv-chip__value">{label}</span>
      {point.wayOff && <span className="zi-tv-chip__way-off">{point.wayOff === 'low' ? '◀ way off' : 'way off ▶'}</span>}
    </li>
  )
}

function Table({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  const results = round.results!
  const scores = totals(state)
  const showTotal = state.roundIndex > 0
  return (
    <table className="zi-tv-table" data-testid="zi-tv-table">
      <caption className="visually-hidden">Round {state.roundIndex + 1} points and totals</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">Player</span>
          </th>
          <th scope="col" className="zi-tv-table__num">
            {showTotal ? 'Round' : 'Points'}
          </th>
          {showTotal && (
            <th scope="col" className="zi-tv-table__num zi-tv-table__total">
              Total
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {roundOrder(state.players, results).map((id) => (
          <tr key={id}>
            <th scope="row">
              <span className="zi-tv-table__who">
                <Chip look={looks[id]} size={30} />
                <span className="zi-tv-table__name">{looks[id]?.name}</span>
              </span>
            </th>
            <td className="zi-tv-table__num">{showTotal ? `+${results[id].points}` : results[id].points}</td>
            {showTotal && <td className="zi-tv-table__num zi-tv-table__total">{scores[id].points}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Answer({ question, shown, final }: { question: Question; shown: boolean; final: boolean }) {
  return (
    <div className="zi-tv-answer" data-shown={shown || undefined} data-testid="zi-tv-answer">
      <span className="tv-label">{final ? 'Final answer' : 'The answer'}</span>
      <span className="zi-tv-answer__value">{shown ? amountText(question.answer, question) : '?'}</span>
    </div>
  )
}

function RingReveal({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  const results = round.results!
  const guesses = Object.fromEntries(Object.entries(results).flatMap(([id, r]) => (r.guess === null ? [] : [[id, r.guess]])))
  const line = layoutLine(round.question.answer, guesses)
  const places = [...new Set(Object.values(results).flatMap((r) => (r.place === null ? [] : [r.place])))].sort((a, b) => a - b)
  // Step 0: guesses on the line. 1: the answer drops. Then each place lights up. Last: points and totals.
  const last = places.length + 2
  const step = useSteps(last)
  const litPlaces = places.slice(0, Math.max(0, step - 1))
  const reach = Math.max(
    0,
    ...line.points.filter((p) => litPlaces.includes(results[p.id].place ?? -1)).map((p) => Math.abs(p.position - line.answerPosition)),
  )
  const exact = state.players.filter((id) => results[id].exact)

  return (
    <div className="zi-tv-reveal" data-testid="zi-tv-reveal">
      <div className="zi-tv-reveal__main">
        <Answer question={round.question} shown={step >= 1} final={false} />
        <div className="zi-tv-line" style={{ '--answer': line.answerPosition, '--reach': reach } as CSSProperties}>
          {step >= 1 && <span className="zi-tv-line__ring" aria-hidden="true" />}
          {step >= 1 && <span className="zi-tv-line__answer" aria-hidden="true" />}
          <ol className="zi-tv-chips" aria-label="Guesses">
            {line.points.map((point) => {
              const result = results[point.id]
              return (
                <LineChip
                  key={point.id}
                  point={point}
                  look={looks[point.id]}
                  lit={result.place !== null && litPlaces.includes(result.place)}
                  label={`${result.place !== null && litPlaces.includes(result.place) ? placeText(result.place) + ' · ' : ''}${amountText(point.value, round.question)}`}
                />
              )
            })}
          </ol>
          <span className="zi-tv-line__end zi-tv-line__end--low">{numberText(Math.round(line.low), round.question)}</span>
          <span className="zi-tv-line__end zi-tv-line__end--high">{numberText(Math.round(line.high), round.question)}</span>
        </div>
        {step >= last && exact.length > 0 && (
          <p className="zi-tv-mark" data-testid="zi-tv-on-the-mark">
            On the Mark! {exact.map((id) => looks[id]?.name).join(' and ')}
          </p>
        )}
        {step >= last && round.question.fact && <p className="zi-tv-fact">{round.question.fact}</p>}
      </div>
      <div className="zi-tv-reveal__side">{step >= last && <Table state={state} looks={looks} />}</div>
    </div>
  )
}

/** The final round: a count climbs from the lowest guess to the answer; guesses it passes are safe, the rest bust. */
function ClimbReveal({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  const results = round.results!
  const answer = round.question.answer
  const guesses = Object.fromEntries(Object.entries(results).flatMap(([id, r]) => (r.guess === null ? [] : [[id, r.guess]])))
  const line = layoutLine(answer, guesses)
  const start = Math.max(0, Math.min(answer, ...Object.values(guesses)))
  const [count, setCount] = useState(() => (prefersReducedMotion() ? answer : start))
  useEffect(() => {
    if (count >= answer) return
    const began = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const share = Math.min(1, (now - began) / CLIMB_MS)
      setCount(Math.round(start + (answer - start) * share))
      if (share < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // The climb runs once per reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const done = count >= answer
  const countPosition = Math.min(1, Math.max(0, (count - line.low) / (line.high - line.low)))
  const everyoneBust = state.players.every((id) => results[id].bust || results[id].guess === null)
  const winners = state.players.filter((id) => results[id].place === 1)

  return (
    <div className="zi-tv-reveal" data-testid="zi-tv-climb">
      <div className="zi-tv-reveal__main">
        <div className="zi-tv-climb__count">
          <span className="tv-label">{done ? 'Final answer' : 'Counting up'}</span>
          <span className="zi-tv-answer__value" data-testid="zi-tv-count">
            {amountText(count, round.question)}
          </span>
        </div>
        <div className="zi-tv-line" style={{ '--answer': line.answerPosition, '--count': countPosition } as CSSProperties}>
          <span className="zi-tv-line__climb" aria-hidden="true" />
          {done && <span className="zi-tv-line__answer" aria-hidden="true" />}
          <ol className="zi-tv-chips" aria-label="Guesses">
            {line.points.map((point) => {
              const result = results[point.id]
              const passed = point.value <= count
              const verdict = result.bust && done ? 'BUST' : passed ? 'SAFE' : ''
              return (
                <li
                  key={point.id}
                  className="zi-tv-chip"
                  data-lit={(passed && !result.bust) || undefined}
                  data-bust={(result.bust && done) || undefined}
                  data-winner={(done && result.place === 1) || undefined}
                  data-way-off={point.wayOff ?? undefined}
                  style={{ '--x': point.position, '--row': point.row } as CSSProperties}
                  data-testid={`zi-tv-chip-${point.id}`}
                >
                  <Chip look={looks[point.id]} size={40} />
                  <span className="zi-tv-chip__value">
                    {verdict && <strong>{verdict} · </strong>}
                    {amountText(point.value, round.question)}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
        {done && (
          <p className="zi-tv-mark" data-testid="zi-tv-climb-result">
            {everyoneBust ? 'Everybody busted! Nobody scores.' : `${winners.map((id) => looks[id]?.name).join(' and ')} ${winners.length > 1 ? 'win' : 'wins'} the final round`}
          </p>
        )}
      </div>
      <div className="zi-tv-reveal__side">{done && <Table state={state} looks={looks} />}</div>
    </div>
  )
}

// ---------- Final standings ----------

function Standings({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const scores = totals(state)
  const places = rules.finishingOrder(state)
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  return (
    <ol className="zi-tv-standings" aria-label="Final standings" data-testid="zi-tv-standings">
      {places.map((place, i) =>
        place.map((id) => (
          <li key={id} className="zi-tv-standings__row" data-top={i === 0 || undefined}>
            <span className="zi-tv-standings__place">{place.length > 1 ? `Tied ${placeText(rankOf(i))}` : placeText(rankOf(i))}</span>
            <Chip look={looks[id]} size={40} />
            <span className="zi-tv-standings__name">{looks[id]?.name}</span>
            <span className="zi-tv-standings__points">{scores[id].points}</span>
          </li>
        )),
      )}
    </ol>
  )
}

export function TvScreen(props: TvScreenProps) {
  const { state } = props
  let body: ReactNode
  if (state.phase === 'guessing') body = <Guessing key={state.roundIndex} {...props} />
  else if (state.phase === 'reveal') {
    body = currentRound(state).final ? <ClimbReveal key={state.roundIndex} {...props} /> : <RingReveal key={state.roundIndex} {...props} />
  } else body = <Standings {...props} />
  return <div className="zi-tv-body">{body}</div>
}

/** Before the game: how it plays, while the host picks settings on their phone. */
export function TvWaiting() {
  return (
    <div className="zi-tv-waiting" data-testid="zi-tv-waiting">
      <span className="tv-label">How to play</span>
      <ol className="zi-tv-steps">
        {howToPlay.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="zi-tv-hint">Closest scores 3, then 2 and 1. Exact hit: 2 more. The final round doubles everything.</p>
    </div>
  )
}
