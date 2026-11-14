// ABOUTME: Pin Drop rules: each round shows a photo, players drop a pin on a world map, and the closest pin wins.
// ABOUTME: Pure logic, no screens: dealing the easy-to-hard ramp, pins and lock-ins, distances, match and stroke play.

import photoPack from '../../../packs/pin-drop/around-the-world.json'
import type { FinishingOrder, GameRules, PlayerId } from '../types'
import { manifest } from './manifest'

export type Difficulty = 'easy' | 'medium' | 'hard'

/** One photo in a pack. The answer is the place's coordinates on Wikidata, never the camera's location. */
export interface Photo {
  id: string
  wikidataId: string
  /** A TV-sized copy of the photo. */
  image: string
  /** The photo's Wikimedia Commons file page, for the credits page. */
  filePage: string
  lat: number
  lng: number
  place: string
  country: string
  /** Number of Wikipedia articles about the place; sets the difficulty. */
  fame: number
  difficulty: Difficulty
  author: string
  license: string
  licenseUrl: string
  /** The author's name gives the place or country away, so the credit waits until the reveal. */
  creditSpoiler: boolean
}

export const PHOTOS: Photo[] = photoPack.photos as Photo[]

export type Scoring = 'match' | 'stroke'
export type Pace = 45 | 60 | 90
export type RoundCount = 5 | 7 | 9
export type Units = 'mi' | 'km'

export const SCORINGS: readonly Scoring[] = ['match', 'stroke']
export const PACES: readonly Pace[] = [45, 60, 90]
export const ROUND_COUNTS: readonly RoundCount[] = [5, 7, 9]
export const UNITS: readonly Units[] = ['mi', 'km']

export interface PinDropSettings {
  scoring: Scoring
  /** Seconds per round. */
  pace: Pace
  rounds: RoundCount
  units: Units
  /** Off hides place names on the map but keeps borders. */
  labels: boolean
}

export const DEFAULT_SETTINGS: PinDropSettings = { scoring: 'match', pace: 60, rounds: 7, units: 'mi', labels: true }

/** Every game ramps from easy to hard. */
export const DIFFICULTY_RAMP: Record<RoundCount, Difficulty[]> = {
  5: ['easy', 'easy', 'medium', 'medium', 'hard'],
  7: ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard'],
  9: ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard'],
}

/** Seconds left when the TV starts its countdown. */
export const COUNTDOWN_SECONDS = 10

/** About half the earth's circumference: the distance a missing pin counts as in stroke play. */
export const NO_PIN_KM = 20037

const EARTH_RADIUS_KM = 6371.0088

export interface Pin {
  lat: number
  lng: number
}

export interface RoundResult {
  /** Null when the player had no pin. */
  km: number | null
  /** 1 is closest. Equal distances share a place. Null when the player had no pin. */
  place: number | null
  /** Match play points: closest gets one per player, then one less per place; no pin gets 0. */
  points: number
}

export interface Round {
  photo: Photo
  pins: Record<PlayerId, Pin>
  /** Players whose pin is final this round. */
  locked: PlayerId[]
  /** Filled in when the round is revealed. */
  results: Record<PlayerId, RoundResult> | null
}

/** guessing: pins go down. reveal: pins drop on the map. standings: waits for the host's Next. over: last round done. */
export type Phase = 'guessing' | 'reveal' | 'standings' | 'over'

export interface PinDropState {
  players: readonly PlayerId[]
  settings: PinDropSettings
  rounds: Round[]
  roundIndex: number
  phase: Phase
  /** The photo each player flagged. One flag per player per game. */
  flags: Record<PlayerId, string>
}

/** A lock-in can carry the pin, so it counts even if the phone's last pin move hasn't reached the host. */
export type PinDropInput = { type: 'pin'; lat: number; lng: number } | { type: 'lock'; lat?: number; lng?: number } | { type: 'flag' }

/** Straight-line distance over the curve of the earth, in kilometers. */
export function distanceKm(a: Pin, b: Pin): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** A map that wraps around the world can report longitudes past 180; bring them back to -180 to 180. */
export function wrapLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180
}

export function currentRound(state: PinDropState): Round {
  return state.rounds[state.roundIndex]
}

export interface Totals {
  points: number
  /** Missing pins count as NO_PIN_KM. */
  km: number
  /** Rounds where the player was closest, ties included. */
  wins: number
}

/** Running totals across every revealed round. */
export function totals(state: PinDropState): Record<PlayerId, Totals> {
  const byPlayer: Record<PlayerId, Totals> = {}
  for (const player of state.players) byPlayer[player] = { points: 0, km: 0, wins: 0 }
  for (const round of state.rounds) {
    if (!round.results) continue
    for (const [player, result] of Object.entries(round.results)) {
      byPlayer[player].points += result.points
      byPlayer[player].km += result.km ?? NO_PIN_KM
      if (result.place === 1) byPlayer[player].wins += 1
    }
  }
  return byPlayer
}

/** One photo per round, following the ramp, never repeating. */
function dealPhotos(roundCount: RoundCount, random: () => number): Photo[] {
  const ramp = DIFFICULTY_RAMP[roundCount]
  const piles: Record<Difficulty, Photo[]> = {
    easy: shuffled(PHOTOS.filter((photo) => photo.difficulty === 'easy'), random),
    medium: shuffled(PHOTOS.filter((photo) => photo.difficulty === 'medium'), random),
    hard: shuffled(PHOTOS.filter((photo) => photo.difficulty === 'hard'), random),
  }
  return ramp.map((difficulty) => {
    const photo = piles[difficulty].pop()
    if (!photo) throw new Error(`The photo pack has too few ${difficulty} photos for ${roundCount} rounds.`)
    return photo
  })
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function isValidPin(input: { lat?: unknown; lng?: unknown }): boolean {
  const { lat, lng } = input
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90
}

function withCurrentRound(state: PinDropState, change: Partial<Round>): PinDropState {
  const rounds = state.rounds.map((round, i) => (i === state.roundIndex ? { ...round, ...change } : round))
  return { ...state, rounds }
}

/** Places and match points for one round. A pin counts whether or not it was locked. */
export function scoreRound(players: readonly PlayerId[], round: Round): Record<PlayerId, RoundResult> {
  const answer = { lat: round.photo.lat, lng: round.photo.lng }
  const distances = players
    .filter((player) => round.pins[player])
    .map((player) => ({ player, km: distanceKm(round.pins[player], answer) }))
    .sort((a, b) => a.km - b.km)

  const results: Record<PlayerId, RoundResult> = {}
  for (const player of players) results[player] = { km: null, place: null, points: 0 }
  distances.forEach(({ player, km }, i) => {
    const place = i > 0 && km === distances[i - 1].km ? results[distances[i - 1].player].place! : i + 1
    results[player] = { km, place, points: players.length - place + 1 }
  })
  return results
}

function revealRound(state: PinDropState): PinDropState {
  return { ...withCurrentRound(state, { results: scoreRound(state.players, currentRound(state)) }), phase: 'reveal' }
}

function startNextRound(state: PinDropState): PinDropState {
  const nextIndex = state.roundIndex + 1
  if (nextIndex >= state.rounds.length) return { ...state, phase: 'over' }
  return { ...state, roundIndex: nextIndex, phase: 'guessing' }
}

/** Sorts players into places by the given keys; players equal on every key share a place. */
function placesBy(players: readonly PlayerId[], keys: ((player: PlayerId) => number)[]): FinishingOrder {
  const compare = (a: PlayerId, b: PlayerId) => {
    for (const key of keys) {
      const difference = key(a) - key(b)
      if (difference !== 0) return difference
    }
    return 0
  }
  const sorted = [...players].sort(compare)
  const places: FinishingOrder = []
  for (const player of sorted) {
    const last = places[places.length - 1]
    if (last && compare(last[0], player) === 0) last.push(player)
    else places.push([player])
  }
  return places
}

export const rules: GameRules<PinDropState, PinDropSettings, PinDropInput> = {
  setup(players, settings, ctx) {
    if (players.length < manifest.players.min) {
      throw new Error(`Pin Drop needs at least ${manifest.players.min} players.`)
    }
    const rounds = dealPhotos(settings.rounds, ctx.random).map((photo) => ({
      photo,
      pins: {},
      locked: [],
      results: null,
    }))
    return { players, settings, rounds, roundIndex: 0, phase: 'guessing', flags: {} }
  },

  /**
   * pin: place or move your pin until you lock in. lock: your pin (or the one sent with it) is final; when everyone has locked in
   * the round reveals early. flag: during the reveal or standings, flag this round's photo, once per game.
   */
  onInput(state, player, input) {
    if (!state.players.includes(player)) return state
    const round = currentRound(state)

    if (input.type === 'flag') {
      if (state.phase !== 'reveal' && state.phase !== 'standings') return state
      if (player in state.flags) return state
      return { ...state, flags: { ...state.flags, [player]: round.photo.id } }
    }

    if (state.phase !== 'guessing' || round.locked.includes(player)) return state

    if (input.type === 'pin') {
      if (!isValidPin(input)) return state
      return withCurrentRound(state, { pins: { ...round.pins, [player]: { lat: input.lat, lng: wrapLongitude(input.lng) } } })
    }

    if (input.type === 'lock') {
      const sentPin = input.lat !== undefined || input.lng !== undefined
      if (sentPin && !isValidPin(input)) return state
      const pins = sentPin ? { ...round.pins, [player]: { lat: input.lat!, lng: wrapLongitude(input.lng!) } } : round.pins
      if (!pins[player]) return state
      const locked = [...round.locked, player]
      const updated = withCurrentRound(state, { pins, locked })
      return state.players.every((p) => locked.includes(p)) ? revealRound(updated) : updated
    }

    return state
  },

  /**
   * Guessing time up: reveal. Reveal finished playing: standings. Standings has no timer;
   * the host's Next round calls this to start the next round or end the game.
   */
  onTimer(state) {
    if (state.phase === 'guessing') return revealRound(state)
    if (state.phase === 'reveal') return { ...state, phase: 'standings' }
    if (state.phase === 'standings') return startNextRound(state)
    return state
  },

  isOver(state) {
    return state.phase === 'over'
  },

  /** Match play: most points, then least total distance. Stroke play: least total distance, then most round wins. */
  finishingOrder(state) {
    const scores = totals(state)
    // Whole meters, so totals that differ only by rounding count as equal and go to the tiebreaker.
    const meters = (p: PlayerId) => Math.round(scores[p].km * 1000)
    if (state.settings.scoring === 'match') {
      return placesBy(state.players, [(p) => -scores[p].points, meters])
    }
    return placesBy(state.players, [meters, (p) => -scores[p].wins])
  },
}
