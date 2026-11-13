// ABOUTME: The row of player color buttons; the chosen one is pressed and shows a check.
// ABOUTME: Colors come from the lobby style, so the same choice looks right in every style.
import { inkOn, PLAYER_COLOR_IDS, PLAYER_COLOR_NAMES, PLAYER_COLORS, type PlayerColorId } from './playerColors'
import type { LobbyStyleId } from './themes/lobbyStyles'

interface ColorSwatchesProps {
  style: LobbyStyleId
  value: PlayerColorId
  /** data-testid for each button is `${testIdPrefix}-${color}`. */
  testIdPrefix: string
  onPick: (color: PlayerColorId) => void
}

export function ColorSwatches({ style, value, testIdPrefix, onPick }: ColorSwatchesProps) {
  return (
    <div className="swatches">
      {PLAYER_COLOR_IDS.map((id) => {
        const hex = PLAYER_COLORS[style][id]
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            className="swatch"
            style={{ background: hex, color: inkOn(hex) }}
            aria-label={PLAYER_COLOR_NAMES[id]}
            aria-pressed={selected}
            data-testid={`${testIdPrefix}-${id}`}
            onClick={() => onPick(id)}
          >
            {selected ? '✓' : ''}
          </button>
        )
      })}
    </div>
  )
}
