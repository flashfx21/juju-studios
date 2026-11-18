// ABOUTME: Tests for No Filler's room views: no card still in a pile and no vote before the verdict reaches the public state,
// ABOUTME: and each phone gets its own vote back. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { PlayerId, RulesContext } from '../types'
import { privateView, publicState, stateForPhone } from './roomViews'
import { CARDS, DEFAULT_SETTINGS, rules, votersFor, type NoFillerInput, type NoFillerState } from './rules'

const PLAYERS = ['ana', 'bo', 'cy', 'di']
const ctx = (now = 0): RulesContext => ({ now, random: seededRandom('7') })

function play(state: NoFillerState, moves: [PlayerId, NoFillerInput][]): NoFillerState {
  return moves.reduce((next, [player, input]) => rules.onInput(next, player, input, ctx(3000)), state)
}

const start = (): NoFillerState => rules.setup(PLAYERS, DEFAULT_SETTINGS, ctx())

/** The first speaker has picked Medium and tapped Done: the vote is open. */
function voting(): NoFillerState {
  const state = start()
  return play(state, [
    [state.turn.speaker, { type: 'pick', difficulty: 'medium' }],
    [state.turn.speaker, { type: 'done' }],
  ])
}

/** Every card whose id or prompt appears in what the room would store. */
function cardsIn(state: NoFillerState): string[] {
  const text = JSON.stringify(state)
  return CARDS.filter((card) => text.includes(card.id) || text.includes(card.prompt)).map((card) => card.id)
}

describe('public state', () => {
  it('holds no card at all while the speaker is choosing', () => {
    expect(cardsIn(start())).toHaveLength(CARDS.length)
    expect(cardsIn(publicState(start()))).toEqual([])
  })

  it('holds only the card being played once it is up, through the vote and the verdict', () => {
    const open = voting()
    const speaking = play(start(), [[start().turn.speaker, { type: 'pick', difficulty: 'medium' }]])
    const reveal = rules.onTimer(open, ctx())
    for (const state of [speaking, open, reveal]) {
      expect(cardsIn(publicState(state))).toEqual([state.turn.card!.id])
    }
  })

  it('shows who has voted during the vote, never how', () => {
    const open = voting()
    const [a, b] = votersFor(open)
    const state = play(open, [
      [a, { type: 'vote', vote: 'filler' }],
      [b, { type: 'vote', vote: 'clean' }],
    ])
    const shown = publicState(state)
    expect(shown.turn.votes).toEqual({ [a]: 'hidden', [b]: 'hidden' })
    const text = JSON.stringify(shown)
    expect(text).not.toContain('"filler"')
    expect(text).not.toContain('"clean"')
  })

  it('names every vote once the verdict is in', () => {
    const open = voting()
    const state = play(
      open,
      votersFor(open).map((id, i) => [id, { type: 'vote', vote: i === 0 ? 'filler' : 'clean' }]),
    )
    expect(state.phase).toBe('reveal')
    expect(publicState(state).turn.votes).toEqual(state.turn.votes)
    expect(publicState(state).turn.outcome).toBe('clean')
  })
})

describe('private view', () => {
  it('gives a phone its own vote back, and nobody else that vote', () => {
    const open = voting()
    const [a, b] = votersFor(open)
    const state = play(open, [[a, { type: 'vote', vote: 'filler' }]])
    const mine = stateForPhone(publicState(state), privateView(state, a), a)
    expect(mine.turn.votes[a]).toBe('filler')
    expect(privateView(state, b).vote).toBeUndefined()
    expect(stateForPhone(publicState(state), privateView(state, b), b).turn.votes).toEqual({ [a]: 'hidden' })
  })

  it("drops a vote that belongs to another turn's vote", () => {
    const open = voting()
    const [a] = votersFor(open)
    const state = play(open, [[a, { type: 'vote', vote: 'filler' }]])
    const stale = { ...privateView(state, a), turnCount: state.turnCount - 1 }
    expect(stateForPhone(publicState(state), stale, a).turn.votes[a]).toBe('hidden')
  })
})
