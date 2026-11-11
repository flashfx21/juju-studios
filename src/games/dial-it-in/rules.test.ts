// ABOUTME: Tests for the Dial It In rules: dealing, clue-giver rotation, guessing, scoring and finishing order.
// ABOUTME: Run with `npm test`.

import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import {
  closenessPoints,
  currentRound,
  DEFAULT_SETTINGS,
  DIAL_RANGES,
  rules,
  SPECTRUM_CARDS,
  totalScores,
  type DialItInState,
} from './rules'

const PLAYERS = ['ana', 'bo', 'cy']

/** A rules context whose random numbers come from the given seed, so deals repeat every run. */
function seeded(seed: number): RulesContext {
  return { now: 0, random: seededRandom(String(seed)) }
}

/** A rules context whose random number is always the same. */
function fixed(value: number): RulesContext {
  return { now: 0, random: () => value }
}

/** For calls that never draw a random number. */
const CTX = seeded(1)

function newGame(range: 50 | 100 = 100): DialItInState {
  return rules.setup(PLAYERS, { range }, seeded(42))
}

/** Replaces each round's target so scores are predictable. */
function withTargets(state: DialItInState, targets: number[]): DialItInState {
  return { ...state, rounds: state.rounds.map((round, i) => ({ ...round, target: targets[i] })) }
}

function guess(state: DialItInState, playerId: string, value: number): DialItInState {
  return rules.onInput(state, playerId, { type: 'guess', value }, CTX)
}

describe('manifest', () => {
  it('offers the same dial ranges and default the rules use', () => {
    const range = manifest.settings.find((setting) => setting.id === 'range')
    expect(range?.options).toEqual(DIAL_RANGES)
    expect(range?.default).toBe(DEFAULT_SETTINGS.range)
  })
})

describe('spectrum pack', () => {
  it('has enough cards for the largest game', () => {
    expect(SPECTRUM_CARDS.length).toBeGreaterThanOrEqual(10)
  })

  it('gives every card a unique id and two non-empty ends', () => {
    const ids = SPECTRUM_CARDS.map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const card of SPECTRUM_CARDS) {
      expect(card.left.trim()).not.toBe('')
      expect(card.right.trim()).not.toBe('')
    }
  })
})

describe('setup', () => {
  it('deals one round per player with the clue giver rotating in turn order', () => {
    const state = newGame()
    expect(state.rounds.map((round) => round.clueGiver)).toEqual(['ana', 'bo', 'cy'])
    expect(state.roundIndex).toBe(0)
    expect(state.phase).toBe('guessing')
  })

  it('deals a different card to every round', () => {
    const state = rules.setup(
      Array.from({ length: 10 }, (_, i) => `p${i}`),
      { range: 100 },
      seeded(7),
    )
    const cardIds = state.rounds.map((round) => round.card.id)
    expect(new Set(cardIds).size).toBe(10)
  })

  it.each([50, 100] as const)('keeps every target within 1 to %i', (range) => {
    for (let seed = 1; seed <= 50; seed++) {
      const state = rules.setup(PLAYERS, { range }, seeded(seed))
      for (const round of state.rounds) {
        expect(Number.isInteger(round.target)).toBe(true)
        expect(round.target).toBeGreaterThanOrEqual(1)
        expect(round.target).toBeLessThanOrEqual(range)
      }
    }
  })

  it('can reach both ends of the dial', () => {
    expect(rules.setup(PLAYERS, { range: 50 }, fixed(0)).rounds[0].target).toBe(1)
    expect(rules.setup(PLAYERS, { range: 50 }, fixed(0.999999)).rounds[0].target).toBe(50)
  })

  it('refuses fewer than the minimum players', () => {
    expect(() => rules.setup(['ana', 'bo'], { range: 100 }, CTX)).toThrow(/at least 3/)
  })
})

describe('closenessPoints', () => {
  it('scores 10 for a bullseye on either range', () => {
    expect(closenessPoints(40, 40, 100)).toBe(10)
    expect(closenessPoints(20, 20, 50)).toBe(10)
  })

  it('drops one point per 2 away on the 1 to 100 dial', () => {
    expect(closenessPoints(41, 40, 100)).toBe(10)
    expect(closenessPoints(42, 40, 100)).toBe(9)
    expect(closenessPoints(30, 40, 100)).toBe(5)
    expect(closenessPoints(59, 40, 100)).toBe(1)
    expect(closenessPoints(60, 40, 100)).toBe(0)
  })

  it('drops one point per 1 away on the 1 to 50 dial', () => {
    expect(closenessPoints(21, 20, 50)).toBe(9)
    expect(closenessPoints(29, 20, 50)).toBe(1)
    expect(closenessPoints(30, 20, 50)).toBe(0)
  })

  it('never goes below 0', () => {
    expect(closenessPoints(1, 100, 100)).toBe(0)
  })
})

describe('guessing', () => {
  it('records a guess privately without revealing until everyone is in', () => {
    const state = guess(newGame(), 'bo', 55)
    expect(currentRound(state).guesses).toEqual({ bo: 55 })
    expect(state.phase).toBe('guessing')
  })

  it('reveals and scores once every guesser has answered', () => {
    let state = withTargets(newGame(), [50, 50, 50])
    state = guess(state, 'bo', 50)
    state = guess(state, 'cy', 40)
    expect(state.phase).toBe('reveal')
    expect(currentRound(state).points).toEqual({ bo: 10, cy: 5 })
  })

  it("ignores the clue giver's guess", () => {
    const start = newGame()
    expect(guess(start, 'ana', 50)).toBe(start)
  })

  it('keeps the first guess; a guess cannot be changed', () => {
    const state = guess(guess(newGame(), 'bo', 10), 'bo', 90)
    expect(currentRound(state).guesses.bo).toBe(10)
  })

  it.each([0, 101, 50.5, Number.NaN])('ignores an out-of-range or non-whole guess (%s)', (value) => {
    const start = newGame()
    expect(guess(start, 'bo', value)).toBe(start)
  })

  it('ignores 51 on the 1 to 50 dial', () => {
    const start = newGame(50)
    expect(guess(start, 'bo', 51)).toBe(start)
  })

  it('ignores players who are not in the game', () => {
    const start = newGame()
    expect(guess(start, 'stranger', 50)).toBe(start)
  })

  it('ignores guesses during the reveal', () => {
    let state = guess(guess(newGame(), 'bo', 50), 'cy', 50)
    const revealed = state
    state = guess(state, 'ana', 50)
    expect(state).toBe(revealed)
  })

  it('does not change the state it was given', () => {
    const start = newGame()
    const snapshot = structuredClone(start)
    guess(start, 'bo', 50)
    expect(start).toEqual(snapshot)
  })
})

describe('timer', () => {
  it('reveals when guessing time runs out, scoring missing guessers 0', () => {
    let state = withTargets(newGame(), [50, 50, 50])
    state = guess(state, 'bo', 50)
    state = rules.onTimer(state, CTX)
    expect(state.phase).toBe('reveal')
    expect(currentRound(state).points).toEqual({ bo: 10, cy: 0 })
  })

  it('moves to the next clue giver when the reveal time runs out', () => {
    let state = rules.onTimer(newGame(), CTX)
    state = rules.onTimer(state, CTX)
    expect(state.phase).toBe('guessing')
    expect(currentRound(state).clueGiver).toBe('bo')
  })

  it('ends the game after every player has given a clue', () => {
    let state = newGame()
    for (let i = 0; i < PLAYERS.length * 2; i++) {
      expect(rules.isOver(state)).toBe(false)
      state = rules.onTimer(state, CTX)
    }
    expect(rules.isOver(state)).toBe(true)
    expect(rules.onTimer(state, CTX)).toBe(state)
  })
})

/** Plays a full game: in each round, the listed guesses, then the timer twice. */
function playGame(targets: number[], guessesByRound: Record<string, number>[]): DialItInState {
  let state = withTargets(newGame(), targets)
  for (const roundGuesses of guessesByRound) {
    for (const [playerId, value] of Object.entries(roundGuesses)) state = guess(state, playerId, value)
    if (state.phase === 'guessing') state = rules.onTimer(state, CTX)
    state = rules.onTimer(state, CTX)
  }
  return state
}

describe('finishing order', () => {
  it('ranks players by total score, best first', () => {
    const state = playGame(
      [50, 50, 50],
      [
        { bo: 50, cy: 40 }, // ana gives the clue: bo 10, cy 5
        { ana: 50, cy: 50 }, // bo gives the clue: ana 10, cy 10
        { ana: 1, bo: 46 }, // cy gives the clue: ana 0, bo 8
      ],
    )
    expect(rules.isOver(state)).toBe(true)
    expect(totalScores(state)).toEqual({ ana: 10, bo: 18, cy: 15 })
    expect(rules.finishingOrder(state)).toEqual([['bo'], ['cy'], ['ana']])
  })

  it('puts tied players in the same place', () => {
    const state = playGame(
      [50, 50, 50],
      [
        { bo: 50, cy: 50 }, // bo 10, cy 10
        { ana: 50, cy: 50 }, // ana 10, cy 10
        { ana: 50, bo: 50 }, // ana 10, bo 10
      ],
    )
    expect(rules.finishingOrder(state)).toEqual([['ana', 'bo', 'cy']])
  })

  it('still includes players who never guessed, at the bottom', () => {
    const state = playGame([50, 50, 50], [{ bo: 50 }, {}, { bo: 50 }])
    expect(rules.finishingOrder(state)).toEqual([['bo'], ['ana', 'cy']])
  })
})
