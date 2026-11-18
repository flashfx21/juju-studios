// ABOUTME: No Filler on a room's TV: before the game, how to play and who's in; during it, the TV screens from the room's
// ABOUTME: public state (no cards still in the piles, no votes before the verdict). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks, type PlayerLook } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import { stageLabel } from './format'
import { Instructions } from './Instructions'
import type { NoFillerState } from './rules'
import { TvScreen } from './TvScreen'
import { noFillerStatus } from './tvText'

/** How a player shows once they have left the room mid-game: they keep their seat and score, without their name or color. */
const LEFT_THE_ROOM: PlayerLook = { name: 'Player', initials: '', color: '#8a8a8a' }

export function TvGame({ room }: { room: Room }) {
  const state = room.play ? (JSON.parse(room.play.state) as NoFillerState) : null
  const inRoom = usePlayerLooks(room, state?.players ?? [])
  const secondsLeft = useSecondsLeft(room.play?.deadline ?? null)

  if (!state) return <Instructions room={room} />

  const looks = Object.fromEntries(state.players.map((id) => [id, inRoom[id] ?? LEFT_THE_ROOM]))
  return (
    <TvFrame title="No Filler" aside={stageLabel(state)} status={noFillerStatus(state)}>
      <TvScreen state={state} looks={looks} secondsLeft={secondsLeft} />
    </TvFrame>
  )
}
