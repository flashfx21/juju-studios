// ABOUTME: Tests for chain codes: reading typed codes, carrying settings, and dealing the same chain on every device.
// ABOUTME: Also checks that seeded random numbers repeat for the same seed.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { makeChainCode, readChainCode } from './chainCode'
import { rules } from './rules'

function chainFor(code: string): string[] {
  const shared = readChainCode(code)!
  return rules.setup(['ann'], shared.settings, { now: 0, random: shared.random }).chain
}

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
    const code = makeChainCode({ wordLength: 6, chainLength: 5 }, Math.random)
    expect(code).toMatch(/^[BCDFGHJKLMNPQRSTVWXZ]{4}65$/)
  })

  it('reads the settings back out of a code', () => {
    expect(readChainCode('kpdt53')?.settings).toEqual({ wordLength: 5, chainLength: 3 })
    expect(readChainCode('KPDT 7-5')?.settings).toEqual({ wordLength: 7, chainLength: 5 })
  })

  it('refuses codes with the wrong shape or settings the game does not offer', () => {
    expect(readChainCode('')).toBeNull()
    expect(readChainCode('KPD53')).toBeNull()
    expect(readChainCode('KPDT83')).toBeNull()
    expect(readChainCode('KPDT54')).toBeNull()
  })

  it('deals the same chain for the same code, however it is typed', () => {
    expect(chainFor('kpdt 53')).toEqual(chainFor('KPDT53'))
    expect(chainFor('KPDT53')).not.toEqual(chainFor('BCDF53'))
  })
})
