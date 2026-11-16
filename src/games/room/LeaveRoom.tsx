// ABOUTME: Leave room in the top-left menu: a player's entry and vote leave the room, so later games don't deal them in.
// ABOUTME: The host is asked first: pass the room to another player (their phone then runs the games) or close it for everyone.
import { useRef, useState } from 'react'
import { closeRoom, leaveRoom, passHost, playerIds, type Room } from '../../engine/net/rooms'
import { MenuItems } from '../../ui/FrameMenu'
import './EndGameEarly.css'

interface LeaveRoomProps {
  room: Room
  /** This phone's player. */
  uid: string
  /** Called before the room is changed, so the screen doesn't join the player straight back in. */
  onLeaving: () => void
  /** Called if leaving failed and the player is still in the room. */
  onStayed: () => void
  /** Called once this player has left. */
  onLeft: () => void
}

export function LeaveRoom({ room, uid, onLeaving, onStayed, onLeft }: LeaveRoomProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  const isHost = room.host === uid
  const others = playerIds(room).filter((id) => id !== uid)

  async function leave(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setProblem('')
    onLeaving()
    try {
      await action()
      dialog.current?.close()
      onLeft()
    } catch (error) {
      console.error('Leaving the room failed', error)
      onStayed()
      setProblem("Couldn't leave. Check you're online and try again.")
      setBusy(false)
    }
  }

  return (
    <>
      <MenuItems>
        <button
          type="button"
          data-menu-last="true"
          data-testid="room-leave"
          onClick={() => (isHost ? dialog.current?.showModal() : void leave(() => leaveRoom(room.code, uid)))}
        >
          Leave room
        </button>
      </MenuItems>
      {isHost && (
        <dialog ref={dialog} className="room-end" aria-labelledby="room-leave-question" data-testid="room-leave-dialog">
          <p className="room-end__question" id="room-leave-question">
            {others.length > 0 ? "You're the host. Pass the room to someone, or close it for everyone?" : "You're the host. Close this room?"}
          </p>
          {others.map((id) => (
            <button
              key={id}
              type="button"
              className="phone-button"
              aria-disabled={busy || undefined}
              data-testid={`room-pass-${id}`}
              onClick={() => void leave(() => passHost(room.code, uid, id))}
            >
              Pass to {room.players[id].username}
            </button>
          ))}
          <button
            type="button"
            className="phone-button phone-button--secondary"
            aria-disabled={busy || undefined}
            data-testid="room-close"
            onClick={() => void leave(() => closeRoom(room.code))}
          >
            Close the room for everyone
          </button>
          <button type="button" className="phone-link" data-testid="room-stay" onClick={() => dialog.current?.close()}>
            Stay
          </button>
          {problem && (
            <p className="preview-note" role="alert">
              {problem}
            </p>
          )}
        </dialog>
      )}
      {!isHost && problem && (
        <p className="preview-note" role="alert">
          {problem}
        </p>
      )}
    </>
  )
}
