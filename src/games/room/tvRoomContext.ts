// ABOUTME: What the TV page tells the room screens it shows: the room code and how to switch to another room.
// ABOUTME: Null outside the TV page, so a TV frame there shows no room details.
import { createContext } from 'react'

export interface TvRoomInfo {
  code: string
  onChangeRoom: () => void
}

export const TvRoomContext = createContext<TvRoomInfo | null>(null)
