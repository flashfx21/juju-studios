// ABOUTME: Tests for the solo-play bot clues: every card has clues spread across the dial,
// ABOUTME: and a bot picks the clue that lands closest to the target on either range.
import { describe, expect, it } from 'vitest'
import botCluePack from '../../../packs/dial-it-in/bot-clues.json'
import { botClue } from './botClues'
import { SPECTRUM_CARDS } from './rules'

const PACK: Record<string, { text: string; at: number }[]> = botCluePack
const cold = SPECTRUM_CARDS.find((card) => card.id === 's001')!

describe('bot clues', () => {
  it('every card has clues, and no stray cards', () => {
    expect(Object.keys(PACK).sort()).toEqual(SPECTRUM_CARDS.map((card) => card.id).sort())
  })

  it('every card covers the dial: no target is more than 12 away from a clue', () => {
    for (const [id, clues] of Object.entries(PACK)) {
      const spots = clues.map((clue) => clue.at)
      expect(spots.every((at) => Number.isInteger(at) && at >= 1 && at <= 100), id).toBe(true)
      for (let target = 1; target <= 100; target++) {
        const nearest = Math.min(...spots.map((at) => Math.abs(at - target)))
        expect(nearest, `${id} at ${target}`).toBeLessThanOrEqual(12)
      }
    }
  })

  it('picks the clue closest to the target', () => {
    expect(botClue(cold, 3, 100)).toBe('Snowball')
    expect(botClue(cold, 85, 100)).toBe('Hot cocoa')
    expect(botClue(cold, 100, 100)).toBe('Lava')
  })

  it('places clues on the 1 to 50 dial too', () => {
    expect(botClue(cold, 50, 50)).toBe('Lava')
    expect(botClue(cold, 26, 50)).toBe('Room temperature')
  })
})
