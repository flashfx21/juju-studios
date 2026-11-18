// ABOUTME: No Filler on a player's phone: the speaker's pick and speaking screens, everyone else's Eyes up and vote,
// ABOUTME: the verdict with who voted what, scores and who is up next between turns, and the final standings.
import type { CSSProperties, ReactNode } from 'react'
import { MenuItems } from '../../ui/FrameMenu'
import type { PlayerId } from '../types'
import {
  DIFFICULTY_NAMES,
  nameList,
  placeText,
  pointsText,
  promptLength,
  resultText,
  stageLabel,
  stoppedText,
  suddenDeathText,
  verdictNote,
  VOTE_NAMES,
  votersBy,
} from './format'
import { canSkip, canVoid, pickChoices, POINTS, rules, upNext, votersFor, type Card, type NoFillerInput, type NoFillerState, type Vote } from './rules'
import '../../ui/PhoneForm.css'
import './colors.css'
import './PhoneScreen.css'

interface PhoneScreenProps {
  state: NoFillerState
  player: PlayerId
  /** Display names by player id. */
  names: Record<PlayerId, string>
  /** The host's phone gets Void turn and Skip turn in the top-left menu. */
  isHost: boolean
  /** Seconds left in the timed step. Null or missing when nothing is timed. */
  secondsLeft?: number | null
  onInput: (input: NoFillerInput) => void
  /** Shown under the final standings, such as Play again. */
  summaryAction?: ReactNode
}

/** Seconds left at which the clock changes to its last-seconds look. */
const LAST_SECONDS = 3

/** More players than this and the scores between turns run in two columns, so ten still fit a short phone. */
const TWO_COLUMNS_ABOVE = 6

/** The mark beside each verdict's word, so Clean and Filler never rely on color. */
const VOTE_MARKS: Record<Vote, string> = { clean: '✓', filler: '✗' }

export function NoFillerTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        No Filler
      </span>
      <h1 className="phone-top__title">No Filler</h1>
    </div>
  )
}

/** The card: a difficulty band with its points, the prompt, and the category with the card's id. */
function CardFace({ card, small = false }: { card: Card; small?: boolean }) {
  return (
    <div className="nf-card" data-difficulty={card.difficulty} data-length={promptLength(card.prompt)} data-small={small || undefined} data-testid="nf-card">
      <p className="nf-card__band">
        <span>{DIFFICULTY_NAMES[card.difficulty]}</span>
        <span>{pointsText(POINTS[card.difficulty])}</span>
      </p>
      <p className="nf-card__prompt" data-testid="nf-prompt">
        {card.prompt}
      </p>
      <p className="nf-card__foot">
        <span>{card.category}</span>
        <span>{card.id}</span>
      </p>
    </div>
  )
}

/** The seconds left, large. The last seconds get a frame and the word "left" swaps for "Hurry", not only a color. */
function BigClock({ secondsLeft }: { secondsLeft?: number | null }) {
  if (secondsLeft === undefined || secondsLeft === null) return null
  const low = secondsLeft <= LAST_SECONDS
  return (
    <p className="nf-clock" role="timer" aria-live={low ? 'polite' : 'off'} data-low={low || undefined} data-testid="nf-clock">
      <span className="nf-clock__number">{secondsLeft}</span>
      <span className="nf-clock__unit">{low ? 'Hurry' : 'seconds'}</span>
    </p>
  )
}

/** What the host did just before this pick, in words. */
function HostCallNote({ state, player, names }: Pick<PhoneScreenProps, 'state' | 'player' | 'names'>) {
  const { hostCall, speaker } = state.turn
  if (!hostCall) return null
  const text =
    hostCall.kind === 'voided'
      ? `Turn voided. ${speaker === player ? 'Pick again for a different card.' : `${names[speaker]} picks again.`}`
      : `${names[hostCall.player]}'s turn was skipped.`
  return (
    <p className="nf-status" role="status" data-testid="nf-host-call">
      {text}
    </p>
  )
}

/** Everyone's score in turn order, with who is up now and who is next. */
function Scores({ state, player, names }: Pick<PhoneScreenProps, 'state' | 'player' | 'names'>) {
  const next = upNext(state)
  return (
    <ol
      className="nf-scores"
      aria-label={`Scores in turn order. Target ${state.settings.target}`}
      data-many={state.order.length > TWO_COLUMNS_ABOVE || undefined}
      style={{ '--nf-rows': Math.ceil(state.order.length / 2) } as CSSProperties}
      data-testid="nf-scores"
    >
      {state.order.map((id) => {
        const tag = id === state.turn.speaker ? 'Up now' : id === next ? 'Next' : state.suddenDeath && state.speakers.includes(id) ? 'Tied' : ''
        return (
          <li key={id} className="nf-scores__row" data-me={id === player || undefined} data-now={id === state.turn.speaker || undefined} data-testid={`nf-score-${id}`}>
            <span className="nf-scores__name">{names[id]}</span>
            <span className="nf-scores__tag">{tag}</span>
            <span className="nf-scores__points">{state.scores[id]}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Pick({ state, player, names, onInput }: PhoneScreenProps) {
  const { speaker } = state.turn
  if (speaker !== player) {
    return (
      <>
        <p className="nf-headline" role="status" data-testid="nf-choosing">
          {names[speaker]} is choosing
        </p>
        {state.suddenDeath && (
          <p className="nf-status" data-testid="nf-sudden-death">
            Sudden death: {nameList(state.speakers, names)} are tied. One Hard card each.
          </p>
        )}
        <HostCallNote state={state} player={player} names={names} />
        <Scores state={state} player={player} names={names} />
      </>
    )
  }
  return (
    <>
      <p className="nf-headline" data-testid="nf-your-turn">
        Your turn. Pick a card.
      </p>
      {state.suddenDeath && (
        <p className="nf-status" data-testid="nf-sudden-death">
          Sudden death: Hard cards only.
        </p>
      )}
      <HostCallNote state={state} player={player} names={names} />
      <div className="nf-picks" role="group" aria-label="Difficulty">
        {pickChoices(state).map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            className="nf-pick"
            data-difficulty={difficulty}
            data-testid={`nf-pick-${difficulty}`}
            onClick={() => onInput({ type: 'pick', difficulty })}
          >
            <span className="nf-pick__name">{DIFFICULTY_NAMES[difficulty]}</span>
            <span className="nf-pick__points">{pointsText(POINTS[difficulty])}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function Speak({ state, player, names, secondsLeft, onInput }: PhoneScreenProps) {
  const { speaker } = state.turn
  const card = state.turn.card!
  if (speaker !== player) {
    return (
      <>
        <p className="nf-eyes-up" data-testid="nf-eyes-up">
          Eyes up
        </p>
        <p className="nf-status">Watch {names[speaker]}, not your phone. You vote when the clock stops.</p>
        <BigClock secondsLeft={secondsLeft} />
        <CardFace card={card} small />
      </>
    )
  }
  return (
    <>
      <CardFace card={card} />
      <div className="nf-speaking">
        <BigClock secondsLeft={secondsLeft} />
        <button type="button" className="phone-button nf-done" data-testid="nf-done" onClick={() => onInput({ type: 'done' })}>
          Done
        </button>
      </div>
    </>
  )
}

function VoteScreen({ state, player, names, onInput }: PhoneScreenProps) {
  const { turn } = state
  const voters = votersFor(state)
  const mine = turn.votes[player]
  const cast = Object.keys(turn.votes).length
  const count = (
    <p className="nf-status" role="status" data-testid="nf-votes-in">
      {cast} of {voters.length} votes in. A tie goes to {turn.speaker === player ? 'you' : names[turn.speaker]}.
    </p>
  )
  if (turn.speaker === player) {
    return (
      <>
        <p className="nf-headline" data-testid="nf-being-judged">
          The room is voting
        </p>
        <CardFace card={turn.card!} small />
        {count}
      </>
    )
  }
  return (
    <>
      <CardFace card={turn.card!} small />
      <p className="nf-status" data-testid="nf-stopped">
        {names[turn.speaker]}: {stoppedText(turn)}
      </p>
      {mine === 'clean' || mine === 'filler' ? (
        <p className="nf-headline" role="status" data-testid="nf-vote-in">
          Vote in: {VOTE_MARKS[mine]} {VOTE_NAMES[mine]}
        </p>
      ) : (
        <div className="nf-vote" role="group" aria-label={`Did ${names[turn.speaker]} name 3 with no filler?`}>
          {(['clean', 'filler'] as Vote[]).map((vote) => (
            <button key={vote} type="button" className="nf-vote__button" data-vote={vote} data-testid={`nf-vote-${vote}`} onClick={() => onInput({ type: 'vote', vote })}>
              <span aria-hidden="true">{VOTE_MARKS[vote]}</span> {VOTE_NAMES[vote]}
            </button>
          ))}
        </div>
      )}
      {count}
    </>
  )
}

function Reveal({ state, player, names }: PhoneScreenProps) {
  const { turn } = state
  const outcome = turn.outcome!
  const note = verdictNote(state)
  const next = upNext(state)
  const list = (ids: PlayerId[]) => (ids.length ? ids.map((id) => names[id]).join(', ') : 'nobody')
  const silent = votersBy(state, null)
  return (
    <>
      <p className="nf-stamp" data-vote={outcome} role="status" data-testid="nf-verdict">
        <span aria-hidden="true">{VOTE_MARKS[outcome]}</span> {VOTE_NAMES[outcome]}
      </p>
      <p className="nf-headline" data-testid="nf-result">
        {resultText(state, names)}
      </p>
      {note && (
        <p className="nf-status" data-testid="nf-verdict-note">
          {note}
        </p>
      )}
      <ul className="nf-votes" aria-label="How everyone voted" data-testid="nf-named-votes">
        <li>
          {VOTE_MARKS.clean} Clean: {list(votersBy(state, 'clean'))}
        </li>
        <li>
          {VOTE_MARKS.filler} Filler: {list(votersBy(state, 'filler'))}
        </li>
        {silent.length > 0 && <li>No vote: {list(silent)}</li>}
      </ul>
      <CardFace card={turn.card!} small />
      <p className="nf-status" data-testid="nf-up-next">
        {next === null ? 'That was the last turn.' : next === player ? "You're up next." : `Up next: ${names[next]}`}
      </p>
    </>
  )
}

/** 1 plus everyone in better places, so two tied for 1st are followed by 3rd. */
function rankOf(places: PlayerId[][], index: number): number {
  return 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
}

function Final({ state, player, names, summaryAction }: PhoneScreenProps) {
  const places = rules.finishingOrder(state)
  const suddenDeath = suddenDeathText(state, names)
  return (
    <>
      <p className="nf-headline">Final standings</p>
      {suddenDeath && (
        <p className="nf-status" data-testid="nf-sudden-death-result">
          {suddenDeath}
        </p>
      )}
      <ol className="nf-list" aria-label="Final standings" data-testid="nf-standings">
        {places.map((place, i) =>
          place.map((id) => (
            <li key={id} className="nf-list__row" data-me={id === player || undefined} data-testid={`nf-standing-${id}`}>
              <span className="nf-list__place">{place.length > 1 ? `=${placeText(rankOf(places, i))}` : placeText(rankOf(places, i))}</span>
              <span className="nf-list__name">{names[id]}</span>
              <span className="nf-list__points">{state.scores[id]}</span>
            </li>
          )),
        )}
      </ol>
      {summaryAction}
    </>
  )
}

const STEP_NAMES: Partial<Record<NoFillerState['phase'], string>> = {
  pick: 'Pick',
  speak: 'Name 3',
  vote: 'Vote',
  reveal: 'Verdict',
}

/** The step's name, and a small clock for the vote and the verdict (the speaking clock is the big one on the screen). */
function Info({ state, secondsLeft }: Pick<PhoneScreenProps, 'state' | 'secondsLeft'>) {
  const clocked = state.phase !== 'speak' && secondsLeft !== undefined && secondsLeft !== null
  return (
    <p className="nf-info" data-testid="nf-info">
      <span>{STEP_NAMES[state.phase]}</span>
      {clocked && (
        <span role="timer" aria-live="off" data-testid="nf-small-clock">
          {secondsLeft} s left
        </span>
      )}
    </p>
  )
}

/** The host's Void turn and Skip turn, in the top-left menu beside End game. */
function HostMenu({ state, names, onInput }: Pick<PhoneScreenProps, 'state' | 'names' | 'onInput'>) {
  return (
    <MenuItems>
      {canVoid(state) && (
        <button type="button" data-testid="nf-void" onClick={() => onInput({ type: 'void' })}>
          Void turn (pick again)
        </button>
      )}
      {canSkip(state) && (
        <button type="button" data-testid="nf-skip" onClick={() => onInput({ type: 'skip' })}>
          Skip {names[state.turn.speaker]}'s turn
        </button>
      )}
    </MenuItems>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { state } = props
  const over = state.phase === 'over'
  return (
    <div className="nf-phone" data-phase={state.phase}>
      <div className="nf-top">
        <NoFillerTitle />
        <span className="nf-top__stage" data-testid="nf-stage">
          {stageLabel(state)}
        </span>
      </div>
      {!over && <Info state={state} secondsLeft={props.secondsLeft} />}
      {state.phase === 'pick' && <Pick {...props} />}
      {state.phase === 'speak' && <Speak {...props} />}
      {state.phase === 'vote' && <VoteScreen {...props} />}
      {state.phase === 'reveal' && <Reveal {...props} />}
      {over && <Final {...props} />}
      {props.isHost && (canVoid(state) || canSkip(state)) && <HostMenu state={state} names={props.names} onInput={props.onInput} />}
    </div>
  )
}
