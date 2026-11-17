// ABOUTME: The words around Chainword's TV screens: the chain's settings in the header and the status in the bar along the bottom.
// ABOUTME: Everyone plays on their own phone, so the bar says how many have finished, never who is ahead.
import { readChainCode } from './chainCode'
import { gameOver, stoppedAt, type ChainPlay, type Progress } from './roomProgress'
import type { PlayerId } from '../types'

/** "3 words · 5 letters", with "hard mode" when it is on, or "Game over". */
export function chainwordChainLabel(play: ChainPlay, over: boolean): string {
  if (over) return 'Game over'
  const { chainLength, wordLength, hardMode } = readChainCode(play.chainCode)!.settings
  return `${chainLength} words · ${wordLength} letters${hardMode ? ' · hard mode' : ''}`
}

/** Where the game is: how many have finished, that the chain has stopped, or that the game is over. */
export function chainwordStatus(play: ChainPlay, shared: Record<PlayerId, Progress>, now: number): string {
  if (gameOver(play, shared, now)) return 'Game over'
  if (stoppedAt(play, now) !== null) return play.endedAt !== null ? 'The host ended the game' : "Time's up"
  const finished = play.players.filter((id) => shared[id]?.finished).length
  return `Guess on your phone · ${finished} of ${play.players.length} finished`
}
