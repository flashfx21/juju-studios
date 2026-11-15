// ABOUTME: A row of tabs (Profile's Profile and Stats, Admin's sections): one selected, the panel below follows it.
// ABOUTME: Arrow keys, Home and End move between tabs, as screen reader users expect. Panels use TabPanel.
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import './Tabs.css'

interface TabsProps<T extends string> {
  tabs: readonly { id: T; label: string }[]
  current: T
  /** Starts every tab and panel id, so two tab rows never clash ("profile" gives "profile-tab-stats"). */
  idPrefix: string
  label: string
  onChange: (tab: T) => void
}

export function Tabs<T extends string>({ tabs, current, idPrefix, label, onChange }: TabsProps<T>) {
  const buttons = useRef<Partial<Record<T, HTMLButtonElement | null>>>({})

  function onKeyDown(event: KeyboardEvent) {
    const index = tabs.findIndex((t) => t.id === current)
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(tabs[next].id)
    buttons.current[tabs[next].id]?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map(({ id, label: tabLabel }) => (
        <button
          key={id}
          ref={(element) => {
            buttons.current[id] = element
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${id}`}
          className="tabs__tab"
          aria-selected={current === id}
          aria-controls={`${idPrefix}-panel-${id}`}
          tabIndex={current === id ? 0 : -1}
          data-testid={`${idPrefix}-tab-${id}`}
          onClick={() => onChange(id)}
        >
          {tabLabel}
        </button>
      ))}
    </div>
  )
}

/** The panel for the selected tab, tied to it for screen readers. */
export function TabPanel({ idPrefix, id, children }: { idPrefix: string; id: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} className="tabs__panel">
      {children}
    </div>
  )
}
