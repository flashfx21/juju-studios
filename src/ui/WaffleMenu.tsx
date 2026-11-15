// ABOUTME: The top-left menu button (a 3x3 grid of dots) that opens a short list of places to go, such as Home and Leaderboard.
// ABOUTME: Escape, a tap outside or picking an item closes it, and focus returns to the button.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import './WaffleMenu.css'

export function WaffleMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    box.current?.querySelector<HTMLElement>('.waffle__panel a, .waffle__panel button')?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    function onPointer(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className="waffle" ref={box}>
      <button
        ref={button}
        type="button"
        className="waffle__button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="waffle"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          {[4, 12, 20].flatMap((y) => [4, 12, 20].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill="currentColor" />))}
        </svg>
      </button>
      {open && (
        <nav id={panelId} className="waffle__panel" aria-label="Menu" onClick={() => setOpen(false)}>
          {children}
        </nav>
      )}
    </div>
  )
}
