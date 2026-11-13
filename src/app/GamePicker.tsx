// ABOUTME: The big-screen game picker: every game six to a page in the lobby style's layout, titled by the game choice mode.
// ABOUTME: Games in testing can be picked (and re-picked) before anyone joins; a picked game offers its Solo play pages.
import { useEffect, useState } from 'react'
import { LINEUP } from '../games/lineup'
import { GameTile } from '../ui/GameTile'
import { TvHeader } from '../ui/TvHeader'
import { TvStage } from '../ui/TvStage'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { pickActions, pickerState, TILES_PER_PAGE } from './pickerGames'
import { href } from './useHashRoute'
import type { GameChoice } from './useHostSettings'
import { useMe } from './useMe'
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
  const me = useMe()
  const canPlaytest = me.kind === 'signed-in' && me.canPlaytest
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!noteFor) return
    const timer = setTimeout(() => setNoteFor(null), NOTE_MS)
    return () => clearTimeout(timer)
  }, [noteFor])

  const pages = Math.ceil(LINEUP.length / TILES_PER_PAGE)
  const onPage = LINEUP.slice(page * TILES_PER_PAGE, (page + 1) * TILES_PER_PAGE)
  const shelves = [onPage.slice(0, 3), onPage.slice(3)]
  const readyCount = LINEUP.filter((game) => pickerState(game, canPlaytest) === 'ready').length
  const pickedGame = LINEUP.find((game) => game.id === picked)
  const noteGame = LINEUP.find((game) => game.id === noteFor)
  const status = readyCount > 0 ? `${readyCount} games in testing` : 'No games ready yet'

  const tile = (game: (typeof LINEUP)[number]) => {
    const state = pickerState(game, canPlaytest)
    return (
      <GameTile
        key={game.id}
        game={game}
        state={state}
        picked={picked === game.id}
        dimmed={picked !== null && picked !== game.id}
        showingNote={noteFor === game.id}
        onTap={() => (state === 'ready' ? setPicked(game.id) : setNoteFor(game.id))}
      />
    )
  }

  return (
    <TvStage label="Game picker">
      <div className="tv-screen game-picker" data-mode={gameChoice}>
        <TvHeader title={TITLES[style][gameChoice]} subtitle={ARCADE_SUBTITLES[gameChoice]}>
          <div className="game-picker__aside">
            <span className="game-picker__aside-main">{status}</span>
            <span className="game-picker__aside-note">
              {readyCount > 0 ? 'the rest are still shrink-wrapped' : 'every box is still shrink-wrapped'}
            </span>
          </div>
        </TvHeader>

        <section className="game-picker__board" aria-label={`Games, page ${page + 1} of ${pages}`}>
          <div className="game-picker__top-shelf" aria-hidden="true" />
          {shelves.map((shelf, i) => (
            <div className="game-picker__row" key={i}>
              <div className="game-picker__tiles">{shelf.map(tile)}</div>
              <div className="game-picker__shelf" aria-hidden="true" />
            </div>
          ))}
        </section>

        <section className="game-picker__controls" aria-label="Picked game and pages">
          <div className="game-picker__pick" aria-live="polite">
            {pickedGame ? (
              <>
                <span className="game-picker__pick-name" data-testid="picked-game">
                  {pickedGame.title}
                </span>
                {pickActions(pickedGame.id).map((action) => (
                  <a
                    key={action.page}
                    className="game-picker__action"
                    href={href('playtest', action.page)}
                    data-testid={`pick-action-${action.page}`}
                  >
                    {action.label}
                  </a>
                ))}
              </>
            ) : (
              <span className="game-picker__pick-hint">
                {readyCount > 0 ? 'Tap a game in testing to pick it' : 'Games in testing open for playtesters'}
              </span>
            )}
          </div>
          {pages > 1 && (
            <div className="game-picker__pager">
              <button
                type="button"
                className="game-picker__page-button"
                aria-label="Previous page"
                aria-disabled={page === 0 || undefined}
                data-testid="picker-previous"
                onClick={() => page > 0 && setPage(page - 1)}
              >
                ◀
              </button>
              <span className="game-picker__page" data-testid="picker-page">
                Page {page + 1} of {pages}
              </span>
              <button
                type="button"
                className="game-picker__page-button"
                aria-label="Next page"
                aria-disabled={page === pages - 1 || undefined}
                data-testid="picker-next"
                onClick={() => page < pages - 1 && setPage(page + 1)}
              >
                ▶
              </button>
            </div>
          )}
        </section>

        <footer className="game-picker__footer">
          <span className="game-picker__hint">{FOOTER_HINTS[gameChoice]}</span>
          <span className="game-picker__status" data-testid="picker-status">
            {status}
          </span>
        </footer>

        <p className="visually-hidden" aria-live="polite">
          {noteGame ? `${noteGame.title} is not ready yet.` : ''}
        </p>
      </div>
    </TvStage>
  )
}
