// ABOUTME: Dial It In on a room's TV: before the game, how to play and who's in; during it, the TV screens from the room's
// ABOUTME: public state (no target or guesses until the reveal). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { Instructions } from './Instructions'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import type { DialItInState } from './rules'
import { TvScreen } from './TvScreen'
import { dialItInRoundLabel, dialItInStatus } from './tvText'

export function TvGame({ room }: { room: Room }) {
  const state = room.play ? (JSON.parse(room.play.state) as { state: DialItInState }).state : null
  const looks = usePlayerLooks(room, state?.players ?? [])
  const secondsLeft = useSecondsLeft(state?.phase === 'guessing' ? (room.play?.deadline ?? null) : null)

  if (!state) return <Instructions room={room} />

  return (
    <TvFrame title="Dial It In" aside={dialItInRoundLabel(state)} status={dialItInStatus(state)}>
      <TvScreen state={state} looks={looks} secondsLeft={secondsLeft} />
    </TvFrame>
  )
}
