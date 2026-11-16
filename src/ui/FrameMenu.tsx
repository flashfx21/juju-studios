// ABOUTME: The top row of a phone screen: the top-left menu and the top-right corner (the player's badge).
// ABOUTME: Any part of a screen can add menu items with MenuItems, or fill the corner with FrameCorner; the row shows only when something is in it.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WaffleMenu } from './WaffleMenu'

interface FrameSlots {
  menu: HTMLElement | null
  corner: HTMLElement | null
  countMenu: (change: number) => void
  countCorner: (change: number) => void
}

const FrameSlotsContext = createContext<FrameSlots | null>(null)

/** Puts its children in the screen's slot, or right where it is when there's no phone frame around it. */
function useSlot(pick: (slots: FrameSlots) => HTMLElement | null, count: (slots: FrameSlots) => (change: number) => void) {
  const slots = useContext(FrameSlotsContext)
  const counter = slots ? count(slots) : null
  useEffect(() => {
    if (!counter) return
    counter(1)
    return () => counter(-1)
  }, [counter])
  return slots ? pick(slots) : undefined
}

/** Items (links or buttons) for the screen's top-left menu. */
export function MenuItems({ children }: { children: ReactNode }) {
  const target = useSlot(
    (slots) => slots.menu,
    (slots) => slots.countMenu,
  )
  if (target === undefined) return <>{children}</>
  return target ? createPortal(children, target) : null
}

/** What sits in the screen's top-right corner, such as the player's badge. */
export function FrameCorner({ children }: { children: ReactNode }) {
  const target = useSlot(
    (slots) => slots.corner,
    (slots) => slots.countCorner,
  )
  if (target === undefined) return <>{children}</>
  return target ? createPortal(children, target) : null
}

/** Used by the phone frame: the top row, and the provider its screen fills in. `fixedItems` always sit last in the menu. */
export function FrameTop({ fixedItems, children }: { fixedItems?: ReactNode; children: ReactNode }) {
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [corner, setCorner] = useState<HTMLElement | null>(null)
  const [menuCount, setMenuCount] = useState(0)
  const [cornerCount, setCornerCount] = useState(0)
  const countMenu = useCallback((change: number) => setMenuCount((count) => count + change), [])
  const countCorner = useCallback((change: number) => setCornerCount((count) => count + change), [])
  const slots = useMemo(() => ({ menu, corner, countMenu, countCorner }), [menu, corner, countMenu, countCorner])
  const hasMenu = menuCount > 0 || !!fixedItems

  return (
    <FrameSlotsContext.Provider value={slots}>
      <div className="frame-top" hidden={!hasMenu && cornerCount === 0}>
        {hasMenu && (
          <WaffleMenu slotRef={setMenu}>
            {fixedItems}
          </WaffleMenu>
        )}
        <div className="frame-top__corner" ref={setCorner} />
      </div>
      {children}
    </FrameSlotsContext.Provider>
  )
}
