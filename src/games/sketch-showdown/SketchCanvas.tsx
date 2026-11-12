// ABOUTME: The square drawing canvas: draws a list of strokes, and for the drawer turns one finger or a stylus into strokes.
// ABOUTME: Points are fractions of the canvas, so the same strokes look the same on every phone, tablet and the TV.
import { useEffect, useRef, type PointerEvent } from 'react'
import { SWATCHES, type BrushSize, type Stroke, type Tool } from './rules'
import './SketchCanvas.css'

/** Brush widths as a fraction of the canvas width, so XL looks the same on a phone and a tablet. */
const BRUSH_WIDTHS: Record<BrushSize, number> = { S: 0.008, M: 0.018, L: 0.035, XL: 0.07 }

const PAPER = '#ffffff'
/** Skip points closer than this to the last one, so a slow finger doesn't send thousands. */
const MIN_STEP = 0.003

interface SketchCanvasProps {
  label: string
  strokes: readonly Stroke[]
  /** Given only to the drawer during the race. */
  onStroke?: (stroke: Stroke) => void
  tool?: Tool
  color?: number
  size?: BrushSize
}

function paint(context: CanvasRenderingContext2D, stroke: Stroke, width: number) {
  const [first, ...rest] = stroke.points
  context.strokeStyle = stroke.tool === 'eraser' ? PAPER : SWATCHES[stroke.color]
  context.fillStyle = context.strokeStyle
  context.lineWidth = BRUSH_WIDTHS[stroke.size] * width
  context.lineCap = 'round'
  context.lineJoin = 'round'
  if (rest.length === 0) {
    context.beginPath()
    context.arc(first[0] * width, first[1] * width, context.lineWidth / 2, 0, Math.PI * 2)
    context.fill()
    return
  }
  context.beginPath()
  context.moveTo(first[0] * width, first[1] * width)
  for (const [x, y] of rest) context.lineTo(x * width, y * width)
  context.stroke()
}

/** Paper, then every finished stroke, then the one being drawn. */
function paintAll(element: HTMLCanvasElement | null, strokes: readonly Stroke[], inProgress?: Stroke) {
  const context = element?.getContext('2d')
  if (!element || !context) return
  const width = element.width
  context.fillStyle = PAPER
  context.fillRect(0, 0, width, width)
  for (const stroke of strokes) paint(context, stroke, width)
  if (inProgress) paint(context, inProgress, width)
}

export function SketchCanvas({ label, strokes, onStroke, tool = 'brush', color = 0, size = 'M' }: SketchCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef<{ pointerId: number; stroke: Stroke } | null>(null)
  /** Once a stylus touches the canvas, finger touches are taken as a resting palm and ignored. */
  const penSeen = useRef(false)
  /** The finished strokes, for redraws from the resize observer and pointer handlers. */
  const finished = useRef(strokes)

  const redraw = () => paintAll(canvas.current, finished.current, drawing.current?.stroke)

  useEffect(() => {
    finished.current = strokes
    paintAll(canvas.current, strokes, drawing.current?.stroke)
  }, [strokes])

  // Match the canvas's pixels to its size on screen, sharp on high-density screens.
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const resize = new ResizeObserver(() => {
      const width = Math.round(element.clientWidth * window.devicePixelRatio)
      if (width > 0 && element.width !== width) {
        element.width = width
        element.height = width
        paintAll(element, finished.current, drawing.current?.stroke)
      }
    })
    resize.observe(element)
    return () => resize.disconnect()
  }, [])

  const pointAt = (event: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clamp = (n: number) => Math.min(1, Math.max(0, n))
    return [clamp((event.clientX - rect.left) / rect.width), clamp((event.clientY - rect.top) / rect.height)]
  }

  const ignored = (event: PointerEvent<HTMLCanvasElement>) =>
    !onStroke || (penSeen.current && event.pointerType === 'touch') || (event.pointerType === 'mouse' && event.button !== 0)

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'pen') penSeen.current = true
    if (ignored(event)) return
    // One finger counts. A pen takes over from a finger that was already drawing.
    if (drawing.current && !(event.pointerType === 'pen' && drawing.current.pointerId !== event.pointerId)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = { pointerId: event.pointerId, stroke: { tool, color, size, points: [pointAt(event)] } }
    redraw()
  }

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = drawing.current
    if (!current || current.pointerId !== event.pointerId) return
    const point = pointAt(event)
    const points = current.stroke.points
    if (current.stroke.tool === 'line') {
      current.stroke = { ...current.stroke, points: [points[0], point] }
    } else {
      const [lx, ly] = points[points.length - 1]
      if (Math.hypot(point[0] - lx, point[1] - ly) < MIN_STEP) return
      current.stroke = { ...current.stroke, points: [...points, point] }
    }
    redraw()
  }

  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = drawing.current
    if (!current || current.pointerId !== event.pointerId) return
    drawing.current = null
    const rounded = current.stroke.points.map(([x, y]) => [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000] as [number, number])
    onStroke?.({ ...current.stroke, points: rounded })
  }

  return (
    <canvas
      ref={canvas}
      className="sketch-canvas"
      data-editable={onStroke ? 'true' : undefined}
      role="img"
      aria-label={label}
      data-testid="ss-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onContextMenu={(event) => event.preventDefault()}
    />
  )
}
