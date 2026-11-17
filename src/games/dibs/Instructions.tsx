// ABOUTME: Dibs's instructions on a room's TV before the game starts: the steps from its How to play page and who's in.
// ABOUTME: Display only: the host picks the settings and starts the game on their phone.
import type { Room } from '../../engine/net/rooms'
import { TvInstructions } from '../room/TvInstructions'
import { howToPlay } from './howToPlay'

export function Instructions({ room }: { room: Room }) {
  return <TvInstructions room={room} title="Dibs" steps={howToPlay.steps} scoring="Any good answer scores 2. The first three good answers score 5, 4 and 3." />
}
