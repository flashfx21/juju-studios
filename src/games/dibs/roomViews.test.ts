// ABOUTME: Tests for Dibs' room views: nothing secret reaches the public state (letter, answers, Taken, notes, votes),
// ABOUTME: and each phone gets its own answer, note and vote back. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { privateView, publicState, stateForPhone } from './roomViews'
import { currentChallenge, currentRound, DEFAULT_SETTINGS, rules, type DibsInput, type DibsState } from './rules'

const PLAYERS = ['ana', 'bo', 'cy']
const ctx = (now = 0): RulesContext => ({ now, random: seededRandom('7') })

function racing(): DibsState {
  const state = rules.onTimer(rules.setup(PLAYERS, DEFAULT_SETTINGS, ctx()), ctx(1000))
  return {
    ...state,
    rounds: state.rounds.map((round, i) => (i === 0 ? { ...round, letter: 'R' } : round)),
  }
}

function play(state: DibsState, moves: [string, DibsInput][]): DibsState {
  return moves.reduce((next, [player, input]) => rules.onInput(next, player, input, ctx(3000)), state)
}

describe('public state', () => {
  it('hides the letter until it drops, and the rounds to come', () => {
    const start = rules.setup(PLAYERS, DEFAULT_SETTINGS, ctx())
    const shown = publicState(start)
    expect(currentRound(shown).letter).toBe('')
    expect(currentRound(shown).category.name).toBe(currentRound(start).category.name)
    expect(shown.rounds[1]).toMatchObject({
      letter: '',
      category: { name: '' },
    })
  })

  it('during the race shows who answered, never what, and no Taken bounces or notes', () => {
    const state = play(racing(), [
      ['ana', { type: 'answer', text: 'Rugrats' }],
      ['bo', { type: 'answer', text: 'Rugrats' }],
      ['cy', { type: 'answer', text: 'Bugs' }],
    ])
    const text = JSON.stringify(publicState(state))
    expect(text).not.toContain('Rugrats')
    expect(text).not.toContain('Bugs')
    expect(currentRound(publicState(state)).claims.map((c) => c.player)).toEqual(['ana'])
  })

  it('hides how people voted until the verdict', () => {
    let state = play(racing(), [
      ['ana', { type: 'answer', text: 'Rugrats' }],
      ['bo', { type: 'answer', text: 'Recess' }],
      ['cy', { type: 'out' }],
    ])
    state = play(state, [
      ['cy', { type: 'challenge', author: 'ana' }],
      ['ana', { type: 'done' }],
      ['bo', { type: 'done' }],
      ['cy', { type: 'done' }],
    ])
    state = play(state, [['bo', { type: 'vote', vote: 'not-valid' }]])
    expect(currentChallenge(publicState(state))?.votes).toEqual({
      bo: 'hidden',
    })
    const bo = stateForPhone(publicState(state), privateView(state, 'bo'), 'bo')
    expect(currentChallenge(bo)?.votes.bo).toBe('not-valid')
  })
})

describe('private view', () => {
  it('gives a phone its own answer and its last bounce, and drops them after Deal again', () => {
    const state = play(racing(), [
      ['ana', { type: 'answer', text: 'Rugrats' }],
      ['bo', { type: 'answer', text: 'Rugrats' }],
    ])
    const ana = stateForPhone(publicState(state), privateView(state, 'ana'), 'ana')
    expect(currentRound(ana).claims[0].text).toBe('Rugrats')
    const bo = stateForPhone(publicState(state), privateView(state, 'bo'), 'bo')
    expect(currentRound(bo).notes).toEqual({
      bo: { kind: 'taken', text: 'Rugrats' },
    })
    const stale = { ...privateView(state, 'bo'), dealtAgain: -1 }
    expect(currentRound(stateForPhone(publicState(state), stale, 'bo')).notes).toEqual({})
  })
})
