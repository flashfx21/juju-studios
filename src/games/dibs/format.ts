// ABOUTME: Dibs words and numbers for screens: claim times as "4.2 s" and why a player scored what they did in a round.
// ABOUTME: Kept apart from the screens so any screen can use them.
import type { PlayerResult } from './rules'

const ORDINALS = ['1st', '2nd', '3rd']

function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`
}

function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

/** Milliseconds after the letter dropped, as "4.2 s". */
export function secondsAt(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

/** Why a player scored what they did this round, as "2nd good answer: 4 points". */
export function reasonText(result: PlayerResult): string {
  let text: string
  if (result.answer === null) text = 'No answer: 0 points'
  else if (!result.valid) text = 'Voted out: 0 points'
  else if (result.speedRank !== null && result.speedRank <= ORDINALS.length)
    text = `${ordinal(result.speedRank)} good answer: ${pointsText(result.points)}`
  else text = `Good answer: ${pointsText(result.points)}`
  return result.penalty > 0 ? `${text}. Failed challenge: -${result.penalty}` : text
}
