// ABOUTME: Tests for the words around No Filler's TV screens: where the game stands in the header and the status bar at each step.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { stageLabel } from './format'
import { DEFAULT_SETTINGS, rules, votersFor, type NoFillerState } from './rules'
import { noFillerStatus } from './tvText'

const ctx = () => ({ now: 0, random: seededRandom('3') })
const start = (): NoFillerState => rules.setup(['ana', 'bo', 'cy'], DEFAULT_SETTINGS, ctx())

describe('No Filler TV words', () => {
  it('labels where the game stands', () => {
    const state = start()
    expect(stageLabel(state)).toBe('First to 15')
    expect(stageLabel({ ...state, scores: { ...state.scores, ana: 15 } })).toBe('Final round')
    expect(stageLabel({ ...state, suddenDeath: true })).toBe('Sudden death')
    expect(stageLabel({ ...state, phase: 'over' })).toBe('Game over')
  })

  it('tells the speaker to pick, then everyone what the card asks', () => {
    const state = start()
    expect(noFillerStatus(state)).toBe('Speaker: pick on your phone')
    expect(noFillerStatus({ ...state, suddenDeath: true })).toBe('Sudden death · Hard cards only')
    const speaking = rules.onInput(state, state.turn.speaker, { type: 'pick', difficulty: 'easy' }, ctx())
    expect(noFillerStatus(speaking)).toBe('Name 3 · No um, uh, er or like')
  })

  it('counts the votes in without saying how, then names the verdict', () => {
    const state = start()
    let voting = rules.onInput(state, state.turn.speaker, { type: 'pick', difficulty: 'easy' }, ctx())
    voting = rules.onTimer(voting, ctx())
    const [first, second] = votersFor(voting)
    voting = rules.onInput(voting, first, { type: 'vote', vote: 'filler' }, ctx())
    expect(noFillerStatus(voting)).toBe('Vote on your phone · 1 of 2 votes in')
    const reveal = rules.onInput(voting, second, { type: 'vote', vote: 'filler' }, ctx())
    expect(noFillerStatus(reveal)).toBe('Filler')
    expect(noFillerStatus({ ...state, phase: 'over' })).toBe('Game over')
  })
})
