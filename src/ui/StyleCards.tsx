// ABOUTME: The three lobby style cards, each drawn in its own style with "In use" on the current one.
// ABOUTME: Full size in TV Host settings, small on the phone Profile; tapping a card picks that style.
import { LOBBY_STYLES, type LobbyStyleId } from './themes/lobbyStyles'
import './StyleCards.css'

interface StyleCardsProps {
  current: LobbyStyleId
  size: 'tv' | 'phone'
  labelledBy: string
  onPick: (style: LobbyStyleId) => void
}

export function StyleCards({ current, size, labelledBy, onPick }: StyleCardsProps) {
  return (
    <div
      className={size === 'phone' ? 'style-cards style-cards--phone' : 'style-cards'}
      role="group"
      aria-labelledby={labelledBy}
    >
      {LOBBY_STYLES.map((style) => {
        const inUse = style.id === current
        return (
          <button
            key={style.id}
            type="button"
            className="style-card"
            data-theme={style.id}
            data-testid={`style-card-${style.id}`}
            aria-pressed={inUse}
            onClick={() => onPick(style.id)}
          >
            <span className="style-card__text">
              <span className="style-card__label">{style.label}</span>
              <span className="style-card__logo" aria-hidden="true">
                JuJu<span className="style-card__logo-rest"> Studios</span>
              </span>
            </span>
            <span className="style-card__swatches" aria-hidden="true">
              {style.swatches.map((color) => (
                <span key={color} className="style-card__swatch" style={{ background: color }} />
              ))}
            </span>
            {inUse && <span className="style-card__badge">In use</span>}
          </button>
        )
      })}
    </div>
  )
}
