// ABOUTME: Dial It In on the TV: the card's two opposites, the dial and who gives the clue while guessers lock in (never what),
// ABOUTME: then the target on the dial with every guess marked by its player, round points and totals, and the final standings.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { dialPosition, layoutMarks } from './dialMarks'
import { BULLSEYE_POINTS, currentRound, guessersFor, rules, totalScores, type DialItInState, type Round } from './rules'
import '../../ui/TvGame.css'
import './TvScreen.css'

interface TvScreenProps {
  /** The room's public state: no target and no guesses (only who has guessed) until the reveal. */
  state: DialItInState
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left to guess, or null when nothing is timed. */
  secondsLeft: number | null
}

/** Time between reveal steps: the guesses on the dial, the target dropping, then points and totals. */
const STEP_MS = 900
/** More players than this and the final standings tighten up to fit the panel. */
const ROOMY_STANDINGS = 8

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

/** The card's two opposites, with the target between them once it may be seen ("?" until then). */
function Card({ round, target }: { round: Round; target: number | null }) {
  return (
    <div className="dii-tv-card" data-testid="dii-tv-card">
      <span className="dii-tv-card__end" data-testid="dii-tv-left">
        {round.card.left}
      </span>
      <span className="dii-tv-target" data-shown={target !== null || undefined}>
        <span className="tv-label">Target</span>
        <span className="dii-tv-target__value" data-testid="dii-tv-target">
          {target ?? '?'}
        </span>
      </span>
      <span className="dii-tv-card__end dii-tv-card__end--right" data-testid="dii-tv-right">
        {round.card.right}
      </span>
    </div>
  )
}

function Scale({ range, note }: { range: number; note?: string }) {
  return (
    <div className="dii-tv-scale">
      <span>1</span>
      {note && <span className="dii-tv-scale__note">{note}</span>}
      <span>{range}</span>
    </div>
  )
}

// ---------- Guessing: the card, the clue giver and who has locked in ----------

function Guessing({ state, looks, secondsLeft }: TvScreenProps) {
  const round = currentRound(state)
  const guessers = guessersFor(state, round)
  const lockedIn = guessers.filter((id) => id in round.guesses)
  return (
    <div className="dii-tv-split" data-testid="dii-tv-guessing">
      <div className="dii-tv-main dii-tv-main--guessing">
        <div className="dii-tv-giver" data-testid="dii-tv-giver">
          <PlayerDot look={looks[round.clueGiver]} size={56} />
          <span className="dii-tv-giver__words">
            <span className="tv-label">Gives the clue out loud</span>
            <span className="dii-tv-giver__name">{looks[round.clueGiver]?.name}</span>
          </span>
        </div>
        <Card round={round} target={null} />
        <div className="dii-tv-dial" aria-hidden="true">
          <span className="dii-tv-dial__track" />
        </div>
        <Scale range={state.range} />
        <p className="dii-tv-note">
          Where does the clue land? Guess 1 to {state.range} on your phone.
        </p>
      </div>
      <div className="dii-tv-side">
        <div className="dii-tv-count">
          {secondsLeft !== null && (
            <span className="tv-tote dii-tv-clock" role="timer" data-low={secondsLeft <= 10 || undefined} data-testid="dii-tv-clock">
              {secondsLeft}
            </span>
          )}
          <span className="tv-label">
            Locked in · {lockedIn.length} of {guessers.length}
          </span>
        </div>
        <ul className="dii-tv-people" aria-label="Who has locked in a guess">
          {guessers.map((id) => {
            const locked = id in round.guesses
            return (
              <li key={id} className="dii-tv-person" data-in={locked || undefined} data-testid={`dii-tv-lock-${id}`}>
                <PlayerDot look={looks[id]} size={30} />
                <span className="dii-tv-person__name">{looks[id]?.name}</span>
                <span className="dii-tv-person__state">{locked ? '✓ In' : '…'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ---------- The reveal: guesses on the dial, the target, then points and totals ----------

/** Guessers from closest to farthest (no guess last), then the clue giver. */
function revealOrder(state: DialItInState, round: Round): PlayerId[] {
  const miss = (id: PlayerId) => (id in round.guesses ? Math.abs(round.guesses[id] - round.target) : Infinity)
  const guessers = [...guessersFor(state, round)].sort((a, b) => miss(a) - miss(b))
  return [...guessers, round.clueGiver]
}

function Table({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  const totals = totalScores(state)
  const showTotal = state.roundIndex > 0
  return (
    <table className="dii-tv-table" data-testid="dii-tv-table">
      <caption className="visually-hidden">Round {state.roundIndex + 1} guesses, points and totals</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">Player</span>
          </th>
          <th scope="col" className="dii-tv-table__num">
            Guess
          </th>
          <th scope="col" className="dii-tv-table__num">
            {showTotal ? 'Round' : 'Points'}
          </th>
          {showTotal && (
            <th scope="col" className="dii-tv-table__num dii-tv-table__total">
              Total
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {revealOrder(state, round).map((id) => (
          <tr key={id} data-testid={`dii-tv-row-${id}`}>
            <th scope="row">
              <span className="dii-tv-table__who">
                <PlayerDot look={looks[id]} size={26} />
                <span className="dii-tv-table__name">{looks[id]?.name}</span>
              </span>
            </th>
            {id === round.clueGiver ? (
              <td colSpan={2} className="dii-tv-table__gave">
                Gave the clue
              </td>
            ) : (
              <>
                <td className="dii-tv-table__num">{round.guesses[id] ?? 'None'}</td>
                <td className="dii-tv-table__num">{showTotal ? `+${round.points[id] ?? 0}` : (round.points[id] ?? 0)}</td>
              </>
            )}
            {showTotal && <td className="dii-tv-table__num dii-tv-table__total">{totals[id]}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Reveal({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  // Step 0: the guesses on the dial. 1: the target drops. 2: points and totals.
  const step = useSteps(2)
  const marks = layoutMarks(round.guesses, state.range)
  const rows = Math.max(1, ...marks.map((mark) => mark.row + 1))
  // Guesses inside this stretch of the dial score: one point less per step away from the target.
  const reach = BULLSEYE_POINTS * (state.range / 50)
  const zone = {
    '--target': dialPosition(round.target, state.range),
    '--zone-from': Math.max(0, dialPosition(round.target - reach, state.range)),
    '--zone-to': Math.min(1, dialPosition(round.target + reach, state.range)),
    '--rows': rows,
  } as CSSProperties
  const bullseyes = guessersFor(state, round).filter((id) => round.points[id] === BULLSEYE_POINTS)
  const targetShown = step >= 1
  const giverName = looks[round.clueGiver]?.name
  let result = `${giverName} gave the clue`
  if (bullseyes.length > 2) result = `${bullseyes.length} bullseyes off ${giverName}'s clue!`
  else if (bullseyes.length > 0) result = `Bullseye! ${bullseyes.map((id) => looks[id]?.name).join(' and ')}`

  return (
    <div className="dii-tv-split dii-tv-split--reveal" data-testid="dii-tv-reveal">
      <div className="dii-tv-main">
        <Card round={round} target={targetShown ? round.target : null} />
        <div className="dii-tv-dial dii-tv-dial--marked" style={zone}>
          <span className="dii-tv-dial__track" aria-hidden="true">
            {targetShown && <span className="dii-tv-dial__zone" />}
          </span>
          {targetShown && <span className="dii-tv-dial__pin" aria-hidden="true" />}
          <ul className="dii-tv-marks" aria-label="Guesses on the dial">
            {marks.map((mark) => (
              <li
                key={mark.id}
                className="dii-tv-mark"
                data-missed={(targetShown && !round.points[mark.id]) || undefined}
                style={{ '--x': mark.position, '--row': mark.row } as CSSProperties}
                data-testid={`dii-tv-mark-${mark.id}`}
              >
                <PlayerDot look={looks[mark.id]} size={32} />
                <span className="visually-hidden">
                  {looks[mark.id]?.name}: {mark.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Scale range={state.range} note={targetShown ? 'Shaded: guesses here score' : undefined} />
        <p className="dii-tv-note dii-tv-note--result" data-testid="dii-tv-bullseye">
          {step >= 2 && result}
        </p>
      </div>
      <div className="dii-tv-side">{step >= 2 && <Table state={state} looks={looks} />}</div>
    </div>
  )
}

// ---------- Final standings ----------

const PLACES = ['1st', '2nd', '3rd']

function placeText(n: number): string {
  return PLACES[n - 1] ?? `${n}th`
}

function Standings({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const totals = totalScores(state)
  const places = rules.finishingOrder(state)
  /** 1 plus everyone in better places, so two tied for 1st are followed by 3rd. */
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  const roomy = state.players.length <= ROOMY_STANDINGS
  return (
    <ol className="dii-tv-standings" data-roomy={roomy || undefined} aria-label="Final standings" data-testid="dii-tv-standings">
      {places.map((place, i) =>
        place.map((id) => (
          <li key={id} className="dii-tv-standings__row" data-top={i === 0 || undefined} data-testid={`dii-tv-final-${id}`}>
            <span>{place.length > 1 ? `Tied ${placeText(rankOf(i))}` : placeText(rankOf(i))}</span>
            <PlayerDot look={looks[id]} size={roomy ? 40 : 30} />
            <span className="dii-tv-standings__name">{looks[id]?.name}</span>
            <span className="dii-tv-standings__points">{totals[id]}</span>
          </li>
        )),
      )}
    </ol>
  )
}

export function TvScreen(props: TvScreenProps) {
  const { state } = props
  let body: ReactNode
  if (state.phase === 'guessing') body = <Guessing {...props} />
  else if (state.phase === 'reveal') body = <Reveal key={state.roundIndex} state={state} looks={props.looks} />
  else body = <Standings state={state} looks={props.looks} />
  return <div className="dii-tv-body">{body}</div>
}
