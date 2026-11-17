// ABOUTME: Don't Jinx It on a room's TV: before the game, how to play and who's in; during it, the TV screens from the
// ABOUTME: view the host publishes for the TV (no word or jinxed clue before the reveal). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { TvFrame } from '../room/TvFrame'
import { useSecondsLeft } from '../room/useSecondsLeft'
import { useTvView } from '../room/useTvView'
import type { FinishingOrder, PlayerId } from '../types'
import { Instructions } from './Instructions'
import type { Phase, TvView } from './rules'
import { PhaseScreen } from './TvScreen'
import { djiStatus, djiTurnLabel } from './tvText'
import { useSeats } from './useSeats'

/** The part of the room's public game the TV reads: who is playing, where the game is, and the final standings. */
interface SharedPlay {
  players: PlayerId[]
  phase: Phase
  turnIndex: number
  standings: FinishingOrder | null
}

export function TvGame({ room }: { room: Room }) {
  const shared = room.play ? (JSON.parse(room.play.state) as SharedPlay) : null
  const view = useTvView<TvView>(room.code)
  const seats = useSeats(room, shared?.players ?? [])
  // The room's deadline belongs to the room's phase; the TV's view can arrive a moment before or after it.
  const timed = shared !== null && view !== null && shared.phase === view.phase && shared.turnIndex === view.turnIndex
  const secondsLeft = useSecondsLeft(timed ? (room.play?.deadline ?? null) : null)

  if (!shared) return <Instructions room={room} />

  // The TV's view arrives separately from the room's game, so wait until it belongs to the players in this game.
  if (!view || !(view.guesser in seats)) {
    return (
      <TvFrame title="Don't Jinx It" status="Dealing the words">
        <div className="dji-tv-body" />
      </TvFrame>
    )
  }

  return (
    <TvFrame title="Don't Jinx It" aside={djiTurnLabel(view)} status={djiStatus(view, seats[view.guesser].name)}>
      <div className="dji-tv-body" data-testid="dji-tv-body">
        <PhaseScreen view={view} seats={seats} secondsLeft={secondsLeft} standings={shared.standings} />
      </div>
    </TvFrame>
  )
}
