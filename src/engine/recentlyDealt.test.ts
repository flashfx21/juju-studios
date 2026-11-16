// ABOUTME: Tests for dealing packs fresh-first: items not dealt lately come first, then the rest from longest ago,
// ABOUTME: and what a device remembers keeps the newest deal last. Run with `npm test`.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshFirst, recentlyDealt, rememberDealt } from './recentlyDealt'
import { seededRandom } from './seededRandom'

const PACK = ['a', 'b', 'c', 'd', 'e', 'f']
const same = (id: string) => id

describe('freshFirst', () => {
  it('is a shuffle of the whole pack when nothing was dealt lately', () => {
    const order = freshFirst(PACK, same, [], seededRandom('x'))
    expect([...order].sort()).toEqual(PACK)
  })

  it('puts items not dealt lately first, then the rest from longest ago to most recent', () => {
    const order = freshFirst(PACK, same, ['e', 'a', 'c'], seededRandom('y'))
    expect([...order.slice(0, 3)].sort()).toEqual(['b', 'd', 'f'])
    expect(order.slice(3)).toEqual(['e', 'a', 'c'])
  })

  it('ignores remembered ids that are no longer in the pack', () => {
    expect(freshFirst(['a', 'b'], same, ['gone', 'a'], seededRandom('z'))).toEqual(['b', 'a'])
  })

  it('never repeats across back-to-back games until the pack runs out', () => {
    const random = seededRandom('games')
    let recent: string[] = []
    const seen: string[] = []
    for (let game = 0; game < 3; game++) {
      const dealt = freshFirst(PACK, same, recent, random).slice(0, 2)
      seen.push(...dealt)
      recent = [...recent.filter((id) => !dealt.includes(id)), ...dealt]
    }
    expect(new Set(seen).size).toBe(6)
  })
})

describe('recentlyDealt and rememberDealt', () => {
  // Tests run outside a browser, so a small in-memory stand-in plays localStorage.
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => items.set(key, value) })
  })

  it('remembers deals in order, moving a re-dealt id to the newest end', () => {
    rememberDealt('game', ['a', 'b'])
    rememberDealt('game', ['c', 'a'])
    expect(recentlyDealt('game')).toEqual(['b', 'c', 'a'])
    expect(recentlyDealt('other')).toEqual([])
  })
})
