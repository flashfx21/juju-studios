// ABOUTME: The Exit game button at the top of a game's phone screen. A second tap confirms, so a stray tap can't quit.
// ABOUTME: Shows only inside a game (see GameExitContext); the confirm resets if the player taps elsewhere.
import { useContext, useState } from 'react'
import { GameExitContext } from './gameExit'
import './GameExitButton.css'

export function GameExitButton() {
  const exit = useContext(GameExitContext)
  const [confirming, setConfirming] = useState(false)
  if (!exit) return null

  return (
    <div className="game-exit">
      <button
        type="button"
        className="game-exit__button"
        data-confirming={confirming ? 'true' : undefined}
        data-testid="game-exit"
        onClick={() => (confirming ? exit() : setConfirming(true))}
        onBlur={() => setConfirming(false)}
      >
        {confirming ? 'Tap again to exit' : '✕ Exit game'}
      </button>
    </div>
  )
}
