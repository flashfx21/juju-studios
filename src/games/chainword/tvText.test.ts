// ABOUTME: Tests for the words around Chainword's TV screens: the chain label and the status bar while playing, stopped and over.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { chainTimeLimitMs, REPORT_GRACE_MS, type ChainPlay, type Progress } from './roomProgress'
import { chainwordChainLabel, chainwordStatus } from './tvText'

const play: ChainPlay = { chainCode: 'KPDT53', players: ['ana', 'bo', 'cy'], startedAt: 1000, endedAt: null }
const going: Progress = { words: [], current: 2, finished: false, totalGuesses: 2, timeMs: null }
const done: Progress = { words: [], current: 0, finished: true, totalGuesses: 11, timeMs: 90_000 }
const deadline = play.startedAt + chainTimeLimitMs(3)

describe('Chainword TV words', () => {
  it('labels the chain by its settings, and the end', () => {
    expect(chainwordChainLabel(play, false)).toBe('3 words · 5 letters')
    expect(chainwordChainLabel({ ...play, chainCode: 'KPDT75H' }, false)).toBe('5 words · 7 letters · hard mode')
    expect(chainwordChainLabel(play, true)).toBe('Game over')
  })

  it('counts who has finished while the chain runs', () => {
    expect(chainwordStatus(play, {}, 2000)).toBe('Guess on your phone · 0 of 3 finished')
    expect(chainwordStatus(play, { ana: done, bo: going }, 2000)).toBe('Guess on your phone · 1 of 3 finished')
  })

  it('says why the chain stopped while the last phones report', () => {
    expect(chainwordStatus(play, { ana: done }, deadline)).toBe("Time's up")
    expect(chainwordStatus({ ...play, endedAt: 5000 }, { ana: done }, 6000)).toBe('The host ended the game')
  })

  it('says game over once everyone has finished, or a moment after the chain stopped', () => {
    expect(chainwordStatus(play, { ana: done, bo: done, cy: done }, 2000)).toBe('Game over')
    expect(chainwordStatus(play, { ana: done }, deadline + REPORT_GRACE_MS)).toBe('Game over')
  })
})
