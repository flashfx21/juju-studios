// ABOUTME: The big-screen game picker: the full lineup in the lobby style's layout, titled by the host's game choice mode.
// ABOUTME: Every game is coming soon for now, so tiles only flash "Not ready yet" when tapped.
import { useEffect, useState } from 'react'
import { LINEUP } from '../games/lineup'
import { GameTile } from '../ui/GameTile'
import { TvHeader } from '../ui/TvHeader'
import { TvStage } from '../ui/TvStage'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import type { GameChoice } from './useHostSettings'
import './GamePicker.css'

/** How long the "Not ready yet" note stays on a tapped tile (design: motion.notReadyNote). */
const NOTE_MS = 1600

const TITLES: Record<LobbyStyleId, Record<GameChoice, string>> = {
  'game-show': { vote: 'Pick the next game', leader: 'The host is picking' },
  arcade: { vote: 'Select game', leader: 'Host select' },
  'rec-room': { vote: "Pick tonight's game", leader: 'The host is picking' },
}

const ARCADE_SUBTITLES: Record<GameChoice, string> = {
  vote: 'Insert a coin from your phone',
  leader: 'The host is choosing',
}

const FOOTER_HINTS: Record<GameChoice, string> = {
  vote: 'Vote on your phone · host taps a game to start',
  leader: "Host's choice tonight · tap a game",
}

export function GamePicker({ gameChoice }: { gameChoice: GameChoice }) {
  const style = useLobbyStyle()
  const [noteFor, setNoteFor] = useState<string | null>(null)

  useEffect(() => {
    if (!noteFor) return
    const timer = setTimeout(() => setNoteFor(null), NOTE_MS)
    return () => clearTimeout(timer)
  }, [noteFor])

  const large = LINEUP.slice(0, 6)
  const small = LINEUP.slice(6)
  const shelves = [large.slice(0, 3), large.slice(3)]
  const noteGame = LINEUP.find((game) => game.id === noteFor)

  const tile = (game: (typeof LINEUP)[number], size: 'large' | 'small') => (
    <GameTile
      key={game.id}
      game={game}
      size={size}
      showingNote={noteFor === game.id}
      onTap={() => setNoteFor(game.id)}
    />
  )

  return (
    <TvStage label="Game picker">
      <div className="tv-screen game-picker" data-mode={gameChoice}>
        <TvHeader title={TITLES[style][gameChoice]} subtitle={ARCADE_SUBTITLES[gameChoice]}>
          <div className="game-picker__aside">
            <span className="game-picker__aside-main">No games ready yet</span>
            <span className="game-picker__aside-note">every box is still shrink-wrapped</span>
          </div>
        </TvHeader>

        <section className="game-picker__board" aria-label="Games">
          <div className="game-picker__top-shelf" aria-hidden="true" />
          {shelves.map((shelf, i) => (
            <div className="game-picker__row" key={i}>
              <div className="game-picker__tiles">{shelf.map((game) => tile(game, 'large'))}</div>
              <div className="game-picker__shelf" aria-hidden="true" />
            </div>
          ))}
        </section>

        <section className="game-picker__soon" aria-label="More games coming soon">
          {small.map((game) => tile(game, 'small'))}
        </section>

        <footer className="game-picker__footer">
          <span className="game-picker__hint">{FOOTER_HINTS[gameChoice]}</span>
          <span className="game-picker__status" data-testid="picker-status">
            No games ready yet
          </span>
        </footer>

        <p className="visually-hidden" aria-live="polite">
          {noteGame ? `${noteGame.title} is not ready yet.` : ''}
        </p>
      </div>
    </TvStage>
  )
}
