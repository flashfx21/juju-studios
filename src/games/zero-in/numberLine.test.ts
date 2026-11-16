// ABOUTME: Tests for Zero In's TV number line: the stretch shown fits the answer and the near guesses, wild guesses sit
// ABOUTME: at an edge marked way off, and close chips stack in rows. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { layoutLine, MAX_ROWS } from './numberLine'

describe('number line', () => {
  it('shows the answer and every near guess inside the line, in order', () => {
    const line = layoutLine(1969, { a: 1960, b: 1972, c: 1950 })
    expect(line.answerPosition).toBeGreaterThan(0)
    expect(line.answerPosition).toBeLessThan(1)
    const at = Object.fromEntries(line.points.map((p) => [p.id, p]))
    expect(at.c.position).toBeLessThan(at.a.position)
    expect(at.a.position).toBeLessThan(line.answerPosition)
    expect(at.b.position).toBeGreaterThan(line.answerPosition)
    expect(line.points.every((p) => p.wayOff === null)).toBe(true)
  })

  it('puts a wild guess at the edge, marked way off, without stretching the line', () => {
    const line = layoutLine(250, { a: 240, b: 260, c: 299, d: 9_000_000 })
    const wild = line.points.find((p) => p.id === 'd')!
    expect(wild).toMatchObject({ wayOff: 'high', position: 1 })
    expect(line.high).toBeLessThan(1000)
    expect(layoutLine(250, { a: 240, b: 260, c: 0 }).points.find((p) => p.id === 'c')?.wayOff).toBe('low')
  })

  it('stacks chips that would overlap into rows, never more than the most rows', () => {
    const guesses = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`p${i}`, 100 + (i % 2)]))
    const line = layoutLine(100, guesses)
    const rows = new Set(line.points.map((p) => p.row))
    expect(rows.size).toBeGreaterThan(1)
    expect(Math.max(...rows)).toBeLessThan(MAX_ROWS)
  })

  it('never runs below 0', () => {
    expect(layoutLine(1, { a: 0, b: 2 }).low).toBe(0)
  })

  it('still draws a line when everyone hits the answer, or nobody guessed', () => {
    expect(layoutLine(88, { a: 88, b: 88 }).answerPosition).toBeCloseTo(0.5)
    expect(layoutLine(88, {}).answerPosition).toBeCloseTo(0.5)
  })
})
