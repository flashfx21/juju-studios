// ABOUTME: Top-level screen switch: applies the host's settings and shows the screen named in the URL hash.
// ABOUTME: Host and phone routing will grow here as the lobby and engine screens arrive.
import { HostSettings } from './app/HostSettings'
import { LobbyPlaceholder } from './app/LobbyPlaceholder'
import { useHashRoute } from './app/useHashRoute'
import { useHostSettings } from './app/useHostSettings'
import { LobbyStyleContext } from './ui/themes/useLobbyStyle'

function App() {
  const [settings, updateSettings] = useHostSettings()
  const route = useHashRoute()

  return (
    <LobbyStyleContext.Provider value={settings.style}>
      {route.screen === 'settings' ? (
        <HostSettings settings={settings} onChange={updateSettings} />
      ) : (
        <LobbyPlaceholder />
      )}
    </LobbyStyleContext.Provider>
  )
}

export default App
