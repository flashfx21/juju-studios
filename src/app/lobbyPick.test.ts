// ABOUTME: Tests for the lobby's next-game pick: most votes wins, ties are a random pick that every phone agrees on.
// ABOUTME: Covers no votes, votes for games no longer offered, and a tie that changes when the votes change.
import { describe, expect, it } from 'vitest'
import { lobbyPick } from './lobbyPick'

const GAMES = ['dial-it-in', 'chainword', 'pin-drop']

describe('lobbyPick', () => {
  it('picks nothing with no votes', () => {
    expect(lobbyPick({}, GAMES)).toBeNull()
  })

  it('picks the game with the most votes, host or not', () => {
    expect(lobbyPick({ host: 'pin-drop', a: 'chainword', b: 'chainword' }, GAMES)).toEqual({ game: 'chainword', tiedWith: [] })
  })

  it('ignores votes for games that are not offered', () => {
    expect(lobbyPick({ a: 'no-filler', b: 'no-filler', c: 'pin-drop' }, GAMES)).toEqual({ game: 'pin-drop', tiedWith: [] })
  })

  it('settles a tie with one of the tied games and lists them', () => {
    const pick = lobbyPick({ a: 'pin-drop', b: 'chainword', c: 'dial-it-in', d: 'pin-drop', e: 'chainword' }, GAMES)
    expect(pick?.tiedWith).toEqual(['chainword', 'pin-drop'])
    expect(['chainword', 'pin-drop']).toContain(pick?.game)
  })

  it('gives the same pick for the same votes, whatever order they arrive in', () => {
    const one = lobbyPick({ a: 'pin-drop', b: 'chainword' }, GAMES)
    const two = lobbyPick({ b: 'chainword', a: 'pin-drop' }, GAMES)
    expect(one).toEqual(two)
  })

  it('lands on each tied game for some set of votes', () => {
    const picks = new Set<string>()
    for (let i = 0; i < 40; i++) picks.add(lobbyPick({ [`p${i}`]: 'pin-drop', [`q${i}`]: 'chainword' }, GAMES)!.game)
    expect(picks).toEqual(new Set(['pin-drop', 'chainword']))
  })
})
