// ABOUTME: Tests for chain codes: reading typed codes, carrying settings, dealing the same chain on every device, and fresh codes.
// ABOUTME: Also checks that seeded random numbers repeat for the same seed.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { answersFor, DEFAULT_SETTINGS } from './rules'
import { chainFor, freshChainCode, makeChainCode, readChainCode } from './chainCode'

describe('seededRandom', () => {
  it('repeats the same numbers for the same seed, within 0 to 1', () => {
    const a = seededRandom('KPDT53')
    const b = seededRandom('KPDT53')
    const first = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(first)
    expect(first.every((n) => n >= 0 && n < 1)).toBe(true)
    expect(seededRandom('KPDT54')()).not.toBe(first[0])
  })
})

describe('chain codes', () => {
  it('makes a 4-letter code ending in the word length and chain length', () => {
    const code = makeChainCode({ wordLength: 6, chainLength: 5, hardMode: false }, Math.random)
    expect(code).toMatch(/^[BCDFGHJKLMNPQRSTVWXZ]{4}65$/)
  })

  it('ends the code with H when hard mode is on', () => {
    const code = makeChainCode({ wordLength: 5, chainLength: 3, hardMode: true }, Math.random)
    expect(code).toMatch(/^[BCDFGHJKLMNPQRSTVWXZ]{4}53H$/)
  })

  it('reads the settings back out of a code', () => {
    expect(readChainCode('kpdt53')?.settings).toEqual({ wordLength: 5, chainLength: 3, hardMode: false })
    expect(readChainCode('KPDT 7-5')?.settings).toEqual({ wordLength: 7, chainLength: 5, hardMode: false })
    expect(readChainCode('kpdt53h')?.settings).toEqual({ wordLength: 5, chainLength: 3, hardMode: true })
  })

  it('refuses codes with the wrong shape or settings the game does not offer', () => {
    expect(readChainCode('')).toBeNull()
    expect(readChainCode('KPD53')).toBeNull()
    expect(readChainCode('KPDT83')).toBeNull()
    expect(readChainCode('KPDT54')).toBeNull()
    expect(readChainCode('KPDT53X')).toBeNull()
  })

  it('deals the same chain for the same code, however it is typed', () => {
    expect(chainFor('kpdt 53')).toEqual(chainFor('KPDT53'))
    expect(chainFor('KPDT53')).not.toEqual(chainFor('BCDF53'))
  })
})

describe('freshChainCode', () => {
  it('finds a chain with none of the words dealt lately', () => {
    const random = seededRandom('fresh')
    const recent = answersFor(5).slice(0, 300)
    for (let game = 0; game < 10; game++) {
      const chain = chainFor(freshChainCode(DEFAULT_SETTINGS, random, recent))
      expect(chain.some((word) => recent.includes(word))).toBe(false)
    }
  })

  it('still gives a code when every word was dealt lately', () => {
    const code = freshChainCode(DEFAULT_SETTINGS, seededRandom('all'), answersFor(5))
    expect(readChainCode(code)?.settings).toEqual(DEFAULT_SETTINGS)
  })
})
