// ABOUTME: Sketch Showdown on the drawer's phone: picking the clue, the countdown, the canvas with its tool menu and the
// ABOUTME: team guess strip, the reveal of both drawings, the sudden-death vote and the result. Takes only playerView(), never full state.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PlayerId } from '../types'
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
  onNext: () => void
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

interface ToolMenuProps {
  tool: Tool
  color: number
  size: BrushSize
  onTool: (tool: Tool) => void
  onColor: (color: number) => void
  onSize: (size: BrushSize) => void
  onDone: () => void
}

/** Tool, size and color choices, laid over the canvas until OK. Escape also closes it. */
function ToolMenu({ tool, color, size, onTool, onColor, onSize, onDone }: ToolMenuProps) {
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])
  return (
    <div
      className="ss-menu"
      role="dialog"
      aria-label="Drawing tools"
      data-testid="ss-menu"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDone()
      }}
    >
      <div className="ss-tools" role="group" aria-label="Tool">
        {TOOLS.map((t) => (
          <button
            key={t}
            ref={t === tool ? first : undefined}
            type="button"
            className="ss-tool"
            aria-pressed={tool === t}
            data-testid={`ss-tool-${t}`}
            onClick={() => onTool(t)}
          >
            {TOOL_NAMES[t]}
          </button>
        ))}
      </div>
      <div className="ss-sizes" role="group" aria-label="Brush size">
        {BRUSH_SIZES.map((s) => (
          <button key={s} type="button" className="ss-tool ss-size" aria-pressed={size === s} aria-label={`Size ${s}`} data-testid={`ss-size-${s}`} onClick={() => onSize(s)}>
            <span className={`ss-size__dot ss-size__dot--${s}`} aria-hidden="true" />
            {s}
          </button>
        ))}
      </div>
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
              onColor(i)
              if (tool === 'eraser') onTool('brush')
            }}
          />
        ))}
      </div>
      <button type="button" className="ss-tool ss-menu__ok" data-testid="ss-menu-ok" onClick={onDone}>
        OK
      </button>
    </div>
  )
}

function Race(props: PhoneScreenProps) {
  const { view, names, onStroke, onUndo, onClear } = props
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState(0)
  const [size, setSize] = useState<BrushSize>('M')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  if (view.role !== 'drawer') return <p className="ss-status">Guess what your drawer is drawing</p>
  const strokes = view.drawings[view.team] ?? []
  const closeMenu = () => {
    setMenuOpen(false)
    menuButton.current?.focus()
  }

  return (
    <>
      <p className="ss-draw-line">
        Draw: <strong data-testid="ss-clue">{view.clue?.answer}</strong>
      </p>
      <div className="ss-canvas-box">
        <div className="ss-paper">
          <SketchCanvas label={`Your drawing of ${view.clue?.answer}`} strokes={strokes} onStroke={onStroke} tool={tool} color={color} size={size} />
          <button
            ref={menuButton}
            type="button"
            className="ss-menu-button"
            aria-label={`Drawing tools: ${TOOL_NAMES[tool]}, size ${size}, color ${color + 1}`}
            aria-expanded={menuOpen}
            data-testid="ss-menu-button"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">{TOOL_NAMES[tool]}</span>
            <span
              className={`ss-menu-button__dot ss-size__dot--${size}`}
              style={{ background: tool === 'eraser' ? '#ffffff' : SWATCHES[color] }}
              aria-hidden="true"
            />
          </button>
          {menuOpen && <ToolMenu tool={tool} color={color} size={size} onTool={setTool} onColor={setColor} onSize={setSize} onDone={closeMenu} />}
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
      </div>
      <p className="ss-role">
        <TeamBadge team={view.team} /> {view.role === 'drawer' ? 'You draw' : 'You guess'}
      </p>
      {view.phase === 'pick' && <Pick {...props} />}
      {view.phase === 'countdown' && <Countdown {...props} />}
      {view.phase === 'race' && <Race {...props} />}
      {view.phase === 'reveal' && <Reveal {...props} />}
      {view.phase === 'vote' && <Vote {...props} />}
      {view.phase === 'over' && <Over {...props} />}
    </div>
  )
}
