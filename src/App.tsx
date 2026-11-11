// ABOUTME: Top-level screen switch: applies the host's settings and shows the screen named in the URL hash.
// ABOUTME: Host and phone routing will grow here as the lobby and engine screens arrive.
import { HoldingPage } from './app/HoldingPage'
import { HostSettings } from './app/HostSettings'
import { useHostSettings } from './app/useHostSettings'
import { useHashRoute } from './app/useHashRoute'

function App() {
  const [settings, updateSettings] = useHostSettings()
  const route = useHashRoute()

  if (route === 'settings') {
    return <HostSettings settings={settings} onChange={updateSettings} />
  }
  return <HoldingPage />
}

export default App
