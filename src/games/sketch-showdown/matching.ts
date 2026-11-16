// ABOUTME: Sketch Showdown's lenient guess matching: cleanup, hand-picked alternates, word forms and one-letter typos.
// ABOUTME: Never accepts part of a multi-word answer or part of a compound unless that part is listed as an alternate.
import { cleanAnswer, oneLetterOff } from '../../engine/textMatch'
import { sameWordForm } from '../../engine/wordForms'

/** One thing to draw, with other answers a drawing can't tell apart from it. */
export interface Clue {
  answer: string
  alternates?: string[]
}

/** Answers this long or longer forgive one wrong, missing or extra letter. */
export const TYPO_MIN_LENGTH = 5

/**
 * Whether a guess names the clue. `isWord` checks the shared dictionary: a typo only counts when the guess
 * isn't itself a real word, so "lighthous" counts for lighthouse but "horse" never counts for house.
 */
export function guessMatches(text: string, clue: Clue, isWord: (word: string) => boolean): boolean {
  const guess = cleanAnswer(text)
  if (!guess) return false
  const answers = [clue.answer, ...(clue.alternates ?? [])].map(cleanAnswer)
  return answers.some(
    (answer) =>
      guess === answer ||
      sameWordForm(guess, answer) ||
      (answer.length >= TYPO_MIN_LENGTH && oneLetterOff(guess, answer) && !isWord(guess)),
  )
}
