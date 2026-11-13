// ABOUTME: The big screen while the host signs in on their phone: where to go, and "Finish on your phone".
// ABOUTME: The TV cannot hear from the phone until rooms exist, so the screen says so and links to the lobby preview.
import { TvHeader } from '../ui/TvHeader'
import { TvStage } from '../ui/TvStage'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { siteAddress } from './siteAddress'
import { href } from './useHashRoute'
import './HostSignInTv.css'

const TITLES: Record<LobbyStyleId, string> = {
  'game-show': 'Sign in to host',
  arcade: 'Host login',
  'rec-room': 'Sign in to host',
}

export function HostSignInTv() {
  const style = useLobbyStyle()
  const [host, ...path] = siteAddress().split('/')

  return (
    <TvStage label="Sign in to host">
      <div className="tv-screen host-sign-in">
        <TvHeader title={TITLES[style]} />

        <div className={style === 'game-show' ? 'bulb-frame host-sign-in__where' : 'host-sign-in__where'}>
          <div className="host-sign-in__where-inner">
            <h2 className="host-sign-in__where-title">On your phone</h2>
            <div className="host-sign-in__address-card">
              <span className="host-sign-in__go">go to</span>
              <span className="host-sign-in__url" data-testid="sign-in-address">
                <span className="host-sign-in__url-part">{host}</span>
                {path.map((part) => (
                  <span key={part}>
                    <wbr />
                    <span className="host-sign-in__url-part">/{part}</span>
                  </span>
                ))}
              </span>
            </div>
            <p className="host-sign-in__then">then tap Host a game</p>
          </div>
        </div>

        <div className="host-sign-in__status">
          <div className="host-sign-in__status-inner">
            <span className="host-sign-in__tag">Waiting</span>
            <p className="host-sign-in__headline">Finish on your phone</p>
            <p className="host-sign-in__body">Sign in with your email on your phone and this screen opens your room.</p>
            <p className="host-sign-in__preview">
              This screen can't see your phone yet.{' '}
              <a href={href('lobby')} data-testid="lobby-preview-link">
                Preview the lobby ▸
              </a>
            </p>
          </div>
        </div>

        <div className="tv-floor">
          <span className="tv-floor__message">Your room opens here once you're signed in</span>
        </div>
      </div>
    </TvStage>
  )
}
