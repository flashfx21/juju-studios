// ABOUTME: The host's room settings (how the next game is chosen, CRT scanlines), saved in this browser.
// ABOUTME: Applies scanlines to <html> as data-scanlines; the lobby style is personal (see useMyStyle).
import { useLayoutEffect, useState } from 'react'

/** How the next game gets picked: everyone votes on their phone, or the host chooses. */
export type GameChoice = 'vote' | 'leader'

export interface HostSettings {
  gameChoice: GameChoice
  scanlines: boolean
}

const STORAGE_KEY = 'juju.hostSettings'

const DEFAULT_SETTINGS: HostSettings = { gameChoice: 'vote', scanlines: true }

export function loadHostSettings(): HostSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      gameChoice: saved.gameChoice === 'leader' ? 'leader' : DEFAULT_SETTINGS.gameChoice,
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
    document.documentElement.dataset.scanlines = settings.scanlines ? 'on' : 'off'
  }, [settings])

  function updateSettings(change: Partial<HostSettings>) {
    const next = { ...settings, ...change }
    setSettings(next)
    saveHostSettings(next)
  }

  return [settings, updateSettings] as const
}
