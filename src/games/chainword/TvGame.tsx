// ABOUTME: Chainword on a room's TV: before the game, how to play and who's in; during it, the chain's clock and which word
// ABOUTME: each player is on (no letters, counts or places); once it is over, the standings and the chain's words. Display only.
import { fromSharedTime } from '../../engine/net/clock'
import type { Room } from '../../engine/net/rooms'
import { Instructions } from './Instructions'
import { TvFrame } from '../room/TvFrame'
import { usePlayerLooks } from '../room/usePlayerLooks'
import { useSecondsLeft } from '../room/useSecondsLeft'
import { deadlineOf, gameOver, sharedProgress, stoppedAt, type ChainPlay } from './roomProgress'
import { TvScreen } from './TvScreen'
import { chainwordChainLabel, chainwordStatus } from './tvText'
import { useNow } from './useNow'

export function TvGame({ room }: { room: Room }) {
  const play = room.play ? (JSON.parse(room.play.state) as ChainPlay) : null
  const looks = usePlayerLooks(room, play?.players ?? [])
  const now = useNow()
  const running = play !== null && stoppedAt(play, now) === null
  const secondsLeft = useSecondsLeft(running ? fromSharedTime(deadlineOf(play)) : null)

  if (!play) return <Instructions room={room} />

  const shared = sharedProgress(room)
  const over = gameOver(play, shared, now)

  return (
    <TvFrame title="Chainword" aside={chainwordChainLabel(play, over)} status={chainwordStatus(play, shared, now)}>
      <TvScreen play={play} shared={shared} looks={looks} secondsLeft={over ? null : secondsLeft} over={over} />
    </TvFrame>
  )
}
