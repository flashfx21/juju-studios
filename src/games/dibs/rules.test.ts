// ABOUTME: Tests for the Dibs rules: dealing, the race (Taken, wrong letter, I'm out, claim times), Deal again,
// ABOUTME: challenges and votes (ties keep the answer, 2-player votes), points, totals and the finishing order. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { manifest } from './manifest'
import {
  CATEGORIES,
  CATEGORY_CHOICES,
  currentChallenge,
  currentRound,
  DEFAULT_SETTINGS,
  LETTERS,
  nearDuplicateOf,
  PACES,
  ROUND_COUNTS,
  rules,
  totals,
  canDealAgain,
  dealAgain,
  type DibsInput,
  type DibsState,
} from './rules'

const PLAYERS = ['ana', 'bo', 'cy', 'di']
const ctx = (now = 0, seed = '1'): RulesContext => ({
  now,
  random: seededRandom(seed),
})

function newGame(players = PLAYERS, settings = DEFAULT_SETTINGS): DibsState {
  return rules.setup(players, settings, ctx(0, '42'))
}

/** A game in its race at 1000 ms, with the letter set to R. */
function racing(players = PLAYERS): DibsState {
  const state = rules.onTimer(newGame(players), ctx(1000))
  return {
    ...state,
    rounds: state.rounds.map((round, i) => (i === 0 ? { ...round, letter: 'R' } : round)),
  }
}

function play(state: DibsState, moves: [string, DibsInput, number?][]): DibsState {
  return moves.reduce((next, [player, input, now]) => rules.onInput(next, player, input, ctx(now ?? 0)), state)
}

/** Everyone answers (or is out) in this order; the race ends and review starts. */
function raced(answers: Record<string, string | null>, players = PLAYERS): DibsState {
  let state = racing(players)
  let now = 2000
  for (const [player, text] of Object.entries(answers)) {
    state = rules.onInput(state, player, text === null ? { type: 'out' } : { type: 'answer', text }, ctx(now))
    now += 1000
  }
  return state
}

describe('manifest', () => {
  it('offers the settings the rules use', () => {
    const setting = (id: string) => manifest.settings.find((s) => s.id === id)
    expect(setting('pace')?.options).toEqual(PACES)
    expect(setting('rounds')?.options).toEqual(ROUND_COUNTS)
    expect(setting('categories')?.options).toEqual(CATEGORY_CHOICES)
    expect(setting('rounds')?.default).toBe(DEFAULT_SETTINGS.rounds)
    expect(setting('categories')?.default).toBe(DEFAULT_SETTINGS.categories)
  })
})

describe('the pack and letters', () => {
  it('has unique ids and a tag on every category', () => {
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(CATEGORIES.length)
    for (const c of CATEGORIES) expect(['family', 'adult']).toContain(c.tag)
  })

  it('deals from 20 letters without Q, U, V, X, Y or Z', () => {
    expect(LETTERS).toHaveLength(20)
    for (const hard of 'QUVXYZ') expect(LETTERS).not.toContain(hard)
  })
})

describe('setup', () => {
  it('deals one category and a different letter per round', () => {
    const state = newGame(PLAYERS, { ...DEFAULT_SETTINGS, rounds: 9 })
    expect(state.rounds).toHaveLength(9)
    expect(new Set(state.rounds.map((r) => r.letter)).size).toBe(9)
    expect(new Set(state.rounds.map((r) => r.category.id)).size).toBe(9)
    expect(state.phase).toBe('category')
  })

  it('keeps adult categories out of Family only', () => {
    const state = newGame(PLAYERS, { ...DEFAULT_SETTINGS, rounds: 9 })
    expect(state.rounds.every((r) => r.category.tag === 'family')).toBe(true)
  })

  it('needs 2 players', () => {
    expect(() => newGame(['ana'])).toThrow()
    expect(newGame(['ana', 'bo']).players).toHaveLength(2)
  })
})

describe('the race', () => {
  it('starts when the category has shown, with the claim time counted from the letter drop', () => {
    const state = play(racing(), [['ana', { type: 'answer', text: 'Rugrats' }, 5200]])
    expect(currentRound(state).claims).toEqual([{ player: 'ana', text: 'Rugrats', at: 4200 }])
  })

  it('says Taken, privately, for an answer already claimed, and keeps the try for the reveal', () => {
    const state = play(racing(), [
      ['ana', { type: 'answer', text: 'Rugrats' }, 5000],
      ['bo', { type: 'answer', text: 'the rugrats!' }, 8000],
    ])
    const round = currentRound(state)
    expect(round.claims).toHaveLength(1)
    expect(round.notes.bo).toEqual({ kind: 'taken', text: 'the rugrats!' })
    expect(round.bounces).toEqual([{ player: 'bo', text: 'the rugrats!', owner: 'ana', at: 7000 }])
    const after = play(state, [['bo', { type: 'answer', text: 'Recess' }, 9000]])
    expect(currentRound(after).claims.map((c) => c.player)).toEqual(['ana', 'bo'])
    expect(currentRound(after).notes.bo).toBeUndefined()
  })

  it('bounces a wrong first letter, skipping a leading article', () => {
    const state = play(racing(), [
      ['ana', { type: 'answer', text: 'Bugs Bunny' }],
      ['bo', { type: 'answer', text: 'The Road Runner Show' }],
    ])
    expect(currentRound(state).notes.ana).toEqual({
      kind: 'wrong-letter',
      text: 'Bugs Bunny',
    })
    expect(currentRound(state).claims.map((c) => c.player)).toEqual(['bo'])
  })

  it('takes one answer per player: a second answer after a claim is ignored', () => {
    const state = play(racing(), [
      ['ana', { type: 'answer', text: 'Rugrats' }],
      ['ana', { type: 'answer', text: 'Recess' }],
    ])
    expect(currentRound(state).claims).toHaveLength(1)
  })

  it('ends when everyone has answered or is out, then goes to review', () => {
    const state = raced({
      ana: 'Rugrats',
      bo: 'Recess',
      cy: null,
      di: 'Robin Hood',
    })
    expect(state.phase).toBe('review')
  })

  it("skips review when nobody answered, and time's up ends the race", () => {
    expect(rules.onTimer(racing(), ctx()).phase).toBe('scores')
  })
})

describe('Deal again', () => {
  it('deals an unused letter and restarts the clock, until the first claim', () => {
    const state = play(racing(), [['ana', { type: 'answer', text: 'Bugs Bunny' }]])
    expect(canDealAgain(state)).toBe(true)
    const again = dealAgain(state, ctx(9000))
    const round = currentRound(again)
    expect(round.letter).not.toBe('R')
    expect(again.rounds.filter((r) => r.letter === round.letter)).toHaveLength(1)
    expect(round).toMatchObject({ dealtAgain: 1, startedAt: 9000, notes: {} })
    expect(again.retired).toEqual(['R'])
    const claimed = play(racing(), [['ana', { type: 'answer', text: 'Rugrats' }]])
    expect(canDealAgain(claimed)).toBe(false)
  })
})

describe('challenges and votes', () => {
  const reviewing = () => raced({ ana: 'Rugrats', bo: 'Recess', cy: 'Rugrat', di: 'Robin Hood' })

  it('flags a near duplicate of an earlier claim', () => {
    const round = currentRound(reviewing())
    expect(nearDuplicateOf(round, round.claims[2])?.player).toBe('ana')
    expect(nearDuplicateOf(round, round.claims[0])).toBeUndefined()
  })

  it('allows 1 challenge each, never on your own answer, and merges challenges on one answer', () => {
    const state = play(reviewing(), [
      ['ana', { type: 'challenge', author: 'ana' }],
      ['ana', { type: 'challenge', author: 'cy' }],
      ['ana', { type: 'challenge', author: 'di' }],
      ['bo', { type: 'challenge', author: 'cy' }],
    ])
    expect(currentRound(state).challenges).toEqual([{ author: 'cy', challengers: ['ana', 'bo'], votes: {}, outcome: null }])
    const withdrawn = play(state, [['ana', { type: 'withdraw' }]])
    expect(currentRound(withdrawn).challenges[0].challengers).toEqual(['bo'])
  })

  it('votes in claim order once everyone is done; everyone but the author votes', () => {
    let state = play(reviewing(), [
      ['bo', { type: 'challenge', author: 'di' }],
      ['di', { type: 'challenge', author: 'cy' }],
    ])
    state = play(
      state,
      PLAYERS.map((p) => [p, { type: 'done' }] as [string, DibsInput]),
    )
    expect(state.phase).toBe('vote')
    expect(currentChallenge(state)?.author).toBe('cy')
    state = play(state, [
      ['cy', { type: 'vote', vote: 'valid' }],
      ['ana', { type: 'vote', vote: 'not-valid' }],
      ['bo', { type: 'vote', vote: 'not-valid' }],
      ['di', { type: 'vote', vote: 'not-valid' }],
    ])
    expect(state.phase).toBe('verdict')
    expect(currentChallenge(state)).toMatchObject({ outcome: 'not-valid' })
    expect(currentChallenge(state)?.votes.cy).toBeUndefined()
    state = rules.onTimer(state, ctx())
    expect(currentChallenge(state)?.author).toBe('di')
    // A tie keeps the answer.
    state = play(state, [
      ['ana', { type: 'vote', vote: 'valid' }],
      ['bo', { type: 'vote', vote: 'not-valid' }],
    ])
    state = rules.onTimer(rules.onTimer(state, ctx()), ctx())
    expect(state.phase).toBe('scores')
    const results = currentRound(state).results!
    expect(results.cy).toMatchObject({ valid: false, points: 0 })
    expect(results.di).toMatchObject({ valid: true, speedRank: 3, points: 3 })
    expect(results.bo).toMatchObject({ speedRank: 2, points: 4, penalty: 1 })
    expect(results.ana).toMatchObject({ speedRank: 1, points: 5, penalty: 0 })
  })

  it('with 2 players, the author votes too, so a challenge needs both to agree', () => {
    let state = raced({ ana: 'Rugrats', bo: 'Recess' }, ['ana', 'bo'])
    state = play(state, [
      ['ana', { type: 'challenge', author: 'bo' }],
      ['ana', { type: 'done' }],
      ['bo', { type: 'done' }],
      ['ana', { type: 'vote', vote: 'not-valid' }],
      ['bo', { type: 'vote', vote: 'valid' }],
    ])
    expect(currentChallenge(state)?.outcome).toBe('valid')
  })
})

describe('points and the finish', () => {
  it('pays 5, 4, 3, then 2 for every other good answer, 0 for none', () => {
    const state = rules.onTimer(
      raced({
        ana: 'Rugrats',
        bo: 'Recess',
        cy: 'Ren and Stimpy',
        di: 'Road Runner',
      }),
      ctx(),
    )
    const results = currentRound(state).results!
    expect(PLAYERS.map((p) => results[p].points)).toEqual([5, 4, 3, 2])
    const none = rules.onTimer(raced({ ana: 'Rugrats', bo: null, cy: null, di: null }), ctx())
    expect(currentRound(none).results!.bo.points).toBe(0)
  })

  it('never lets a total drop below 0', () => {
    let state = raced({ ana: 'Rugrats', bo: null, cy: null, di: null })
    state = play(state, [['bo', { type: 'challenge', author: 'ana' }]])
    state = rules.onTimer(rules.onTimer(rules.onTimer(state, ctx()), ctx()), ctx())
    expect(currentRound(state).results!.bo.penalty).toBe(1)
    expect(totals(state).bo.points).toBe(0)
  })

  it('moves to the next round, then ends; ties go to round wins, then share a place', () => {
    let state = rules.onTimer(raced({ ana: 'Rugrats', bo: 'Recess', cy: 'Robin Hood', di: 'Ren' }), ctx())
    state = rules.onTimer(state, ctx())
    expect(state).toMatchObject({ roundIndex: 1, phase: 'category' })
    state = { ...state, phase: 'over' }
    expect(rules.isOver(state)).toBe(true)
    expect(rules.finishingOrder(state)).toEqual([['ana'], ['bo'], ['cy'], ['di']])
    const tied = rules.onTimer(raced({ ana: null, bo: null, cy: null, di: null }), ctx())
    expect(rules.finishingOrder({ ...tied, phase: 'over' })).toEqual([PLAYERS])
  })
})
