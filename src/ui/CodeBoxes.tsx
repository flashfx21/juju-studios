// ABOUTME: A short letters-only entry (room code, initials) drawn as one box per letter, like the design.
// ABOUTME: It is a single real text input under the boxes, so typing, pasting and screen readers work normally.
import { useState } from 'react'
import { lettersOnly } from '../app/formRules'

interface CodeBoxesProps {
  id: string
  value: string
  length: number
  invalid: boolean
  describedBy?: string
  variant?: 'initials'
  testId: string
  onChange: (value: string) => void
}

export function CodeBoxes({ id, value, length, invalid, describedBy, variant, testId, onChange }: CodeBoxesProps) {
  const [focused, setFocused] = useState(false)
  const letters = Array.from({ length }, (_, i) => value[i] ?? '')
  const activeIndex = Math.min(value.length, length - 1)

  return (
    <div className={variant ? `code-boxes code-boxes--${variant}` : 'code-boxes'} data-focused={focused || undefined}>
      {letters.map((letter, i) => (
        <span
          key={i}
          className="field__input code-boxes__box"
          aria-invalid={invalid || undefined}
          data-active={focused && i === activeIndex ? 'true' : undefined}
          aria-hidden="true"
        >
          {letter}
        </span>
      ))}
      <input
        id={id}
        className="code-boxes__input"
        value={value}
        maxLength={length}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-testid={testId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(lettersOnly(event.target.value, length))}
      />
    </div>
  )
}
