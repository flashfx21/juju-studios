// ABOUTME: A game tile for the TV game picker: prize door, arcade cabinet or game box, by lobby style.
// ABOUTME: In-testing games show their pitch and can be picked; the rest are marked and flash "Not ready yet" when tapped.
import type { CSSProperties } from 'react'
import type { LineupGame } from '../games/lineup'
import { GAME_TILE_COLORS, stripeGradient } from './gameTileColors'
import { PICKER_STATE_LABELS, type PickerState } from './gameTileStates'
import { useLobbyStyle } from './themes/useLobbyStyle'
import './GameTile.css'

interface GameTileProps {
  game: LineupGame
  state: PickerState
  /** This tile is the picked game. */
  picked: boolean
  /** Another tile is picked, so this one steps back. */
  dimmed: boolean
  showingNote: boolean
  onTap: () => void
}

/** Titles this long shrink a step so they fit without truncating (design: shrink, don't truncate). */
const LONG_TITLE = 18

export function GameTile({ game, state, picked, dimmed, showingNote, onTap }: GameTileProps) {
  const style = useLobbyStyle()
  const colors = GAME_TILE_COLORS[style][game.id]
  const ready = state === 'ready'
  const label = PICKER_STATE_LABELS[state]
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
      className="game-tile game-tile--large"
      data-state={state}
      data-picked={picked ? 'true' : undefined}
      data-dimmed={dimmed ? 'true' : undefined}
      data-colored={colors ? 'true' : undefined}
      data-teaser={game.teaser ? 'true' : undefined}
      data-long={game.title.length > LONG_TITLE ? 'true' : undefined}
      data-testid={`game-tile-${game.id}`}
      style={tileStyle}
      aria-disabled={ready ? undefined : 'true'}
      aria-pressed={ready ? picked : undefined}
      aria-label={`${game.number} ${game.title}, ${game.tag}, ${label.toLowerCase()}${ready ? '' : ', not playable yet'}`}
      onClick={onTap}
    >
      <span className="game-tile__marquee" aria-hidden="true">
        {label}
      </span>
      <span className="game-tile__face">
        <span className="game-tile__stripe" aria-hidden="true" />
        <span className="game-tile__kicker" aria-hidden="true">
          <span className="game-tile__number">{game.number} · </span>
          <span className="game-tile__status">{label} · </span>
          {game.tag}
          {!ready && <span className="game-tile__out-of-order"> · Out of order</span>}
        </span>
        <span className="game-tile__title" aria-hidden="true">
          {game.title}
        </span>
        {ready && (
          <span className="game-tile__pitch" aria-hidden="true">
            {game.pitch}
          </span>
        )}
      </span>
      <span className="game-tile__coin-door" aria-hidden="true">
        <span className="game-tile__coin-slot" />
        <span className="game-tile__coin-slot" />
      </span>
      <span className="game-tile__sticker" aria-hidden="true">
        {label}
      </span>
      {picked && (
        <span className="game-tile__picked" aria-hidden="true">
          Picked
        </span>
      )}
      {showingNote && (
        <span className="game-tile__note" aria-hidden="true">
          Not ready yet
        </span>
      )}
    </button>
  )
}
