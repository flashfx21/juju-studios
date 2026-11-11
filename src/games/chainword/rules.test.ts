// ABOUTME: Tests for Chainword's rules: coloring, hard mode, the guess cap, word lists, ending early and finishing order.
// ABOUTME: Uses a fixed chain and clock so every result is predictable.
import { describe, expect, it } from 'vitest'
import answerPack from '../../../packs/chainword/answers.json'
import guessPack from '../../../packs/chainword/guesses.json'
import type { RulesContext } from '../types'
import {
  answersFor,
  checkGuess,
  DEFAULT_SETTINGS,
  endGame,
  markGuess,
  MISSED_WORD_COST,
  rules,
  totalGuesses,
  totalTime,
  tvProgress,
  WORD_LENGTHS,
  type ChainwordState,
} from './rules'

const START = 1_000_000

function at(now: number): RulesContext {
  return { now, random: () => 0 }
}

/** A game with a known chain, started at START. */
function game(players: string[], chain = ['chain', 'spice', 'grape'], hardMode = false): ChainwordState {
  const state = rules.setup(players, { chainLength: chain.length as 3 | 5, wordLength: 5, hardMode }, at(START))
  return { ...state, chain }
}

function guess(state: ChainwordState, player: string, word: string, now = START): ChainwordState {
  return rules.onInput(state, player, { type: 'guess', word }, at(now))
}

function guessAll(state: ChainwordState, player: string, words: string[], now = START): ChainwordState {
  return words.reduce((s, word) => guess(s, player, word, now), state)
}

describe('word packs', () => {
  it.each(WORD_LENGTHS)('%i letters: answers and guesses are lowercase, the right length, with no repeats', (n) => {
    const answers = answerPack[n]
    const guesses = guessPack[n].split(' ')
    const shape = new RegExp(`^[a-z]{${n}}$`)
    expect(answers.length).toBeGreaterThan(200)
    expect([...answers, ...guesses].every((word) => shape.test(word))).toBe(true)
    expect(new Set(answers).size).toBe(answers.length)
    expect(new Set(guesses).size).toBe(guesses.length)
  })

  it.each(WORD_LENGTHS)('%i letters: every answer is also an accepted guess', (n) => {
    const guesses = new Set(guessPack[n].split(' '))
    expect(answerPack[n].filter((word) => !guesses.has(word))).toEqual([])
  })
})

describe('setup', () => {
  it('defaults to 3 words of 5 letters, hard mode off', () => {
    const state = rules.setup(['ann'], DEFAULT_SETTINGS, at(START))
    expect(state.chain).toHaveLength(3)
    expect(state.chain.every((word) => word.length === 5)).toBe(true)
    expect(state.hardMode).toBe(false)
  })

  it.each(WORD_LENGTHS)('deals 5 distinct %i-letter answers when asked', (wordLength) => {
    let n = 0
    const random = () => (n++ * 0.37) % 1
    const state = rules.setup(['ann'], { chainLength: 5, wordLength, hardMode: false }, { now: START, random })
    expect(new Set(state.chain).size).toBe(5)
    expect(state.chain.every((word) => answersFor(wordLength).includes(word))).toBe(true)
  })

  it('checks guesses against the chosen word length', () => {
    const state = rules.setup(['ann'], { chainLength: 3, wordLength: 7, hardMode: false }, at(START))
    expect(checkGuess(state, 'ann', 'chain')).toEqual({ kind: 'wrong-length' })
    expect(checkGuess(state, 'ann', 'kitchen')).toBeNull()
  })

  it('gives every player the same chain', () => {
    const state = game(['ann', 'bo'])
    expect(Object.keys(state.runs)).toEqual(['ann', 'bo'])
    expect(state.runs.ann.attempts).toHaveLength(1)
  })
})

describe('markGuess', () => {
  it('marks greens, yellows and grays', () => {
    expect(markGuess('piano', 'spice')).toEqual(['yellow', 'yellow', 'gray', 'gray', 'gray'])
  })

  it('marks a repeated letter only as often as the answer has it', () => {
    expect(markGuess('sheep', 'spice')).toEqual(['green', 'gray', 'yellow', 'gray', 'yellow'])
  })

  it('lets a green use up the only copy before any yellow', () => {
    expect(markGuess('geese', 'grape')).toEqual(['green', 'gray', 'gray', 'gray', 'green'])
  })
})

describe('checkGuess', () => {
  it('refuses words that are the wrong length or not in the word list', () => {
    const state = game(['ann'])
    expect(checkGuess(state, 'ann', 'cat')).toEqual({ kind: 'wrong-length' })
    expect(checkGuess(state, 'ann', 'zzzzz')).toEqual({ kind: 'not-a-word' })
    expect(checkGuess(state, 'ann', ' Chair ')).toBeNull()
  })

  it('refuses a player who is not in the game', () => {
    expect(checkGuess(game(['ann']), 'zed', 'chair')).toEqual({ kind: 'not-playing' })
  })

  it('normal mode: any listed word is allowed, whatever the earlier hints', () => {
    const state = guess(game(['ann']), 'ann', 'chair')
    expect(checkGuess(state, 'ann', 'stone')).toBeNull()
    expect(guess(state, 'ann', 'stone').runs.ann.attempts[0].guesses).toEqual(['chair', 'stone'])
  })

  it('hard mode: greens must stay in place', () => {
    const state = guess(game(['ann'], undefined, true), 'ann', 'chair')
    expect(checkGuess(state, 'ann', 'cheap')).toEqual({ kind: 'keep-green', letter: 'a', position: 2 })
  })

  it('hard mode: yellow letters must be used again', () => {
    const chain = ['spice', 'chain', 'grape']
    const state = guess(game(['ann'], chain, true), 'ann', 'piano')
    expect(checkGuess(state, 'ann', 'stone')).toEqual({ kind: 'use-letter', letter: 'p', count: 1 })
    expect(checkGuess(state, 'ann', 'spine')).toBeNull()
  })

  it('hard mode: hints from one word do not carry to the next', () => {
    const state = guessAll(game(['ann'], undefined, true), 'ann', ['chair', 'chain'])
    expect(checkGuess(state, 'ann', 'stone')).toBeNull()
  })
})

describe('onInput', () => {
  it('ignores a refused guess without counting it', () => {
    const state = game(['ann'])
    expect(guess(state, 'ann', 'zzzzz')).toBe(state)
  })

  it('moves to the next word when a word is solved', () => {
    const state = guessAll(game(['ann']), 'ann', ['chair', 'chain'])
    expect(state.runs.ann.attempts).toHaveLength(2)
    expect(state.runs.ann.attempts[0].solved).toBe(true)
    expect(totalGuesses(state.runs.ann)).toBe(2)
  })

  it('counts a missed word as 7 after 6 guesses and moves on', () => {
    const misses = ['plump', 'fudge', 'store', 'jolly', 'proud', 'debut']
    const state = guessAll(game(['ann']), 'ann', misses)
    expect(state.runs.ann.attempts[0].solved).toBe(false)
    expect(state.runs.ann.attempts).toHaveLength(2)
    expect(totalGuesses(state.runs.ann)).toBe(MISSED_WORD_COST)
  })

  it('finishes a player after the last word and records the time', () => {
    let state = guessAll(game(['ann', 'bo']), 'ann', ['chain', 'spice'])
    state = guess(state, 'ann', 'grape', START + 42_000)
    expect(state.runs.ann.finishedAt).toBe(START + 42_000)
    expect(totalTime(state, state.runs.ann)).toBe(42_000)
    expect(checkGuess(state, 'ann', 'chain')).toEqual({ kind: 'not-playing' })
    expect(rules.isOver(state)).toBe(false)
  })
})

describe('isOver and finishingOrder', () => {
  it('ranks by fewest total guesses, then by faster time, and keeps exact ties together', () => {
    let state = game(['ann', 'bo', 'cy', 'di'])
    state = guessAll(state, 'ann', ['chair', 'chain', 'spice', 'grape'], START + 50_000)
    state = guessAll(state, 'bo', ['chain', 'spice', 'grape'], START + 90_000)
    state = guessAll(state, 'cy', ['chain', 'spice', 'grape'], START + 60_000)
    state = guessAll(state, 'di', ['chair', 'chain', 'spice', 'grape'], START + 50_000)
    expect(rules.isOver(state)).toBe(true)
    expect(rules.finishingOrder(state)).toEqual([['cy'], ['bo'], ['ann', 'di']])
  })

  it('puts a player with a missed word behind one who solved everything slowly', () => {
    const misses = ['plump', 'fudge', 'store', 'jolly', 'proud', 'debut']
    let state = game(['ann', 'bo'])
    state = guessAll(state, 'ann', [...misses, 'spice', 'grape'], START + 10_000)
    state = guessAll(state, 'bo', ['chair', 'chain', 'spine', 'spice', 'grace', 'grape'], START + 99_000)
    expect(totalGuesses(state.runs.ann)).toBe(9)
    expect(totalGuesses(state.runs.bo)).toBe(6)
    expect(rules.finishingOrder(state)).toEqual([['bo'], ['ann']])
  })

  it('onTimer changes nothing', () => {
    const state = game(['ann'])
    expect(rules.onTimer(state, at(START + 1))).toBe(state)
  })
})

describe('endGame', () => {
  it('counts the word in progress and every word not reached as missed, and finishes everyone', () => {
    let state = game(['ann', 'bo', 'cy'])
    state = guessAll(state, 'ann', ['chain', 'spice', 'grape'], START + 30_000)
    state = guessAll(state, 'bo', ['chain', 'piano'])
    state = endGame(state, at(START + 60_000))
    expect(rules.isOver(state)).toBe(true)
    expect(state.runs.ann.finishedAt).toBe(START + 30_000)
    expect(state.runs.bo.finishedAt).toBe(START + 60_000)
    expect(state.runs.bo.attempts).toHaveLength(3)
    expect(totalGuesses(state.runs.bo)).toBe(1 + 2 * MISSED_WORD_COST)
    expect(totalGuesses(state.runs.cy)).toBe(3 * MISSED_WORD_COST)
    expect(rules.finishingOrder(state)).toEqual([['ann'], ['bo'], ['cy']])
  })
})

describe('tvProgress', () => {
  it('shows colors and counts but never letters', () => {
    let state = game(['ann', 'bo'])
    state = guessAll(state, 'ann', ['chair', 'chain', 'piano'])
    const progress = tvProgress(state)
    const ann = progress.find((p) => p.player === 'ann')!
    expect(ann.words).toEqual([
      [
        ['green', 'green', 'green', 'green', 'gray'],
        ['green', 'green', 'green', 'green', 'green'],
      ],
      [['yellow', 'yellow', 'gray', 'gray', 'gray']],
    ])
    expect(ann).toMatchObject({ wordIndex: 1, solvedWords: 1, totalGuesses: 3, finished: false })

    const allowed = new Set(['ann', 'bo', 'green', 'yellow', 'gray'])
    const strings: string[] = []
    const collect = (value: unknown) => {
      if (typeof value === 'string') strings.push(value)
      else if (value && typeof value === 'object') Object.values(value).forEach(collect)
    }
    collect(progress)
    expect(strings.filter((s) => !allowed.has(s))).toEqual([])
  })
})
