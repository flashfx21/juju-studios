// ABOUTME: Pin Drop's instructions on a room's TV before the game starts: the steps from its How to play page and who's in.
// ABOUTME: Display only: the host picks the settings and starts the game on their phone.
import type { Room } from '../../engine/net/rooms'
import { TvInstructions } from '../room/TvInstructions'
import { howToPlay } from './howToPlay'

export function Instructions({ room }: { room: Room }) {
  return <TvInstructions room={room} title="Pin Drop" steps={howToPlay.steps.slice(0, 5)} scoring="The closest pin scores the most each round. No pin, no points." />
}
