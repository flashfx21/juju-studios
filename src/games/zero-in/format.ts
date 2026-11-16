// ABOUTME: How Zero In writes and reads numbers: commas for big numbers (never in years), the unit before or after,
// ABOUTME: and turning what a player typed into a guess.
import { MAX_GUESS, type Question } from './rules'

/** "29,032", or "1937" for a year. */
export function numberText(value: number, question: Pick<Question, 'lane'>): string {
  return question.lane === 'year' ? String(value) : value.toLocaleString('en-US')
}

/** "$2,495", "8 cents", "1969". */
export function amountText(value: number, question: Pick<Question, 'lane' | 'unit' | 'unitPosition'>): string {
  const number = numberText(value, question)
  if (!question.unit) return number
  return question.unitPosition === 'before' ? `${question.unit}${number}` : `${number} ${question.unit}`
}

/** What a player typed as a guess: digits only (commas and spaces are fine), up to 9 digits. Null if it isn't one. */
export function readGuess(typed: string): number | null {
  const digits = typed.replace(/[,\s]/g, '')
  if (!/^\d{1,9}$/.test(digits)) return null
  const value = Number(digits)
  return value <= MAX_GUESS ? value : null
}

/** The typed text tidied as the player types: digits only, commas added (not for years). */
export function tidyTyped(typed: string, question: Pick<Question, 'lane'>): string {
  const digits = typed.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9)
  return digits === '' ? '' : numberText(Number(digits), question)
}

/** "2 away", "Exact", "1,200 away". */
export function distanceText(distance: number, question: Pick<Question, 'lane'>): string {
  return distance === 0 ? 'Exact' : `${numberText(distance, { lane: question.lane === 'year' ? 'number' : question.lane })} away`
}

/** "1st", "2nd", "3rd", "11th". */
export function placeText(place: number): string {
  const tens = place % 100
  if (tens >= 11 && tens <= 13) return `${place}th`
  return `${place}${{ 1: 'st', 2: 'nd', 3: 'rd' }[place % 10] ?? 'th'}`
}
