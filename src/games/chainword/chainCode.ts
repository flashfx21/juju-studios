// ABOUTME: Chain codes let everyone in a playtest get the same chain on their own phone, with no server.
// ABOUTME: A code is 4 letters plus the word length and chain length, e.g. "KPDT53" is 5-letter words, 3 of them.
import { seededRandom } from '../../engine/seededRandom'
import { CHAIN_LENGTHS, WORD_LENGTHS, type ChainLength, type ChainwordSettings, type WordLength } from './rules'

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
  return `${letters}${settings.wordLength}${settings.chainLength}`
}

/** Reads a typed code (any case, spaces and dashes ignored). Returns null if it isn't a chain code. */
export function readChainCode(typed: string): SharedChain | null {
  const code = typed.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = /^([A-Z]{4})(\d)(\d)$/.exec(code)
  if (!match) return null
  const wordLength = Number(match[2]) as WordLength
  const chainLength = Number(match[3]) as ChainLength
  if (!WORD_LENGTHS.includes(wordLength) || !CHAIN_LENGTHS.includes(chainLength)) return null
  return { code, settings: { wordLength, chainLength }, random: seededRandom(code) }
}
