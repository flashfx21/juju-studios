// ABOUTME: One player symbol as inline SVG, sized to fill most of the colored circle it sits in.
// ABOUTME: The circle around it supplies the colors (see PlayerSymbol.css).
import { PLAYER_SYMBOLS, type PlayerSymbolId } from './playerSymbols'
import './PlayerSymbol.css'

export function PlayerSymbol({ symbol }: { symbol: PlayerSymbolId }) {
  return (
    <svg
      className="player-symbol"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PLAYER_SYMBOLS[symbol].markup }}
    />
  )
}
