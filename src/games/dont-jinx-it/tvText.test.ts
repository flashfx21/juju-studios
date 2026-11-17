// ABOUTME: Tests for the words around Don't Jinx It's TV screens in a room: the turn label and the status bar at each step.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { currentTurn, DEFAULT_SETTINGS, rules, tvView, type DontJinxItState } from './rules'
import { djiStatus, djiTurnLabel } from './tvText'

const ctx = () => ({ now: 0, random: seededRandom('3') })
const start = (): DontJinxItState => rules.setup(['ana', 'bo', 'cy', 'di'], DEFAULT_SETTINGS, ctx())
const timeUp = (state: DontJinxItState) => rules.onTimer(state, ctx())
const status = (state: DontJinxItState) => djiStatus(tvView(state), 'Ana')

/** Every writer sends a clue, which moves the turn on to the pile. */
function allWrite(state: DontJinxItState): DontJinxItState {
  return ['bo', 'cy', 'di'].reduce((game, id, i) => rules.onInput(game, id, { type: 'clues', words: [['zq', 'zx', 'zv'][i]] }, ctx()), state)
}

describe("Don't Jinx It TV words", () => {
  it('labels the turn, and the end', () => {
    expect(djiTurnLabel(tvView(start()))).toBe('Turn 1 of 4')
    expect(djiTurnLabel(tvView({ ...start(), phase: 'over' }))).toBe('Game over')
  })

  it('counts the writers who are in', () => {
    expect(status(start())).toBe('Write on your phone · 0 of 3 in')
    const one = rules.onInput(start(), 'bo', { type: 'clues', words: ['zq'] }, ctx())
    expect(status(one)).toBe('Write on your phone · 1 of 3 in')
  })

  it('names the guesser at the guess, and never the word', () => {
    const pile = allWrite(start())
    expect(status(pile)).toBe('Checking for jinxes')
    const guess = timeUp(pile)
    expect(status(guess)).toBe('Ana is guessing')
    const verdict = rules.onInput(guess, 'ana', { type: 'pass' }, ctx())
    expect(status(verdict)).toBe('The verdict')
    for (const state of [start(), pile, guess, verdict]) expect(status(state)).not.toContain(currentTurn(state).word)
  })

  it('tells the host which button to tap at the reveal', () => {
    const reveal = { ...start(), phase: 'reveal' as const }
    expect(status(reveal)).toBe('Host: tap Next turn on your phone')
    expect(status({ ...reveal, turnIndex: 3 })).toBe('Host: tap Final standings on your phone')
    expect(status({ ...reveal, phase: 'over' })).toBe('Game over')
  })
})
