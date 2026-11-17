// ABOUTME: Tests for the wording Pin Drop's screens share: distances in miles or kilometers, places and photo credits.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { creditText, distanceText, placeText } from './format'
import { PHOTOS } from './rules'

describe('Pin Drop wording', () => {
  it('shows whole distances at 10 and above, one decimal below', () => {
    expect(distanceText(1937.6, 'km')).toBe('1,938 km')
    expect(distanceText(1937.6, 'mi')).toBe('1,204 mi')
    expect(distanceText(3.44, 'km')).toBe('3.4 km')
  })

  it('names places', () => {
    expect([1, 2, 3, 4, 10].map(placeText)).toEqual(['1st', '2nd', '3rd', '4th', '10th'])
  })

  it('credits a photo by author, license and source', () => {
    const photo = { ...PHOTOS[0], author: 'A. Walker', license: 'CC BY-SA 4.0' }
    expect(creditText(photo)).toBe('Photo: A. Walker · CC BY-SA 4.0 · Wikimedia Commons')
  })
})
