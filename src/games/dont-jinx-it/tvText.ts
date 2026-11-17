// ABOUTME: The words around Don't Jinx It's TV screens in a room: the turn label in the header and the status in the bar.
// ABOUTME: Everyone plays on their phone and the host moves the turn on from theirs, so the bar says what to do and where.
import type { TvView } from './rules'

/** "Turn 3 of 8" or "Game over". */
export function djiTurnLabel(view: TvView): string {
  return view.phase === 'over' ? 'Game over' : `Turn ${view.turnIndex + 1} of ${view.turnCount}`
}

/** Where the turn is, and what to do on the phones. Never a word or a clue. */
export function djiStatus(view: TvView, guesserName: string): string {
  switch (view.phase) {
    case 'write':
      return `Write on your phone · ${view.progress.filter((writer) => writer.submitted).length} of ${view.progress.length} in`
    case 'pile':
      return 'Checking for jinxes'
    case 'guess':
      return `${guesserName} is guessing`
    case 'verdict':
      return 'The verdict'
    case 'reveal':
      return `Host: tap ${view.turnIndex + 1 >= view.turnCount ? 'Final standings' : 'Next turn'} on your phone`
    default:
      return 'Game over'
  }
}
