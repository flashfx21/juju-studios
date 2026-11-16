// ABOUTME: The top-left menu button (a 3x3 grid of dots) that opens a short list of places to go, such as Home and Leaderboard.
// ABOUTME: Escape, a tap outside or picking an item closes it, and focus returns to the button. Items can also be placed in it from elsewhere.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import './WaffleMenu.css'

interface WaffleMenuProps {
  children?: ReactNode
  /** Receives the element where items from elsewhere on the page are placed (see FrameMenu), before `children`. */
  slotRef?: (element: HTMLDivElement | null) => void
}

export function WaffleMenu({ children, slotRef }: WaffleMenuProps) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLElement>('a, button')?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    function onPointer(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    // A plain listener, not React's onClick: items placed from elsewhere pass their clicks up the page, not through this menu.
    function onPick(event: MouseEvent) {
      if ((event.target as HTMLElement).closest('a, button')) setOpen(false)
    }
    const list = panel.current
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    list?.addEventListener('click', onPick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      list?.removeEventListener('click', onPick)
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
      {/* Always in the page (hidden while closed) so items placed from elsewhere have somewhere to go. */}
      <nav ref={panel} id={panelId} className="waffle__panel" aria-label="Menu" hidden={!open}>
        {slotRef && <div className="waffle__slot" ref={slotRef} />}
        {children}
      </nav>
    </div>
  )
}
