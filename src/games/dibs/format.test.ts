// ABOUTME: Tests for Dibs' screen words: claim times and the reason a player scored what they did in a round.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { reasonText, secondsAt } from './format'

describe('secondsAt', () => {
  it('shows tenths of a second', () => {
    expect(secondsAt(4200)).toBe('4.2 s')
    expect(secondsAt(0)).toBe('0.0 s')
  })
})

describe('reasonText', () => {
  const base = { answer: 'Rugrats', valid: true, speedRank: 2, points: 4, penalty: 0 }

  it('names the speed place for the first three good answers', () => {
    expect(reasonText(base)).toBe('2nd good answer: 4 points')
    expect(reasonText({ ...base, speedRank: 5, points: 2 })).toBe('Good answer: 2 points')
  })

  it('says why an answer scored nothing, and adds a failed challenge', () => {
    expect(reasonText({ ...base, answer: null, valid: false, speedRank: null, points: 0 })).toBe('No answer: 0 points')
    expect(reasonText({ ...base, valid: false, speedRank: null, points: 0, penalty: 1 })).toBe('Voted out: 0 points. Failed challenge: -1')
  })
})
