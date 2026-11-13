// ABOUTME: The game-over gallery: page through every round's two drawings with its answer.
// ABOUTME: Shown on phones until the TV screen exists; takes the gallery from tvView(), which has no secrets by then.
import { useState } from 'react'
import type { TvView } from './rules'
import { SketchCanvas } from './SketchCanvas'
import { TEAM_LOOKS } from './teams'
import '../../ui/PlaytestDev.css'
import './Gallery.css'

export function Gallery({ items }: { items: NonNullable<TvView['gallery']> }) {
  const [index, setIndex] = useState(0)
  if (items.length === 0) return null
  const item = items[Math.min(index, items.length - 1)]
  return (
    <section className="ss-gallery" aria-label="Gallery">
      <p className="ss-gallery__title">
        Round {index + 1} of {items.length}: {item.clue.answer}
      </p>
      <div className="ss-pair">
        {item.drawings.map((strokes, team) => (
          <SketchCanvas key={team} label={`${TEAM_LOOKS[team].name} drawing`} strokes={strokes} />
        ))}
      </div>
      <div className="playtest-dev__buttons">
        <button type="button" className="playtest-dev__button" disabled={index === 0} data-testid="ss-gallery-prev" onClick={() => setIndex(index - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="playtest-dev__button"
          disabled={index >= items.length - 1}
          data-testid="ss-gallery-next"
          onClick={() => setIndex(index + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
