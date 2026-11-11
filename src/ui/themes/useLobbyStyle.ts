// ABOUTME: Shares the active lobby style with every screen, for the few words and layouts that differ per style.
// ABOUTME: Colors and fonts come from CSS tokens; use this only where copy or markup changes between styles.
import { createContext, useContext } from 'react'
import { DEFAULT_LOBBY_STYLE, type LobbyStyleId } from './lobbyStyles'

export const LobbyStyleContext = createContext<LobbyStyleId>(DEFAULT_LOBBY_STYLE)

export function useLobbyStyle(): LobbyStyleId {
  return useContext(LobbyStyleContext)
}
