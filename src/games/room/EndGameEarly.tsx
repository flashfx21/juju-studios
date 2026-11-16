// ABOUTME: The host's End game in the top-left menu while a room game runs: save the results as they stand, or end without saving.
// ABOUTME: Without saving, a lobby room goes back to the lobby and any other room back to its waiting room; nothing reaches the leaderboard.
import { useRef } from 'react'
import { clearPlay, LOBBY, switchGame, type Room } from '../../engine/net/rooms'
import { MenuItems } from '../../ui/FrameMenu'
import './EndGameEarly.css'

interface EndGameEarlyProps {
  room: Room
  /** Ends the game now with places as they stand; the game's own end then saves the result like any finished game. */
  onSave: () => void
}

export function EndGameEarly({ room, onSave }: EndGameEarlyProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = () => dialog.current?.close()

  return (
    <>
      <MenuItems>
        <button type="button" data-testid="room-end-game" onClick={() => dialog.current?.showModal()}>
          End game
        </button>
      </MenuItems>
      <dialog ref={dialog} className="room-end" aria-labelledby="room-end-question" data-testid="room-end-dialog">
        <p className="room-end__question" id="room-end-question">
          End this game for everyone now?
        </p>
        <button
          type="button"
          className="phone-button"
          data-testid="room-end-save"
          onClick={() => {
            close()
            onSave()
          }}
        >
          Save results so far
        </button>
        <button
          type="button"
          className="phone-button phone-button--secondary"
          data-testid="room-end-discard"
          onClick={() => {
            close()
            void (room.lobby ? switchGame(room.code, LOBBY) : clearPlay(room.code))
          }}
        >
          End without saving
        </button>
        <button type="button" className="phone-link" data-testid="room-end-keep" onClick={close}>
          Keep playing
        </button>
      </dialog>
    </>
  )
}
