// ABOUTME: Dibs on the TV: the category alone with the scoreboard, the letter drop and race (who's in, never what), answers
// ABOUTME: filling in by claim order with Taken callouts and challenges, each vote and its named verdict, round scores and the final standings.
import { useEffect, useState, type ReactNode } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { bounceText, reasonText, secondsAt } from './format'
import { howToPlay } from './howToPlay'
import { currentChallenge, currentRound, nearDuplicateOf, rules, totals, votersFor, type DibsState, type Round } from './rules'
import '../../ui/TvGame.css'
import './TvScreen.css'

interface TvScreenProps {
  /** The room's public state: no letter before it drops, no answers during the race, no votes before the verdict. */
  state: DibsState
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left in the timed step, or null when nothing is timed. */
  secondsLeft: number | null
}

/** Time between answers filling in at review. */
const STEP_MS = 500
/** Answers in one column before the list takes a second. */
const ROWS_PER_COLUMN = 5

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

function namesOf(looks: Record<PlayerId, PlayerLook>, ids: readonly PlayerId[]): string {
  return ids.map((id) => looks[id]?.name).join(', ')
}

function Clock({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft === null) return null
  return (
    <span className="tv-tote db-tv-clock" role="timer" data-low={secondsLeft <= 5 || undefined} data-testid="db-tv-clock">
      {secondsLeft}
    </span>
  )
}

/** Everyone's total so far, in order: the strip under the category. */
function ScoreStrip({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const scores = totals(state)
  const order = [...state.players].sort((a, b) => scores[b].points - scores[a].points)
  return (
    <ol className="db-tv-strip" aria-label="Scores so far" data-testid="db-tv-strip">
      {order.map((id) => (
        <li key={id} className="db-tv-strip__item">
          <PlayerDot look={looks[id]} size={34} />
          <span className="db-tv-strip__name">{looks[id]?.name}</span>
          <span className="db-tv-strip__points">{scores[id].points}</span>
        </li>
      ))}
    </ol>
  )
}

// ---------- T1 category, T2 race, T8 Deal again ----------

function CategoryAlone({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  return (
    <div className="db-tv-category" data-testid="db-tv-category">
      <span className="tv-label">Category</span>
      <p className="db-tv-category__name">{round.category.name}</p>
      <p className="db-tv-category__coming">Letter coming</p>
      {state.roundIndex > 0 && <ScoreStrip state={state} looks={looks} />}
    </div>
  )
}

function Race({ state, looks, secondsLeft }: TvScreenProps) {
  const round = currentRound(state)
  const inCount = round.claims.length + round.out.length
  return (
    <div className="db-tv-split" data-testid="db-tv-race">
      <div className="db-tv-race">
        <span className="tv-label">{round.category.name}</span>
        <p key={round.letter} className="db-tv-letter" data-testid="db-tv-letter">
          {round.letter}
        </p>
        {round.dealtAgain > 0 ? (
          <p className="db-tv-note" data-testid="db-tv-dealt-again">
            New letter dealt. This round still counts once.
          </p>
        ) : (
          <p className="db-tv-note">One answer each. First claim keeps it.</p>
        )}
      </div>
      <div className="db-tv-side">
        <Clock secondsLeft={secondsLeft} />
        <span className="tv-label">
          In · {inCount} of {state.players.length}
        </span>
        <ul className="db-tv-people" aria-label="Who has answered">
          {state.players.map((id) => {
            const claimed = round.claims.some((c) => c.player === id)
            const out = round.out.includes(id)
            return (
              <li key={id} className="db-tv-person" data-in={claimed || out || undefined} data-testid={`db-tv-in-${id}`}>
                <PlayerDot look={looks[id]} size={34} />
                <span className="db-tv-person__name">{looks[id]?.name}</span>
                <span className="db-tv-person__state">{claimed ? '✓ In' : out ? 'Out' : '…'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ---------- T3 reveal and T4 challenge window ----------

function AnswerCard({ round, index, looks }: { round: Round; index: number; looks: Record<PlayerId, PlayerLook> }) {
  const claim = round.claims[index]
  const near = nearDuplicateOf(round, claim)
  const challenge = round.challenges.find((c) => c.author === claim.player)
  const names = Object.fromEntries(Object.entries(looks).map(([id, look]) => [id, look.name]))
  const notes = [
    ...bounceText(round, claim, names).map((line) => `Dibs! ${line}`),
    ...(challenge ? [`Challenged by ${namesOf(looks, challenge.challengers)}`] : []),
  ]
  return (
    <li className="db-tv-answer" data-challenged={challenge ? 'true' : undefined} data-testid={`db-tv-answer-${claim.player}`}>
      <span className="db-tv-answer__time">{secondsAt(claim.at)}</span>
      <PlayerDot look={looks[claim.player]} size={34} />
      <span className="db-tv-answer__main">
        <span className="db-tv-answer__text">
          {claim.text}
          {near && <span className="db-tv-answer__near"> ? close to {near.text}</span>}
        </span>
        <span className="db-tv-answer__who">
          {looks[claim.player]?.name}
          {notes.length > 0 && ` · ${notes.join(' · ')}`}
        </span>
      </span>
    </li>
  )
}

function Review({ state, looks, secondsLeft }: TvScreenProps) {
  const round = currentRound(state)
  const shown = useSteps(round.claims.length)
  const missing = state.players.filter((id) => !round.claims.some((c) => c.player === id))
  const columns = round.claims.length > ROWS_PER_COLUMN ? 2 : 1
  return (
    <div className="db-tv-split" data-testid="db-tv-review">
      <div className="db-tv-review">
        <span className="tv-label">
          {round.category.name} · {round.letter}
        </span>
        <ol className="db-tv-answers" data-columns={columns} aria-label="Answers in the order they were claimed">
          {round.claims.slice(0, shown).map((claim, index) => (
            <AnswerCard key={claim.player} round={round} index={index} looks={looks} />
          ))}
        </ol>
        {shown >= round.claims.length && missing.length > 0 && <p className="db-tv-note">No answer: {namesOf(looks, missing)}</p>}
      </div>
      <div className="db-tv-side">
        <Clock secondsLeft={secondsLeft} />
        <span className="tv-label">
          Done · {round.done.length} of {state.players.length}
        </span>
        <p className="db-tv-note">Think an answer doesn't fit? Challenge it on your phone. A failed challenge costs 1 point.</p>
      </div>
    </div>
  )
}

// ---------- T5 vote and T6 verdict ----------

function ChallengedAnswer({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  const challenge = currentChallenge(state)!
  const claim = round.claims.find((c) => c.player === challenge.author)!
  return (
    <div className="db-tv-challenge">
      <span className="tv-label">
        Challenge {round.voteIndex + 1} of {round.challenges.length} · {round.category.name} · {round.letter}
      </span>
      <p className="db-tv-challenge__answer" data-testid="db-tv-challenged-answer">
        {claim.text}
      </p>
      <p className="db-tv-challenge__who">
        <PlayerDot look={looks[challenge.author]} size={40} />
        {looks[challenge.author]?.name}'s answer, challenged by {namesOf(looks, challenge.challengers)}
      </p>
    </div>
  )
}

function Vote({ state, looks, secondsLeft }: TvScreenProps) {
  const challenge = currentChallenge(state)!
  const voters = votersFor(state, challenge)
  return (
    <div className="db-tv-split" data-testid="db-tv-vote">
      <div className="db-tv-main">
        <ChallengedAnswer state={state} looks={looks} />
        <p className="db-tv-note">Valid or not valid? Vote on your phone. A tie keeps the answer.</p>
      </div>
      <div className="db-tv-side">
        <Clock secondsLeft={secondsLeft} />
        <span className="tv-label">
          Votes in · {Object.keys(challenge.votes).length} of {voters.length}
        </span>
        <ul className="db-tv-people" aria-label="Who has voted">
          {voters.map((id) => (
            <li key={id} className="db-tv-person" data-in={id in challenge.votes || undefined}>
              <PlayerDot look={looks[id]} size={34} />
              <span className="db-tv-person__name">{looks[id]?.name}</span>
              <span className="db-tv-person__state">{id in challenge.votes ? '✓ Voted' : '…'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Verdict({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const challenge = currentChallenge(state)!
  const kept = challenge.outcome === 'valid'
  const byVote = (vote: string) => Object.keys(challenge.votes).filter((id) => challenge.votes[id] === vote)
  const valid = byVote('valid')
  const notValid = byVote('not-valid')
  return (
    <div className="db-tv-split" data-testid="db-tv-verdict">
      <div className="db-tv-main">
        <ChallengedAnswer state={state} looks={looks} />
        <p className="db-tv-effect" data-testid="db-tv-verdict-effect">
          {kept
            ? `The answer stands. ${namesOf(looks, challenge.challengers)} ${challenge.challengers.length === 1 ? 'loses' : 'each lose'} 1 point.`
            : `${looks[challenge.author]?.name} scores 0 this round. Everyone after moves up.`}
        </p>
      </div>
      <div className="db-tv-side db-tv-side--verdict">
        <p className="db-tv-stamp" data-kept={kept || undefined} data-testid="db-tv-stamp">
          {kept ? 'Valid' : 'Not valid'}
        </p>
        <span className="tv-label">Valid</span>
        <p className="db-tv-voters">{valid.length ? namesOf(looks, valid) : 'Nobody'}</p>
        <span className="tv-label">Not valid</span>
        <p className="db-tv-voters">{notValid.length ? namesOf(looks, notValid) : 'Nobody'}</p>
      </div>
    </div>
  )
}

// ---------- T7 round scores and T9 final standings ----------

function Scores({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const results = currentRound(state).results!
  const scores = totals(state)
  const order = [...state.players].sort((a, b) => scores[b].points - scores[a].points || scores[b].roundWins - scores[a].roundWins)
  return (
    <table className="db-tv-table" data-testid="db-tv-scores">
      <caption className="visually-hidden">Round {state.roundIndex + 1} points and totals</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">Player</span>
          </th>
          <th scope="col">Answer</th>
          <th scope="col" className="db-tv-table__num">
            Round
          </th>
          <th scope="col" className="db-tv-table__num">
            Wins
          </th>
          <th scope="col" className="db-tv-table__num db-tv-table__total">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {order.map((id) => {
          const result = results[id]
          const net = result.points - result.penalty
          return (
            <tr key={id} data-testid={`db-tv-score-${id}`}>
              <th scope="row">
                <span className="db-tv-table__who">
                  <PlayerDot look={looks[id]} size={30} />
                  <span className="db-tv-table__name">{looks[id]?.name}</span>
                </span>
              </th>
              <td>
                <span className="db-tv-table__answer" data-out={result.valid ? undefined : 'true'}>
                  {result.answer ?? '-'}
                </span>
                <span className="db-tv-table__how">{reasonText(result)}</span>
              </td>
              <td className="db-tv-table__num">{net >= 0 ? `+${net}` : net}</td>
              <td className="db-tv-table__num">{scores[id].roundWins}</td>
              <td className="db-tv-table__num db-tv-table__total">{scores[id].points}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const PLACES = ['1st', '2nd', '3rd']

function placeText(n: number): string {
  return PLACES[n - 1] ?? `${n}th`
}

/** "Tied on 31. KaliBear wins on round wins, 4 to 3", when round wins decided the winner. */
function tieText(state: DibsState, looks: Record<PlayerId, PlayerLook>): string | null {
  const [first, second] = rules.finishingOrder(state)
  if (!first || !second || first.length > 1) return null
  const scores = totals(state)
  const [a, b] = [scores[first[0]], scores[second[0]]]
  if (a.points !== b.points) return null
  return `Tied on ${a.points}. ${looks[first[0]]?.name} wins on round wins, ${a.roundWins} to ${b.roundWins}.`
}

function Standings({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const scores = totals(state)
  const places = rules.finishingOrder(state)
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  const tie = tieText(state, looks)
  return (
    <div className="db-tv-final" data-testid="db-tv-standings">
      {tie && (
        <p className="db-tv-tie" data-testid="db-tv-tie">
          {tie}
        </p>
      )}
      <ol className="db-tv-standings" aria-label="Final standings">
        {places.map((place, i) =>
          place.map((id) => (
            <li key={id} className="db-tv-standings__row" data-top={i === 0 || undefined}>
              <span>{place.length > 1 ? `Tied ${placeText(rankOf(i))}` : placeText(rankOf(i))}</span>
              <PlayerDot look={looks[id]} size={40} />
              <span className="db-tv-standings__name">{looks[id]?.name}</span>
              <span className="db-tv-standings__points">{scores[id].points}</span>
            </li>
          )),
        )}
      </ol>
    </div>
  )
}

export function TvScreen(props: TvScreenProps) {
  const { state } = props
  const round = currentRound(state)
  let body: ReactNode
  switch (state.phase) {
    case 'category':
      body = <CategoryAlone state={state} looks={props.looks} />
      break
    case 'race':
      body = <Race {...props} />
      break
    case 'review':
      body = <Review key={state.roundIndex} {...props} />
      break
    case 'vote':
      body = <Vote {...props} />
      break
    case 'verdict':
      body = <Verdict key={round.voteIndex} state={state} looks={props.looks} />
      break
    case 'scores':
      body = <Scores state={state} looks={props.looks} />
      break
    default:
      body = <Standings state={state} looks={props.looks} />
  }
  return <div className="db-tv-body">{body}</div>
}

/** Before the game: how it plays, while the host picks settings on their phone. */
export function TvWaiting() {
  return (
    <div className="db-tv-waiting" data-testid="db-tv-waiting">
      <span className="tv-label">How to play</span>
      <ol className="db-tv-steps">
        {howToPlay.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="db-tv-note">Any good answer scores 2. The first three good answers score 5, 4 and 3.</p>
    </div>
  )
}
