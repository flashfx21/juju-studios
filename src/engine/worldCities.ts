// ABOUTME: The shared world city list (packs/shared/world-cities.json): real places on land any game can use.
// ABOUTME: Pin Drop bots pick their guesses from it so they never land at sea.
import worldCities from '../../packs/shared/world-cities.json'

export interface WorldCity {
  name: string
  country: string
  lat: number
  lng: number
}

export const WORLD_CITIES: readonly WorldCity[] = worldCities.cities
