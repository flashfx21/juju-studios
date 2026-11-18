// ABOUTME: No Filler on the TV: the scoreboard strip with the target and who is up, "[Name] is choosing", the card with its
// ABOUTME: clock, the votes coming in (who, never how), the verdict with named votes, the final round and sudden death, and the final standings.
import type { CSSProperties, ReactNode } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { DIFFICULTY_NAMES, nameList, placeText, pointsText, promptLength, resultText, stoppedText, suddenDeathText, verdictNote, VOTE_NAMES, votersBy } from './format'
import { DIFFICULTIES, isFinalRound, POINTS, rules, upNext, votersFor, type Card, type NoFillerState, type Vote } from './rules'
import '../../ui/TvGame.css'
import './colors.css'
import './TvScreen.css'

interface TvScreenProps {
  /** The room's public state: no cards still in the piles, no votes before the verdict. */
  state: NoFillerState
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left in the timed step, or null when nothing is timed. */
  secondsLeft: number | null
}

/** Seconds left at which the speaking clock changes to its last-seconds look. */
const LAST_SECONDS = 3

/** The mark beside each verdict's word, so Clean and Filler never rely on color. */
const VOTE_MARKS: Record<Vote, string> = { clean: '✓', filler: '✗' }

function namesOf(looks: Record<PlayerId, PlayerLook>): Record<PlayerId, string> {
  return Object.fromEntries(Object.entries(looks).map(([id, look]) => [id, look.name]))
}

/** The seconds left. The speaking clock's last seconds get a heavy frame and the word Hurry, not only a color. */
function Clock({ secondsLeft, speaking = false }: { secondsLeft: number | null; speaking?: boolean }) {
  if (secondsLeft === null) return null
  const low = speaking && secondsLeft <= LAST_SECONDS
  return (
    <div className="nf-tv-clock" data-low={low || undefined}>
      <span className="tv-tote nf-tv-clock__number" role="timer" data-testid="nf-tv-clock">
        {secondsLeft}
      </span>
      <span className="tv-label">{low ? 'Hurry' : 'Seconds'}</span>
    </div>
  )
}

/** Every player's score in turn order, a track toward the target, and who is up now and next. */
function ScoreStrip({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const { target } = state.settings
  const next = upNext(state)
  return (
    <ol className="nf-tv-strip" aria-label={`Scores in turn order. Target ${target}`} data-testid="nf-tv-strip">
      {state.order.map((id) => {
        const score = state.scores[id]
        const now = id === state.turn.speaker && state.phase !== 'over'
        const reached = score >= target
        const tag = now ? 'Up now' : id === next ? 'Next' : state.suddenDeath && state.speakers.includes(id) ? 'Tied' : ''
        return (
          <li key={id} className="nf-tv-chip" data-now={now || undefined} data-reached={reached || undefined} data-testid={`nf-tv-chip-${id}`}>
            <span className="nf-tv-chip__tag">{tag}</span>
            <span className="nf-tv-chip__who">
              <PlayerDot look={looks[id]} size={32} />
              <span className="nf-tv-chip__score" data-testid={`nf-tv-score-${id}`}>
                {score}
              </span>
              <span className="nf-tv-chip__target">{reached ? '✓' : `/${target}`}</span>
            </span>
            <span className="nf-tv-chip__name">{looks[id]?.name}</span>
            <span className="nf-tv-chip__track" aria-hidden="true">
              <span className="nf-tv-chip__fill" style={{ width: `${Math.min(100, (score / target) * 100)}%` } as CSSProperties} />
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** The card, large: a difficulty band with its points, then the category, the prompt and the card's id. */
function CardFace({ card }: { card: Card }) {
  return (
    <div className="nf-tv-card" data-difficulty={card.difficulty} data-length={promptLength(card.prompt)} data-testid="nf-tv-card">
      <p className="nf-tv-card__band">
        <span className="nf-tv-card__difficulty">{DIFFICULTY_NAMES[card.difficulty]}</span>
        <span className="nf-tv-card__points">{pointsText(POINTS[card.difficulty])}</span>
      </p>
      <div className="nf-tv-card__body">
        <span className="nf-tv-card__category">{card.category}</span>
        <p className="nf-tv-card__prompt" data-testid="nf-tv-prompt">
          {card.prompt}
        </p>
        <span className="nf-tv-card__id">{card.id}</span>
      </div>
    </div>
  )
}

function Speaker({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const { speaker } = state.turn
  return (
    <p className="nf-tv-speaker">
      <PlayerDot look={looks[speaker]} size={40} />
      <span className="nf-tv-speaker__name">{looks[speaker]?.name}</span>
    </p>
  )
}

function Choosing({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const { speaker, hostCall } = state.turn
  const names = namesOf(looks)
  const next = upNext(state)
  return (
    <div className="nf-tv-choosing" data-testid="nf-tv-choosing">
      {state.suddenDeath && (
        <div className="nf-tv-sudden" data-testid="nf-tv-sudden-death">
          <span className="tv-label">Sudden death</span>
          <p className="nf-tv-note">
            {nameList(state.speakers, names)} are tied on {state.scores[state.speakers[0]]}. One Hard card each. Still tied after that: they share first.
          </p>
        </div>
      )}
      {hostCall && (
        <p className="nf-tv-note" data-testid="nf-tv-host-call">
          {hostCall.kind === 'voided' ? `Turn voided. ${names[speaker]} picks again.` : `${names[hostCall.player]}'s turn was skipped.`}
        </p>
      )}
      <p className="nf-tv-choosing__name">
        <PlayerDot look={looks[speaker]} size={64} />
        <span>{names[speaker]} is choosing</span>
      </p>
      {!state.suddenDeath && (
        <ul className="nf-tv-legend" aria-label="What each difficulty scores">
          {DIFFICULTIES.map((difficulty) => (
            <li key={difficulty} className="nf-tv-legend__item" data-difficulty={difficulty}>
              {DIFFICULTY_NAMES[difficulty]} · {pointsText(POINTS[difficulty])}
            </li>
          ))}
        </ul>
      )}
      {next && (
        <p className="nf-tv-note" data-testid="nf-tv-up-next">
          Up next: {names[next]}
        </p>
      )}
    </div>
  )
}

function Speaking({ state, looks, secondsLeft }: TvScreenProps) {
  return (
    <div className="nf-tv-split" data-testid="nf-tv-speaking">
      <CardFace card={state.turn.card!} />
      <div className="nf-tv-side">
        <Clock secondsLeft={secondsLeft} speaking />
        <Speaker state={state} looks={looks} />
        <p className="nf-tv-note">Name 3. No um, uh, er or like.</p>
      </div>
    </div>
  )
}

function Voting({ state, looks, secondsLeft }: TvScreenProps) {
  const { turn } = state
  const voters = votersFor(state)
  return (
    <div className="nf-tv-split" data-testid="nf-tv-voting">
      <CardFace card={turn.card!} />
      <div className="nf-tv-side">
        <div className="nf-tv-side__row">
          <Clock secondsLeft={secondsLeft} />
          <p className="nf-tv-note" data-testid="nf-tv-stopped">
            {looks[turn.speaker]?.name}: {stoppedText(turn)}
          </p>
        </div>
        <span className="tv-label" data-testid="nf-tv-votes-in">
          Votes in · {Object.keys(turn.votes).length} of {voters.length}
        </span>
        <ul className="nf-tv-people" data-many={voters.length > 5 || undefined} aria-label="Who has voted">
          {voters.map((id) => (
            <li key={id} className="nf-tv-person" data-in={id in turn.votes || undefined} data-testid={`nf-tv-voter-${id}`}>
              <PlayerDot look={looks[id]} size={30} />
              <span className="nf-tv-person__name">{looks[id]?.name}</span>
              <span className="nf-tv-person__state">{id in turn.votes ? '✓ Voted' : '…'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Reveal({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const { turn } = state
  const outcome = turn.outcome!
  const names = namesOf(looks)
  const note = verdictNote(state)
  const next = upNext(state)
  const list = (ids: PlayerId[]) => (ids.length ? ids.map((id) => names[id]).join(', ') : 'Nobody')
  const silent = votersBy(state, null)
  return (
    <div className="nf-tv-split" data-testid="nf-tv-reveal">
      <div className="nf-tv-main">
        <CardFace card={turn.card!} />
        <p className="nf-tv-effect" data-testid="nf-tv-result">
          {resultText(state, names)}
          {note ? ` · ${note}` : ''}
        </p>
      </div>
      <div className="nf-tv-side nf-tv-side--verdict">
        <p className="nf-tv-stamp" data-vote={outcome} data-testid="nf-tv-stamp">
          <span aria-hidden="true">{VOTE_MARKS[outcome]}</span> {VOTE_NAMES[outcome]}
        </p>
        <dl className="nf-tv-named" data-testid="nf-tv-named-votes">
          <dt>{VOTE_MARKS.clean} Clean</dt>
          <dd>{list(votersBy(state, 'clean'))}</dd>
          <dt>{VOTE_MARKS.filler} Filler</dt>
          <dd>{list(votersBy(state, 'filler'))}</dd>
          {silent.length > 0 && (
            <>
              <dt>No vote</dt>
              <dd>{list(silent)}</dd>
            </>
          )}
        </dl>
        <p className="nf-tv-note" data-testid="nf-tv-up-next">
          {next ? `Up next: ${names[next]}` : 'That was the last turn.'}
        </p>
      </div>
    </div>
  )
}

function Standings({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const places = rules.finishingOrder(state)
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
  const suddenDeath = suddenDeathText(state, namesOf(looks))
  const many = state.players.length > 6
  return (
    <div className="nf-tv-final" data-testid="nf-tv-standings">
      {suddenDeath && (
        <p className="nf-tv-effect" data-testid="nf-tv-sudden-death-result">
          {suddenDeath}
        </p>
      )}
      <ol className="nf-tv-standings" data-many={many || undefined} aria-label="Final standings">
        {places.map((place, i) =>
          place.map((id) => (
            <li key={id} className="nf-tv-standings__row" data-top={i === 0 || undefined} data-testid={`nf-tv-standing-${id}`}>
              <span>{place.length > 1 ? `Tied ${placeText(rankOf(i))}` : placeText(rankOf(i))}</span>
              <PlayerDot look={looks[id]} size={36} />
              <span className="nf-tv-standings__name">{looks[id]?.name}</span>
              <span className="nf-tv-standings__points">{state.scores[id]}</span>
            </li>
          )),
        )}
      </ol>
    </div>
  )
}

export function TvScreen(props: TvScreenProps) {
  const { state, looks } = props
  if (state.phase === 'over') {
    return (
      <div className="nf-tv-body">
        <Standings state={state} looks={looks} />
      </div>
    )
  }
  let body: ReactNode
  switch (state.phase) {
    case 'pick':
      body = <Choosing state={state} looks={looks} />
      break
    case 'speak':
      body = <Speaking {...props} />
      break
    case 'vote':
      body = <Voting {...props} />
      break
    default:
      body = <Reveal key={state.turnCount} state={state} looks={looks} />
  }
  const reached = state.order.filter((id) => state.scores[id] >= state.settings.target)
  return (
    <div className="nf-tv-body">
      <ScoreStrip state={state} looks={looks} />
      {isFinalRound(state) && (
        <p className="nf-tv-banner" data-testid="nf-tv-final-round">
          <strong>Final round</strong> {nameList(reached, namesOf(looks))} reached {state.settings.target}. The round plays out, then most points wins.
        </p>
      )}
      <div className="nf-tv-stage">{body}</div>
    </div>
  )
}
