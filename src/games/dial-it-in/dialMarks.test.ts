// ABOUTME: Tests for placing guesses on the TV's dial: positions along it and rows for guesses that land close together.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { dialPosition, layoutMarks } from './dialMarks'

describe('Dial It In TV dial marks', () => {
  it('puts 1 at the left end and the top of the range at the right end', () => {
    expect(dialPosition(1, 100)).toBe(0)
    expect(dialPosition(100, 100)).toBe(1)
    expect(dialPosition(50, 50)).toBe(1)
  })

  it('keeps guesses that are far apart on the dial itself', () => {
    const marks = layoutMarks({ ana: 10, bo: 50, cy: 90 }, 100)
    expect(marks.map((mark) => [mark.id, mark.row])).toEqual([
      ['ana', 0],
      ['bo', 0],
      ['cy', 0],
    ])
  })

  it('stacks guesses that land close together, and reuses a row once it is clear', () => {
    const marks = layoutMarks({ ana: 40, bo: 40, cy: 42, di: 60 }, 100)
    expect(marks.map((mark) => [mark.id, mark.row])).toEqual([
      ['ana', 0],
      ['bo', 1],
      ['cy', 2],
      ['di', 0],
    ])
  })
})
