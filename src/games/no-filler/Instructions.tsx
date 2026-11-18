// ABOUTME: No Filler's instructions on a room's TV before the game starts: the steps from its How to play page and who's in.
// ABOUTME: Display only: the host picks the settings and starts the game on their phone.
import type { Room } from '../../engine/net/rooms'
import { TvInstructions } from '../room/TvInstructions'
import { howToPlay } from './howToPlay'

export function Instructions({ room }: { room: Room }) {
  return <TvInstructions room={room} title="No Filler" steps={howToPlay.steps} scoring="It's Filler if you say a filler word, name fewer than 3, repeat or miss an answer, or run out of time." />
}
