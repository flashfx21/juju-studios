// ABOUTME: Tests for Don't Jinx It's rules: dealing, clue checks, jinxes and close calls, guessing, scoring,
// ABOUTME: the turn flow, and the hard rule that the guesser's phone and the TV never get a secret early.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import {
  clueProblems,
  cluesPerWriter,
  currentTurn,
  DEFAULT_SETTINGS,
  isCloseCall,
  MYSTERY_WORDS,
  PACES,
  PACE_SECONDS,
  phaseSeconds,
  playerView,
  resolvePile,
  rules,
  SKIP_WINDOW_SECONDS,
  survivors,
  totalScores,
  tvView,
  type DontJinxItInput,
  type DontJinxItState,
} from './rules'

const START = 1_000_000
const SIX = ['ana', 'bo', 'cy', 'di', 'ed', 'fy']

function at(now = START): RulesContext {
  return { now, random: seededRandom('jinx') }
}

/** A game whose first word is known. */
function game(players = SIX, word = 'beach', settings = DEFAULT_SETTINGS): DontJinxItState {
  const state = rules.setup(players, settings, at())
  return { ...state, turns: state.turns.map((turn, i) => (i === 0 ? { ...turn, word } : turn)) }
}

function send(state: DontJinxItState, player: string, input: DontJinxItInput, now = START): DontJinxItState {
  return rules.onInput(state, player, input, at(now))
}

function clue(state: DontJinxItState, player: string, ...words: string[]): DontJinxItState {
  return send(state, player, { type: 'clues', words })
}

/** The sample from the design brief, one clue each: two sands, a towel and towels, and two clean clues. */
function samplePile(): DontJinxItState {
  let state = game()
  state = clue(state, 'bo', 'sand')
  state = clue(state, 'cy', 'sand')
  state = clue(state, 'di', 'towel')
  state = clue(state, 'ed', 'towels')
  return clue(state, 'fy', 'shells')
}

function timeUp(state: DontJinxItState, now = START): DontJinxItState {
  return rules.onTimer(state, at(now))
}

describe('manifest', () => {
  it('offers the paces and defaults the rules use', () => {
    const pace = manifest.settings.find((setting) => setting.id === 'pace')
    expect(pace?.options).toEqual(PACES)
    expect(pace?.default).toBe(DEFAULT_SETTINGS.pace)
    expect(manifest.settings.find((setting) => setting.id === 'longGame')?.default).toBe('off')
  })
})

describe('word packs', () => {
  it('has 200+ distinct mystery words, lowercase letters only, 3 or more letters', () => {
    expect(MYSTERY_WORDS.length).toBeGreaterThanOrEqual(200)
    expect(new Set(MYSTERY_WORDS).size).toBe(MYSTERY_WORDS.length)
    expect(MYSTERY_WORDS.every((word) => /^[a-z]{3,}$/.test(word))).toBe(true)
  })

})

describe('setup', () => {
  it('deals one turn per player, guessers in player order, distinct words', () => {
    const state = rules.setup(SIX, DEFAULT_SETTINGS, at())
    expect(state.turns.map((turn) => turn.guesser)).toEqual(SIX)
    expect(new Set(state.turns.map((turn) => turn.word)).size).toBe(6)
    expect(state.phase).toBe('write')
    expect(currentTurn(state).writeStartedAt).toBe(START)
  })

  it('deals two rounds of guessers in a long game', () => {
    const state = rules.setup(SIX, { ...DEFAULT_SETTINGS, longGame: true }, at())
    expect(state.turns.map((turn) => turn.guesser)).toEqual([...SIX, ...SIX])
  })

  it('keeps the undealt words as spares for skips', () => {
    const state = rules.setup(SIX, DEFAULT_SETTINGS, at())
    const dealt = state.turns.map((turn) => turn.word)
    expect(state.spareWords).toHaveLength(MYSTERY_WORDS.length - 6)
    expect(state.spareWords.some((word) => dealt.includes(word))).toBe(false)
  })

  it('deals the same game from the same random numbers', () => {
    expect(rules.setup(SIX, DEFAULT_SETTINGS, at())).toEqual(rules.setup(SIX, DEFAULT_SETTINGS, at()))
  })

  it('needs at least 3 players', () => {
    expect(() => rules.setup(['ana', 'bo'], DEFAULT_SETTINGS, at())).toThrow(/at least 3/)
  })

  it('gives each writer 2 clues with 3 players, otherwise 1', () => {
    expect(cluesPerWriter(3)).toBe(2)
    expect(cluesPerWriter(4)).toBe(1)
    expect(cluesPerWriter(10)).toBe(1)
  })

  it('times each phase from the pace', () => {
    const state = rules.setup(SIX, { pace: 'quick', longGame: false }, at())
    expect(phaseSeconds(state)).toBe(PACE_SECONDS.quick.write)
    expect(phaseSeconds({ ...state, phase: 'guess' })).toBe(PACE_SECONDS.quick.guess)
    expect(phaseSeconds({ ...state, phase: 'over' })).toBeNull()
  })
})

describe('clueProblems', () => {
  it('checks each clue in the brief order', () => {
    expect(clueProblems([''], 'beach')).toEqual(['empty'])
    expect(clueProblems(['sun-hat'], 'beach')).toEqual(['not-letters'])
    expect(clueProblems(['two words'], 'beach')).toEqual(['not-letters'])
    expect(clueProblems(['Beach'], 'beach')).toEqual(['mystery-word'])
    expect(clueProblems(['beachy'], 'beach')).toEqual(['part-of-word'])
    expect(clueProblems(['each'], 'beach')).toEqual(['part-of-word'])
    expect(clueProblems([' Sand '], 'beach')).toEqual([null])
  })

  it('allows a short piece of the word', () => {
    expect(clueProblems(['be'], 'beach')).toEqual([null])
  })

  it('flags two matching clues on the second one', () => {
    expect(clueProblems(['sand', 'Sand'], 'beach')).toEqual([null, 'clues-match'])
  })
})

describe('writing clues', () => {
  it('takes a clue from a writer, once', () => {
    let state = clue(game(), 'bo', ' Sand ')
    expect(currentTurn(state).clues.bo).toEqual(['sand'])
    state = clue(state, 'bo', 'waves')
    expect(currentTurn(state).clues.bo).toEqual(['sand'])
  })

  it('refuses clues from the guesser, the wrong number of clues, and clues that break a rule', () => {
    const state = game()
    expect(clue(state, 'ana', 'sand')).toBe(state)
    expect(clue(state, 'bo', 'sand', 'waves')).toBe(state)
    expect(clue(state, 'bo', 'beach')).toBe(state)
    expect(clue(state, 'zed', 'sand')).toBe(state)
  })

  it('asks for 2 clues each with 3 players', () => {
    const state = game(['ana', 'bo', 'cy'])
    expect(clue(state, 'bo', 'sand')).toBe(state)
    expect(currentTurn(clue(state, 'bo', 'sand', 'waves')).clues.bo).toEqual(['sand', 'waves'])
  })

  it('opens the pile as soon as every writer is in', () => {
    expect(samplePile().phase).toBe('pile')
  })

  it('opens the pile when writing time runs out, with missing clues left blank', () => {
    const state = timeUp(clue(game(), 'bo', 'sand'))
    expect(state.phase).toBe('pile')
    expect(resolvePile(state, currentTurn(state))).toHaveLength(1)
  })
})

describe('skipping the word', () => {
  it('lets a writer swap the word early, once, clearing clues already sent', () => {
    let state = clue(game(), 'bo', 'sand')
    const spare = state.spareWords[0]
    state = send(state, 'cy', { type: 'skip' }, START + 5000)
    expect(currentTurn(state).word).toBe(spare)
    expect(currentTurn(state).clues).toEqual({})
    expect(state.spareWords).not.toContain(spare)
    expect(send(state, 'di', { type: 'skip' }, START + 6000)).toBe(state)
  })

  it('closes the skip after the first 15 seconds', () => {
    const state = game()
    expect(send(state, 'bo', { type: 'skip' }, START + SKIP_WINDOW_SECONDS * 1000)).toBe(state)
  })

  it('never lets the guesser skip', () => {
    const state = game()
    expect(send(state, 'ana', { type: 'skip' })).toBe(state)
  })
})

describe('close calls', () => {
  it.each([
    ['towel', 'towels'],
    ['box', 'boxes'],
    ['baby', 'babies'],
    ['bake', 'baking'],
    ['run', 'running'],
    ['run', 'ran'],
    ['mouse', 'mice'],
    ['bird', 'birdhouse'],
    ['house', 'birdhouse'],
  ])('%s and %s are a close call', (a, b) => {
    expect(isCloseCall(a, b)).toBe(true)
    expect(isCloseCall(b, a)).toBe(true)
  })

  it.each([
    ['car', 'carpet'],
    ['art', 'party'],
    ['ring', 'string'],
    ['sand', 'waves'],
    ['shell', 'shelf'],
    ['glass', 'grass'],
    ['sand', 'sand'],
  ])('%s and %s are not', (a, b) => {
    expect(isCloseCall(a, b)).toBe(false)
  })
})

describe('the pile', () => {
  it('jinxes exact matches, removes close calls and keeps the rest', () => {
    const state = samplePile()
    expect(resolvePile(state, currentTurn(state))).toEqual([
      { word: 'sand', by: 'bo', fate: 'jinxed', matchedWith: ['cy'] },
      { word: 'sand', by: 'cy', fate: 'jinxed', matchedWith: ['bo'] },
      { word: 'towel', by: 'di', fate: 'close-call', matchedWith: ['ed'] },
      { word: 'towels', by: 'ed', fate: 'close-call', matchedWith: ['di'] },
      { word: 'shells', by: 'fy', fate: 'survived', matchedWith: [] },
    ])
    expect(survivors(state, currentTurn(state))).toEqual(['shells'])
  })

  it('can jinx every clue: a shutout', () => {
    let state = game(['ana', 'bo', 'cy', 'di'])
    state = clue(state, 'bo', 'sand')
    state = clue(state, 'cy', 'sand')
    state = clue(state, 'di', 'sands')
    expect(survivors(state, currentTurn(state))).toEqual([])
  })
})

describe('guessing', () => {
  function guessing(): DontJinxItState {
    return timeUp(samplePile())
  }

  it('moves from the pile to the guess on the timer', () => {
    expect(guessing().phase).toBe('guess')
  })

  it('takes one guess from the guesser only', () => {
    const state = guessing()
    expect(send(state, 'bo', { type: 'guess', word: 'beach' })).toBe(state)
    const guessed = send(state, 'ana', { type: 'guess', word: ' Beach ' })
    expect(guessed.phase).toBe('verdict')
    expect(currentTurn(guessed)).toMatchObject({ guess: 'beach', result: 'correct' })
  })

  it('counts another form of the word as correct', () => {
    expect(currentTurn(send(guessing(), 'ana', { type: 'guess', word: 'beaches' })).result).toBe('correct')
  })

  it('marks a wrong guess as a miss, and a pass or running out of time as a pass', () => {
    expect(currentTurn(send(guessing(), 'ana', { type: 'guess', word: 'ocean' })).result).toBe('miss')
    expect(currentTurn(send(guessing(), 'ana', { type: 'pass' })).result).toBe('pass')
    expect(currentTurn(timeUp(guessing()))).toMatchObject({ guess: null, result: 'pass' })
  })

  it('ignores a guess that is not letters only', () => {
    const state = guessing()
    expect(send(state, 'ana', { type: 'guess', word: 'sun hat' })).toBe(state)
  })

  it('ignores guesses before the guess phase', () => {
    const state = samplePile()
    expect(send(state, 'ana', { type: 'guess', word: 'beach' })).toBe(state)
  })
})

describe('scoring', () => {
  it('gives the guesser 2 and each writer whose clue survived 1 on a correct guess', () => {
    const state = send(timeUp(samplePile()), 'ana', { type: 'guess', word: 'beach' })
    expect(totalScores(state)).toEqual({ ana: 2, bo: 0, cy: 0, di: 0, ed: 0, fy: 1 })
  })

  it('gives a writer 1, not 2, when both of their clues survive', () => {
    let state = game(['ana', 'bo', 'cy'])
    state = clue(state, 'bo', 'sand', 'waves')
    state = clue(state, 'cy', 'ocean', 'shells')
    state = send(timeUp(state), 'ana', { type: 'guess', word: 'beach' })
    expect(totalScores(state)).toEqual({ ana: 2, bo: 1, cy: 1 })
  })

  it('gives nobody anything on a miss or a pass', () => {
    const state = send(timeUp(samplePile()), 'ana', { type: 'pass' })
    expect(Object.values(totalScores(state)).every((points) => points === 0)).toBe(true)
  })
})

describe('turn flow', () => {
  it('runs verdict, reveal, then the next guesser, until every turn is played', () => {
    let state = send(timeUp(samplePile()), 'ana', { type: 'pass' })
    state = timeUp(state)
    expect(state.phase).toBe('reveal')
    state = timeUp(state, START + 90_000)
    expect(state.phase).toBe('write')
    expect(currentTurn(state).guesser).toBe('bo')
    expect(currentTurn(state).writeStartedAt).toBe(START + 90_000)

    for (let i = 1; i < SIX.length; i++) {
      for (let step = 0; step < 5; step++) state = timeUp(state)
    }
    expect(state.phase).toBe('over')
    expect(rules.isOver(state)).toBe(true)
  })

  it('ranks players by points, with ties sharing a place', () => {
    const state = send(timeUp(samplePile()), 'ana', { type: 'guess', word: 'beach' })
    expect(rules.finishingOrder(state)).toEqual([['ana'], ['fy'], ['bo', 'cy', 'di', 'ed']])
  })
})

describe('what each screen may know', () => {
  /** True if the word appears anywhere in the data, so no field can leak it. */
  function contains(data: unknown, word: string): boolean {
    return JSON.stringify(data).includes(`"${word}"`)
  }

  function eachPhaseBeforeReveal(): DontJinxItState[] {
    const write = clue(game(), 'bo', 'sand')
    const pile = samplePile()
    const guess = timeUp(pile)
    const verdict = send(guess, 'ana', { type: 'guess', word: 'ocean' })
    return [write, pile, guess, verdict]
  }

  it("never sends the word, the pile or a writer to the guesser's phone before the reveal", () => {
    for (const state of eachPhaseBeforeReveal()) {
      const view = playerView(state, 'ana', START)
      expect(contains(view, 'beach')).toBe(false)
      expect(contains(view, 'sand')).toBe(false)
      expect(contains(view, 'towel')).toBe(false)
      expect(view.pile).toBeNull()
    }
  })

  it('never puts the word or a jinxed clue on the TV before the reveal', () => {
    for (const state of eachPhaseBeforeReveal()) {
      const view = tvView(state)
      expect(contains(view, 'beach')).toBe(false)
      expect(contains(view, 'sand')).toBe(false)
      expect(contains(view, 'towels')).toBe(false)
    }
  })

  it('keeps survivors face down on the TV until the cards flip at the guess', () => {
    const pile = samplePile()
    expect(contains(tvView(pile), 'shells')).toBe(false)
    expect(tvView(pile).cards?.map((card) => card.fate)).toEqual(['jinxed', 'jinxed', 'close-call', 'close-call', 'survived'])
    expect(tvView(timeUp(pile)).survivors).toEqual(['shells'])
  })

  it("names the writers of jinxed cards on the TV, but never a survivor's writer before the reveal", () => {
    const pile = samplePile()
    expect(tvView(pile).cards?.map((card) => card.by)).toEqual(['bo', 'cy', 'di', 'ed', null])
    expect(tvView(timeUp(pile)).cards?.[4].by).toBeNull()
    const reveal = timeUp(send(timeUp(pile), 'ana', { type: 'pass' }))
    expect(tvView(reveal).cards?.[4].by).toBe('fy')
  })

  it('gives survivors to every screen at the same moment, without writers', () => {
    const pile = samplePile()
    expect(playerView(pile, 'ana', START).survivors).toBeNull()
    expect(playerView(pile, 'bo', START).survivors).toBeNull()
    const guess = timeUp(pile)
    for (const player of SIX) expect(playerView(guess, player, START).survivors).toEqual(['shells'])
  })

  it('shows writers the whole pile, with writers, from the pile on', () => {
    expect(playerView(clue(game(), 'bo', 'sand'), 'cy', START).pile).toBeNull()
    expect(playerView(samplePile(), 'cy', START).pile).toEqual(resolvePile(samplePile(), currentTurn(samplePile())))
  })

  it("keeps each writer's clues to themselves while writing", () => {
    const state = clue(game(), 'bo', 'sand')
    expect(playerView(state, 'bo', START).myClues).toEqual(['sand'])
    expect(contains(playerView(state, 'cy', START), 'sand')).toBe(false)
    expect(contains(tvView(state), 'sand')).toBe(false)
  })

  it('shows everyone everything at the reveal', () => {
    const reveal = timeUp(send(timeUp(samplePile()), 'ana', { type: 'guess', word: 'ocean' }))
    expect(playerView(reveal, 'ana', START).word).toBe('beach')
    expect(playerView(reveal, 'ana', START).pile).toHaveLength(5)
    expect(tvView(reveal).word).toBe('beach')
    expect(tvView(reveal).cards?.map((card) => card.word)).toEqual(['sand', 'sand', 'towel', 'towels', 'shells'])
  })

  it('offers the skip only to writers, early, before it is used', () => {
    const state = game()
    expect(playerView(state, 'bo', START).skip).toBe('open')
    expect(playerView(state, 'ana', START).skip).toBe('closed')
    expect(playerView(state, 'bo', START + SKIP_WINDOW_SECONDS * 1000).skip).toBe('closed')
    expect(playerView(send(state, 'bo', { type: 'skip' }), 'cy', START).skip).toBe('used')
  })
})
