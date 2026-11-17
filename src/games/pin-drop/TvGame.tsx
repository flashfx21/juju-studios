// ABOUTME: Pin Drop on a room's TV: before the game, how to play and who's in; during it, the TV screens from the room's
// ABOUTME: public state (no place name or pins until the reveal). Display only: the host's phone runs the game.
import { useMemo } from 'react'
import type { Room } from '../../engine/net/rooms'
import { Instructions } from './Instructions'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { PinDropState } from './rules'
import { TvScreen } from './TvScreen'
import { pinDropRoundLabel, pinDropStatus } from './tvText'

export function TvGame({ room }: { room: Room }) {
  const shared = room.play?.state
  // Read once per change, so the results map keeps its pins while nothing in the game has changed.
  const state = useMemo(() => (shared ? (JSON.parse(shared) as PinDropState) : null), [shared])
  const looks = usePlayerLooks(room, state?.players ?? [])
  const secondsLeft = useSecondsLeft(state?.phase === 'guessing' ? (room.play?.deadline ?? null) : null)

  if (!state) return <Instructions room={room} />

  return (
    <TvFrame title="Pin Drop" aside={pinDropRoundLabel(state)} status={pinDropStatus(state)}>
      <TvScreen state={state} looks={looks} secondsLeft={secondsLeft} />
    </TvFrame>
  )
}
