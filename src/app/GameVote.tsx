// ABOUTME: The phone side of the game picker: games in testing as rows to pick (and re-pick), then the rest as chips.
// ABOUTME: Picking a game offers its Solo play pages; no lobby is needed. Votes and Lock in wait for rooms.
import { useState, type CSSProperties } from 'react'
import { LINEUP } from '../games/lineup'
import { GAME_TILE_COLORS } from '../ui/gameTileColors'
import { PICKER_STATE_LABELS } from '../ui/gameTileStates'
import { PhoneFrame } from '../ui/PhoneFrame'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { pickActions, pickerState } from './pickerGames'
import { PlayerBadge } from './PlayerBadge'
import { href } from './useHashRoute'
import type { GameChoice } from './useHostSettings'
import { useMe } from './useMe'
import './GameVote.css'

const TITLES: Record<LobbyStyleId, Record<GameChoice, string>> = {
  'game-show': { vote: 'Cast your vote', leader: 'The host is picking' },
  arcade: { vote: 'Select game', leader: 'Host select' },
  'rec-room': { vote: 'Pick a game', leader: 'The host is picking' },
}

const DIVIDERS: Record<LobbyStyleId, string> = {
  'game-show': "Coming soon · can't pick yet",
  arcade: 'Coming soon · no coins yet',
  'rec-room': "top shelf · coming soon, can't pick yet",
}

export function GameVote({ gameChoice }: { gameChoice: GameChoice }) {
  const style = useLobbyStyle()
  const me = useMe()
  const canPlaytest = me.kind === 'signed-in' && me.canPlaytest
  const [picked, setPicked] = useState<string | null>(null)
  const ready = LINEUP.filter((game) => pickerState(game, canPlaytest) === 'ready')
  const rest = LINEUP.filter((game) => pickerState(game, canPlaytest) !== 'ready')
  const pickedGame = ready.find((game) => game.id === picked)

  return (
    <PhoneFrame label="Pick a game">
      <div className="game-vote__top">
        <a className="game-vote__back" href={href('lobby')} data-testid="vote-back-top">
          ‹ Back
        </a>
        <PlayerBadge />
      </div>
      <h1 className="game-vote__title">{TITLES[style][gameChoice]}</h1>
      {ready.length === 0 ? (
        <p className="game-vote__empty" data-testid="vote-empty">
          No games are ready to pick yet. Games in testing open for playtesters.
        </p>
      ) : (
        <ul className="game-vote__rows" aria-label="Games in testing">
          {ready.map((game) => {
            const colors = GAME_TILE_COLORS[style][game.id]
            return (
              <li key={game.id}>
                <button
                  type="button"
                  className="game-vote__row"
                  aria-pressed={picked === game.id}
                  data-testid={`vote-row-${game.id}`}
                  style={colors ? ({ '--row-bg': colors.bg, '--row-ink': colors.ink } as CSSProperties) : undefined}
                  onClick={() => setPicked(game.id)}
                >
                  <span className="game-vote__number">{game.number}</span>
                  <span className="game-vote__row-text">
                    <span className="game-vote__row-title">{game.title}</span>
                    <span className="game-vote__row-tag">
                      {game.tag} · {PICKER_STATE_LABELS.ready}
                    </span>
                  </span>
                  {picked === game.id && <span className="game-vote__mark">Picked</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {pickedGame && (
        <div className="game-vote__actions" aria-live="polite">
          {pickActions(pickedGame.id).map((action, i) => (
            <a
              key={action.page}
              className={i === 0 ? 'phone-button' : 'phone-button phone-button--secondary'}
              href={href('playtest', action.page)}
              data-testid={`pick-action-${action.page}`}
            >
              {action.label}
            </a>
          ))}
        </div>
      )}

      <h2 className="game-vote__divider" id="coming-soon-heading">
        {DIVIDERS[style]}
      </h2>
      <ul className="game-vote__chips" aria-labelledby="coming-soon-heading">
        {rest.map((game) => {
          const colors = GAME_TILE_COLORS[style][game.id]
          return (
            <li
              key={game.id}
              className="game-vote__chip"
              style={style === 'rec-room' && colors ? { background: colors.bg, color: colors.ink } : undefined}
            >
              {game.number} {game.title}
              <span className="game-vote__chip-state"> · {PICKER_STATE_LABELS[pickerState(game, canPlaytest)]}</span>
            </li>
          )
        })}
      </ul>
      <div className="phone-actions">
        <a className="phone-link" href={href('lobby')} data-testid="vote-back">
          Back
        </a>
      </div>
    </PhoneFrame>
  )
}
