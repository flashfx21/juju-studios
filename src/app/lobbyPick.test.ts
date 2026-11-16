// ABOUTME: Tests for the lobby's next-game choice: most votes wins, a tie lists every tied game, and Random picks among them.
// ABOUTME: Covers no votes and votes for games no longer offered.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../engine/seededRandom'
import { mostVoted, randomPick } from './lobbyPick'

const GAMES = ['dial-it-in', 'chainword', 'pin-drop']

describe('mostVoted', () => {
  it('is empty with no votes', () => {
    expect(mostVoted({}, GAMES)).toEqual([])
  })

  it('gives the game with the most votes, host or not', () => {
    expect(mostVoted({ host: 'pin-drop', a: 'chainword', b: 'chainword' }, GAMES)).toEqual(['chainword'])
  })

  it('ignores votes for games that are not offered', () => {
    expect(mostVoted({ a: 'no-filler', b: 'no-filler', c: 'pin-drop' }, GAMES)).toEqual(['pin-drop'])
  })

  it('lists every game tied for the most votes, in list order', () => {
    const votes = { a: 'pin-drop', b: 'chainword', c: 'dial-it-in', d: 'pin-drop', e: 'chainword' }
    expect(mostVoted(votes, GAMES)).toEqual(['chainword', 'pin-drop'])
  })
})

describe('randomPick', () => {
  it('lands on each tied game, and only on tied games', () => {
    const random = seededRandom('tie')
    const picks = new Set(Array.from({ length: 40 }, () => randomPick(['pin-drop', 'chainword'], random)))
    expect(picks).toEqual(new Set(['pin-drop', 'chainword']))
  })
})
