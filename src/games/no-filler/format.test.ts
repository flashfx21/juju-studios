// ABOUTME: Tests for No Filler's screen words: when the speaker stopped, who voted what, why a verdict went the speaker's way,
// ABOUTME: what it scored and how sudden death settled first place. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { PlayerId } from '../types'
import { nameList, placeText, pointsText, resultText, stoppedText, suddenDeathText, verdictNote, votersBy } from './format'
import { DEFAULT_SETTINGS, rules, votersFor, type NoFillerState, type Vote } from './rules'

const NAMES: Record<PlayerId, string> = { ana: 'Ana', bo: 'Bo', cy: 'Cy', di: 'Di' }
const ctx = (now = 0) => ({ now, random: seededRandom('5') })

/** The first speaker picked Hard and tapped Done after 6.4 s; the voters vote as listed, and the clock closes the vote. */
function judged(votes: Vote[]): NoFillerState {
  const start = rules.setup(Object.keys(NAMES), DEFAULT_SETTINGS, ctx())
  let state = rules.onInput(start, start.turn.speaker, { type: 'pick', difficulty: 'hard' }, ctx(1000))
  state = rules.onInput(state, start.turn.speaker, { type: 'done' }, ctx(7400))
  votersFor(state).forEach((id, i) => {
    if (votes[i]) state = rules.onInput(state, id, { type: 'vote', vote: votes[i] }, ctx())
  })
  return state.phase === 'vote' ? rules.onTimer(state, ctx()) : state
}

describe('No Filler screen words', () => {
  it('counts points and places in words', () => {
    expect(pointsText(1)).toBe('1 point')
    expect(pointsText(3)).toBe('3 points')
    expect([1, 2, 3, 4].map(placeText)).toEqual(['1st', '2nd', '3rd', '4th'])
    expect(nameList(['ana'], NAMES)).toBe('Ana')
    expect(nameList(['ana', 'bo', 'cy'], NAMES)).toBe('Ana, Bo and Cy')
  })

  it('says when the speaker stopped, or that time ran out', () => {
    const state = judged(['clean', 'clean', 'clean'])
    expect(stoppedText(state.turn)).toBe('Stopped at 6.4 s')
    expect(stoppedText({ ...state.turn, stoppedAt: null })).toBe('Time ran out')
  })

  it('names who voted each way and who did not vote', () => {
    const state = judged(['clean', 'filler'])
    const [a, b, c] = votersFor(state)
    expect(votersBy(state, 'clean')).toEqual([a])
    expect(votersBy(state, 'filler')).toEqual([b])
    expect(votersBy(state, null)).toEqual([c])
  })

  it('explains a tie and an empty vote, and stays quiet about a majority', () => {
    expect(verdictNote(judged(['clean', 'filler']))).toBe('A tie goes to the speaker.')
    expect(verdictNote(judged([]))).toBe('Nobody voted, so it goes to the speaker.')
    expect(verdictNote(judged(['filler', 'filler', 'clean']))).toBeNull()
  })

  it('says what the verdict scored', () => {
    const clean = judged(['clean', 'clean', 'clean'])
    expect(resultText(clean, NAMES)).toBe(`+3 for ${NAMES[clean.turn.speaker]}`)
    const filler = judged(['filler', 'filler', 'filler'])
    expect(resultText(filler, NAMES)).toBe(`No points for ${NAMES[filler.turn.speaker]}`)
  })

  it('says how sudden death settled first place', () => {
    const state = judged([])
    expect(suddenDeathText(state, NAMES)).toBeNull()
    const tied: NoFillerState = { ...state, phase: 'over', suddenDeath: true, scores: { ana: 15, bo: 15, cy: 4, di: 2 }, tiebreak: { ana: 0, bo: 0, cy: 0, di: 0 } }
    expect(suddenDeathText(tied, NAMES)).toBe('Tied on 15, and still tied after sudden death: Ana and Bo share first.')
    expect(suddenDeathText({ ...tied, tiebreak: { ...tied.tiebreak, bo: 3 } }, NAMES)).toBe('Tied on 15. Bo wins the sudden death.')
  })
})
