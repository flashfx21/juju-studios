// ABOUTME: A coming-soon game tile for the TV game picker: prize door, arcade cabinet or game box, by lobby style.
// ABOUTME: Shows title and tag only, can't be picked, and flashes "Not ready yet" when tapped.
import type { CSSProperties } from 'react'
import type { LineupGame } from '../games/lineup'
import { GAME_TILE_COLORS, stripeGradient } from './gameTileColors'
import { useLobbyStyle } from './themes/useLobbyStyle'
import './GameTile.css'

interface GameTileProps {
  game: LineupGame
  size: 'large' | 'small'
  showingNote: boolean
  onTap: () => void
}

/** Titles this long shrink a step so they fit without truncating (design: shrink, don't truncate). */
const LONG_TITLE = 18

export function GameTile({ game, size, showingNote, onTap }: GameTileProps) {
  const style = useLobbyStyle()
  const colors = GAME_TILE_COLORS[style][game.id]
  const tileStyle = colors
    ? ({
        '--tile-bg': colors.bg,
        '--tile-ink': colors.ink,
        '--tile-accent': colors.accent ?? colors.ink,
        '--tile-stripe': colors.stripe ? stripeGradient(colors.stripe, '90deg') : 'none',
      } as CSSProperties)
    : undefined

  return (
    <button
      type="button"
      className={`game-tile game-tile--${size}`}
      data-colored={colors ? 'true' : undefined}
      data-teaser={game.teaser ? 'true' : undefined}
      data-long={game.title.length > LONG_TITLE ? 'true' : undefined}
      data-testid={`game-tile-${game.id}`}
      style={tileStyle}
      aria-disabled="true"
      aria-label={`${game.title}, ${game.tag}, coming soon, not playable yet`}
      onClick={onTap}
    >
      <span className="game-tile__marquee" aria-hidden="true">
        Coming soon
      </span>
      <span className="game-tile__face">
        <span className="game-tile__stripe" aria-hidden="true" />
        <span className="game-tile__kicker" aria-hidden="true">
          <span className="game-tile__status">Coming soon · </span>
          {game.tag}
          <span className="game-tile__out-of-order"> · Out of order</span>
        </span>
        <span className="game-tile__title" aria-hidden="true">
          {game.title}
        </span>
      </span>
      <span className="game-tile__coin-door" aria-hidden="true">
        <span className="game-tile__coin-slot" />
        <span className="game-tile__coin-slot" />
      </span>
      <span className="game-tile__sticker" aria-hidden="true">
        Coming soon
      </span>
      {showingNote && (
        <span className="game-tile__note" aria-hidden="true">
          Not ready yet
        </span>
      )}
    </button>
  )
}
