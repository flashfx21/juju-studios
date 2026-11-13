// ABOUTME: A labeled row of choices for a game's setup (scoring, rounds, bots...). The chosen one is pressed and checked.
// ABOUTME: The check mark means the choice never relies on color alone.
import './OptionRow.css'

interface OptionRowProps<T extends string | number> {
  label: string
  options: readonly T[]
  names: Record<T, string>
  value: T
  onChoose: (value: T) => void
}

export function OptionRow<T extends string | number>({ label, options, names, value, onChoose }: OptionRowProps<T>) {
  return (
    <div className="option-row" role="group" aria-label={label}>
      <span className="option-row__label">{label}</span>
      <div className="option-row__buttons">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="option-row__button"
            aria-pressed={option === value}
            data-testid={`option-${label.toLowerCase()}-${option}`}
            onClick={() => onChoose(option)}
          >
            {names[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
