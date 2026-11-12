// ABOUTME: Shared check for "the same word in another form" (towel / towels, bake / baking, run / ran) any game can use.
// ABOUTME: Regular endings are matched by spelling; irregular forms come from packs/shared/word-forms.json.
import formPack from '../../packs/shared/word-forms.json'

/** Groups of irregular forms of one word, such as run, ran, running. */
export const WORD_FORM_GROUPS: readonly (readonly string[])[] = formPack.groups

/** Strips common endings so regular forms meet: towels, boxes, babies, baking and running lose their endings. */
function stem(word: string): string {
  let w = word
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`
  else if (w.length > 4 && /(ss|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2)
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (/([b-df-hj-km-np-rt-z])\1$/.test(w)) w = w.slice(0, -1)
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1)
  return w
}

const formGroupOf = new Map<string, number>()
WORD_FORM_GROUPS.forEach((group, i) => group.forEach((word) => formGroupOf.set(word, i)))

/** Same word in another form: towel / towels, bake / baking, run / ran. Expects lowercase words. */
export function sameWordForm(a: string, b: string): boolean {
  if (stem(a) === stem(b)) return true
  const group = formGroupOf.get(a)
  return group !== undefined && group === formGroupOf.get(b)
}
