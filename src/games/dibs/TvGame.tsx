// ABOUTME: Dibs on a room's TV: before the game, how to play and who's in; during it, the TV screens from the room's
// ABOUTME: public state (no letter before it drops, no answers during the race). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { playerIds } from '../../engine/net/rooms'
import { PlayerDot } from '../room/RoomPage'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { DibsState } from './rules'
import { TvScreen, TvWaiting } from './TvScreen'
import { dibsRoundLabel, dibsStatus } from './tvText'

export function TvGame({ room }: { room: Room }) {
  const state = room.play ? (JSON.parse(room.play.state) as DibsState) : null
  const looks = usePlayerLooks(room, state?.players ?? [])
  const secondsLeft = useSecondsLeft(room.play?.deadline ?? null)

  if (!state) {
    return (
      <TvFrame title="Dibs" aside="Getting ready" status="The host picks the settings and starts on their phone">
        <div className="db-tv-split">
          <TvWaiting />
          <div className="db-tv-side">
            <span className="tv-label">In the room</span>
            <ul className="db-tv-people" aria-label="Players in the room">
              {playerIds(room).map((id) => (
                <li key={id} className="db-tv-person" data-in>
                  <PlayerDot look={looks[id]} size={34} />
                  <span className="db-tv-person__name">{looks[id]?.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TvFrame>
    )
  }

  return (
    <TvFrame title="Dibs" aside={dibsRoundLabel(state)} status={dibsStatus(state)}>
      <TvScreen state={state} looks={looks} secondsLeft={secondsLeft} />
    </TvFrame>
  )
}
