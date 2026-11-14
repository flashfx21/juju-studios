// ABOUTME: Tests for Chainword in a room: shared progress matches the phone's own totals, standings order, and bots.
// ABOUTME: Bot tests use fixed seeds so the same games are checked every run.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botProgress, everyoneFinished, finishingOrderOf, progressOf, standings, type Progress } from './roomProgress'
import { endGame, rules, totalGuesses, type ChainwordState } from './rules'

function freshGame(): ChainwordState {
  return rules.setup(['me'], { wordLength: 5, chainLength: 3, hardMode: false }, { now: 1000, random: seededRandom('room-test') })
}

function guess(state: ChainwordState, word: string, now = 2000): ChainwordState {
  return rules.onInput(state, 'me', { type: 'guess', word }, { now, random: Math.random })
}

const done = (totalGuesses: number, timeMs: number): Progress => ({
  words: [],
  current: 0,
  finished: true,
  totalGuesses,
  timeMs,
})
const going = (wordsDone: number, totalGuesses: number): Progress => ({
  words: Array.from({ length: wordsDone }, () => ({ solved: true, cost: 3 })),
  current: 0,
  finished: false,
  totalGuesses,
  timeMs: null,
})

describe('progressOf', () => {
  it('shares counts that match the phone, and the guesses of finished words only', () => {
    let state = freshGame()
    state = guess(state, 'crane')
    state = guess(state, state.chain[0])
    state = guess(state, 'slate')
    const progress = progressOf(state, 'me')
    expect(progress.words).toEqual([{ solved: true, cost: 2, guesses: ['crane', state.chain[0]] }])
    expect(progress.current).toBe(1)
    expect(progress.totalGuesses).toBe(totalGuesses(state.runs.me))
    expect(JSON.stringify(progress)).not.toContain('slate')
    expect(JSON.stringify(progress)).not.toContain(state.chain[1])
  })

  it('a game ended early counts the rest as missed', () => {
    const ended = endGame(guess(freshGame(), 'crane'), { now: 5000, random: Math.random })
    const progress = progressOf(ended, 'me')
    expect(progress.finished).toBe(true)
    expect(progress.words.map((w) => w.cost)).toEqual([7, 7, 7])
    expect(progress.timeMs).toBe(4000)
  })
})

describe('standings', () => {
  it('finished players first by fewest guesses, then fastest; then the rest by how far along', () => {
    const table = standings(['a', 'b', 'c', 'd'], {
      a: going(2, 6),
      b: done(9, 90_000),
      c: done(9, 60_000),
      d: going(1, 2),
    })
    expect(table.map((row) => row.player)).toEqual(['c', 'b', 'a', 'd'])
    expect(table.map((row) => row.place)).toEqual([1, 2, 3, 4])
  })

  it('players level on everything share a place', () => {
    const table = standings(['a', 'b', 'c'], { a: done(9, 60_000), b: done(9, 60_000), c: done(12, 1) })
    expect(table.map((row) => row.place)).toEqual([1, 1, 3])
    expect(finishingOrderOf(table)).toEqual([['a', 'b'], ['c']])
  })

  it('players who have shared nothing yet sit at the bottom, and the game is not over', () => {
    const shared = { a: done(9, 1) }
    expect(standings(['a', 'b'], shared).map((row) => row.player)).toEqual(['a', 'b'])
    expect(everyoneFinished(['a', 'b'], shared)).toBe(false)
    expect(everyoneFinished(['a'], shared)).toBe(true)
  })
})

describe('botProgress', () => {
  it('starts on word 1 and finishes the chain given time', () => {
    expect(botProgress('room-bot-sharp-1', 'sharp', 3, 0, null)).toMatchObject({ words: [], current: 0, finished: false })
    const end = botProgress('room-bot-sharp-1', 'sharp', 3, 60 * 60 * 1000, null)
    expect(end.finished).toBe(true)
    expect(end.words).toHaveLength(3)
    expect(end.totalGuesses).toBe(end.words.reduce((sum, w) => sum + w.cost, 0))
  })

  it('only moves forward as time passes, and the same seed gives the same game', () => {
    let last = -1
    for (let t = 0; t <= 20 * 60 * 1000; t += 15_000) {
      const p = botProgress('room-bot-casual-2', 'casual', 5, t, null)
      const steps = p.words.length * 10 + p.current
      expect(steps).toBeGreaterThanOrEqual(last)
      last = steps
    }
    expect(botProgress('x', 'sharp', 5, 300_000, null)).toEqual(botProgress('x', 'sharp', 5, 300_000, null))
  })

  it('sharp bots use fewer guesses than casual ones on average', () => {
    const average = (skill: 'sharp' | 'casual') => {
      let sum = 0
      for (let i = 0; i < 200; i++) sum += botProgress(`seed-${i}`, skill, 5, 1e9, null).totalGuesses
      return sum / 200
    }
    expect(average('sharp')).toBeLessThan(average('casual'))
  })

  it('when the host ends the game, unfinished words count as missed', () => {
    const p = botProgress('room-bot-casual-1', 'casual', 5, 120_000, 30_000)
    expect(p.finished).toBe(true)
    expect(p.words).toHaveLength(5)
    expect(p.timeMs).toBe(30_000)
    expect(p.words.filter((w) => !w.solved).length).toBeGreaterThan(0)
  })
})
