// ABOUTME: Sketch Showdown on the TV: both teams with their drawers, the clock, a live ink meter and wrong-guess count per team
// ABOUTME: (never strokes, guesses or the clue during the race), then both drawings with the answer, and the gallery at the end.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { TEAM_INDEXES, type Stroke, type TeamIndex, type TvView } from './rules'
import { SketchCanvas } from './SketchCanvas'
import { TEAM_LOOKS } from './teams'
import { resultHeadline, revealHeadline, winTimeText, wrongGuessText } from './tvText'
import '../../ui/TvGame.css'
import './TvScreen.css'

interface TvScreenProps {
  /** What the host published for the TV: tvView() from the rules, which holds no drawing, guess or clue before the reveal. */
  view: TvView
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left in the timed step, or null when nothing is timed. */
  secondsLeft: number | null
}

/** Wrong guesses listed under a drawing at the reveal; the rest are counted. */
const REVEAL_GUESSES = 6
/** With nobody right, both drawings stand alone this long before the answer. */
const ANSWER_DELAY_MS = 2500
/** Ink that fills half the meter, in canvas widths. The meter never quite fills, so it always moves. */
const HALF_INK = 8
/** The gallery's box inside the panel, the gaps between its rounds and the height of a round's caption, in pixels. */
const GALLERY = { width: 808, height: 378, columnGap: 16, rowGap: 8, pairGap: 6, caption: 26 }

const UNKNOWN_PLAYER: PlayerLook = { name: 'Player', initials: '?', color: '#8a8f98' }

function lookOf(looks: Record<PlayerId, PlayerLook>, id: PlayerId): PlayerLook {
  return looks[id] ?? UNKNOWN_PLAYER
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** False for `delay` milliseconds, then true; true at once with reduced motion or no delay. */
function useShownAfter(delay: number): boolean {
  const [shown, setShown] = useState(() => delay === 0 || prefersReducedMotion())
  useEffect(() => {
    if (shown) return
    const timer = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(timer)
  }, [shown, delay])
  return shown
}

/** How full a team's ink meter is, from 0 to 1. */
function inkLevel(ink: number): number {
  return ink / (ink + HALF_INK)
}

/** Columns for the gallery and the side of one drawing in pixels, so every round fits the panel without scrolling. */
function galleryLayout(count: number): { columns: number; thumb: number } {
  const columns = count <= 4 ? Math.min(Math.max(count, 1), 2) : count <= 9 ? 3 : 4
  const rows = Math.ceil(Math.max(count, 1) / columns)
  const byWidth = ((GALLERY.width - (columns - 1) * GALLERY.columnGap) / columns - GALLERY.pairGap) / 2
  const byHeight = (GALLERY.height - (rows - 1) * GALLERY.rowGap) / rows - GALLERY.caption
  return { columns, thumb: Math.floor(Math.min(byWidth, byHeight)) }
}

function TeamBadge({ team }: { team: TeamIndex }) {
  const look = TEAM_LOOKS[team]
  return (
    <span className="ss-tv-badge" style={{ background: look.color, color: look.ink }}>
      <span aria-hidden="true">{look.badge}</span> {look.name}
    </span>
  )
}

function Clock({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft === null) return null
  return (
    <span className="tv-tote ss-tv-clock" role="timer" data-low={secondsLeft <= 5 || undefined} data-testid="ss-tv-clock">
      {secondsLeft}
    </span>
  )
}

/** Rounds won: each team's badge around "3 to 2". */
function Score({ wins }: { wins: [number, number] }) {
  return (
    <p className="ss-tv-score" data-testid="ss-tv-score">
      <TeamBadge team={0} />
      <span className="ss-tv-score__tally">
        {wins[0]} to {wins[1]}
      </span>
      <TeamBadge team={1} />
    </p>
  )
}

/** A drawing on its white paper, read only. An empty one says so, as when a team of bots had the pencil. */
function Paper({ label, strokes }: { label: string; strokes: readonly Stroke[] }) {
  return (
    <div className="ss-tv-paper">
      <SketchCanvas label={strokes.length === 0 ? `${label}: no drawing` : label} strokes={strokes} />
      {strokes.length === 0 && (
        <span className="ss-tv-paper__empty" aria-hidden="true">
          No drawing
        </span>
      )}
    </div>
  )
}

// ---------- Pick, countdown, race and the sudden-death vote: a team each side, the step in the middle ----------

type TeamDetail = 'players' | 'drawer' | 'race'

function TeamPanel({ view, looks, team, detail }: Pick<TvScreenProps, 'view' | 'looks'> & { team: TeamIndex; detail: TeamDetail }) {
  const look = TEAM_LOOKS[team]
  const drawer = detail === 'players' ? null : view.drawers[team]
  return (
    <section className="ss-tv-team" style={{ '--team': look.color } as CSSProperties} aria-label={look.name} data-testid={`ss-tv-team-${team}`}>
      <div className="ss-tv-team__head">
        <TeamBadge team={team} />
        <span className="ss-tv-team__wins" data-testid={`ss-tv-wins-${team}`}>
          {view.wins[team]} won
        </span>
      </div>
      <ul className="ss-tv-members" aria-label={`${look.name} players`}>
        {view.teams[team].map((id) => (
          <li key={id} className="ss-tv-member" data-drawer={id === drawer || undefined}>
            <PlayerDot look={lookOf(looks, id)} size={30} />
            <span className="ss-tv-member__name">{lookOf(looks, id).name}</span>
            {id === drawer && <span className="ss-tv-member__state">✎ Draws</span>}
          </li>
        ))}
      </ul>
      {detail === 'race' && (
        <div className="ss-tv-live">
          <div className="ss-tv-ink">
            <span className="tv-label" id={`ss-tv-ink-${team}`}>
              Ink
            </span>
            <div
              className="ss-tv-ink__track"
              role="meter"
              aria-labelledby={`ss-tv-ink-${team}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(inkLevel(view.ink[team]) * 100)}
              data-testid={`ss-tv-ink-${team}`}
            >
              <div className="ss-tv-ink__fill" style={{ width: `${inkLevel(view.ink[team]) * 100}%` }} />
            </div>
          </div>
          <div className="ss-tv-misses">
            <span className="tv-label">Wrong</span>
            <span className="ss-tv-misses__count" data-testid={`ss-tv-wrong-${team}`}>
              {view.wrongGuessCounts[team]}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

function Versus({ view, looks, detail, children }: Pick<TvScreenProps, 'view' | 'looks'> & { detail: TeamDetail; children: ReactNode }) {
  return (
    <div className="ss-tv-versus" data-testid={`ss-tv-${view.phase}`}>
      <TeamPanel view={view} looks={looks} team={0} detail={detail} />
      <div className="ss-tv-middle">{children}</div>
      <TeamPanel view={view} looks={looks} team={1} detail={detail} />
    </div>
  )
}

function Pick({ view, looks, secondsLeft }: TvScreenProps) {
  return (
    <Versus view={view} looks={looks} detail="drawer">
      <p className="ss-tv-headline">Drawers are choosing</p>
      <Clock secondsLeft={secondsLeft} />
      <p className="ss-tv-note">Both drawers pick from the same 3 clues.</p>
    </Versus>
  )
}

function Countdown({ view, looks, secondsLeft }: TvScreenProps) {
  return (
    <Versus view={view} looks={looks} detail="drawer">
      <p className="ss-tv-headline">Get ready</p>
      {secondsLeft !== null && (
        <span className="ss-tv-count" role="timer" data-testid="ss-tv-count">
          {secondsLeft}
        </span>
      )}
      <p className="ss-tv-note">Both canvases unlock together.</p>
    </Versus>
  )
}

function Race({ view, looks, secondsLeft }: TvScreenProps) {
  return (
    <Versus view={view} looks={looks} detail="race">
      <Clock secondsLeft={secondsLeft} />
      <p className="ss-tv-headline">Guess it first</p>
      <p className="ss-tv-note">Watch your own drawer's sketch on your phone.</p>
    </Versus>
  )
}

function Vote({ view, looks, secondsLeft }: TvScreenProps) {
  return (
    <Versus view={view} looks={looks} detail="players">
      <p className="ss-tv-headline">Sudden death!</p>
      <Clock secondsLeft={secondsLeft} />
      <p className="ss-tv-note">It's level. Each team nominates a drawer for one more round.</p>
    </Versus>
  )
}

// ---------- Reveal: both drawings as they stood, then the answer ----------

function Reveal({ view, looks }: Pick<TvScreenProps, 'view' | 'looks'>) {
  const reveal = view.reveal!
  const answerShown = useShownAfter(reveal.winner === null ? ANSWER_DELAY_MS : 0)
  const won = reveal.winningGuess
  return (
    <div className="ss-tv-reveal" data-testid="ss-tv-reveal">
      {TEAM_INDEXES.map((team) => {
        const drawer = lookOf(looks, view.drawers[team]).name
        return (
          <figure key={team} className="ss-tv-figure" data-testid={`ss-tv-figure-${team}`}>
            <div className="ss-tv-figure__head">
              <TeamBadge team={team} />
              <span className="ss-tv-figure__drawer">{drawer}</span>
            </div>
            <div className="ss-tv-figure__drawing">
              <Paper label={`${TEAM_LOOKS[team].name} drawing by ${drawer}`} strokes={reveal.drawings[team]} />
              {reveal.winner === team && (
                <span className="ss-tv-won" style={{ background: TEAM_LOOKS[team].color, color: TEAM_LOOKS[team].ink }} data-testid="ss-tv-got-it">
                  ✓ Got it
                </span>
              )}
            </div>
            <figcaption className="ss-tv-wrong" data-testid={`ss-tv-wrong-guesses-${team}`}>
              {wrongGuessText(reveal.guesses[team], won, REVEAL_GUESSES)}
            </figcaption>
          </figure>
        )
      })}
      <div className="ss-tv-outcome">
        <p className="ss-tv-headline" data-testid="ss-tv-reveal-headline">
          {revealHeadline(view)}
        </p>
        {answerShown ? (
          <div className="ss-tv-answer">
            <span className="tv-label">The answer</span>
            <p className="ss-tv-answer__text" data-testid="ss-tv-answer">
              {reveal.clue.answer}
            </p>
          </div>
        ) : (
          <p className="ss-tv-note">Two drawings, no right guess. What was it?</p>
        )}
        {won && (
          <p className="ss-tv-solver" data-testid="ss-tv-solver">
            <PlayerDot look={lookOf(looks, won.player)} size={34} />
            <span className="ss-tv-solver__name">{lookOf(looks, won.player).name}</span>
            <span className="ss-tv-solver__time">in {winTimeText(view)}</span>
          </p>
        )}
        <Score wins={view.wins} />
      </div>
    </div>
  )
}

// ---------- Game over: the result beside every round's pair of drawings ----------

function Over({ view }: Pick<TvScreenProps, 'view'>) {
  const gallery = view.gallery ?? []
  const { columns, thumb } = galleryLayout(gallery.length)
  return (
    <div className="ss-tv-over" data-testid="ss-tv-over">
      <div className="ss-tv-result">
        <p className="ss-tv-headline" data-testid="ss-tv-result">
          {resultHeadline(view.wins)}
        </p>
        <span className="tv-label" id="ss-tv-tally-label">
          Rounds won
        </span>
        <ul className="ss-tv-tally" aria-labelledby="ss-tv-tally-label" data-testid="ss-tv-tally">
          {TEAM_INDEXES.map((team) => (
            <li key={team} className="ss-tv-tally__row">
              <TeamBadge team={team} />
              <span className="ss-tv-tally__wins">{view.wins[team]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ss-tv-gallery">
        <span className="tv-label">{gallery.length === 0 ? 'No rounds were drawn' : 'Every round'}</span>
        <ol
          className="ss-tv-rounds"
          aria-label="Every round's two drawings and its answer"
          style={{ '--columns': columns, '--thumb': `${thumb}px` } as CSSProperties}
          data-testid="ss-tv-gallery"
        >
          {gallery.map((item, index) => (
            <li key={index} className="ss-tv-round">
              <div className="ss-tv-round__pair">
                {TEAM_INDEXES.map((team) => (
                  <div key={team} className="ss-tv-round__drawing" data-won={item.winner === team || undefined}>
                    <Paper label={`Round ${index + 1}, ${TEAM_LOOKS[team].name} drawing`} strokes={item.drawings[team]} />
                    {item.winner === team && (
                      <span className="ss-tv-won" style={{ background: TEAM_LOOKS[team].color, color: TEAM_LOOKS[team].ink }}>
                        <span aria-hidden="true">✓</span>
                        <span className="visually-hidden">{TEAM_LOOKS[team].name} got it</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="ss-tv-round__caption">
                <span className="ss-tv-round__answer">
                  {index + 1}. {item.clue.answer}
                </span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function TvScreen(props: TvScreenProps) {
  const { view, looks } = props
  let body: ReactNode
  switch (view.phase) {
    case 'pick':
      body = <Pick {...props} />
      break
    case 'countdown':
      body = <Countdown {...props} />
      break
    case 'race':
      body = <Race {...props} />
      break
    case 'reveal':
      body = view.reveal ? <Reveal key={view.roundNumber} view={view} looks={looks} /> : null
      break
    case 'vote':
      body = <Vote {...props} />
      break
    default:
      body = <Over view={view} />
  }
  return <div className="ss-tv-body">{body}</div>
}
