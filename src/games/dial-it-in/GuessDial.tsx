// ABOUTME: A safe-style dial for choosing a guess: drag the face clockwise to count up, counterclockwise to count down.
// ABOUTME: Works as a slider for keyboards and screen readers (arrow keys, Page Up/Down, Home/End).
import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { angleFromTop, faceRotation, numberAngle, shownNumber, turnBetween, turnedValue } from './dialTurns'
import './GuessDial.css'

interface GuessDialProps {
  value: number
  range: number
  label: string
  onChange: (value: number) => void
}

/** Drawing units: the face is drawn in a 200 by 200 box, centered on 100, 100. */
const CENTER = 100
const FACE_RADIUS = 92
const LABEL_RADIUS = 66

function pointAt(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180
  return { x: CENTER + radius * Math.sin(radians), y: CENTER - radius * Math.cos(radians) }
}

/**
 * Ticks for every number, longer every 5. Labels every 10 on the 1 to 100 dial and every 5 on the 1 to 50 dial;
 * 1 gets a tick but no label, since it sits right beside the top number and the two would overlap.
 */
function Face({ range }: { range: number }) {
  const labelEvery = range >= 100 ? 10 : 5
  const numbers = Array.from({ length: range }, (_, i) => i + 1)
  return (
    <>
      <circle className="dii-dial__face" cx={CENTER} cy={CENTER} r={FACE_RADIUS} />
      {numbers.map((n) => {
        const angle = numberAngle(n, range)
        const long = n === 1 || n % 5 === 0
        const outer = pointAt(angle, FACE_RADIUS - 3)
        const inner = pointAt(angle, FACE_RADIUS - (long ? 14 : 8))
        return (
          <line
            key={n}
            className={long ? 'dii-dial__tick dii-dial__tick--long' : 'dii-dial__tick'}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
          />
        )
      })}
      {numbers
        .filter((n) => n % labelEvery === 0)
        .map((n) => {
          const angle = numberAngle(n, range)
          const at = pointAt(angle, LABEL_RADIUS)
          return (
            <text
              key={n}
              className="dii-dial__number"
              x={at.x}
              y={at.y}
              transform={`rotate(${angle} ${at.x} ${at.y})`}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {n}
            </text>
          )
        })}
    </>
  )
}

export function GuessDial({ value, range, label, onChange }: GuessDialProps) {
  const dial = useRef<HTMLDivElement>(null)
  /** While dragging: the unrounded value and the pointer's last angle, so slow turns still add up. */
  const drag = useRef<{ value: number; angle: number } | null>(null)

  function pointerAngle(event: PointerEvent) {
    const box = dial.current!.getBoundingClientRect()
    return angleFromTop(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2))
  }

  function startTurn(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus()
    drag.current = { value, angle: pointerAngle(event) }
  }

  function turn(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const angle = pointerAngle(event)
    const next = turnedValue(drag.current.value, turnBetween(drag.current.angle, angle), range)
    drag.current = { value: next, angle }
    const shown = shownNumber(next, range)
    if (shown !== value) onChange(shown)
  }

  function endTurn() {
    drag.current = null
  }

  function nudge(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowUp: value + 1,
      ArrowRight: value + 1,
      ArrowDown: value - 1,
      ArrowLeft: value - 1,
      PageUp: value + 10,
      PageDown: value - 10,
      Home: 1,
      End: range,
    }
    if (!(event.key in steps)) return
    event.preventDefault()
    onChange(Math.min(range, Math.max(1, steps[event.key])))
  }

  return (
    <div className="dii-dial">
      <div
        ref={dial}
        className="dii-dial__control"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={range}
        aria-valuenow={value}
        data-testid="dii-dial"
        onPointerDown={startTurn}
        onPointerMove={turn}
        onPointerUp={endTurn}
        onPointerCancel={endTurn}
        onKeyDown={nudge}
      >
        <svg className="dii-dial__svg" viewBox="0 0 200 200" aria-hidden="true">
          <g transform={`rotate(${faceRotation(value, range)} ${CENTER} ${CENTER})`}>
            <Face range={range} />
          </g>
          <circle className="dii-dial__hub" cx={CENTER} cy={CENTER} r={38} />
          <text
            className="dii-dial__value"
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            dominantBaseline="central"
            data-testid="dii-dial-value"
          >
            {value}
          </text>
        </svg>
        <span className="dii-dial__mark" aria-hidden="true" />
      </div>
      <p className="dii-dial__hint" aria-hidden="true">
        Turn clockwise to go up, counterclockwise to go down
      </p>
    </div>
  )
}
