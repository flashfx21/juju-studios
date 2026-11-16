// ABOUTME: Shared text cleanup for comparing typed answers: case, accents, punctuation, "&" as "and", a leading article,
// ABOUTME: spaces and hyphens; plus the first letter that counts and a one-letter-off check for near matches.

const ARTICLES = ['a', 'an', 'the']

/** Lowercase words with accents folded (Emile and Émile read the same) and "&" read as "and"; other punctuation dropped. */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
}

/** The words with a leading "a", "an" or "the" dropped, as long as something is left. */
function withoutArticle(list: string[]): string[] {
  return list.length > 1 && ARTICLES.includes(list[0]) ? list.slice(1) : list
}

/**
 * What two answers are compared by: lowercase, accents folded, "&" as "and", punctuation dropped, a leading "a",
 * "an" or "the" ignored, then spaces and hyphens ignored, so "The Race-Car!" and "racecar" read the same.
 */
export function cleanAnswer(text: string): string {
  return withoutArticle(words(text)).join('')
}

/**
 * The letter an answer counts for: the first letter after a leading "The", "A" or "An", accents ignored.
 * "Everybody Loves Raymond" is "e", "The Office" is "o", "Émile" is "e". A digit or nothing typed gives "".
 */
export function firstLetter(text: string): string {
  const first = withoutArticle(words(text))[0]?.[0] ?? ''
  return /[a-z]/.test(first) ? first : ''
}

/** True when the two differ by exactly one wrong, missing or extra letter. */
export function oneLetterOff(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  let i = 0
  while (i < shorter.length && shorter[i] === longer[i]) i++
  const rest = shorter.length === longer.length ? shorter.slice(i + 1) : shorter.slice(i)
  return rest === longer.slice(i + 1)
}
