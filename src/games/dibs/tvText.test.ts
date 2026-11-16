// ABOUTME: Tests for the words around Dibs' TV screens: the round label and the status bar at each step.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { DEFAULT_SETTINGS, rules, type DibsState } from './rules'
import { dibsRoundLabel, dibsStatus } from './tvText'

const ctx = () => ({ now: 0, random: seededRandom('3') })
const start = (): DibsState => rules.setup(['ana', 'bo', 'cy'], DEFAULT_SETTINGS, ctx())

describe('Dibs TV words', () => {
  it('labels the round, and the end', () => {
    expect(dibsRoundLabel(start())).toBe('Round 1 of 7')
    expect(dibsRoundLabel({ ...start(), phase: 'over' })).toBe('Game over')
  })

  it('counts who is in during the race and who is done at review', () => {
    expect(dibsStatus(start())).toBe('Letter coming')
    let state = rules.onTimer(start(), ctx())
    state = rules.onInput(state, 'ana', { type: 'out' }, ctx())
    expect(dibsStatus(state)).toBe('Answer on your phone · 1 of 3 in')
  })

  it('tells the host to tap Next at the scores', () => {
    const scores = rules.onTimer(rules.onTimer(start(), ctx()), ctx())
    expect(dibsStatus(scores)).toBe('Host: tap Next on your phone for the next round')
  })
})
