// ABOUTME: Tests for the guess dial's arithmetic: angles, turn direction, wrapping and the number under the mark.
// ABOUTME: Run with `npm test`.

import { describe, expect, it } from 'vitest'
import { angleFromTop, faceRotation, numberAngle, shownNumber, turnBetween, turnedValue, wrapToRange } from './dialTurns'

describe('angleFromTop', () => {
  it('measures clockwise from the top', () => {
    expect(angleFromTop(0, -1)).toBeCloseTo(0)
    expect(angleFromTop(1, 0)).toBeCloseTo(90)
    expect(angleFromTop(0, 1)).toBeCloseTo(180)
    expect(angleFromTop(-1, 0)).toBeCloseTo(270)
  })
})

describe('turnBetween', () => {
  it('is positive for clockwise and negative for counterclockwise', () => {
    expect(turnBetween(10, 40)).toBe(30)
    expect(turnBetween(40, 10)).toBe(-30)
  })

  it('takes the short way across the top', () => {
    expect(turnBetween(350, 10)).toBe(20)
    expect(turnBetween(10, 350)).toBe(-20)
  })
})

describe('wrapToRange', () => {
  it('wraps past either end like a safe', () => {
    expect(wrapToRange(101, 100)).toBe(1)
    expect(wrapToRange(0, 100)).toBe(100)
    expect(wrapToRange(51, 50)).toBe(1)
    expect(wrapToRange(-4, 50)).toBe(46)
  })

  it('leaves numbers inside the range alone', () => {
    expect(wrapToRange(1, 100)).toBe(1)
    expect(wrapToRange(100, 100)).toBe(100)
  })
})

describe('turnedValue', () => {
  it('counts up when turned clockwise and down when turned counterclockwise', () => {
    expect(turnedValue(50, 36, 100)).toBeCloseTo(60)
    expect(turnedValue(50, -36, 100)).toBeCloseTo(40)
  })

  it('covers the whole range in one turn on both dials', () => {
    expect(turnedValue(10, 360, 100)).toBeCloseTo(10)
    expect(turnedValue(10, 180, 100)).toBeCloseTo(60)
    expect(turnedValue(10, 180, 50)).toBeCloseTo(35)
  })

  it('wraps from the top number back to 1', () => {
    expect(shownNumber(turnedValue(99, 7.2, 100), 100)).toBe(1)
    expect(shownNumber(turnedValue(2, -7.2, 100), 100)).toBe(100)
  })
})

describe('face', () => {
  it('puts the shown number under the top mark', () => {
    for (const value of [1, 17, 50, 100]) {
      expect((numberAngle(value, 100) + faceRotation(value, 100)) % 360).toBeCloseTo(0)
    }
  })

  it('prints numbers counterclockwise, so turning the face clockwise brings bigger numbers to the top', () => {
    expect(numberAngle(2, 100)).toBeLessThan(numberAngle(1, 100))
    expect(faceRotation(60, 100)).toBeGreaterThan(faceRotation(50, 100))
  })
})

describe('shownNumber', () => {
  it('rounds to a whole number and never shows 0 or more than the range', () => {
    expect(shownNumber(49.6, 100)).toBe(50)
    expect(shownNumber(100.4, 100)).toBe(100)
    expect(shownNumber(100.6, 100)).toBe(1)
    expect(shownNumber(0.6, 100)).toBe(1)
  })
})
