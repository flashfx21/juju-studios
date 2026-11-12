// ABOUTME: Sketch Showdown's lenient guess matching: cleanup, hand-picked alternates, word forms and one-letter typos.
// ABOUTME: Never accepts part of a multi-word answer or part of a compound unless that part is listed as an alternate.
import { sameWordForm } from '../../engine/wordForms'

/** One thing to draw, with other answers a drawing can't tell apart from it. */
export interface Clue {
  answer: string
  alternates?: string[]
}

/** Answers this long or longer forgive one wrong, missing or extra letter. */
export const TYPO_MIN_LENGTH = 5

/**
 * Lowercase, trim, drop punctuation, ignore a leading "a", "an" or "the", then ignore spaces and hyphens,
 * so "The Race-Car!" and "racecar" read the same.
 */
export function cleanGuess(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
  if (words.length > 1 && ['a', 'an', 'the'].includes(words[0])) words.shift()
  return words.join('')
}

/** True when the two differ by exactly one wrong, missing or extra letter. */
function oneLetterOff(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  let i = 0
  while (i < shorter.length && shorter[i] === longer[i]) i++
  const rest = shorter.length === longer.length ? shorter.slice(i + 1) : shorter.slice(i)
  return rest === longer.slice(i + 1)
}

/**
 * Whether a guess names the clue. `isWord` checks the shared dictionary: a typo only counts when the guess
 * isn't itself a real word, so "lighthous" counts for lighthouse but "horse" never counts for house.
 */
export function guessMatches(text: string, clue: Clue, isWord: (word: string) => boolean): boolean {
  const guess = cleanGuess(text)
  if (!guess) return false
  const answers = [clue.answer, ...(clue.alternates ?? [])].map(cleanGuess)
  return answers.some(
    (answer) =>
      guess === answer ||
      sameWordForm(guess, answer) ||
      (answer.length >= TYPO_MIN_LENGTH && oneLetterOff(guess, answer) && !isWord(guess)),
  )
}
