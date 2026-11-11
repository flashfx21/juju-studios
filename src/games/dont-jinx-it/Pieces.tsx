// ABOUTME: Small pieces Don't Jinx It's TV and phone screens share: player chips and the word in letter tiles.
// ABOUTME: Sizes are passed in pixels so the TV and phone draw the same piece at their own scale.
import type { CSSProperties } from 'react'
import { inkOn, PLAYER_COLORS, type PlayerColorId } from '../../ui/playerColors'
import { useLobbyStyle } from '../../ui/themes/useLobbyStyle'
import { initials } from './format'
import './Pieces.css'

/** How a player appears on screen. */
export interface Seat {
  name: string
  color: PlayerColorId
}

interface ChipProps {
  seat: Seat
  /** Diameter in pixels. */
  size: number
  /** A gold ring around the chip, for the player in the spotlight. */
  ringed?: boolean
}

/** A player's color circle with their initials. Decorative: the name always sits beside it. */
export function Chip({ seat, size, ringed }: ChipProps) {
  const style = useLobbyStyle()
  const background = PLAYER_COLORS[style][seat.color]
  return (
    <span
      className={ringed ? 'dji-chip dji-chip--ringed' : 'dji-chip'}
      style={{ background, color: inkOn(background), width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {initials(seat.name)}
    </span>
  )
}

const TILE_GAP = 4

interface WordTilesProps {
  word: string
  /** Widest a tile may be, in pixels. */
  tile: number
  /** Widest the whole word may be; long words shrink their tiles to fit. */
  room: number
}

/** The word in letter tiles. Screen readers get the word once, not letter by letter. */
export function WordTiles({ word, tile, room }: WordTilesProps) {
  const width = Math.min(tile, Math.floor((room + TILE_GAP) / word.length) - TILE_GAP)
  return (
    <span className="dji-tiles" style={{ '--tile': `${width}px` } as CSSProperties} data-testid="dji-word">
      <span className="visually-hidden">{word}</span>
      {[...word].map((letter, i) => (
        <span key={i} className="dji-tiles__tile" aria-hidden="true">
          {letter}
        </span>
      ))}
    </span>
  )
}
