// ABOUTME: Top-level screen switch: applies this person's style, the host's settings and who is signed in, then shows the screen in the URL hash.
// ABOUTME: Screens with a TV and a phone version pick one by screen shape (see useScreenKind).
import { GamePicker } from './app/GamePicker'
import { GameVote } from './app/GameVote'
import { HostOrJoinPhone, HostOrJoinTv } from './app/HostOrJoin'
import { HostSettings } from './app/HostSettings'
import { HostSignInTv } from './app/HostSignInTv'
import { Join } from './app/Join'
import { LobbyPlaceholder } from './app/LobbyPlaceholder'
import { PlaytestPage } from './app/PlaytestPage'
import { Profile } from './app/Profile'
import { SignIn } from './app/SignIn'
import { useHashRoute, type Route } from './app/useHashRoute'
import { useHostSettings, type HostSettings as Settings } from './app/useHostSettings'
import { MeProvider } from './app/MeProvider'
import { useMe } from './app/useMe'
import { useMyStyle } from './app/useMyStyle'
import type { LobbyStyleId } from './ui/themes/lobbyStyles'
import { LobbyStyleContext } from './ui/themes/useLobbyStyle'
import { useScreenKind, type ScreenKind } from './ui/useScreenKind'

interface ScreenProps {
  route: Route
  kind: ScreenKind
  settings: Settings
  updateSettings: (change: Partial<Settings>) => void
  style: LobbyStyleId
  setStyle: (style: LobbyStyleId) => void
}

function CurrentScreen({ route, kind, settings, updateSettings, style, setStyle }: ScreenProps) {
  const me = useMe()
  // Everyone has a profile: a signed-in player without one sets it up before anything else.
  if (me.kind === 'signed-in' && me.profile === null && route.screen !== 'sign-in') {
    return <Profile style={style} onStyleChange={setStyle} />
  }

  switch (route.screen) {
    case 'settings':
      return <HostSettings settings={settings} onChange={updateSettings} style={style} onStyleChange={setStyle} />
    case 'profile':
      return <Profile style={style} onStyleChange={setStyle} />
    case 'picker':
      return kind === 'tv' ? (
        <GamePicker gameChoice={settings.gameChoice} />
      ) : (
        <GameVote gameChoice={settings.gameChoice} />
      )
    case 'host':
      return kind === 'tv' ? <HostSignInTv /> : <SignIn step="" />
    case 'sign-in':
      return <SignIn step={route.step} />
    case 'join':
      return <Join />
    case 'playtest':
      return <PlaytestPage gameId={route.step} />
    case 'lobby':
      return <LobbyPlaceholder />
    default:
      return kind === 'tv' ? <HostOrJoinTv /> : <HostOrJoinPhone />
  }
}

function App() {
  const [style, setStyle] = useMyStyle()
  const [settings, updateSettings] = useHostSettings()
  const route = useHashRoute()
  const kind = useScreenKind()

  return (
    <LobbyStyleContext.Provider value={style}>
      <MeProvider>
        <CurrentScreen
          route={route}
          kind={kind}
          settings={settings}
          updateSettings={updateSettings}
          style={style}
          setStyle={setStyle}
        />
      </MeProvider>
    </LobbyStyleContext.Provider>
  )
}

export default App
