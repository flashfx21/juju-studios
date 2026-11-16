// ABOUTME: Tests for the shared answer cleanup: case, accents, punctuation, "&" as "and", leading articles,
// ABOUTME: the first letter an answer counts for, and the one-letter-off check. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { cleanAnswer, firstLetter, oneLetterOff } from './textMatch'

describe('cleanAnswer', () => {
  it('ignores case, punctuation, spaces, hyphens and a leading article', () => {
    expect(cleanAnswer('The Race-Car!')).toBe(cleanAnswer('racecar'))
    expect(cleanAnswer('A Bug')).toBe('bug')
  })

  it('keeps an article that is the whole answer', () => {
    expect(cleanAnswer('The')).toBe('the')
  })

  it('reads "&" as "and" and folds accents', () => {
    expect(cleanAnswer('Ren & Stimpy')).toBe(cleanAnswer('Ren and Stimpy'))
    expect(cleanAnswer('Émile')).toBe(cleanAnswer('Emile'))
  })
})

describe('firstLetter', () => {
  it('skips a leading The, A or An', () => {
    expect(firstLetter('Everybody Loves Raymond')).toBe('e')
    expect(firstLetter('The Office')).toBe('o')
    expect(firstLetter('An Apple')).toBe('a')
  })

  it('takes people by the name as typed, accents ignored', () => {
    expect(firstLetter('Kobe Bryant')).toBe('k')
    expect(firstLetter('Émile')).toBe('e')
  })

  it('gives nothing for a digit or an empty answer', () => {
    expect(firstLetter('7 Up')).toBe('')
    expect(firstLetter('  ')).toBe('')
  })
})

describe('oneLetterOff', () => {
  it('spots one wrong, missing or extra letter', () => {
    expect(oneLetterOff('rugrat', 'rugrats')).toBe(true)
    expect(oneLetterOff('house', 'horse')).toBe(true)
    expect(oneLetterOff('house', 'house')).toBe(false)
    expect(oneLetterOff('house', 'hose s')).toBe(false)
  })
})
