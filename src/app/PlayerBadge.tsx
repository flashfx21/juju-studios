// ABOUTME: The signed-in player's initials in their color, in the top corner of phone menu screens.
// ABOUTME: Tapping it opens Profile. Shows nothing while signed out or before the profile loads.
import type { CSSProperties } from 'react'
import { inkOn, PLAYER_COLORS } from '../ui/playerColors'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import { href } from './useHashRoute'
import { useMe } from './useMe'
import './PlayerBadge.css'

export function PlayerBadge() {
  const me = useMe()
  const style = useLobbyStyle()
  if (me.kind !== 'signed-in' || !me.profile) return null
  const { username, initials, color } = me.profile
  const hex = PLAYER_COLORS[style][color]

  return (
    <div className="player-badge-row">
      <a
        className="player-badge"
        href={href('profile')}
        style={{ '--player': hex, '--player-ink': inkOn(hex) } as CSSProperties}
        aria-label={`Your profile: ${username}`}
        data-testid="player-badge"
      >
        <span aria-hidden="true">{initials.slice(0, style === 'arcade' ? 3 : 2)}</span>
      </a>
    </div>
  )
}
