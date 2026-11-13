// ABOUTME: Sketch Showdown on a phone: picking the clue, the countdown, the drawer's canvas with its tools, the guesser's live sketch
// ABOUTME: and guess box, the team guess strip, the reveal of both drawings, the sudden-death vote and the result. Takes only playerView().
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { PlayerId } from '../types'
import { cleanGuess } from './matching'
import { SketchCanvas } from './SketchCanvas'
import { BRUSH_SIZES, SWATCHES, TEAM_INDEXES, TOOLS, type BrushSize, type PlayerView, type Stroke, type TeamGuess, type TeamIndex, type Tool } from './rules'
import { TEAM_LOOKS } from './teams'
import '../../ui/PhoneForm.css'
import './PhoneScreen.css'

interface PhoneScreenProps {
  view: PlayerView
  player: PlayerId
  names: Record<PlayerId, string>
  /** Teammates, for the sudden-death vote. */
  teammates: PlayerId[]
  isHost: boolean
  onPick: (option: number) => void
  onStroke: (stroke: Stroke) => void
  onUndo: () => void
  onClear: () => void
  onVote: (nominee: PlayerId) => void
  onGuess: (text: string) => void
  onNext: () => void
  /** Seconds left on the current phase's clock, or null when nothing is timed. */
  secondsLeft?: number | null
  /** Shown under the race, such as the room host's End round. */
  raceAction?: ReactNode
  /** Shown under the result, such as the playtest's gallery and Play again button. */
  summaryAction?: ReactNode
}

/** How long Clear must be held. */
const CLEAR_HOLD_MS = 700
/** Wrong guesses shown under a drawing at the reveal; the rest are counted. */
const REVEAL_GUESSES = 8

const TOOL_NAMES: Record<Tool, string> = { brush: 'Brush', eraser: 'Eraser', line: 'Line' }

export function SketchShowdownTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Sketch Showdown
      </span>
      <h1 className="phone-top__title">Sketch Showdown</h1>
    </div>
  )
}

function TeamBadge({ team }: { team: TeamIndex }) {
  const look = TEAM_LOOKS[team]
  return (
    <span className="ss-badge" style={{ background: look.color, color: look.ink }}>
      <span aria-hidden="true">{look.badge}</span> {look.name}
    </span>
  )
}

function howChosenText(view: PlayerView): string {
  switch (view.howChosen) {
    case 'both':
      return 'You both picked it'
    case 'coin':
      return view.options && view.myPick !== null && view.options[view.myPick] === view.clue ? 'Coin flip: your pick' : 'Coin flip: their pick'
    case 'one':
      return view.myPick !== null ? 'Only you picked, so it is yours' : 'Only the other drawer picked'
    case 'random':
      return 'Nobody picked, so it was random'
    default:
      return ''
  }
}

function Pick({ view, onPick }: PhoneScreenProps) {
  if (view.role !== 'drawer' || !view.options) {
    return <p className="ss-status">Drawers are choosing</p>
  }
  if (view.myPick !== null) {
    return (
      <p className="ss-status" role="status" data-testid="ss-picked">
        You picked {view.options[view.myPick].answer}. Waiting for the other drawer.
      </p>
    )
  }
  return (
    <>
      <p className="ss-headline">Pick one to draw</p>
      <p className="ss-hint">The other drawer sees the same three.</p>
      <div className="ss-options">
        {view.options.map((clue, i) => (
          <button key={clue.answer} type="button" className="phone-button" data-testid={`ss-option-${i}`} onClick={() => onPick(i)}>
            {clue.answer}
          </button>
        ))}
      </div>
    </>
  )
}

function Countdown({ view }: PhoneScreenProps) {
  if (view.role !== 'drawer') return <p className="ss-status">Get ready to guess</p>
  return (
    <>
      <p className="ss-hint">You're drawing</p>
      <p className="ss-clue" data-testid="ss-clue">
        {view.clue?.answer}
      </p>
      <p className="ss-status" role="status" data-testid="ss-how-chosen">
        {howChosenText(view)}. Get ready: both canvases unlock together.
      </p>
    </>
  )
}

/** Clear wipes the canvas only after a press and hold, by finger, mouse or key, so a stray tap can't. */
function ClearButton({ onClear }: { onClear: () => void }) {
  const timer = useRef<number | null>(null)
  const [holding, setHolding] = useState(false)
  const start = () => {
    if (timer.current !== null) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setHolding(false)
      onClear()
    }, CLEAR_HOLD_MS)
  }
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }
  return (
    <button
      type="button"
      className="ss-tool ss-tool--clear"
      data-holding={holding ? 'true' : undefined}
      aria-label="Clear the canvas (press and hold)"
      data-testid="ss-clear"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
          event.preventDefault()
          start()
        }
      }}
      onKeyUp={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      Hold to clear
    </button>
  )
}

function GuessStrip({ guesses, names }: { guesses: TeamGuess[]; names: Record<PlayerId, string> }) {
  const latest = [...guesses].reverse()
  return (
    <div className="ss-strip" aria-live="polite" aria-label="Your team's guesses" data-testid="ss-strip">
      {latest.length === 0 ? (
        <span className="ss-strip__empty">Your team's guesses show here</span>
      ) : (
        latest.map((guess) => (
          <span key={`${guess.player}-${guess.at}`} className="ss-strip__guess">
            {guess.text} <span className="ss-strip__who">{names[guess.player]}</span>
          </span>
        ))
      )}
    </div>
  )
}

type MenuKind = 'brush' | 'color'

/** Choices laid over the canvas until OK; Escape also closes it. Focus starts on the current choice. */
function Menu({ label, kind, onDone, children }: { label: string; kind: MenuKind; onDone: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => box.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus(), [])
  return (
    <div
      ref={box}
      className={`ss-menu ss-menu--${kind}`}
      role="dialog"
      aria-label={label}
      data-testid={`ss-menu-${kind}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDone()
      }}
    >
      {children}
      <button type="button" className="ss-tool ss-menu__ok" data-testid="ss-menu-ok" onClick={onDone}>
        OK
      </button>
    </div>
  )
}

/** True while a wrong guess still locks this player out, re-checked as the lockout runs down. */
function useLockedOut(lockedUntil: number): boolean {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (lockedUntil <= Date.now()) return
    const timer = window.setTimeout(() => setNow(Date.now()), lockedUntil - Date.now() + 50)
    return () => window.clearTimeout(timer)
  }, [lockedUntil, now])
  return now < lockedUntil
}

/** A guesser's race: the team's sketch as it's drawn, a guess box that clears after every guess, and the team's guesses. */
function GuessRace({ view, names, onGuess }: PhoneScreenProps) {
  const [typed, setTyped] = useState('')
  const [note, setNote] = useState('')
  const lockedOut = useLockedOut(view.lockedUntil)
  const guesses = view.guesses[view.team] ?? []
  const drawer = view.drawers[view.team]

  function submit(event: FormEvent) {
    event.preventDefault()
    const cleaned = cleanGuess(typed)
    setTyped('')
    if (!cleaned) setNote('Type a guess')
    else if (lockedOut) setNote('Wait: locked out for 2 seconds after a wrong guess')
    else if (guesses.some((guess) => cleanGuess(guess.text) === cleaned)) setNote('Already guessed')
    else {
      setNote('')
      onGuess(typed)
    }
  }

  return (
    <>
      <p className="ss-draw-line">
        Guess what <strong>{names[drawer]}</strong> is drawing
      </p>
      <div className="ss-canvas-box">
        <div className="ss-paper">
          <SketchCanvas label={`${names[drawer]}'s drawing so far`} strokes={view.drawings[view.team] ?? []} />
        </div>
      </div>
      <GuessStrip guesses={guesses} names={names} />
      {/* Inside a cue card, like every shared field: the field takes its text color from the card. */}
      <form className="cue-card ss-guess" noValidate onSubmit={submit}>
        <label className="visually-hidden" htmlFor="ss-guess">
          Your guess
        </label>
        <input
          id="ss-guess"
          className="field__input ss-guess__input"
          type="text"
          placeholder="Type a guess"
          autoComplete="off"
          autoCapitalize="none"
          enterKeyHint="send"
          value={typed}
          data-testid="ss-guess-input"
          onChange={(event) => setTyped(event.target.value)}
        />
        <button type="submit" className="phone-button ss-guess__send" data-testid="ss-guess-send" aria-disabled={lockedOut ? 'true' : undefined}>
          Guess
        </button>
      </form>
      <p className="ss-status" role="status" data-testid="ss-guess-note">
        {lockedOut ? 'Locked out for 2 seconds after a wrong guess' : note}
      </p>
    </>
  )
}

function Race(props: PhoneScreenProps) {
  const { view, names, onStroke, onUndo, onClear } = props
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState(0)
  const [size, setSize] = useState<BrushSize>('M')
  const [menu, setMenu] = useState<MenuKind | null>(null)
  const brushButton = useRef<HTMLButtonElement>(null)
  const colorButton = useRef<HTMLButtonElement>(null)
  if (view.role !== 'drawer') return <GuessRace {...props} />
  const strokes = view.drawings[view.team] ?? []
  const closeMenu = () => {
    const opener = menu === 'color' ? colorButton : brushButton
    opener.current?.focus()
    setMenu(null)
  }

  return (
    <>
      <p className="ss-draw-line">
        Draw: <strong data-testid="ss-clue">{view.clue?.answer}</strong>
      </p>
      <div className="ss-canvas-box">
        <div className="ss-paper">
          <SketchCanvas label={`Your drawing of ${view.clue?.answer}`} strokes={strokes} onStroke={onStroke} tool={tool} color={color} size={size} />
          <div className="ss-menu-buttons">
            <button
              ref={brushButton}
              type="button"
              className="ss-menu-button"
              aria-label={`Brush: ${TOOL_NAMES[tool]}, size ${size}`}
              aria-expanded={menu === 'brush'}
              data-testid="ss-menu-brush-button"
              onClick={() => setMenu('brush')}
            >
              <span className={`ss-size__dot ss-size__dot--${size}`} aria-hidden="true" />
              <span aria-hidden="true">{TOOL_NAMES[tool]}</span>
            </button>
            <button
              ref={colorButton}
              type="button"
              className="ss-menu-button"
              aria-label={`Color ${color + 1}`}
              aria-expanded={menu === 'color'}
              data-testid="ss-menu-color-button"
              onClick={() => setMenu('color')}
            >
              <span className="ss-menu-button__swatch" style={{ background: SWATCHES[color] }} aria-hidden="true" />
            </button>
          </div>
          {menu === 'brush' && (
            <Menu label="Brush" kind="brush" onDone={closeMenu}>
              <div className="ss-tools" role="group" aria-label="Tool">
                {TOOLS.map((t) => (
                  <button key={t} type="button" className="ss-tool" aria-pressed={tool === t} data-testid={`ss-tool-${t}`} onClick={() => setTool(t)}>
                    {TOOL_NAMES[t]}
                  </button>
                ))}
              </div>
              <div className="ss-sizes" role="group" aria-label="Brush size">
                {BRUSH_SIZES.map((s) => (
                  <button key={s} type="button" className="ss-tool ss-size" aria-pressed={size === s} aria-label={`Size ${s}`} data-testid={`ss-size-${s}`} onClick={() => setSize(s)}>
                    <span className={`ss-size__dot ss-size__dot--${s}`} aria-hidden="true" />
                    {s}
                  </button>
                ))}
              </div>
            </Menu>
          )}
          {menu === 'color' && (
            <Menu label="Color" kind="color" onDone={closeMenu}>
              <div className="ss-swatches" role="group" aria-label="Colors">
                {SWATCHES.map((swatch, i) => (
                  <button
                    key={swatch}
                    type="button"
                    className="ss-swatch"
                    style={{ background: swatch }}
                    aria-pressed={color === i}
                    aria-label={`Color ${i + 1}`}
                    data-testid={`ss-color-${i}`}
                    onClick={() => {
                      setColor(i)
                      if (tool === 'eraser') setTool('brush')
                    }}
                  />
                ))}
              </div>
            </Menu>
          )}
        </div>
      </div>
      <GuessStrip guesses={view.guesses[view.team] ?? []} names={names} />
      <div className="ss-tools" role="group" aria-label="Undo and clear">
        <button type="button" className="ss-tool" data-testid="ss-undo" disabled={strokes.length === 0} onClick={onUndo}>
          Undo
        </button>
        <ClearButton onClear={onClear} />
      </div>
    </>
  )
}

function seconds(view: PlayerView): string {
  if (!view.winningGuess || view.startedAt === null) return ''
  return `${Math.max(0, Math.round((view.winningGuess.at - view.startedAt) / 1000))} s`
}

function WrongGuesses({ guesses, winning }: { guesses: TeamGuess[] | null; winning: TeamGuess | null }) {
  const wrong = (guesses ?? []).filter((guess) => !(winning && guess.at === winning.at && guess.player === winning.player))
  if (wrong.length === 0) return <p className="ss-wrong">No wrong guesses</p>
  const shown = wrong.slice(-REVEAL_GUESSES)
  const more = wrong.length - shown.length
  return (
    <p className="ss-wrong">
      {shown.map((guess) => guess.text).join(', ')}
      {more > 0 && ` and ${more} more`}
    </p>
  )
}

function Score({ wins }: { wins: [number, number] }) {
  return (
    <p className="ss-score" data-testid="ss-score">
      <TeamBadge team={0} /> {wins[0]} to {wins[1]} <TeamBadge team={1} />
    </p>
  )
}

function Reveal({ view, names, isHost, onNext }: PhoneScreenProps) {
  const headline = view.winner === null ? 'Nobody got it' : `${TEAM_LOOKS[view.winner].name} got it!`
  return (
    <>
      <p className="ss-headline" role="status" data-testid="ss-reveal">
        {headline}
      </p>
      <p className="ss-answer">
        It was <strong data-testid="ss-answer">{view.clue?.answer}</strong>
        {view.winningGuess && ` · ${names[view.winningGuess.player]} in ${seconds(view)}`}
      </p>
      <div className="ss-pair">
        {TEAM_INDEXES.map((team) => (
          <figure key={team} className="ss-pair__item">
            <TeamBadge team={team} />
            <SketchCanvas label={`${TEAM_LOOKS[team].name} drawing by ${names[view.drawers[team]]}`} strokes={view.drawings[team] ?? []} />
            <figcaption>
              <WrongGuesses guesses={view.guesses[team]} winning={view.winningGuess} />
            </figcaption>
          </figure>
        ))}
      </div>
      <Score wins={view.wins} />
      {isHost ? (
        <button type="button" className="phone-button" data-testid="ss-next" onClick={onNext}>
          Next
        </button>
      ) : (
        <p className="ss-status">Waiting for the host</p>
      )}
    </>
  )
}

function Vote({ view, names, teammates, onVote }: PhoneScreenProps) {
  return (
    <>
      <p className="ss-headline">Sudden death!</p>
      <p className="ss-hint">It's level. Nominate your team's drawer for one more round.</p>
      <div className="ss-options" role="group" aria-label="Nominate a drawer">
        {teammates.map((mate) => (
          <button
            key={mate}
            type="button"
            className="phone-button phone-button--secondary"
            aria-pressed={view.myVote === mate}
            data-testid={`ss-vote-${mate}`}
            onClick={() => onVote(mate)}
          >
            {view.myVote === mate ? '✓ ' : ''}
            {names[mate]}
          </button>
        ))}
      </div>
    </>
  )
}

function Over({ view, summaryAction }: PhoneScreenProps) {
  const [a, b] = view.wins
  const headline = a === b ? "It's a tie" : `${TEAM_LOOKS[a > b ? 0 : 1].name} win!`
  return (
    <>
      <p className="ss-headline" data-testid="ss-result">
        {headline}
      </p>
      <Score wins={view.wins} />
      {summaryAction}
    </>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { view } = props
  return (
    <div className="ss-phone">
      <div className="ss-top">
        <SketchShowdownTitle />
        {view.phase !== 'over' && view.phase !== 'vote' && (
          <span className="ss-top__round" data-testid="ss-round">
            {view.suddenDeath ? 'Sudden death' : `Round ${view.roundNumber} of ${view.regularRounds}`}
          </span>
        )}
        {props.secondsLeft != null && (
          <span className="ss-top__round" role="timer" aria-live={props.secondsLeft <= 10 ? 'polite' : 'off'} data-testid="ss-clock">
            {props.secondsLeft} s
          </span>
        )}
      </div>
      <p className="ss-role">
        <TeamBadge team={view.team} /> {view.role === 'drawer' ? 'You draw' : 'You guess'}
      </p>
      {view.phase === 'pick' && <Pick {...props} />}
      {view.phase === 'countdown' && <Countdown {...props} />}
      {view.phase === 'race' && <Race {...props} />}
      {view.phase === 'race' && props.raceAction}
      {view.phase === 'reveal' && <Reveal {...props} />}
      {view.phase === 'vote' && <Vote {...props} />}
      {view.phase === 'over' && <Over {...props} />}
    </div>
  )
}
