// ABOUTME: Tests for the words around Pin Drop's TV screens: the round label and the status bar at each step.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { DEFAULT_SETTINGS, rules, type PinDropState } from './rules'
import { pinDropRoundLabel, pinDropStatus } from './tvText'

const ctx = () => ({ now: 0, random: seededRandom('6') })
const start = (): PinDropState => rules.setup(['ana', 'bo', 'cy'], DEFAULT_SETTINGS, ctx())
const lastRound = (state: PinDropState): PinDropState => ({ ...state, roundIndex: state.rounds.length - 1 })

describe('Pin Drop TV words', () => {
  it('labels the round, and the end', () => {
    expect(pinDropRoundLabel(start())).toBe('Round 1 of 7')
    expect(pinDropRoundLabel({ ...start(), phase: 'over' })).toBe('Game over')
  })

  it('counts who has locked in while pins go down', () => {
    expect(pinDropStatus(start())).toBe('Drop your pin on your phone · 0 of 3 locked in')
    const state = rules.onInput(start(), 'ana', { type: 'lock', lat: 10, lng: 20 }, ctx())
    expect(pinDropStatus(state)).toBe('Drop your pin on your phone · 1 of 3 locked in')
  })

  it('tells the host what to tap on the reveal and the standings', () => {
    const reveal = rules.onTimer(start(), ctx())
    expect(pinDropStatus(reveal)).toBe('Host: tap Standings on your phone')
    const standings = rules.onTimer(reveal, ctx())
    expect(pinDropStatus(standings)).toBe('Host: tap Next round on your phone')
    expect(pinDropStatus(lastRound(standings))).toBe('Host: tap Final standings on your phone')
  })

  it('says when the game is over', () => {
    expect(pinDropStatus({ ...start(), phase: 'over' })).toBe('Game over')
  })
})
