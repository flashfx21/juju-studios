// ABOUTME: Chain codes let everyone in a playtest get the same chain on their own phone, with no server.
// ABOUTME: A code is 4 letters, the word length, the chain length, and H for hard mode, e.g. "KPDT53H".
import { seededRandom } from '../../engine/seededRandom'
import { CHAIN_LENGTHS, rules, WORD_LENGTHS, type ChainLength, type ChainwordSettings, type WordLength } from './rules'

/** No vowels, so a code never spells a word. */
const CODE_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ'

export interface SharedChain {
  code: string
  settings: ChainwordSettings
  /** Deals this chain; pass it to setup as the random source. */
  random: () => number
}

export function makeChainCode(settings: ChainwordSettings, random: () => number): string {
  let letters = ''
  for (let i = 0; i < 4; i++) letters += CODE_LETTERS[Math.floor(random() * CODE_LETTERS.length)]
  return `${letters}${settings.wordLength}${settings.chainLength}${settings.hardMode ? 'H' : ''}`
}

/** Codes to try when looking for a chain with no recent words; with a few hundred answers per length, one or two are enough. */
const FRESH_TRIES = 50

/** The words a chain code deals. */
export function chainFor(code: string): string[] {
  const shared = readChainCode(code)
  if (!shared) throw new Error(`${code} isn't a chain code.`)
  return rules.setup([], shared.settings, { now: 0, random: shared.random }).chain
}

/** A new chain code whose chain shares no word with `recent`, or the fewest it could find. */
export function freshChainCode(settings: ChainwordSettings, random: () => number, recent: readonly string[]): string {
  const seen = new Set(recent)
  let best = { code: '', repeats: Infinity }
  for (let i = 0; i < FRESH_TRIES && best.repeats > 0; i++) {
    const code = makeChainCode(settings, random)
    const repeats = chainFor(code).filter((word) => seen.has(word)).length
    if (repeats < best.repeats) best = { code, repeats }
  }
  return best.code
}

/** Reads a typed code (any case, spaces and dashes ignored). Returns null if it isn't a chain code. */
export function readChainCode(typed: string): SharedChain | null {
  const code = typed.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = /^([A-Z]{4})(\d)(\d)(H?)$/.exec(code)
  if (!match) return null
  const wordLength = Number(match[2]) as WordLength
  const chainLength = Number(match[3]) as ChainLength
  const hardMode = match[4] === 'H'
  if (!WORD_LENGTHS.includes(wordLength) || !CHAIN_LENGTHS.includes(chainLength)) return null
  return { code, settings: { wordLength, chainLength, hardMode }, random: seededRandom(code) }
}
