// ABOUTME: Tests for Dial It In in a room: the public state leaks no secrets, each phone gets back only its own, and bots.
// ABOUTME: These are the checks that keep the target from the guessers and guesses private until the reveal.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botDialGuess, HIDDEN_GUESS, HIDDEN_TARGET, privateView, publicState, stateForPhone } from './roomViews'
import { currentRound, rules, type DialItInState } from './rules'

const ctx = { now: 0, random: seededRandom('dial-room') }

function game(): DialItInState {
  return rules.setup(['ana', 'bo', 'bot-sharp-1'], { range: 100, clueGivers: ['ana', 'bo'], turnsEach: 2 }, ctx)
}

function guess(state: DialItInState, player: string, value: number): DialItInState {
  return rules.onInput(state, player, { type: 'guess', value }, ctx)
}

describe('publicState', () => {
  it('hides every unrevealed target and every private guess', () => {
    const state = guess(game(), 'bo', 37)
    const shared = publicState(state)
    expect(shared.rounds.every((round) => round.target === HIDDEN_TARGET)).toBe(true)
    expect(currentRound(shared).guesses).toEqual({ bo: HIDDEN_GUESS })
    for (const round of state.rounds) {
      expect(JSON.stringify(shared)).not.toContain(`"target":${round.target}`)
    }
  })

  it('shows a round in full once it is revealed, but still hides the rounds to come', () => {
    let state = guess(game(), 'bo', 37)
    state = guess(state, 'bot-sharp-1', 60)
    expect(state.phase).toBe('reveal')
    const shared = publicState(state)
    expect(shared.rounds[0].target).toBe(state.rounds[0].target)
    expect(shared.rounds[0].guesses).toEqual({ bo: 37, 'bot-sharp-1': 60 })
    expect(shared.rounds.slice(1).every((round) => round.target === HIDDEN_TARGET)).toBe(true)
  })
})

describe('privateView and stateForPhone', () => {
  it('the clue giver gets the target back; a guesser does not', () => {
    const state = game()
    const target = currentRound(state).target
    const shared = publicState(state)
    expect(currentRound(stateForPhone(shared, privateView(state, 'ana'), 'ana')).target).toBe(target)
    expect(privateView(state, 'bo').target).toBeUndefined()
    expect(currentRound(stateForPhone(shared, privateView(state, 'bo'), 'bo')).target).toBe(HIDDEN_TARGET)
  })

  it("a guesser gets their own guess back, and sees only that others have guessed", () => {
    // Ana gives the clue; Dee hasn't guessed yet, so the round is still being guessed.
    let state = rules.setup(['ana', 'bo', 'cy', 'dee'], { range: 100 }, ctx)
    state = guess(state, 'bo', 37)
    state = guess(state, 'cy', 81)
    const phone = stateForPhone(publicState(state), privateView(state, 'bo'), 'bo')
    expect(currentRound(phone).guesses).toEqual({ bo: 37, cy: HIDDEN_GUESS })
  })

  it('an old view from an earlier round changes nothing', () => {
    const state = game()
    const shared = { ...publicState(state), roundIndex: 1 }
    expect(stateForPhone(shared, { roundIndex: 0, target: 55 }, 'ana')).toBe(shared)
  })
})

describe('botDialGuess', () => {
  it('stays on the dial and lands closer when sharp', () => {
    const random = seededRandom('dial-bots')
    const miss = (skill: 'sharp' | 'casual') => {
      let total = 0
      for (let i = 0; i < 300; i++) {
        const value = botDialGuess(50, 100, skill, random)
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(100)
        expect(Number.isInteger(value)).toBe(true)
        total += Math.abs(value - 50)
      }
      return total / 300
    }
    expect(miss('sharp')).toBeLessThan(miss('casual'))
  })

  it('never leaves the 1 to 50 dial either, even near the ends', () => {
    const random = seededRandom('dial-ends')
    for (let i = 0; i < 200; i++) {
      const value = botDialGuess(i % 2 ? 1 : 50, 50, 'casual', random)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(50)
    }
  })
})
