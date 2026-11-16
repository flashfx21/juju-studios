// ABOUTME: Pin Drop in a room: the public state every phone may read (where the photo is and everyone's pins stay masked
// ABOUTME: until the reveal, and rounds to come show nothing), and each player's private view (their own pin).
import type { PlayerId } from '../types'
import { currentRound, type Photo, type Pin, type PinDropState } from './rules'

/** What one player alone may see while guessing: their own pin. */
export interface PrivateView {
  roundIndex: number
  pin?: Pin
}

/** The photo being guessed: the picture and its credit, without where it is. A credit that gives the place away waits too. */
function hidePlace(photo: Photo): Photo {
  return {
    ...photo,
    wikidataId: '',
    filePage: '',
    lat: 0,
    lng: 0,
    place: '',
    country: '',
    fame: 0,
    author: photo.creditSpoiler ? '' : photo.author,
  }
}

/** A photo not yet shown: nothing but its difficulty. */
function hidePhoto(photo: Photo): Photo {
  return { ...hidePlace(photo), id: '', image: '', author: '', license: '', licenseUrl: '' }
}

/**
 * The state with every secret masked: rounds to come show no photo, the round being guessed hides where its photo is,
 * and pins show only who has locked in, not where.
 */
export function publicState(state: PinDropState): PinDropState {
  return {
    ...state,
    rounds: state.rounds.map((round, i) => {
      if (state.phase === 'over' || i < state.roundIndex || (i === state.roundIndex && state.phase !== 'guessing')) return round
      if (i > state.roundIndex) return { ...round, photo: hidePhoto(round.photo), pins: {} }
      return { ...round, photo: hidePlace(round.photo), pins: {} }
    }),
  }
}

/** This player's own pin for the round being guessed. */
export function privateView(state: PinDropState, player: PlayerId): PrivateView {
  const view: PrivateView = { roundIndex: state.roundIndex }
  const pin = currentRound(state).pins[player]
  if (state.phase === 'guessing' && pin) view.pin = pin
  return view
}

/** What this phone shows: the public state with its own pin put back in. */
export function stateForPhone(shared: PinDropState, mine: PrivateView | null, player: PlayerId): PinDropState {
  if (!mine || !mine.pin || mine.roundIndex !== shared.roundIndex || shared.phase !== 'guessing') return shared
  const pin = mine.pin
  return {
    ...shared,
    rounds: shared.rounds.map((round, i) => (i === shared.roundIndex ? { ...round, pins: { ...round.pins, [player]: pin } } : round)),
  }
}
