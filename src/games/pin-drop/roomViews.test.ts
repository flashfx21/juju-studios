// ABOUTME: Tests for Pin Drop's room views: where a photo is and everyone's pins stay out of the public state until the reveal,
// ABOUTME: rounds to come show nothing, and each phone gets its own pin back. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { privateView, publicState, stateForPhone } from './roomViews'
import { currentRound, DEFAULT_SETTINGS, rules, type PinDropState } from './rules'

const PLAYERS = ['ana', 'bo', 'cy']
const ctx = (): RulesContext => ({ now: 0, random: seededRandom('3') })

function guessing(): PinDropState {
  const start = rules.setup(PLAYERS, DEFAULT_SETTINGS, ctx())
  const pinned = rules.onInput(start, 'ana', { type: 'pin', lat: 10, lng: 20 }, ctx())
  return rules.onInput(pinned, 'bo', { type: 'lock', lat: -5, lng: 40 }, ctx())
}

describe('public state', () => {
  it('hides where the photo is and every pin while guessing, but shows who locked in', () => {
    const state = guessing()
    const shown = currentRound(publicState(state))
    const real = currentRound(state).photo
    expect(shown.photo).toMatchObject({ id: real.id, image: real.image, lat: 0, lng: 0, place: '', country: '', wikidataId: '', filePage: '' })
    expect(shown.pins).toEqual({})
    expect(shown.locked).toEqual(['bo'])
    const text = JSON.stringify(publicState(state))
    for (const round of state.rounds) expect(text).not.toContain(`"place":"${round.photo.place}"`)
  })

  it('shows nothing of the rounds to come', () => {
    const state = guessing()
    const shown = publicState(state)
    for (const round of shown.rounds.slice(1)) expect(round.photo).toMatchObject({ id: '', image: '', place: '', lat: 0, lng: 0 })
    expect(JSON.stringify(shown)).not.toContain(state.rounds[1].photo.image)
  })

  it('shows the whole round once it is revealed, and the whole game once it is over', () => {
    const revealed = rules.onTimer(guessing(), ctx())
    expect(currentRound(publicState(revealed))).toEqual(currentRound(revealed))
    expect(publicState(revealed).rounds[1].photo.place).toBe('')
    const over: PinDropState = { ...revealed, phase: 'over' }
    expect(publicState(over)).toEqual(over)
  })
})

describe('private view', () => {
  it('gives each phone its own pin back while guessing', () => {
    const state = guessing()
    const shared = JSON.parse(JSON.stringify(publicState(state))) as PinDropState
    expect(privateView(state, 'ana')).toEqual({ roundIndex: 0, pin: { lat: 10, lng: 20 } })
    expect(privateView(state, 'cy')).toEqual({ roundIndex: 0 })
    expect(currentRound(stateForPhone(shared, privateView(state, 'ana'), 'ana')).pins).toEqual({ ana: { lat: 10, lng: 20 } })
    expect(stateForPhone(shared, privateView(state, 'cy'), 'cy')).toBe(shared)
  })

  it('drops a pin from another round', () => {
    const state = guessing()
    const next = rules.onTimer(rules.onTimer(rules.onTimer(state, ctx()), ctx()), ctx())
    expect(next.roundIndex).toBe(1)
    const shared = publicState(next)
    expect(stateForPhone(shared, privateView(state, 'ana'), 'ana')).toBe(shared)
  })
})
