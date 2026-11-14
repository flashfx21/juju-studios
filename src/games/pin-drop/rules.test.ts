// ABOUTME: Tests for the Pin Drop rules and wording: dealing the ramp, pins and lock-ins, distances, scoring and finishing order.
// ABOUTME: Run with `npm test`.

import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { creditText, distanceText } from './format'
import { manifest } from './manifest'
import {
  currentRound,
  DEFAULT_SETTINGS,
  DIFFICULTY_RAMP,
  distanceKm,
  NO_PIN_KM,
  PACES,
  PHOTOS,
  ROUND_COUNTS,
  rules,
  SCORINGS,
  totals,
  UNITS,
  wrapLongitude,
  type PinDropSettings,
  type PinDropState,
} from './rules'

const PLAYERS = ['ana', 'bo', 'cy']
const CTX: RulesContext = { now: 0, random: seededRandom('1') }

const PARIS = { lat: 48.8566, lng: 2.3522 }
const LONDON = { lat: 51.5074, lng: -0.1278 }

function newGame(settings: Partial<PinDropSettings> = {}, players = PLAYERS): PinDropState {
  return rules.setup(players, { ...DEFAULT_SETTINGS, ...settings }, { now: 0, random: seededRandom('42') })
}

/** Moves every round's answer to Paris so distances are predictable. */
function answersInParis(state: PinDropState): PinDropState {
  return { ...state, rounds: state.rounds.map((round) => ({ ...round, photo: { ...round.photo, ...PARIS } })) }
}

function pin(state: PinDropState, player: string, lat: number, lng: number): PinDropState {
  return rules.onInput(state, player, { type: 'pin', lat, lng }, CTX)
}

function lock(state: PinDropState, player: string): PinDropState {
  return rules.onInput(state, player, { type: 'lock' }, CTX)
}

/** Plays one round: each listed player pins at the given point; time runs out; reveal and host Next follow. */
function playRound(state: PinDropState, pins: Record<string, { lat: number; lng: number }>): PinDropState {
  let next = state
  for (const [player, point] of Object.entries(pins)) next = pin(next, player, point.lat, point.lng)
  next = rules.onTimer(next, CTX)
  next = rules.onTimer(next, CTX)
  return rules.onTimer(next, CTX)
}

describe('manifest', () => {
  it('offers the same settings and defaults the rules use', () => {
    const setting = (id: string) => manifest.settings.find((s) => s.id === id)
    expect(setting('scoring')?.options).toEqual(SCORINGS)
    expect(setting('pace')?.options).toEqual(PACES)
    expect(setting('rounds')?.options).toEqual(ROUND_COUNTS)
    expect(setting('units')?.options).toEqual(UNITS)
    expect(setting('scoring')?.default).toBe(DEFAULT_SETTINGS.scoring)
    expect(setting('pace')?.default).toBe(DEFAULT_SETTINGS.pace)
    expect(setting('rounds')?.default).toBe(DEFAULT_SETTINGS.rounds)
    expect(setting('units')?.default).toBe(DEFAULT_SETTINGS.units)
    expect(setting('labels')?.default).toBe(DEFAULT_SETTINGS.labels ? 'on' : 'off')
  })
})

describe('photo pack', () => {
  it('has enough photos of each difficulty for the longest game', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const needed = DIFFICULTY_RAMP[9].filter((d) => d === difficulty).length
      expect(PHOTOS.filter((photo) => photo.difficulty === difficulty).length).toBeGreaterThanOrEqual(needed)
    }
  })

  it('gives every photo a unique id, real coordinates, a place, an author and an allowed license', () => {
    expect(new Set(PHOTOS.map((photo) => photo.id)).size).toBe(PHOTOS.length)
    for (const photo of PHOTOS) {
      expect(Math.abs(photo.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(photo.lng)).toBeLessThanOrEqual(180)
      expect(photo.place).not.toBe('')
      expect(photo.country).not.toBe('')
      expect(photo.author).not.toBe('')
      expect(photo.image).toMatch(/^https:\/\//)
      expect(photo.license).toMatch(/^(CC0|Public domain|CC BY(-SA)? [\d.]+)/)
    }
  })
})

describe('setup', () => {
  it('deals one photo per round, easy to hard, with no repeats', () => {
    for (const rounds of ROUND_COUNTS) {
      const state = newGame({ rounds })
      expect(state.rounds.map((round) => round.photo.difficulty)).toEqual(DIFFICULTY_RAMP[rounds])
      expect(new Set(state.rounds.map((round) => round.photo.id)).size).toBe(rounds)
    }
  })

  it('needs at least two players', () => {
    expect(() => newGame({}, ['ana'])).toThrow()
  })

  it('starts the first round with no pins', () => {
    const state = newGame()
    expect(state.phase).toBe('guessing')
    expect(state.roundIndex).toBe(0)
    expect(currentRound(state).pins).toEqual({})
  })
})

describe('pins and lock-ins', () => {
  it('lets a player move their pin until they lock in', () => {
    let state = pin(newGame(), 'ana', 10, 20)
    state = pin(state, 'ana', 30, 40)
    expect(currentRound(state).pins.ana).toEqual({ lat: 30, lng: 40 })
    state = lock(state, 'ana')
    expect(pin(state, 'ana', 0, 0)).toBe(state)
  })

  it('refuses a lock-in with no pin, and pins from outside the game', () => {
    const state = newGame()
    expect(lock(state, 'ana')).toBe(state)
    expect(pin(state, 'zed', 1, 1)).toBe(state)
  })

  it('locks in the pin sent with the lock-in, even when no pin arrived before it', () => {
    let state = pin(newGame(), 'ana', 10, 20)
    state = rules.onInput(state, 'ana', { type: 'lock', lat: 30, lng: 40 }, CTX)
    expect(currentRound(state).pins.ana).toEqual({ lat: 30, lng: 40 })
    expect(currentRound(state).locked).toContain('ana')
    state = rules.onInput(state, 'bo', { type: 'lock', lat: 5, lng: 6 }, CTX)
    expect(currentRound(state).pins.bo).toEqual({ lat: 5, lng: 6 })
    expect(currentRound(state).locked).toContain('bo')
    expect(rules.onInput(state, 'cy', { type: 'lock', lat: 95, lng: 0 }, CTX)).toBe(state)
  })

  it('refuses pins off the map but wraps longitudes past 180', () => {
    const state = newGame()
    expect(pin(state, 'ana', 91, 0)).toBe(state)
    expect(pin(state, 'ana', Number.NaN, 0)).toBe(state)
    expect(currentRound(pin(state, 'ana', 10, 190)).pins.ana).toEqual({ lat: 10, lng: -170 })
  })

  it('reveals early once everyone has locked in', () => {
    let state = newGame()
    for (const player of PLAYERS) state = lock(pin(state, player, 1, 1), player)
    expect(state.phase).toBe('reveal')
  })

  it('counts a pin that was never locked when time runs out', () => {
    let state = answersInParis(newGame())
    state = pin(state, 'ana', LONDON.lat, LONDON.lng)
    state = rules.onTimer(state, CTX)
    expect(state.phase).toBe('reveal')
    expect(currentRound(state).results?.ana.km).toBeCloseTo(distanceKm(LONDON, PARIS))
    expect(currentRound(state).results?.bo).toEqual({ km: null, place: null, points: 0 })
  })
})

describe('round flow', () => {
  it('goes from reveal to standings, then waits for the host Next to start the next round', () => {
    let state = rules.onTimer(newGame(), CTX)
    expect(state.phase).toBe('reveal')
    state = rules.onTimer(state, CTX)
    expect(state.phase).toBe('standings')
    state = rules.onTimer(state, CTX)
    expect(state.phase).toBe('guessing')
    expect(state.roundIndex).toBe(1)
  })

  it('ends after the last round', () => {
    let state = newGame({ rounds: 5 })
    for (let i = 0; i < 5; i++) state = playRound(state, {})
    expect(rules.isOver(state)).toBe(true)
  })
})

describe('distance', () => {
  it('measures Paris to London at about 344 km', () => {
    expect(distanceKm(PARIS, LONDON)).toBeGreaterThan(340)
    expect(distanceKm(PARIS, LONDON)).toBeLessThan(348)
  })

  it('measures the short way around, across the date line', () => {
    expect(distanceKm({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeLessThan(250)
  })

  it('wraps longitudes into -180 to 180', () => {
    expect(wrapLongitude(190)).toBe(-170)
    expect(wrapLongitude(-190)).toBe(170)
    expect(wrapLongitude(45)).toBe(45)
  })

  it('shows whole numbers from 10 up and one decimal below', () => {
    expect(distanceText(1937.6, 'km')).toBe('1,938 km')
    expect(distanceText(3.44, 'km')).toBe('3.4 km')
    expect(distanceText(16.09344, 'mi')).toBe('10 mi')
    expect(distanceText(NO_PIN_KM, 'mi')).toBe('12,450 mi')
  })
})

describe('match play', () => {
  it('gives the closest one point per player and one less per place; no pin gets 0', () => {
    let state = answersInParis(newGame())
    state = pin(state, 'ana', 48.9, 2.4)
    state = pin(state, 'bo', LONDON.lat, LONDON.lng)
    state = rules.onTimer(state, CTX)
    const results = currentRound(state).results!
    expect(results.ana).toMatchObject({ place: 1, points: 3 })
    expect(results.bo).toMatchObject({ place: 2, points: 2 })
    expect(results.cy).toMatchObject({ place: null, points: 0 })
  })

  it('lets equal distances share a place', () => {
    let state = answersInParis(newGame())
    state = pin(state, 'ana', LONDON.lat, LONDON.lng)
    state = pin(state, 'bo', LONDON.lat, LONDON.lng)
    state = pin(state, 'cy', 0, 0)
    const results = currentRound(rules.onTimer(state, CTX)).results!
    expect(results.ana).toMatchObject({ place: 1, points: 3 })
    expect(results.bo).toMatchObject({ place: 1, points: 3 })
    expect(results.cy).toMatchObject({ place: 3, points: 1 })
  })

  it('ranks by points, then by lower total distance', () => {
    let state = answersInParis(newGame({ rounds: 5 }))
    state = playRound(state, { ana: { lat: 48.9, lng: 2.4 }, bo: LONDON, cy: { lat: 0, lng: 0 } })
    state = playRound(state, { bo: { lat: 48.9, lng: 2.4 }, ana: LONDON, cy: { lat: 0, lng: 0 } })
    for (let i = 0; i < 3; i++) state = playRound(state, {})
    expect(totals(state).ana.points).toBe(totals(state).bo.points)
    expect(rules.finishingOrder(state)).toEqual([['ana', 'bo'], ['cy']])
  })

  it('breaks a points tie by total distance', () => {
    let state = answersInParis(newGame({ rounds: 5 }))
    state = playRound(state, { ana: { lat: 48.9, lng: 2.4 }, bo: LONDON })
    state = playRound(state, { bo: { lat: 48.9, lng: 2.4 }, ana: { lat: 49.5, lng: 2.4 } })
    for (let i = 0; i < 3; i++) state = playRound(state, {})
    expect(totals(state).ana.points).toBe(totals(state).bo.points)
    expect(rules.finishingOrder(state)).toEqual([['ana'], ['bo'], ['cy']])
  })
})

describe('stroke play', () => {
  it('ranks by lowest total distance, counting a missing pin as half the earth', () => {
    let state = answersInParis(newGame({ scoring: 'stroke', rounds: 5 }))
    state = playRound(state, { ana: LONDON, bo: LONDON, cy: { lat: 48.9, lng: 2.4 } })
    for (let i = 0; i < 4; i++) state = playRound(state, { ana: LONDON, bo: LONDON, cy: LONDON })
    expect(totals(state).cy.km).toBeLessThan(totals(state).ana.km)
    expect(rules.finishingOrder(state)[0]).toEqual(['cy'])

    let skipped = answersInParis(newGame({ scoring: 'stroke', rounds: 5 }))
    skipped = playRound(skipped, { ana: LONDON, bo: LONDON })
    for (let i = 0; i < 4; i++) skipped = playRound(skipped, { ana: LONDON, bo: LONDON, cy: LONDON })
    expect(totals(skipped).cy.km - totals(skipped).ana.km).toBeCloseTo(NO_PIN_KM - distanceKm(LONDON, PARIS))
  })

  it('breaks a distance tie by more round wins', () => {
    // Due north of Paris, so distance grows exactly with the number of degrees.
    const north = (degrees: number) => ({ lat: PARIS.lat + degrees, lng: PARIS.lng })
    let state = answersInParis(newGame({ scoring: 'stroke', rounds: 5 }, ['ana', 'bo']))
    state = playRound(state, { ana: north(1), bo: north(2) })
    state = playRound(state, { ana: north(1), bo: north(2) })
    state = playRound(state, { ana: north(4), bo: north(2) })
    state = playRound(state, {})
    state = playRound(state, {})
    expect(totals(state).ana.km).toBeCloseTo(totals(state).bo.km, 6)
    expect(totals(state).ana.wins).toBe(2)
    expect(totals(state).bo.wins).toBe(1)
    expect(rules.finishingOrder(state)).toEqual([['ana'], ['bo']])
  })
})

describe('flags', () => {
  it('lets each player flag one photo per game, only on the reveal or standings', () => {
    let state = newGame()
    expect(rules.onInput(state, 'ana', { type: 'flag' }, CTX)).toBe(state)
    state = rules.onTimer(state, CTX)
    state = rules.onInput(state, 'ana', { type: 'flag' }, CTX)
    expect(state.flags.ana).toBe(currentRound(state).photo.id)
    state = rules.onTimer(rules.onTimer(state, CTX), CTX)
    state = rules.onTimer(state, CTX)
    expect(rules.onInput(state, 'ana', { type: 'flag' }, CTX)).toBe(state)
  })
})

describe('credits', () => {
  it('names the author, license and Wikimedia Commons', () => {
    expect(creditText(PHOTOS[0])).toBe(`Photo: ${PHOTOS[0].author} · ${PHOTOS[0].license} · Wikimedia Commons`)
  })

  it('holds back credits that name the place or country', () => {
    const tableMountain = PHOTOS.find((photo) => photo.wikidataId === 'Q213360')
    expect(tableMountain?.creditSpoiler).toBe(true)
    expect(PHOTOS.filter((photo) => photo.creditSpoiler)).toHaveLength(1)
  })
})
