// ABOUTME: Tests for the guess dial's arithmetic: angles, turn direction, stopping at the ends and the number under the mark.
// ABOUTME: Run with `npm test`.

import { describe, expect, it } from 'vitest'
import { angleFromTop, clampToRange, faceRotation, numberAngle, shownNumber, turnBetween, turnedValue } from './dialTurns'

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

describe('clampToRange', () => {
  it('stops at either end instead of wrapping', () => {
    expect(clampToRange(101, 100)).toBe(100)
    expect(clampToRange(0, 100)).toBe(1)
    expect(clampToRange(51, 50)).toBe(50)
    expect(clampToRange(-4, 50)).toBe(1)
  })

  it('leaves numbers inside the range alone', () => {
    expect(clampToRange(1, 100)).toBe(1)
    expect(clampToRange(100, 100)).toBe(100)
    expect(clampToRange(37.5, 100)).toBe(37.5)
  })
})

describe('turnedValue', () => {
  it('counts up when turned clockwise and down when turned counterclockwise', () => {
    expect(turnedValue(50, 36, 100)).toBeCloseTo(60)
    expect(turnedValue(50, -36, 100)).toBeCloseTo(40)
  })

  it('covers the whole range in one turn on both dials', () => {
    expect(turnedValue(1, 360, 100)).toBeCloseTo(100)
    expect(turnedValue(10, 180, 100)).toBeCloseTo(60)
    expect(turnedValue(10, 180, 50)).toBeCloseTo(35)
  })

  it('stops at the top number and at 1 when turned past them', () => {
    expect(shownNumber(turnedValue(99, 7.2, 100), 100)).toBe(100)
    expect(shownNumber(turnedValue(2, -7.2, 100), 100)).toBe(1)
    expect(turnedValue(100, 90, 100)).toBe(100)
    expect(turnedValue(1, -90, 50)).toBe(1)
  })

  it('turns back down straight away after hitting the top', () => {
    const stopped = turnedValue(95, 90, 100)
    expect(turnedValue(stopped, -36, 100)).toBeCloseTo(90)
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
    expect(shownNumber(100.6, 100)).toBe(100)
    expect(shownNumber(0.6, 100)).toBe(1)
  })
})
