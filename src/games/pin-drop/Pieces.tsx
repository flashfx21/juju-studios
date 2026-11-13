// ABOUTME: Pin Drop pieces shared by the solo and two-phone playtests: a row of setting options and the round photo.
// ABOUTME: The photo stands in for the TV until Pin Drop has a TV screen; tap it to see it full screen.
import { useEffect, useState } from 'react'
import { creditText } from './format'
import type { Photo } from './rules'
import './Pieces.css'

interface OptionRowProps<T extends string | number> {
  label: string
  options: readonly T[]
  names: Record<T, string>
  value: T
  onChoose: (value: T) => void
}

export function OptionRow<T extends string | number>({ label, options, names, value, onChoose }: OptionRowProps<T>) {
  return (
    <div className="pd-option" role="group" aria-label={label}>
      <span className="pd-option__label">{label}</span>
      <div className="pd-option__buttons">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="pd-option__button"
            aria-pressed={option === value}
            data-testid={`pd-option-${label.toLowerCase()}-${option}`}
            onClick={() => onChoose(option)}
          >
            {names[option]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** The round's photo, small above the map; tap it to see it full screen. A credit that names the place waits. */
export function RoundPhoto({ photo }: { photo: Photo }) {
  const [big, setBig] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!big) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setBig(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [big])

  if (failed) {
    return (
      <div className="pd-tv pd-tv--failed" role="alert">
        <span>The photo didn't load.</span>
        <button
          type="button"
          className="playtest-dev__button"
          data-testid="pd-photo-retry"
          onClick={() => {
            setFailed(false)
            setAttempt((n) => n + 1)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <figure className="pd-tv" data-big={big ? 'true' : undefined}>
      <button
        type="button"
        className="pd-tv__button"
        aria-label={big ? 'Photo. Tap to shrink' : 'Photo. Tap to see it full screen'}
        aria-expanded={big}
        data-testid="pd-photo"
        onClick={() => setBig(!big)}
      >
        <img key={attempt} className="pd-tv__image" src={photo.image} alt="" onError={() => setFailed(true)} />
      </button>
      {!photo.creditSpoiler && <figcaption className="pd-tv__credit">{creditText(photo)}</figcaption>}
    </figure>
  )
}
