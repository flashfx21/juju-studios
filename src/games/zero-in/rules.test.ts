// ABOUTME: Tests for the Zero In rules: dealing (final round, no repeats, topic spread, fresh first), guesses and lock-ins,
// ABOUTME: places and points (ties, exact hits, the final round's busts), phases and the finishing order. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import {
  currentRound,
  DEFAULT_SETTINGS,
  FINAL_MIN_ANSWER,
  finalIsNext,
  LANE_CHOICES,
  PACES,
  QUESTIONS,
  ROUND_COUNTS,
  rules,
  scoreRound,
  totals,
  type Question,
  type Round,
  type ZeroInSettings,
  type ZeroInState,
} from './rules'

const PLAYERS = ['ana', 'bo', 'cy', 'di']
const ctx = (seed = '1', recent?: string[]): RulesContext => ({ now: 0, random: seededRandom(seed), recent })

function newGame(settings: Partial<ZeroInSettings> = {}, players = PLAYERS, seed = '42'): ZeroInState {
  return rules.setup(players, { ...DEFAULT_SETTINGS, ...settings }, ctx(seed))
}

const QUESTION: Question = { id: 'q', lane: 'number', topic: 'Animals', prompt: 'How many?', answer: 14, unit: '', unitPosition: 'after', source: 'test', local: false }

function round(guesses: Record<string, number>, final = false, answer = 14): Round {
  return { question: { ...QUESTION, answer }, final, guesses, locked: [], results: null }
}

describe('clearing a draft', () => {
  it('takes the guess back until the player locks in', () => {
    const ctx = { now: 0, random: Math.random }
    let state = rules.setup(['ana', 'bo', 'cy'], DEFAULT_SETTINGS, ctx)
    state = rules.onInput(state, 'ana', { type: 'draft', value: 500 }, ctx)
    state = rules.onInput(state, 'ana', { type: 'clear' }, ctx)
    expect('ana' in currentRound(state).guesses).toBe(false)
    state = rules.onInput(state, 'bo', { type: 'lock', value: 7 }, ctx)
    expect(rules.onInput(state, 'bo', { type: 'clear' }, ctx)).toBe(state)
  })
})

describe('manifest', () => {
  it('offers the settings the rules use', () => {
    const setting = (id: string) => manifest.settings.find((s) => s.id === id)
    expect(setting('pace')?.options).toEqual(PACES)
    expect(setting('rounds')?.options).toEqual(ROUND_COUNTS)
    expect(setting('lanes')?.options).toEqual(LANE_CHOICES)
    expect(setting('pace')?.default).toBe(DEFAULT_SETTINGS.pace)
    expect(setting('rounds')?.default).toBe(DEFAULT_SETTINGS.rounds)
    expect(setting('lanes')?.default).toBe(DEFAULT_SETTINGS.lanes)
  })
})

describe('the pack', () => {
  it('has whole-number answers, unique ids and a unit position for every question', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
    for (const q of QUESTIONS) {
      expect(Number.isInteger(q.answer) && q.answer >= 0).toBe(true)
      expect(['before', 'after']).toContain(q.unitPosition)
    }
  })
})

describe('setup', () => {
  it('deals the rounds asked for, with no repeats, and a Price Tag final of 10 or more', () => {
    for (const rounds of [5, 10] as const) {
      for (let seed = 0; seed < 20; seed++) {
        const state = newGame({ rounds }, PLAYERS, String(seed))
        const ids = state.rounds.map((r) => r.question.id)
        expect(ids).toHaveLength(rounds)
        expect(new Set(ids).size).toBe(rounds)
        const last = state.rounds.at(-1)!
        expect(last.final).toBe(true)
        expect(last.question.lane).toBe('price')
        expect(last.question.answer).toBeGreaterThanOrEqual(FINAL_MIN_ANSWER)
        expect(state.rounds.slice(0, -1).every((r) => !r.final)).toBe(true)
      }
    }
  })

  it('keeps a topic from coming up twice in a row or more than twice a game when the pack allows', () => {
    for (let seed = 0; seed < 30; seed++) {
      const topics = newGame({ rounds: 10 }, PLAYERS, String(seed)).rounds.map((r) => r.question.topic)
      for (let i = 1; i < topics.length; i++) expect(topics[i]).not.toBe(topics[i - 1])
      for (const topic of new Set(topics)) expect(topics.filter((t) => t === topic).length).toBeLessThanOrEqual(2)
    }
  })

  it('plays only one lane when asked, with that lane for the final, and as many rounds as the pack holds', () => {
    const years = QUESTIONS.filter((q) => q.lane === 'year').length
    const state = newGame({ lanes: 'year', rounds: 15 })
    expect(state.rounds).toHaveLength(Math.min(15, years))
    expect(state.rounds.every((r) => r.question.lane === 'year')).toBe(true)
    expect(state.rounds.at(-1)!.final).toBe(true)
  })

  it('deals questions this device asked lately only once the fresh ones run out', () => {
    const first = newGame({ rounds: 10 })
    const recent = first.rounds.map((r) => r.question.id)
    const next = rules.setup(PLAYERS, { ...DEFAULT_SETTINGS, rounds: 10 }, ctx('7', recent))
    // 32 questions, 10 asked: the next 10 regular rounds can all be fresh; the final comes from 7 price questions.
    const repeats = next.rounds.filter((r) => !r.final && recent.includes(r.question.id))
    expect(repeats).toHaveLength(0)
  })

  it('needs at least 3 players, bots included', () => {
    expect(() => newGame({}, ['ana', 'bo'])).toThrow(/at least 3/)
  })

  it('starts the first round with no guesses', () => {
    const state = newGame()
    expect(state.phase).toBe('guessing')
    expect(currentRound(state).guesses).toEqual({})
  })
})

describe('guessing', () => {
  it('lets a draft change until the player locks in, and a lock is final', () => {
    let state = newGame()
    state = rules.onInput(state, 'ana', { type: 'draft', value: 100 }, ctx())
    state = rules.onInput(state, 'ana', { type: 'draft', value: 120 }, ctx())
    state = rules.onInput(state, 'ana', { type: 'lock', value: 130 }, ctx())
    state = rules.onInput(state, 'ana', { type: 'draft', value: 999 }, ctx())
    expect(currentRound(state).guesses.ana).toBe(130)
    expect(currentRound(state).locked).toEqual(['ana'])
  })

  it('refuses negative, fractional and too-long numbers, and players not in the game', () => {
    const state = newGame()
    for (const value of [-1, 2.5, 1_000_000_000, Number.NaN]) {
      expect(rules.onInput(state, 'ana', { type: 'lock', value }, ctx())).toBe(state)
    }
    expect(rules.onInput(state, 'zed', { type: 'lock', value: 5 }, ctx())).toBe(state)
  })

  it('reveals as soon as everyone has locked in', () => {
    let state = newGame()
    for (const p of PLAYERS) state = rules.onInput(state, p, { type: 'lock', value: 10 }, ctx())
    expect(state.phase).toBe('reveal')
    expect(currentRound(state).results).not.toBeNull()
  })

  it("counts a typed guess when time runs out; an empty box is no guess", () => {
    let state = newGame()
    state = rules.onInput(state, 'ana', { type: 'draft', value: 50 }, ctx())
    state = rules.onTimer(state, ctx())
    const results = currentRound(state).results!
    expect(results.ana.guess).toBe(50)
    expect(results.bo).toMatchObject({ guess: null, place: null, points: 0 })
  })
})

describe('scoring a regular round', () => {
  it('scores the spec example: answer 14, guesses 12 and 16 tie for 1st, 8 is 3rd, 30 scores nothing', () => {
    const results = scoreRound(PLAYERS, round({ ana: 12, bo: 16, cy: 8, di: 30 }))
    expect([results.ana.place, results.bo.place, results.cy.place, results.di.place]).toEqual([1, 1, 3, 4])
    expect([results.ana.points, results.bo.points, results.cy.points, results.di.points]).toEqual([3, 3, 1, 0])
  })

  it('counts over and under the same', () => {
    const results = scoreRound(['ana', 'bo'], round({ ana: 16, bo: 8 }))
    expect(results.ana.points).toBe(3)
    expect(results.bo.points).toBe(2)
  })

  it('adds 2 for an exact hit', () => {
    expect(scoreRound(['ana'], round({ ana: 14 })).ana).toMatchObject({ points: 5, exact: true, place: 1 })
  })

  it('puts everyone 1st when everyone guesses the same', () => {
    const results = scoreRound(PLAYERS, round({ ana: 9, bo: 9, cy: 9, di: 9 }))
    expect(PLAYERS.map((p) => results[p].points)).toEqual([3, 3, 3, 3])
  })
})

describe('the final round', () => {
  it('doubles the points and treats a guess over the answer as a bust', () => {
    const results = scoreRound(PLAYERS, round({ ana: 100, bo: 90, cy: 120, di: 70 }, true, 100))
    expect(results.ana).toMatchObject({ place: 1, points: 2 * (3 + 2), exact: true, bust: false })
    expect(results.bo).toMatchObject({ place: 2, points: 4 })
    expect(results.di).toMatchObject({ place: 3, points: 2 })
    expect(results.cy).toMatchObject({ place: null, points: 0, bust: true })
  })

  it('scores nobody when everyone goes over', () => {
    const results = scoreRound(['ana', 'bo'], round({ ana: 101, bo: 500 }, true, 100))
    expect(results.ana.points + results.bo.points).toBe(0)
    expect(results.ana.bust && results.bo.bust).toBe(true)
  })
})

describe('phases', () => {
  it('goes from the reveal straight to the next question, and ends after the final', () => {
    let state = newGame({ rounds: 5 })
    for (let i = 0; i < 5; i++) {
      expect(state.phase).toBe('guessing')
      expect(finalIsNext(state)).toBe(i === 3)
      state = rules.onTimer(state, ctx())
      expect(state.phase).toBe('reveal')
      state = rules.onTimer(state, ctx())
      if (i < 4) expect([state.phase, state.roundIndex]).toEqual(['guessing', i + 1])
    }
    expect(rules.isOver(state)).toBe(true)
  })
})

describe('finishing order', () => {
  function finished(rounds: Round[]): ZeroInState {
    const scored = rounds.map((r) => ({ ...r, results: scoreRound(PLAYERS, r) }))
    return { players: PLAYERS, settings: DEFAULT_SETTINGS, rounds: scored, roundIndex: scored.length - 1, phase: 'over' }
  }

  it('ranks by points', () => {
    const state = finished([round({ ana: 14, bo: 15, cy: 20, di: 40 })])
    expect(rules.finishingOrder(state)).toEqual([['ana'], ['bo'], ['cy'], ['di']])
  })

  it('breaks a points tie by round wins, then exact hits, and shares what is still tied', () => {
    // Round 1: ana and bo share 1st (3 each). Round 2: bo 1st alone (3), ana 2nd (2). Round 3: ana 1st (3), bo 2nd (2).
    // ana 8, bo 8; wins ana 2, bo 2; exact: none. cy and di never guess.
    const state = finished([round({ ana: 13, bo: 15 }), round({ ana: 10, bo: 13 }), round({ ana: 13, bo: 10 })])
    expect(totals(state).ana.points).toBe(totals(state).bo.points)
    expect(rules.finishingOrder(state)).toEqual([['ana', 'bo'], ['cy', 'di']])
    const withExact = finished([round({ ana: 14, bo: 15 }), round({ ana: 20, bo: 13 })])
    // ana: 5 + 2 = 7, wins 1, exact 1. bo: 2 + 3 = 5. Points decide here.
    expect(rules.finishingOrder(withExact)[0]).toEqual(['ana'])
  })

  it('uses exact hits when points and wins are level', () => {
    const result = (place: number | null, points: number, exact: boolean) => ({ guess: 0, distance: 0, place, points, exact, bust: false })
    // Both score 5 with one round win each; only ana's points include an exact hit.
    const state: ZeroInState = {
      players: ['ana', 'bo'],
      settings: DEFAULT_SETTINGS,
      rounds: [
        { ...round({}), results: { ana: result(1, 5, true), bo: result(2, 0, false) } },
        { ...round({}), results: { ana: result(3, 0, false), bo: result(1, 5, false) } },
      ],
      roundIndex: 1,
      phase: 'over',
    }
    expect(rules.finishingOrder(state)).toEqual([['ana'], ['bo']])
  })
})
