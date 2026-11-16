// ABOUTME: Zero In on a room's TV: before the game, how to play and who's in; during it, the TV screens from the room's
// ABOUTME: public state (no answers or guesses until the reveal). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { playerIds } from '../../engine/net/rooms'
import { PlayerDot } from '../room/RoomPage'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { ZeroInState } from './rules'
import { TvScreen, TvWaiting } from './TvScreen'
import { zeroInRoundLabel, zeroInStatus } from './tvText'

export function TvGame({ room }: { room: Room }) {
  const state = room.play ? (JSON.parse(room.play.state) as ZeroInState) : null
  const looks = usePlayerLooks(room, state?.players ?? [])
  const secondsLeft = useSecondsLeft(state?.phase === 'guessing' ? (room.play?.deadline ?? null) : null)

  if (!state) {
    return (
      <TvFrame title="Zero In" aside="Getting ready" status="The host picks the settings and starts on their phone">
        <div className="zi-tv-guessing">
          <TvWaiting />
          <div className="zi-tv-guessing__side">
            <span className="tv-label">In the room</span>
            <ul className="zi-tv-locks" aria-label="Players in the room">
              {playerIds(room).map((id) => (
                <li key={id} className="zi-tv-lock" data-locked>
                  <PlayerDot look={looks[id]} size={36} />
                  <span className="zi-tv-lock__name">{looks[id]?.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TvFrame>
    )
  }

  return (
    <TvFrame title="Zero In" aside={zeroInRoundLabel(state)} status={zeroInStatus(state)}>
      <TvScreen state={state} looks={looks} secondsLeft={secondsLeft} />
    </TvFrame>
  )
}
