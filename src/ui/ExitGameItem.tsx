// ABOUTME: The Exit game item in a game screen's top-left menu; opening the menu first means a stray tap can't quit.
// ABOUTME: Shows only inside a game (see GameExitContext).
import { useContext } from 'react'
import { GameExitContext } from './gameExit'

export function ExitGameItem() {
  const exit = useContext(GameExitContext)
  if (!exit) return null
  return (
    <button type="button" data-menu-last="true" data-testid="game-exit" onClick={exit}>
      Exit game
    </button>
  )
}
