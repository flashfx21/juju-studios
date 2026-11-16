// ABOUTME: Tests for Zero In's room views: the public state never carries an unrevealed answer or anyone's guess,
// ABOUTME: each phone gets back only its own guess, and bot guesses land near the answer, sometimes over in the final. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botGuess, HIDDEN_ANSWER, privateView, publicState, stateForPhone } from './roomViews'
import { currentRound, DEFAULT_SETTINGS, QUESTIONS, rules, type ZeroInState } from './rules'

const PLAYERS = ['ana', 'bo', 'cy']

function game(): ZeroInState {
  let state = rules.setup(PLAYERS, { ...DEFAULT_SETTINGS, rounds: 5 }, { now: 0, random: seededRandom('views') })
  state = rules.onInput(state, 'ana', { type: 'lock', value: 1234 }, { now: 0, random: Math.random })
  state = rules.onInput(state, 'bo', { type: 'draft', value: 5678 }, { now: 0, random: Math.random })
  return state
}

describe('public state', () => {
  it('carries no answer, fact, source or guess while guessing, and nothing of later questions', () => {
    const state = game()
    const text = JSON.stringify(publicState(state))
    for (const round of state.rounds) expect(text).not.toContain(`"answer":${round.question.answer}`)
    for (const later of state.rounds.slice(1)) expect(text).not.toContain(later.question.prompt)
    expect(text).not.toContain('1234')
    expect(text).not.toContain('5678')
    const shared = publicState(state)
    expect(currentRound(shared).question.answer).toBe(HIDDEN_ANSWER)
    expect(currentRound(shared).question.prompt).toBe(currentRound(state).question.prompt)
    expect(currentRound(shared).locked).toEqual(['ana'])
    expect(Object.keys(currentRound(shared).guesses).sort()).toEqual(['ana', 'bo'])
  })

  it('shows the answer and every guess once the round is revealed', () => {
    const revealed = rules.onTimer(game(), { now: 0, random: Math.random })
    expect(currentRound(publicState(revealed))).toEqual(currentRound(revealed))
  })
})

describe('private views', () => {
  it('gives each phone back only its own guess', () => {
    const state = game()
    const shared = publicState(state)
    const forAna = stateForPhone(shared, privateView(state, 'ana'), 'ana')
    expect(currentRound(forAna).guesses.ana).toBe(1234)
    expect(currentRound(forAna).guesses.bo).not.toBe(5678)
    expect(privateView(state, 'cy').guess).toBeUndefined()
  })
})

describe('bots', () => {
  it('guess near the answer, never below 0, and go over in the final round only some of the time', () => {
    const random = seededRandom('bots')
    const price = QUESTIONS.find((q) => q.lane === 'price' && q.answer > 100)!
    const year = QUESTIONS.find((q) => q.lane === 'year')!
    const yearGuesses = Array.from({ length: 200 }, () => botGuess(year, false, 'sharp', random))
    const median = [...yearGuesses].sort((a, b) => a - b)[100]
    expect(Math.abs(median - year.answer)).toBeLessThan(5)
    const finals = Array.from({ length: 400 }, () => botGuess(price, true, 'casual', random))
    const over = finals.filter((g) => g > price.answer).length
    expect(over).toBeGreaterThan(20)
    expect(over).toBeLessThan(200)
    expect(finals.every((g) => g >= 0 && Number.isInteger(g))).toBe(true)
  })
})
