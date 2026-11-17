// ABOUTME: Sketch Showdown's instructions on a room's TV before the game starts: the steps from its How to play page and who's in.
// ABOUTME: Display only: the host picks the settings and starts the game on their phone.
import type { Room } from '../../engine/net/rooms'
import { TvInstructions } from '../room/TvInstructions'
import { howToPlay } from './howToPlay'

export function Instructions({ room }: { room: Room }) {
  return <TvInstructions room={room} title="Sketch Showdown" steps={howToPlay.steps} scoring="The team that wins more rounds wins the game." />
}
