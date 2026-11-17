// ABOUTME: Dibs on a room's TV: before the game, how to play and who's in; during it, the TV screens from the room's
// ABOUTME: public state (no letter before it drops, no answers during the race). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { Instructions } from './Instructions'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { DibsState } from './rules'
import { TvScreen } from './TvScreen'
import { dibsRoundLabel, dibsStatus } from './tvText'

export function TvGame({ room }: { room: Room }) {
  const state = room.play ? (JSON.parse(room.play.state) as DibsState) : null
  const looks = usePlayerLooks(room, state?.players ?? [])
  const secondsLeft = useSecondsLeft(room.play?.deadline ?? null)

  if (!state) return <Instructions room={room} />

  return (
    <TvFrame title="Dibs" aside={dibsRoundLabel(state)} status={dibsStatus(state)}>
      <TvScreen state={state} looks={looks} secondsLeft={secondsLeft} />
    </TvFrame>
  )
}
