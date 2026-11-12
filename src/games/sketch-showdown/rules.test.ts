// ABOUTME: Tests for the Sketch Showdown rules: turn order, the clue pick, drawing, guessing and lockouts, matching,
// ABOUTME: sudden death, finishing order, and that phones and the TV never see what they shouldn't. Run with `npm test`.

import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import { cleanGuess, guessMatches } from './matching'
import {
  CLUES,
  currentRound,
  DEFAULT_SETTINGS,
  guessProblem,
  inkUsed,
  LOCKOUT_MS,
  PACES,
  phaseSeconds,
  playerView,
  regularRoundCount,
  roundWins,
  sketchShowdownRules,
  TURNS,
  tvView,
  type SketchShowdownSettings,
  type SketchShowdownState,
  type Stroke,
} from './rules'

/** A tiny dictionary: just enough real words for the typo rule. */
const WORDS = new Set(['horse', 'house', 'car', 'cars', 'flag'])
const rules = sketchShowdownRules((word) => WORDS.has(word))

const RED = ['ana', 'bo', 'cy']
const BLUE = ['di', 'ed', 'fay']

function at(now: number, seed = '1'): RulesContext {
  return { now, random: seededRandom(seed) }
}

const fixed = (value: number, now = 0): RulesContext => ({ now, random: () => value })

function newGame(settings: Partial<SketchShowdownSettings> = {}, teams = [RED, BLUE]): SketchShowdownState {
  return rules.setup([...teams[0], ...teams[1]], { ...DEFAULT_SETTINGS, ...settings }, at(0, '42'), teams)
}

const line: Stroke = { tool: 'brush', color: 0, size: 'M', points: [[0.1, 0.1], [0.4, 0.5]] }

/** Both drawers pick option 0 and the countdown ends at time 1000, so the race is on. */
function racing(state: SketchShowdownState): SketchShowdownState {
  const [a, b] = currentRound(state).drawers
  let next = rules.onInput(state, a, { type: 'pick', option: 0 }, at(0))
  next = rules.onInput(next, b, { type: 'pick', option: 0 }, at(0))
  return rules.onTimer(next, at(1000))
}

/** A guesser on the given team this round. */
function guesserOn(state: SketchShowdownState, team: 0 | 1): string {
  return state.teams[team].find((player) => player !== currentRound(state).drawers[team])!
}

function send(state: SketchShowdownState, player: string, text: string, now = 2000): SketchShowdownState {
  return rules.onInput(state, player, { type: 'guess', text }, at(now))
}

/** Plays one round to its reveal: the given team guesses right, or nobody does. Then the host taps Next. */
function playRound(state: SketchShowdownState, winner: 0 | 1 | null): SketchShowdownState {
  let next = racing(state)
  if (winner === null) next = rules.onTimer(next, at(5000))
  else next = send(next, guesserOn(next, winner), currentRound(next).clue!.answer)
  expect(next.phase).toBe('reveal')
  return rules.onTimer(next, at(6000))
}

describe('manifest', () => {
  it('offers the same turns and pace the rules use', () => {
    expect(manifest.settings.find((s) => s.id === 'turns')?.options).toEqual(TURNS)
    expect(manifest.settings.find((s) => s.id === 'pace')?.options).toEqual(PACES)
    expect(manifest.settings.find((s) => s.id === 'turns')?.default).toBe(DEFAULT_SETTINGS.turns)
    expect(manifest.settings.find((s) => s.id === 'pace')?.default).toBe(DEFAULT_SETTINGS.pace)
  })
})

describe('clue pack', () => {
  it('has about 243 clues with unique answers, enough for the longest game', () => {
    expect(CLUES.length).toBeGreaterThanOrEqual(240)
    expect(new Set(CLUES.map((clue) => cleanGuess(clue.answer))).size).toBe(CLUES.length)
    expect(CLUES.length).toBeGreaterThanOrEqual((regularRoundCount([RED, [...BLUE, 'gus', 'hal']], 'twice') + 1) * 3)
  })

  it('applies the spec cuts and renames', () => {
    const answers = CLUES.map((clue) => clue.answer)
    expect(answers).not.toContain('yogurt')
    expect(answers).toEqual(expect.arrayContaining(['roller coaster', 'birthday cake', 'alarm clock', 'lightning', 'treasure chest', 'bathtub', 'American flag']))
  })
})

describe('setup', () => {
  it('needs two teams of 2 to 5', () => {
    const players = [...RED, ...BLUE]
    expect(() => rules.setup(players, DEFAULT_SETTINGS, at(0))).toThrow()
    expect(() => rules.setup(players, DEFAULT_SETTINGS, at(0), [RED])).toThrow()
    expect(() => rules.setup(players, DEFAULT_SETTINGS, at(0), [['ana'], ['bo', 'cy', 'di']])).toThrow()
    expect(() => rules.setup(players, DEFAULT_SETTINGS, at(0), [RED, ['a', 'b', 'c', 'd', 'e', 'f']])).toThrow()
  })

  it('plays the bigger team size in rounds, doubled when everyone draws twice', () => {
    expect(newGame().drawOrder[0]).toHaveLength(3)
    expect(newGame({ turns: 'twice' }).drawOrder[0]).toHaveLength(6)
    expect(newGame({}, [['ana', 'bo'], BLUE]).drawOrder[0]).toHaveLength(3)
  })

  it('cycles each team from a random first drawer; the smaller team draws extra in turn', () => {
    const state = rules.setup([], { ...DEFAULT_SETTINGS, turns: 'twice' }, fixed(0.5), [['ana', 'bo'], BLUE])
    expect(state.drawOrder[1]).toEqual(['ed', 'fay', 'di', 'ed', 'fay', 'di'])
    expect(state.drawOrder[0]).toEqual(['bo', 'ana', 'bo', 'ana', 'bo', 'ana'])
  })

  it('starts with both first drawers choosing from 3 options', () => {
    const state = newGame()
    expect(state.phase).toBe('pick')
    expect(currentRound(state).drawers).toEqual([state.drawOrder[0][0], state.drawOrder[1][0]])
    expect(currentRound(state).options).toHaveLength(3)
  })
})

describe('picking the clue', () => {
  function pick(state: SketchShowdownState, choices: (number | null)[], ctx = fixed(0.9)) {
    let next = state
    currentRound(state).drawers.forEach((drawer, i) => {
      if (choices[i] !== null) next = rules.onInput(next, drawer, { type: 'pick', option: choices[i]! }, ctx)
    })
    return next.phase === 'pick' ? rules.onTimer(next, ctx) : next
  }

  it('uses the clue when both pick it, and moves straight to the countdown', () => {
    const state = newGame()
    const next = pick(state, [1, 1])
    expect(next.phase).toBe('countdown')
    expect(currentRound(next).clue).toEqual(currentRound(state).options[1])
    expect(currentRound(next).howChosen).toBe('both')
  })

  it('flips a coin between two different picks', () => {
    const state = newGame()
    expect(currentRound(pick(state, [0, 2], fixed(0.9))).clue).toEqual(currentRound(state).options[2])
    expect(currentRound(pick(state, [0, 2], fixed(0.1))).clue).toEqual(currentRound(state).options[0])
    expect(currentRound(pick(state, [0, 2])).howChosen).toBe('coin')
  })

  it("uses the only pick, or a random option if nobody picked, when the clock runs out", () => {
    const state = newGame()
    const one = pick(state, [null, 2])
    expect(currentRound(one).clue).toEqual(currentRound(state).options[2])
    expect(currentRound(one).howChosen).toBe('one')
    const none = pick(state, [null, null], fixed(0.5))
    expect(currentRound(none).clue).toEqual(currentRound(state).options[1])
    expect(currentRound(none).howChosen).toBe('random')
  })

  it('ignores picks from guessers, second picks and options out of range', () => {
    const state = newGame()
    const [a] = currentRound(state).drawers
    expect(rules.onInput(state, guesserOn(state, 0), { type: 'pick', option: 0 }, at(0))).toBe(state)
    expect(rules.onInput(state, a, { type: 'pick', option: 3 }, at(0))).toBe(state)
    const picked = rules.onInput(state, a, { type: 'pick', option: 0 }, at(0))
    expect(rules.onInput(picked, a, { type: 'pick', option: 1 }, at(0))).toBe(picked)
  })

  it('never shows an option twice in a game', () => {
    let state = newGame({ turns: 'twice' })
    const shown: string[] = []
    while (state.phase !== 'over' && state.phase !== 'vote') {
      shown.push(...currentRound(state).options.map((clue) => clue.answer))
      state = playRound(state, null)
    }
    expect(new Set(shown).size).toBe(shown.length)
  })
})

describe('drawing', () => {
  it('lets only the drawers draw, and only during the race', () => {
    const state = newGame()
    const [a] = currentRound(state).drawers
    expect(rules.onInput(state, a, { type: 'stroke', stroke: line }, at(0))).toBe(state)
    const race = racing(state)
    expect(rules.onInput(race, guesserOn(race, 0), { type: 'stroke', stroke: line }, at(0))).toBe(race)
    const drawn = rules.onInput(race, a, { type: 'stroke', stroke: line }, at(0))
    expect(currentRound(drawn).drawings).toEqual([[line], []])
  })

  it('undoes the last whole stroke and clears the canvas', () => {
    const race = racing(newGame())
    const [a] = currentRound(race).drawers
    const dot: Stroke = { tool: 'brush', color: 3, size: 'XL', points: [[0.5, 0.5]] }
    let state = rules.onInput(race, a, { type: 'stroke', stroke: line }, at(0))
    state = rules.onInput(state, a, { type: 'stroke', stroke: dot }, at(0))
    expect(currentRound(rules.onInput(state, a, { type: 'undo' }, at(0))).drawings[0]).toEqual([line])
    expect(currentRound(rules.onInput(state, a, { type: 'clear' }, at(0))).drawings[0]).toEqual([])
  })

  it('refuses strokes off the canvas or with unknown tools, colors or sizes', () => {
    const race = racing(newGame())
    const [a] = currentRound(race).drawers
    const bad: Stroke[] = [
      { ...line, points: [[1.2, 0.5]] },
      { ...line, points: [] },
      { ...line, color: 16 },
      { ...line, size: 'XXL' as Stroke['size'] },
      { ...line, tool: 'bucket' as Stroke['tool'] },
    ]
    for (const stroke of bad) expect(rules.onInput(race, a, { type: 'stroke', stroke }, at(0))).toBe(race)
  })

  it('measures ink by stroke length and ignores the eraser', () => {
    expect(inkUsed([line])).toBeCloseTo(0.5)
    expect(inkUsed([{ ...line, tool: 'eraser' }])).toBe(0)
  })
})

describe('guessing', () => {
  it('locks a player out for 2 seconds after a wrong guess', () => {
    const race = racing(newGame())
    const player = guesserOn(race, 0)
    const state = send(race, player, 'banana', 2000)
    expect(currentRound(state).guesses[0]).toEqual([{ player, text: 'banana', at: 2000 }])
    expect(guessProblem(state, player, 'apple', 2000 + LOCKOUT_MS - 1)).toBe('locked-out')
    expect(send(state, player, 'apple', 2000 + LOCKOUT_MS - 1)).toBe(state)
    expect(guessProblem(state, player, 'apple', 2000 + LOCKOUT_MS)).toBeNull()
  })

  it("refuses a guess a teammate already sent, with no lockout, but not the other team's", () => {
    let state = racing(newGame())
    const [first, second] = state.teams[0].filter((p) => p !== currentRound(state).drawers[0])
    state = send(state, first, 'Banana!')
    expect(guessProblem(state, second, 'banana', 2000)).toBe('already-guessed')
    expect(send(state, second, 'banana')).toBe(state)
    expect(currentRound(state).lockedUntil[second]).toBeUndefined()
    expect(guessProblem(state, guesserOn(state, 1), 'banana', 2000)).toBeNull()
  })

  it("doesn't let drawers guess, or anyone guess outside the race", () => {
    const state = newGame()
    expect(guessProblem(state, guesserOn(state, 0), 'x', 0)).toBe('not-guessing')
    const race = racing(state)
    expect(guessProblem(race, currentRound(race).drawers[0], 'x', 2000)).toBe('not-guessing')
    expect(guessProblem(race, guesserOn(race, 0), '  ', 2000)).toBe('empty')
  })

  it('ends the round on the first correct guess and freezes both canvases', () => {
    let state = racing(newGame())
    const [a, b] = currentRound(state).drawers
    state = rules.onInput(state, b, { type: 'stroke', stroke: line }, at(0))
    const winner = guesserOn(state, 1)
    state = send(state, winner, currentRound(state).clue!.answer, 4200)
    expect(state.phase).toBe('reveal')
    expect(currentRound(state).winner).toBe(1)
    expect(currentRound(state).winningGuess).toMatchObject({ player: winner, at: 4200 })
    expect(rules.onInput(state, a, { type: 'stroke', stroke: line }, at(0))).toBe(state)
    expect(send(state, guesserOn(state, 0), currentRound(state).clue!.answer)).toBe(state)
  })

  it('reveals with no winner when time runs out', () => {
    const state = rules.onTimer(racing(newGame()), at(5000))
    expect(state.phase).toBe('reveal')
    expect(currentRound(state).winner).toBeNull()
  })

  it('times each phase from the settings; the reveal waits for the host', () => {
    const state = newGame({ pace: 'quick' })
    expect(phaseSeconds(state)).toBe(15)
    expect(phaseSeconds(racing(state))).toBe(90)
    expect(phaseSeconds(rules.onTimer(racing(state), at(0)))).toBeNull()
  })
})

describe('matching guesses', () => {
  const isWord = (word: string) => WORDS.has(word)
  const clue = (answer: string, alternates?: string[]) => ({ answer, alternates })

  it.each([
    ['The Race-Car!', clue('race car')],
    ['racecar', clue('race car')],
    ['a cheeseburger', clue('cheeseburger', ['burger'])],
    ['burger', clue('cheeseburger', ['burger'])],
    ['cars', clue('car')],
    ['lighthous', clue('lighthouse')],
    ['Fire Engine', clue('fire truck', ['fire engine'])],
  ])('accepts %s', (text, c) => {
    expect(guessMatches(text, c, isWord)).toBe(true)
  })

  it.each([
    ['horse', clue('house')],
    ['flag', clue('American flag', ['US flag'])],
    ['house', clue('lighthouse')],
    ['ca', clue('car')],
    ['', clue('car')],
  ])('refuses %s', (text, c) => {
    expect(guessMatches(text, c, isWord)).toBe(false)
  })

  it('forgives typos only on answers of 5 or more letters', () => {
    expect(guessMatches('bok', clue('box'), isWord)).toBe(false)
    expect(guessMatches('tabel', clue('table'), isWord)).toBe(false)
    expect(guessMatches('tablr', clue('table'), isWord)).toBe(true)
  })
})

describe('ending', () => {
  it('ends after the regular rounds when one team has more round wins', () => {
    let state = newGame()
    state = playRound(state, 0)
    state = playRound(state, 0)
    state = playRound(state, 1)
    expect(state.phase).toBe('over')
    expect(roundWins(state)).toEqual([2, 1])
    expect(rules.finishingOrder(state)).toEqual([RED, BLUE])
  })

  it('goes to a sudden-death vote when level, and the most-voted player draws', () => {
    let state = newGame()
    state = playRound(state, 0)
    state = playRound(state, 1)
    state = playRound(state, null)
    expect(state.phase).toBe('vote')
    state = rules.onInput(state, 'ana', { type: 'vote', nominee: 'cy' }, at(0))
    state = rules.onInput(state, 'bo', { type: 'vote', nominee: 'cy' }, at(0))
    state = rules.onInput(state, 'cy', { type: 'vote', nominee: 'ana' }, at(0))
    expect(rules.onInput(state, 'ana', { type: 'vote', nominee: 'di' }, at(0)).votes.ana).toBe('cy')
    state = rules.onTimer(state, at(0))
    expect(state.phase).toBe('pick')
    expect(currentRound(state).suddenDeath).toBe(true)
    expect(currentRound(state).drawers[0]).toBe('cy')
    expect(BLUE).toContain(currentRound(state).drawers[1])
  })

  it('ends after sudden death, tied if nobody guessed it', () => {
    let state = newGame()
    for (const winner of [0, 1, null] as const) state = playRound(state, winner)
    state = rules.onTimer(state, at(0))
    const tied = playRound(state, null)
    expect(tied.phase).toBe('over')
    expect(rules.finishingOrder(tied)).toEqual([[...RED, ...BLUE]])
    const won = playRound(state, 1)
    expect(rules.finishingOrder(won)).toEqual([BLUE, RED])
  })

  it('ranks a game the host ended early by round wins, level is a tie', () => {
    let state = newGame()
    expect(rules.finishingOrder(state)).toEqual([[...RED, ...BLUE]])
    state = playRound(state, 1)
    expect(rules.finishingOrder(state)).toEqual([BLUE, RED])
  })
})

describe('what each screen can see', () => {
  function midRace() {
    let state = racing(newGame())
    const [a, b] = currentRound(state).drawers
    state = rules.onInput(state, a, { type: 'stroke', stroke: line }, at(0))
    state = rules.onInput(state, b, { type: 'stroke', stroke: { ...line, color: 5 } }, at(0))
    state = send(state, guesserOn(state, 0), 'redsecret')
    state = send(state, guesserOn(state, 1), 'bluesecret')
    return state
  }

  it("never shows a guesser the clue, the other team's sketch or its guesses during the race", () => {
    const state = midRace()
    const view = playerView(state, guesserOn(state, 0))
    const text = JSON.stringify(view)
    expect(view.role).toBe('guesser')
    expect(view.clue).toBeNull()
    expect(view.options).toBeNull()
    expect(view.drawings[1]).toBeNull()
    expect(view.guesses[1]).toBeNull()
    expect(text).not.toContain(currentRound(state).clue!.answer)
    expect(text).not.toContain('bluesecret')
    expect(text).toContain('redsecret')
  })

  it('shows only the drawers the options, and the clue from the countdown on', () => {
    const state = newGame()
    const [a] = currentRound(state).drawers
    expect(playerView(state, a).options).toHaveLength(3)
    expect(playerView(state, guesserOn(state, 0)).options).toBeNull()
    expect(playerView(state, a).clue).toBeNull()
    expect(playerView(midRace(), currentRound(midRace()).drawers[0]).clue).not.toBeNull()
  })

  it('keeps strokes, guess text and the clue off the TV until the reveal', () => {
    const state = midRace()
    const tv = tvView(state)
    const text = JSON.stringify(tv)
    expect(tv.reveal).toBeNull()
    expect(text).not.toContain(currentRound(state).clue!.answer)
    expect(text).not.toContain('secret')
    expect(text).not.toContain('0.4')
    expect(tv.ink[0]).toBeGreaterThan(0)
    expect(tv.wrongGuessCounts).toEqual([1, 1])
  })

  it('shows everyone both drawings and the answer at the reveal, and the TV a gallery at the end', () => {
    const state = rules.onTimer(midRace(), at(9000))
    const view = playerView(state, guesserOn(state, 0))
    expect(view.drawings[0]).not.toBeNull()
    expect(view.drawings[1]).not.toBeNull()
    expect(view.guesses[1]).not.toBeNull()
    expect(view.clue).not.toBeNull()
    expect(tvView(state).reveal?.clue).toEqual(currentRound(state).clue)
    let over = rules.onTimer(state, at(0))
    over = playRound(playRound(over, 0), 0)
    expect(tvView(over).gallery).toHaveLength(3)
  })
})
