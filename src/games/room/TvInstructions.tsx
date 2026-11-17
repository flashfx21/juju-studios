// ABOUTME: A game's instructions on a room's TV before it starts: the steps from its How to play page, a scoring line,
// ABOUTME: and who's in the room. The host picks the settings and starts the game on their phone.
import { playerIds, type Room } from '../../engine/net/rooms'
import { PlayerDot } from './RoomPage'
import { TvFrame } from './TvFrame'
import { usePlayerLooks } from './usePlayerLooks'

interface TvInstructionsProps {
  room: Room
  title: string
  steps: readonly string[]
  /** One line on how points work, under the steps. */
  scoring: string
}

export function TvInstructions({ room, title, steps, scoring }: TvInstructionsProps) {
  const looks = usePlayerLooks(room)
  return (
    <TvFrame title={title} aside="Getting ready" status="The host picks the settings and starts on their phone">
      <div className="tv-instructions" data-testid="tv-instructions">
        <div className="tv-instructions__rules">
          <span className="tv-label">How to play</span>
          <ol className="tv-instructions__steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="tv-instructions__scoring">{scoring}</p>
        </div>
        <div className="tv-instructions__side">
          <span className="tv-label">In the room</span>
          <ul className="tv-instructions__people" aria-label="Players in the room">
            {playerIds(room).map((id) => (
              <li key={id} className="tv-instructions__person" data-testid={`tv-instructions-player-${id}`}>
                <PlayerDot look={looks[id]} size={34} />
                <span className="tv-instructions__name">{looks[id]?.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </TvFrame>
  )
}
