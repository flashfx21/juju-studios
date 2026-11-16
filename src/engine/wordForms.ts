// ABOUTME: Shared check for "the same word in another form" (towel / towels, bake / baking, run / ran) any game can use.
// ABOUTME: Regular endings are matched by spelling; irregular forms come from packs/shared/word-forms.json.
import formPack from '../../packs/shared/word-forms.json'

/** Groups of irregular forms of one word, such as run, ran, running. */
export const WORD_FORM_GROUPS: readonly (readonly string[])[] = formPack.groups

/**
 * The words this one could be a regular form of: towels gives towel, boxes box, babies baby. An -ing or -ed ending
 * may have dropped an e (baking) or doubled a letter (running), so those give both spellings. A word with no ending
 * is only itself, so car and care stay different words.
 */
function bases(word: string): string[] {
  if (word.length > 4 && word.endsWith('ies')) return [`${word.slice(0, -3)}y`]
  if (word.length > 4 && /(ss|x|z|ch|sh)es$/.test(word)) return [word.slice(0, -2)]
  let cut: string
  if (word.length > 5 && word.endsWith('ing')) cut = word.slice(0, -3)
  else if (word.length > 4 && word.endsWith('ed')) cut = word.slice(0, -2)
  else if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return [word.slice(0, -1)]
  else return [word]
  return /([b-df-hj-km-np-rt-z])\1$/.test(cut) ? [cut.slice(0, -1), cut] : [cut, `${cut}e`]
}

const formGroupOf = new Map<string, number>()
WORD_FORM_GROUPS.forEach((group, i) => group.forEach((word) => formGroupOf.set(word, i)))

/** Same word in another form: towel / towels, bake / baking, run / ran. Expects lowercase words. */
export function sameWordForm(a: string, b: string): boolean {
  const other = bases(b)
  if (bases(a).some((base) => other.includes(base))) return true
  const group = formGroupOf.get(a)
  return group !== undefined && group === formGroupOf.get(b)
}
