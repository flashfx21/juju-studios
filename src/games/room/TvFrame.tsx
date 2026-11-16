// ABOUTME: The frame for any room shown on a TV: header with title and a right-hand label, the game panel, and a bar
// ABOUTME: with what's happening, the room code and where to join, and Change room. The TV page supplies the room.
import { useContext, type ReactNode } from 'react'
import { siteAddress } from '../../app/siteAddress'
import { TvHeader } from '../../ui/TvHeader'
import { TvRoomContext } from './tvRoomContext'
import '../../ui/TvGame.css'

interface TvFrameProps {
  title: string
  /** Shown at the right of the header, such as "Round 3 of 10". */
  aside?: string
  /** What's happening, in the bar along the bottom. */
  status: string
  children: ReactNode
}

export function TvFrame({ title, aside, status, children }: TvFrameProps) {
  const room = useContext(TvRoomContext)
  return (
    <div className="tv-screen">
      <TvHeader title={title}>
        {aside && (
          <span className="tv-frame__aside" data-testid="tv-aside">
            {aside}
          </span>
        )}
      </TvHeader>
      <section className="tv-panel" aria-label={title}>
        {children}
      </section>
      <footer className="tv-bar">
        <span className="tv-bar__status" role="status" data-testid="tv-status">
          {status}
        </span>
        {room && (
          <>
            <span className="tv-bar__aside" data-testid="tv-room-code">
              Room {room.code} · {siteAddress()}
            </span>
            <button type="button" className="tv-button tv-button--quiet" data-testid="tv-change-room" onClick={room.onChangeRoom}>
              Change room
            </button>
          </>
        )}
      </footer>
    </div>
  )
}
