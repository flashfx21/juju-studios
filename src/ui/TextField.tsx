// ABOUTME: A labelled phone form field with its error message wired up for screen readers.
// ABOUTME: Password fields get a Show / Hide toggle, as in the sign-in design.
import { useState, type ReactNode } from 'react'
import './PhoneForm.css'

interface FieldProps {
  id: string
  label: string
  error: string
  children: ReactNode
}

/** Label above, control in the middle, error message below. */
export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  error: string
  type?: 'text' | 'email' | 'password'
  autoComplete: string
  testId: string
  onChange: (value: string) => void
}

export function TextField({ id, label, value, error, type = 'text', autoComplete, testId, onChange }: TextFieldProps) {
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'

  return (
    <Field id={id} label={label} error={error}>
      <div className="field__box">
        <input
          id={id}
          className={isPassword ? 'field__input field__input--with-toggle' : 'field__input'}
          type={isPassword && shown ? 'text' : type}
          value={value}
          autoComplete={autoComplete}
          inputMode={type === 'email' ? 'email' : undefined}
          autoCapitalize={type === 'text' ? 'words' : 'none'}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          data-testid={testId}
          onChange={(event) => onChange(event.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            aria-pressed={shown}
            aria-label={shown ? 'Hide password' : 'Show password'}
            data-testid={`${testId}-toggle`}
            onClick={() => setShown(!shown)}
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </Field>
  )
}
