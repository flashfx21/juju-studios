// ABOUTME: Tests for Don't Jinx It room bots: the clue list covers every mystery word with clues that pass the checks,
// ABOUTME: bots write the right number of different clues, and guess right more often with more clues.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botClues, botGuess, cluesFor, rankGuesses } from './roomBots'
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

  it('passes with no clues left', () => {
    expect(botGuess([], 'sharp', Math.random)).toEqual({ type: 'pass' })
  })

  it('ranks the words the clues point to, more obvious clues counting more', () => {
    const ranked = rankGuesses(['sand', 'waves'], MYSTERY_WORDS)
    expect(ranked[0].word).toBe('beach')
    expect(ranked.map((entry) => entry.word)).toContain('ocean')
  })

  it('matches another form of a listed clue', () => {
    expect(rankGuesses(['waves'], ['beach'])[0]?.word).toBe('beach')
    expect(rankGuesses(['wave'], ['beach'])[0]?.word).toBe('beach')
  })

  it('a sharp bot takes the best match', () => {
    for (let i = 0; i < 20; i++) expect(botGuess(['sand', 'sun'], 'sharp', seededRandom(`s${i}`))).toEqual({ type: 'guess', word: 'beach' })
  })

  it('a casual bot sometimes settles on a runner-up', () => {
    const guesses = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const move = botGuess(['sand'], 'casual', seededRandom(`c${i}`))
      if (move.type === 'guess') guesses.add(move.word)
    }
    expect(guesses.has('beach')).toBe(true)
    expect(guesses.size).toBeGreaterThan(1)
  })

  it('rules out words it was told were played, and guesses blind when no clue matches', () => {
    expect(botGuess(['sand', 'sun'], 'sharp', () => 0, MYSTERY_WORDS.filter((word) => word !== 'beach'))).not.toEqual({ type: 'guess', word: 'beach' })
    const blind = botGuess(['zzzz'], 'sharp', () => 0, ['apple', 'anchor'])
    expect(blind).toEqual({ type: 'guess', word: 'apple' })
  })
})
