// ABOUTME: The host's screen settings (lobby style, CRT scanlines), saved in this browser between visits.
// ABOUTME: Applies them to <html> as data-theme and data-scanlines so every screen restyles at once.
import { useLayoutEffect, useState } from 'react'
import { DEFAULT_LOBBY_STYLE, isLobbyStyleId, type LobbyStyleId } from '../ui/themes/lobbyStyles'

export interface HostSettings {
  style: LobbyStyleId
  scanlines: boolean
}

const STORAGE_KEY = 'juju.hostSettings'

const DEFAULT_SETTINGS: HostSettings = { style: DEFAULT_LOBBY_STYLE, scanlines: true }

export function loadHostSettings(): HostSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      style: isLobbyStyleId(saved.style) ? saved.style : DEFAULT_SETTINGS.style,
      scanlines: typeof saved.scanlines === 'boolean' ? saved.scanlines : DEFAULT_SETTINGS.scanlines,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveHostSettings(settings: HostSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be blocked (private browsing); the setting still applies for this visit.
  }
}

export function useHostSettings() {
  const [settings, setSettings] = useState(loadHostSettings)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = settings.style
    document.documentElement.dataset.scanlines = settings.scanlines ? 'on' : 'off'
  }, [settings])

  function updateSettings(change: Partial<HostSettings>) {
    const next = { ...settings, ...change }
    setSettings(next)
    saveHostSettings(next)
  }

  return [settings, updateSettings] as const
}
