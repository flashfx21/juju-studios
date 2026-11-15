// ABOUTME: A button for an action that's hard to undo: the first tap asks "Tap again to ...", the second does it.
// ABOUTME: Moving focus away cancels the question, so a stray tap never confirms.
import { useState } from 'react'

interface ConfirmButtonProps {
  label: string
  /** Shown after the first tap, e.g. "Tap again to delete". */
  confirmLabel: string
  className: string
  testId: string
  onConfirm: () => void
}

export function ConfirmButton({ label, confirmLabel, className, testId, onConfirm }: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)
  return (
    <button
      type="button"
      className={className}
      data-testid={testId}
      onClick={() => {
        if (!asking) {
          setAsking(true)
          return
        }
        setAsking(false)
        onConfirm()
      }}
      onBlur={() => setAsking(false)}
    >
      {asking ? confirmLabel : label}
    </button>
  )
}
