// ABOUTME: How Pin Drop bots guess: always a real city (so never in the ocean), missing by an amount that grows
// ABOUTME: with the photo's difficulty. Sharp bots miss by less than casual ones. Pure, so tests can seed it.
import { WORLD_CITIES } from '../../engine/worldCities'
import type { BotSkill } from '../room/bots'
import { distanceKm, wrapLongitude, type Difficulty, type Photo, type Pin } from './rules'

/** How far off a bot aims, in km: [nearest, farthest]. Real players get the city on easy photos, the region on hard. */
const MISS_KM: Record<BotSkill, Record<Difficulty, [number, number]>> = {
  sharp: { easy: [20, 300], medium: [100, 1000], hard: [400, 3000] },
  casual: { easy: [60, 900], medium: [300, 2500], hard: [1000, 6000] },
}

/** How many of the best-fitting cities the bot picks among, so two bots rarely land on the same spot. */
const CANDIDATES = 3

/** The farthest a bot's pin sits from the city it picked, so pins near one city don't stack up exactly. */
const SPREAD_KM = 12

const KM_PER_DEGREE = 111.32

/**
 * A bot's pin for this photo: it decides how far off to be, picks a city about that far from the answer,
 * and drops the pin a few km from that city's center.
 */
export function botGuess(photo: Photo, skill: BotSkill, random: () => number): Pin {
  const answer = { lat: photo.lat, lng: photo.lng }
  const [nearest, farthest] = MISS_KM[skill][photo.difficulty]
  // Squaring the draw makes close misses more common than far ones.
  const aim = nearest + (farthest - nearest) * random() ** 2

  const fits = WORLD_CITIES.map((city) => ({ city, off: Math.abs(distanceKm(city, answer) - aim) }))
    .sort((a, b) => a.off - b.off)
    .slice(0, CANDIDATES)
  const { city } = fits[Math.floor(random() * fits.length)]

  const angle = random() * 2 * Math.PI
  const spread = random() * SPREAD_KM
  const lat = city.lat + (Math.sin(angle) * spread) / KM_PER_DEGREE
  const lng = city.lng + (Math.cos(angle) * spread) / (KM_PER_DEGREE * Math.max(0.2, Math.cos((city.lat * Math.PI) / 180)))
  return { lat: Math.max(-85, Math.min(85, lat)), lng: wrapLongitude(lng) }
}

/** The city a pin was dropped near, for tests: the nearest one and how far away it is. */
export function nearestCity(pin: Pin): { name: string; km: number } {
  let best = { name: '', km: Infinity }
  for (const city of WORLD_CITIES) {
    const km = distanceKm(city, pin)
    if (km < best.km) best = { name: city.name, km }
  }
  return best
}

