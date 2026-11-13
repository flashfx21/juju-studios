// ABOUTME: The grid of player symbols, each shown in the player's chosen color so they see the pair ("red wolf").
// ABOUTME: The chosen one is pressed and outlined; each button is named for screen readers.
import type { CSSProperties } from 'react'
import { PlayerSymbol } from './PlayerSymbol'
import { PLAYER_SYMBOL_IDS, PLAYER_SYMBOLS, type PlayerSymbolId } from './playerSymbols'
import { inkOn } from './playerColors'
import './SymbolPicker.css'

interface SymbolPickerProps {
  /** The player color's hex in the current style. */
  colorHex: string
  value: PlayerSymbolId | undefined
  /** data-testid for each button is `${testIdPrefix}-${symbol}`. */
  testIdPrefix: string
  onPick: (symbol: PlayerSymbolId) => void
}

export function SymbolPicker({ colorHex, value, testIdPrefix, onPick }: SymbolPickerProps) {
  return (
    <div className="symbol-picker" style={{ '--player': colorHex, '--player-ink': inkOn(colorHex) } as CSSProperties}>
      {PLAYER_SYMBOL_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className="symbol-picker__button"
          aria-label={PLAYER_SYMBOLS[id].name}
          aria-pressed={id === value}
          data-testid={`${testIdPrefix}-${id}`}
          onClick={() => onPick(id)}
        >
          <PlayerSymbol symbol={id} />
        </button>
      ))}
    </div>
  )
}
