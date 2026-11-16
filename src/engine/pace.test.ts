// ABOUTME: Tests for the shared Pace names and labels: seconds read as seconds under 2 minutes, minutes from there.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { paceHowToPlay, paceLabels, secondsText } from './pace'

describe('pace', () => {
  it('writes short times in seconds and long ones in minutes', () => {
    expect(secondsText(45)).toBe('45 s')
    expect(secondsText(90)).toBe('90 s')
    expect(secondsText(120)).toBe('2 min')
    expect(secondsText(150)).toBe('2.5 min')
  })

  it('labels each pace with its time', () => {
    expect(paceLabels({ quick: 45, normal: 60, relaxed: 90 })).toEqual({ quick: 'Quick 45 s', normal: 'Normal 60 s', relaxed: 'Relaxed 90 s' })
  })

  it('writes the How to play line', () => {
    expect(paceHowToPlay({ quick: 90, normal: 120, relaxed: 180 }, 'a round')).toBe('Pace: Quick, Normal or Relaxed (90 s, 2 min or 3 min a round)')
  })
})
