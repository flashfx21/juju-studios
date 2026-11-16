// ABOUTME: An on-screen QWERTY keyboard for word games (Chainword, Dibs): letter keys, Delete, an optional Enter,
// ABOUTME: and an optional last row the game fills (Dibs puts I'm out, Space and Submit there). Taps never move focus.
import type { PointerEvent, ReactNode } from 'react'
import './LetterKeyboard.css'

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

/** Pointer taps shouldn't move focus onto a key, so a physical Enter still means the game's Enter. */
function keepFocus(event: PointerEvent) {
  event.preventDefault()
}

interface KeyProps {
  label: ReactNode
  onPress: () => void
  testId: string
  ariaLabel?: string
  /** wide: Enter, Delete and other word keys. space: a space bar. primary: the game's main action, in its button color. */
  kind?: 'wide' | 'space' | 'primary'
  /** A game's mark on the key, such as Chainword's green, yellow or gray. */
  mark?: string
}

/** One key. Games use it for the keys in their own last row. */
export function Key({ label, onPress, testId, ariaLabel, kind, mark }: KeyProps) {
  return (
    <button
      type="button"
      className={kind ? `letter-key letter-key--${kind}` : 'letter-key'}
      data-mark={mark}
      data-testid={testId}
      aria-label={ariaLabel}
      onPointerDown={keepFocus}
      onClick={onPress}
    >
      {label}
    </button>
  )
}

interface LetterKeyboardProps {
  onLetter: (letter: string) => void
  onDelete: () => void
  /** When given, an Enter key sits at the left of the bottom letter row. */
  onEnter?: () => void
  /** A game's mark for a letter's key. */
  markOf?: (letter: string) => string | undefined
  /** What a screen reader hears for a letter's key; the capital letter when left out. */
  labelOf?: (letter: string) => string
  /** Start of every key's test id: `<prefix>-keyboard`, `<prefix>-key-a`, `<prefix>-key-enter`, `<prefix>-key-delete`. */
  testIdPrefix: string
  /** A last row under the letters. */
  children?: ReactNode
}

export function LetterKeyboard({ onLetter, onDelete, onEnter, markOf, labelOf, testIdPrefix, children }: LetterKeyboardProps) {
  return (
    <div className="letter-keys" role="group" aria-label="Keyboard" data-testid={`${testIdPrefix}-keyboard`}>
      {KEY_ROWS.map((row, r) => (
        <div key={row} className="letter-keys__row" data-row={r}>
          {r === 2 && onEnter && <Key label="Enter" kind="wide" testId={`${testIdPrefix}-key-enter`} onPress={onEnter} />}
          {[...row].map((letter) => (
            <Key
              key={letter}
              label={letter.toUpperCase()}
              mark={markOf?.(letter)}
              ariaLabel={labelOf?.(letter)}
              testId={`${testIdPrefix}-key-${letter}`}
              onPress={() => onLetter(letter)}
            />
          ))}
          {r === 2 && <Key label="⌫" kind="wide" ariaLabel="Delete letter" testId={`${testIdPrefix}-key-delete`} onPress={onDelete} />}
        </div>
      ))}
      {children && <div className="letter-keys__row">{children}</div>}
    </div>
  )
}
