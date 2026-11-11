// ABOUTME: Tests for the shared dictionary: what it accepts and refuses, and that it loads only once.
// ABOUTME: Reads the real word list from packs/shared.
import { describe, expect, it } from 'vitest'
import { loadDictionary } from './dictionary'

describe('loadDictionary', () => {
  it('knows common words, short and long', async () => {
    const dictionary = await loadDictionary()
    expect(['ox', 'sand', 'beach', 'towels', 'lifeguard', 'refrigerator'].every((word) => dictionary.has(word))).toBe(true)
  })

  it('has no one-letter words and misses some compounds', async () => {
    const dictionary = await loadDictionary()
    expect(dictionary.has('a')).toBe(false)
    expect(dictionary.has('sandcastle')).toBe(false)
  })

  it('ignores case and spaces around the word', async () => {
    const dictionary = await loadDictionary()
    expect(dictionary.has(' Beach ')).toBe(true)
  })

  it('refuses names, made-up words and blanks', async () => {
    const dictionary = await loadDictionary()
    expect(dictionary.has('malibu')).toBe(false)
    expect(dictionary.has('zzqx')).toBe(false)
    expect(dictionary.has('')).toBe(false)
  })

  it('loads once and hands back the same dictionary', async () => {
    expect(await loadDictionary()).toBe(await loadDictionary())
  })
})
