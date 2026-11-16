// ABOUTME: Tests for how Zero In writes and reads numbers: commas, units, years, typed guesses and places.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { amountText, distanceText, placeText, readGuess, tidyTyped } from './format'

const PRICE = { lane: 'price', unit: '$', unitPosition: 'before' } as const
const CENTS = { lane: 'price', unit: 'cents', unitPosition: 'after' } as const
const YEAR = { lane: 'year', unit: '', unitPosition: 'after' } as const
const FEET = { lane: 'number', unit: 'feet', unitPosition: 'after' } as const

describe('format', () => {
  it('writes amounts with the unit in place and no commas in years', () => {
    expect(amountText(2495, PRICE)).toBe('$2,495')
    expect(amountText(8, CENTS)).toBe('8 cents')
    expect(amountText(1969, YEAR)).toBe('1969')
    expect(amountText(29032, FEET)).toBe('29,032 feet')
  })

  it('reads typed guesses with commas or spaces, and refuses anything else', () => {
    expect(readGuess('2,495')).toBe(2495)
    expect(readGuess(' 1 969 ')).toBe(1969)
    expect(readGuess('0')).toBe(0)
    for (const bad of ['', '-5', '2.5', 'abc', '1234567890']) expect(readGuess(bad)).toBeNull()
  })

  it('tidies typing: digits only, commas added, years left alone, 9 digits at most', () => {
    expect(tidyTyped('2495', PRICE)).toBe('2,495')
    expect(tidyTyped('$2,4a95', PRICE)).toBe('2,495')
    expect(tidyTyped('1969', YEAR)).toBe('1969')
    expect(tidyTyped('007', FEET)).toBe('7')
    expect(tidyTyped('12345678901', FEET)).toBe('123,456,789')
    expect(tidyTyped('', FEET)).toBe('')
  })

  it('writes distances and places', () => {
    expect(distanceText(0, PRICE)).toBe('Exact')
    expect(distanceText(1200, PRICE)).toBe('1,200 away')
    expect(distanceText(1200, YEAR)).toBe('1,200 away')
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(placeText)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd'])
  })
})
