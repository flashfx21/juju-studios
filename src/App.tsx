// ABOUTME: Top-level screen switch: applies the host's settings and shows the screen named in the URL hash.
// ABOUTME: Screens with a TV and a phone version pick one by screen shape (see useScreenKind).
import { GamePicker } from './app/GamePicker'
import { GameVote } from './app/GameVote'
import { HostSettings } from './app/HostSettings'
import { LobbyPlaceholder } from './app/LobbyPlaceholder'
import { useHashRoute, type Route } from './app/useHashRoute'
import { useHostSettings, type HostSettings as Settings } from './app/useHostSettings'
import { LobbyStyleContext } from './ui/themes/useLobbyStyle'
import { useScreenKind, type ScreenKind } from './ui/useScreenKind'

interface ScreenProps {
  route: Route
  kind: ScreenKind
  settings: Settings
  updateSettings: (change: Partial<Settings>) => void
}

function CurrentScreen({ route, kind, settings, updateSettings }: ScreenProps) {
  switch (route.screen) {
    case 'settings':
      return <HostSettings settings={settings} onChange={updateSettings} />
    case 'picker':
      return kind === 'tv' ? (
        <GamePicker gameChoice={settings.gameChoice} />
      ) : (
        <GameVote gameChoice={settings.gameChoice} />
      )
    default:
      return <LobbyPlaceholder />
  }
}

function App() {
  const [settings, updateSettings] = useHostSettings()
  const route = useHashRoute()
  const kind = useScreenKind()

  return (
    <LobbyStyleContext.Provider value={settings.style}>
      <CurrentScreen route={route} kind={kind} settings={settings} updateSettings={updateSettings} />
    </LobbyStyleContext.Provider>
  )
}

export default App
