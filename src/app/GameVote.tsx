// ABOUTME: The phone side of the game picker: playable games to vote on, then the coming-soon games below a divider.
// ABOUTME: Every game is coming soon for now, so the phone says so and lists them; there is nothing to lock in.
import { LINEUP } from '../games/lineup'
import { GAME_TILE_COLORS } from '../ui/gameTileColors'
import { PhoneFrame } from '../ui/PhoneFrame'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import type { GameChoice } from './useHostSettings'
import './GameVote.css'

const TITLES: Record<LobbyStyleId, Record<GameChoice, string>> = {
  'game-show': { vote: 'Cast your vote', leader: 'The host is picking' },
  arcade: { vote: 'Select game', leader: 'Host select' },
  'rec-room': { vote: 'Pick a game', leader: 'The host is picking' },
}

const DIVIDERS: Record<LobbyStyleId, string> = {
  'game-show': "Coming soon · can't vote yet",
  arcade: 'Coming soon · no coins yet',
  'rec-room': "top shelf · coming soon, can't vote yet",
}

export function GameVote({ gameChoice }: { gameChoice: GameChoice }) {
  const style = useLobbyStyle()
  const comingSoon = LINEUP.filter((game) => game.status === 'coming-soon')

  return (
    <PhoneFrame label="Vote for the next game">
      <h1 className="game-vote__title">{TITLES[style][gameChoice]}</h1>
      <p className="game-vote__empty" data-testid="vote-empty">
        No games are ready to vote on yet.
      </p>
      <h2 className="game-vote__divider" id="coming-soon-heading">
        {DIVIDERS[style]}
      </h2>
      <ul className="game-vote__chips" aria-labelledby="coming-soon-heading">
        {comingSoon.map((game) => {
          const colors = GAME_TILE_COLORS[style][game.id]
          return (
            <li
              key={game.id}
              className="game-vote__chip"
              style={style === 'rec-room' && colors ? { background: colors.bg, color: colors.ink } : undefined}
            >
              {game.title}
            </li>
          )
        })}
      </ul>
    </PhoneFrame>
  )
}
