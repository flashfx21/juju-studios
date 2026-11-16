// ABOUTME: Dibs on a player's phone: the category, the letter drop and the race (Taken and wrong-letter bounces), the review
// ABOUTME: with challenges, the votes and verdicts, the round's points with the host's Next, and the final standings.
import { useState, type FormEvent, type ReactNode } from 'react'
import type { PlayerId } from '../types'
import {
  canDealAgain,
  CHALLENGES_PER_ROUND,
  challengesMade,
  currentChallenge,
  currentRound,
  fitsLetter,
  MAX_ANSWER_LENGTH,
  nearDuplicateOf,
  rules,
  totals,
  votersFor,
  type Claim,
  type DibsInput,
  type DibsState,
  type Round,
} from './rules'
import '../../ui/PhoneForm.css'
import { reasonText, secondsAt } from './format'
import './PhoneScreen.css'

interface PhoneScreenProps {
  state: DibsState
  player: PlayerId
  /** Display names by player id. */
  names: Record<PlayerId, string>
  /** The host's phone gets Deal again during the race and Next at the scores. */
  isHost: boolean
  /** Seconds left in the timed step. Null or missing when nothing is timed. */
  secondsLeft?: number | null
  onInput: (input: DibsInput) => void
  onDealAgain: () => void
  onNext: () => void
  /** Shown under the final standings, such as Play again. */
  summaryAction?: ReactNode
}


export function DibsTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Dibs
      </span>
      <h1 className="phone-top__title">Dibs</h1>
    </div>
  )
}

function CategoryCard({ round }: { round: Round }) {
  return (
    <div className="cue-card db-category" data-testid="db-category">
      <p className="db-category__label">Category</p>
      <p className="db-category__name">{round.category.name}</p>
      {round.letter ? (
        <p className="db-letter" data-testid="db-letter" aria-label={`Letter ${round.letter}`}>
          {round.letter}
        </p>
      ) : (
        <p className="db-letter db-letter--coming" data-testid="db-letter-coming">
          Letter coming
        </p>
      )}
    </div>
  )
}

/** People still racing, for "Waiting for 3 players". */
function stillRacing(state: DibsState): number {
  const round = currentRound(state)
  return state.players.filter((id) => !round.out.includes(id) && !round.claims.some((c) => c.player === id)).length
}

function waitingText(count: number): string {
  return count === 0 ? 'Everyone is in' : `Waiting for ${count} ${count === 1 ? 'player' : 'players'}`
}

interface AnswerEntryProps {
  round: Round
  player: PlayerId
  onInput: (input: DibsInput) => void
}

/** The answer box with Submit and I'm out. Wrong letters are caught here; Taken comes back from the host. */
function AnswerEntry({ round, player, onInput }: AnswerEntryProps) {
  const [typed, setTyped] = useState('')
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')
  const note = round.notes[player]
  const noteShown = note && note.text === sent && sent === typed.trim() ? note : undefined
  const checking = sent !== '' && sent === typed.trim() && !noteShown

  function submit(event: FormEvent) {
    event.preventDefault()
    const answer = typed.trim()
    if (!answer) {
      setError('Type an answer.')
      return
    }
    if (!fitsLetter(answer, round.letter)) {
      setError(`Must start with ${round.letter}`)
      return
    }
    setError('')
    setSent(answer)
    onInput({ type: 'answer', text: answer })
  }

  const message = error || (noteShown?.kind === 'taken' ? 'TAKEN, try another' : noteShown ? `Must start with ${round.letter}` : '')
  return (
    <form className="db-entry" noValidate onSubmit={submit}>
      <div className="cue-card">
        <label className="visually-hidden" htmlFor="db-answer">
          Your answer
        </label>
        <div className="field__box">
          <input
            id="db-answer"
            className="field__input db-entry__input"
            type="text"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="send"
            maxLength={MAX_ANSWER_LENGTH}
            value={typed}
            aria-invalid={message ? true : undefined}
            aria-describedby="db-answer-message"
            data-testid="db-answer-input"
            onChange={(event) => {
              setTyped(event.target.value)
              setError('')
            }}
          />
        </div>
        <p
          className="db-entry__message"
          id="db-answer-message"
          role="status"
          data-kind={noteShown?.kind ?? (error ? 'error' : undefined)}
          data-testid="db-answer-message"
        >
          {message || (checking ? 'Checking' : '')}
        </p>
      </div>
      <div className="db-entry__buttons">
        <button type="submit" className="phone-button" data-testid="db-submit">
          Submit
        </button>
        <button type="button" className="phone-button phone-button--secondary" data-testid="db-out" onClick={() => onInput({ type: 'out' })}>
          I'm out
        </button>
      </div>
    </form>
  )
}

function Race({ state, player, isHost, onInput, onDealAgain }: PhoneScreenProps) {
  const round = currentRound(state)
  const claim = round.claims.find((c) => c.player === player)
  const out = round.out.includes(player)
  return (
    <>
      <CategoryCard round={round} />
      {round.dealtAgain > 0 && (
        <p className="db-status" data-testid="db-dealt-again">
          New letter. This round still counts once.
        </p>
      )}
      {claim || out ? (
        <>
          <p className="db-headline" data-testid="db-locked">
            {claim ? `Locked in: ${claim.text}` : "You're out this round"}
          </p>
          <p className="db-status" role="status">
            {waitingText(stillRacing(state))}
          </p>
        </>
      ) : (
        <AnswerEntry key={`${state.roundIndex}-${round.dealtAgain}`} round={round} player={player} onInput={onInput} />
      )}
      {isHost && canDealAgain(state) && (
        <button type="button" className="phone-button phone-button--secondary" data-testid="db-deal-again" onClick={onDealAgain}>
          Deal again (new letter)
        </button>
      )}
    </>
  )
}

/** The claim's "Taken" callouts: everyone who tried the same answer after it. */
function bounceText(round: Round, claim: Claim, names: Record<PlayerId, string>): string[] {
  return round.bounces
    .filter((bounce) => bounce.owner === claim.player)
    .map((bounce) => `${secondsAt(bounce.at - claim.at)} before ${names[bounce.player]}`)
}

interface AnswerRowProps {
  round: Round
  claim: Claim
  names: Record<PlayerId, string>
  /** The challenge control on this row, if any. */
  action?: ReactNode
  /** Extra words after the author, such as how the vote went. */
  aside?: string
}

function AnswerRow({ round, claim, names, action, aside }: AnswerRowProps) {
  const near = nearDuplicateOf(round, claim)
  const challenge = round.challenges.find((c) => c.author === claim.player)
  return (
    <li className="db-answers__row" data-testid={`db-answer-${claim.player}`}>
      <span className="db-answers__time">{secondsAt(claim.at)}</span>
      <span className="db-answers__main">
        <span className="db-answers__text">
          {claim.text}
          {near && (
            <span className="db-answers__near" data-testid={`db-near-${claim.player}`}>
              {' '}
              ? close to {near.text}
            </span>
          )}
        </span>
        <span className="db-answers__who">
          {names[claim.player]}
          {aside ? `: ${aside}` : ''}
        </span>
        {bounceText(round, claim, names).map((line) => (
          <span key={line} className="db-answers__taken">
            Dibs! {line}
          </span>
        ))}
        {challenge && <span className="db-answers__challenged">Challenged by {challenge.challengers.map((id) => names[id]).join(', ')}</span>}
      </span>
      {action}
    </li>
  )
}

/** Players with no answer this round, shown as a dash after the answers. */
function NoAnswers({ state, names }: { state: DibsState; names: Record<PlayerId, string> }) {
  const round = currentRound(state)
  const missing = state.players.filter((id) => !round.claims.some((c) => c.player === id))
  if (missing.length === 0) return null
  return (
    <p className="db-status" data-testid="db-no-answers">
      No answer: {missing.map((id) => names[id]).join(', ')}
    </p>
  )
}

function Review({ state, player, names, onInput }: PhoneScreenProps) {
  const round = currentRound(state)
  const done = round.done.includes(player)
  const used = challengesMade(round, player)
  const left = CHALLENGES_PER_ROUND - used
  return (
    <>
      <p className="db-headline">
        {round.category.name}: {round.letter}
      </p>
      <ol className="db-answers" aria-label="Answers in the order they were claimed">
        {round.claims.map((claim) => {
          const mine = claim.player === player
          const challenged = round.challenges.some((c) => c.author === claim.player && c.challengers.includes(player))
          const blocked = done || (!challenged && left <= 0)
          const action = mine ? (
            <span className="db-answers__yours">Yours</span>
          ) : (
            <button
              type="button"
              className="db-answers__challenge"
              aria-pressed={challenged}
              aria-disabled={blocked && !challenged ? 'true' : undefined}
              aria-label={`${challenged ? 'Take back challenge on' : 'Challenge'} ${claim.text}`}
              data-testid={`db-challenge-${claim.player}`}
              onClick={() => {
                if (done) return
                if (challenged) onInput({ type: 'withdraw' })
                else if (!blocked) onInput({ type: 'challenge', author: claim.player })
              }}
            >
              {challenged ? 'Challenged' : 'Challenge'}
            </button>
          )
          return <AnswerRow key={claim.player} round={round} claim={claim} names={names} action={action} />
        })}
      </ol>
      <NoAnswers state={state} names={names} />
      {done ? (
        <p className="db-status" role="status" data-testid="db-done-waiting">
          Done. {round.done.length} of {state.players.length} done
        </p>
      ) : (
        <>
          <p className="db-status" data-testid="db-challenges-left">
            {left > 0 ? `${left} challenge left. A failed challenge costs 1 point.` : 'Challenge used. Tap it again to take it back.'}
          </p>
          <button type="button" className="phone-button" data-testid="db-done" onClick={() => onInput({ type: 'done' })}>
            Done
          </button>
        </>
      )}
    </>
  )
}

function ChallengeCard({ state, names }: { state: DibsState; names: Record<PlayerId, string> }) {
  const round = currentRound(state)
  const challenge = currentChallenge(state)!
  const claim = round.claims.find((c) => c.player === challenge.author)!
  return (
    <div className="cue-card db-challenge" data-testid="db-challenge-card">
      <p className="db-category__label">
        Challenge {round.voteIndex + 1} of {round.challenges.length}
      </p>
      <p className="db-challenge__answer">{claim.text}</p>
      <p className="db-challenge__who">
        {names[challenge.author]}'s answer, challenged by {challenge.challengers.map((id) => names[id]).join(', ')}
      </p>
      <p className="db-challenge__category">
        {round.category.name}: {round.letter}
      </p>
    </div>
  )
}

function VoteScreen({ state, player, names, onInput }: PhoneScreenProps) {
  const challenge = currentChallenge(state)!
  const voters = votersFor(state, challenge)
  const mine = challenge.votes[player]
  const cast = Object.keys(challenge.votes).length
  return (
    <>
      <ChallengeCard state={state} names={names} />
      {challenge.author === player && (
        <p className="db-headline" data-testid="db-being-challenged">
          Your answer is being challenged
        </p>
      )}
      {voters.includes(player) &&
        (mine === 'valid' || mine === 'not-valid' ? (
          <p className="db-headline" data-testid="db-vote-in">
            Vote in: {mine === 'valid' ? 'Valid' : 'Not valid'}
          </p>
        ) : (
          <div className="db-vote">
            {state.players.length === 2 && challenge.author === player && (
              <p className="db-status">With 2 players you vote too. A tie keeps your answer.</p>
            )}
            <button type="button" className="phone-button" data-testid="db-vote-valid" onClick={() => onInput({ type: 'vote', vote: 'valid' })}>
              Valid
            </button>
            <button
              type="button"
              className="phone-button phone-button--secondary"
              data-testid="db-vote-not-valid"
              onClick={() => onInput({ type: 'vote', vote: 'not-valid' })}
            >
              Not valid
            </button>
          </div>
        ))}
      <p className="db-status" role="status" data-testid="db-votes-in">
        {cast} of {voters.length} votes in. A tie keeps the answer.
      </p>
    </>
  )
}

function Verdict({ state, names }: PhoneScreenProps) {
  const challenge = currentChallenge(state)!
  const kept = challenge.outcome === 'valid'
  const byVote = (vote: string) =>
    Object.entries(challenge.votes)
      .filter(([, v]) => v === vote)
      .map(([id]) => names[id])
  const valid = byVote('valid')
  const notValid = byVote('not-valid')
  return (
    <>
      <ChallengeCard state={state} names={names} />
      <p className="db-stamp" data-kept={kept ? 'true' : undefined} role="status" data-testid="db-verdict">
        {kept ? 'Valid' : 'Not valid'}
      </p>
      <ul className="db-votes" aria-label="How everyone voted">
        <li>Valid: {valid.length ? valid.join(', ') : 'nobody'}</li>
        <li>Not valid: {notValid.length ? notValid.join(', ') : 'nobody'}</li>
      </ul>
      <p className="db-status" data-testid="db-verdict-effect">
        {kept
          ? `The answer stands. ${challenge.challengers.map((id) => names[id]).join(', ')} ${challenge.challengers.length === 1 ? 'loses' : 'each lose'} 1 point.`
          : `${names[challenge.author]} scores 0 this round. Everyone after moves up.`}
      </p>
    </>
  )
}


function Scores({ state, player, names, isHost, onNext }: PhoneScreenProps) {
  const round = currentRound(state)
  const results = round.results!
  const scores = totals(state)
  const order = [...state.players].sort((a, b) => scores[b].points - scores[a].points)
  const last = state.roundIndex + 1 >= state.rounds.length
  return (
    <>
      <p className="db-headline" role="status" data-testid="db-my-result">
        {reasonText(results[player])}
      </p>
      <table className="db-table" data-testid="db-table">
        <caption className="visually-hidden">Round {state.roundIndex + 1} points and totals</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Player</span>
            </th>
            <th scope="col">Answer</th>
            <th scope="col" className="db-table__num">
              Round
            </th>
            <th scope="col" className="db-table__num db-table__total">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {order.map((id) => {
            const result = results[id]
            const net = result.points - result.penalty
            return (
              <tr key={id} data-me={id === player ? 'true' : undefined} data-testid={`db-score-${id}`}>
                <th scope="row" className="db-table__name">
                  {names[id]}
                </th>
                <td>
                  <span className="db-table__answer" data-out={result.valid ? undefined : 'true'}>
                    {result.answer ?? '-'}
                  </span>
                  <span className="db-table__how">{reasonText(result)}</span>
                </td>
                <td className="db-table__num">{net >= 0 ? `+${net}` : net}</td>
                <td className="db-table__num db-table__total" data-testid={`db-total-${id}`}>
                  {scores[id].points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {isHost ? (
        <button type="button" className="phone-button" data-testid="db-next" onClick={onNext}>
          {last ? 'Final standings' : 'Next round'}
        </button>
      ) : (
        <p className="db-status" role="status">
          Waiting for the host
        </p>
      )}
    </>
  )
}

/** 1 plus everyone in better places, so two tied for 1st are followed by 3rd. */
function rankOf(places: PlayerId[][], index: number): number {
  return 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
}

/** "Tied on 31. KaliBear wins on round wins, 4 to 3", when the winner was decided by round wins. */
function tieText(state: DibsState, names: Record<PlayerId, string>): string | null {
  const [first, second] = rules.finishingOrder(state)
  if (!first || !second || first.length > 1) return null
  const scores = totals(state)
  const [a, b] = [scores[first[0]], scores[second[0]]]
  if (a.points !== b.points) return null
  return `Tied on ${a.points}. ${names[first[0]]} wins on round wins, ${a.roundWins} to ${b.roundWins}.`
}

function Final({ state, player, names, summaryAction }: PhoneScreenProps) {
  const scores = totals(state)
  const places = rules.finishingOrder(state)
  const tie = tieText(state, names)
  return (
    <>
      <p className="db-headline">Final standings</p>
      {tie && (
        <p className="db-status" data-testid="db-tie">
          {tie}
        </p>
      )}
      <ol className="db-list" aria-label="Final standings">
        {places.map((place, i) =>
          place.map((id) => (
            <li key={id} className="db-list__row" data-me={id === player ? 'true' : undefined} data-testid={`db-standing-${id}`}>
              <span className="db-list__place">{place.length > 1 ? `=${rankOf(places, i)}` : rankOf(places, i)}</span>
              <span className="db-list__name">{names[id]}</span>
              <span className="db-list__points">{scores[id].points}</span>
            </li>
          )),
        )}
      </ol>
      {summaryAction}
    </>
  )
}

const STEP_NAMES: Partial<Record<DibsState['phase'], string>> = {
  category: 'Get ready',
  race: 'Race',
  review: 'Challenges',
  vote: 'Vote',
  verdict: 'Verdict',
  scores: 'Scores',
}

function Info({ state, secondsLeft }: Pick<PhoneScreenProps, 'state' | 'secondsLeft'>) {
  return (
    <p className="db-info" data-testid="db-info">
      <span>{STEP_NAMES[state.phase]}</span>
      {secondsLeft !== undefined && secondsLeft !== null && (
        <span role="timer" aria-live={secondsLeft <= 5 ? 'polite' : 'off'} data-testid="db-clock" data-low={secondsLeft <= 5 ? 'true' : undefined}>
          {secondsLeft} s left
        </span>
      )}
    </p>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { state } = props
  const over = state.phase === 'over'
  return (
    <div className="db-phone">
      <div className="db-top">
        <DibsTitle />
        {!over && (
          <span className="db-top__round" data-testid="db-round">
            Round {state.roundIndex + 1} of {state.rounds.length}
          </span>
        )}
      </div>
      {!over && <Info state={state} secondsLeft={props.secondsLeft} />}
      {state.phase === 'category' && <CategoryCard round={currentRound(state)} />}
      {state.phase === 'race' && <Race {...props} />}
      {state.phase === 'review' && <Review {...props} />}
      {state.phase === 'vote' && <VoteScreen {...props} />}
      {state.phase === 'verdict' && <Verdict {...props} />}
      {state.phase === 'scores' && <Scores {...props} />}
      {over && <Final {...props} />}
    </div>
  )
}
