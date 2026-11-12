// ABOUTME: Tests for the shared word-form check and its irregular forms pack.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { sameWordForm, WORD_FORM_GROUPS } from './wordForms'

describe('word forms', () => {
  it('lists each irregular form once, lowercase letters only', () => {
    const forms = WORD_FORM_GROUPS.flat()
    expect(forms.every((word) => /^[a-z]+$/.test(word))).toBe(true)
    expect(new Set(forms).size).toBe(forms.length)
  })

  it.each([
    ['towel', 'towels'],
    ['box', 'boxes'],
    ['baby', 'babies'],
    ['bake', 'baking'],
    ['run', 'running'],
    ['car', 'cars'],
  ])('matches regular forms: %s / %s', (a, b) => {
    expect(sameWordForm(a, b)).toBe(true)
  })

  it('matches irregular forms from the pack', () => {
    const [first, second] = WORD_FORM_GROUPS[0]
    expect(sameWordForm(first, second)).toBe(true)
  })

  it('keeps different words apart', () => {
    expect(sameWordForm('house', 'horse')).toBe(false)
    expect(sameWordForm('car', 'carpet')).toBe(false)
  })
})
