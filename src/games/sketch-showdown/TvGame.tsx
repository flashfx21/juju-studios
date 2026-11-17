// ABOUTME: Sketch Showdown on a room's TV: before the game, how to play and who's in; during it, the TV screens from the
// ABOUTME: view the host publishes for the TV (no drawing, guess or clue before the reveal). Display only: the host's phone runs the game.
import type { Room } from '../../engine/net/rooms'
import { Instructions } from './Instructions'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import { useTvView } from '../room/useTvView'
import type { PlayerId } from '../types'
import type { TvView } from './rules'
import { TvScreen } from './TvScreen'
import { sketchRoundLabel, sketchStatus } from './tvText'
import './TvScreen.css'

const TITLE = 'Sketch Showdown'

export function TvGame({ room }: { room: Room }) {
  const shared = room.play ? (JSON.parse(room.play.state) as { teams: [PlayerId[], PlayerId[]] }) : null
  const view = useTvView<TvView>(room.code)
  const looks = usePlayerLooks(room, shared ? [...shared.teams[0], ...shared.teams[1]] : [])
  const secondsLeft = useSecondsLeft(room.play?.deadline ?? null)

  if (!shared) return <Instructions room={room} />

  if (!view) {
    return (
      <TvFrame title={TITLE} status="Loading">
        <p className="ss-tv-loading" data-testid="ss-tv-loading">
          Loading
        </p>
      </TvFrame>
    )
  }

  const timed = view.phase !== 'reveal' && view.phase !== 'over'
  return (
    <TvFrame title={TITLE} aside={sketchRoundLabel(view)} status={sketchStatus(view)}>
      <TvScreen view={view} looks={looks} secondsLeft={timed ? secondsLeft : null} />
    </TvFrame>
  )
}
