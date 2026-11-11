// ABOUTME: This person's own lobby style, saved on this device and applied to <html> as data-theme.
// ABOUTME: Everyone picks their own: the TV shows the host's style, each phone shows its user's.
import { useLayoutEffect, useState } from 'react'
import { DEFAULT_LOBBY_STYLE, isLobbyStyleId, type LobbyStyleId } from '../ui/themes/lobbyStyles'

const STORAGE_KEY = 'juju.myStyle'
/** Where the style lived when it was a host setting; read so an earlier choice carries over. */
const EARLIER_KEY = 'juju.hostSettings'

function loadMyStyle(): LobbyStyleId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLobbyStyleId(saved)) return saved
    const earlier = JSON.parse(localStorage.getItem(EARLIER_KEY) ?? '{}').style
    return isLobbyStyleId(earlier) ? earlier : DEFAULT_LOBBY_STYLE
  } catch {
    return DEFAULT_LOBBY_STYLE
  }
}

export function useMyStyle() {
  const [style, setStyle] = useState(loadMyStyle)

  // Apply and save together, so a style carried over from the earlier key is kept under the new one.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = style
    try {
      localStorage.setItem(STORAGE_KEY, style)
    } catch {
      // Storage blocked (private browsing): the style still applies for this visit.
    }
  }, [style])

  return [style, setStyle] as const
}
