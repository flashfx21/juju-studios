// ABOUTME: Tests for the words around Dial It In's TV screens: the round label and the status bar at each step.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { publicState } from './roomViews'
import { DEFAULT_SETTINGS, rules, type DialItInState } from './rules'
import { dialItInRoundLabel, dialItInStatus } from './tvText'

const ctx = () => ({ now: 0, random: seededRandom('3') })
const start = (): DialItInState => rules.setup(['ana', 'bo', 'cy'], DEFAULT_SETTINGS, ctx())

describe('Dial It In TV words', () => {
  it('labels the round, and the end', () => {
    expect(dialItInRoundLabel(start())).toBe('Round 1 of 3')
    expect(dialItInRoundLabel({ ...start(), phase: 'over' })).toBe('Game over')
  })

  it('counts the guessers who have locked in, from the masked room state', () => {
    expect(dialItInStatus(publicState(start()))).toBe('Guess on your phone · 0 of 2 locked in')
    const state = rules.onInput(start(), 'bo', { type: 'guess', value: 40 }, ctx())
    expect(dialItInStatus(publicState(state))).toBe('Guess on your phone · 1 of 2 locked in')
  })

  it('tells the host which button moves on at the reveal', () => {
    const reveal = rules.onTimer(start(), ctx())
    expect(dialItInStatus(reveal)).toBe('Host: tap Next round on your phone')
    expect(dialItInStatus({ ...reveal, roundIndex: 2 })).toBe('Host: tap Final standings on your phone')
  })

  it('says when the game is over', () => {
    expect(dialItInStatus({ ...start(), phase: 'over' })).toBe('Game over')
  })
})
