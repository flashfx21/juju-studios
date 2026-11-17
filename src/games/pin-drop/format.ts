// ABOUTME: Wording Pin Drop's TV and phone screens share: distances in miles or kilometers, places and photo credits.
// ABOUTME: Kept in one place so the TV and every phone describe a pin the same way.
import type { Photo, Units } from './rules'

const KM_PER_MILE = 1.609344

/** Whole numbers at 10 and above, one decimal below 10: "1,204 mi", "3.4 km". */
export function distanceText(km: number, units: Units): string {
  const value = units === 'mi' ? km / KM_PER_MILE : km
  const shown = value >= 10 ? Math.round(value).toLocaleString('en-US') : value.toFixed(1)
  return `${shown} ${units}`
}

export function creditText(photo: Photo): string {
  return `Photo: ${photo.author} · ${photo.license} · Wikimedia Commons`
}

const PLACES = ['1st', '2nd', '3rd']

/** "1st", "2nd", "3rd", "4th". */
export function placeText(place: number): string {
  return PLACES[place - 1] ?? `${place}th`
}
