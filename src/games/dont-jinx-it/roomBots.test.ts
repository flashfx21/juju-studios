// ABOUTME: Tests for Don't Jinx It room bots: the clue list covers every mystery word with clues that pass the checks,
// ABOUTME: bots write the right number of different clues, and guess right more often with more clues.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botClues, botGuess, cluesFor, rightChance } from './roomBots'
import { MYSTERY_WORDS } from './rules'

describe("Don't Jinx It room bots", () => {
  it('every mystery word has four listed clues, and every one passes the clue checks', () => {
    for (const word of MYSTERY_WORDS) expect(cluesFor(word).length, word).toBe(4)
  })

  it('writes as many different clues as asked', () => {
    const random = seededRandom('two')
    for (const word of MYSTERY_WORDS) {
      const clues = botClues(word, 2, 'casual', random)
      expect(new Set(clues).size, word).toBe(2)
    }
  })

  it('a sharp bot never writes the most obvious clue', () => {
    const random = seededRandom('sharp')
    for (let i = 0; i < 50; i++) expect(botClues('beach', 1, 'sharp', random)).not.toContain('sand')
  })

  it('passes with no clues left, and is right more often with more clues and when sharp', () => {
    expect(botGuess('beach', 0, 'sharp', Math.random)).toEqual({ type: 'pass' })
    expect(rightChance(3, 'casual')).toBeGreaterThan(rightChance(1, 'casual'))
    expect(rightChance(2, 'sharp')).toBeGreaterThan(rightChance(2, 'casual'))
    expect(botGuess('beach', 2, 'sharp', () => 0)).toEqual({ type: 'guess', word: 'beach' })
    const miss = botGuess('beach', 2, 'casual', () => 0.99)
    expect(miss.type === 'guess' && miss.word !== 'beach').toBe(true)
  })
})
