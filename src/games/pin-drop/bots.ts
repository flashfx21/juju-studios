// ABOUTME: How Pin Drop bots guess: always a real city (so never in the ocean), missing by an amount that grows
// ABOUTME: with the photo's difficulty. Sharp bots miss by less than casual ones. Pure, so tests can seed it.
import { WORLD_CITIES } from '../../engine/worldCities'
import type { PlayerColorId } from '../../ui/playerColors'
import type { PlayerSymbolId } from '../../ui/playerSymbols'
import type { PlayerId } from '../types'
import { distanceKm, wrapLongitude, type Difficulty, type Photo, type Pin } from './rules'

export type BotSkill = 'casual' | 'sharp'
export const BOT_SKILLS: readonly BotSkill[] = ['casual', 'sharp']

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

/** The bots a host can add, in order. Each has its own look so players can tell them apart. */
export const BOTS: readonly { name: string; initials: string; color: PlayerColorId; symbol: PlayerSymbolId }[] = [
  { name: 'Bot Ada', initials: 'BA', color: 'silver', symbol: 'rocket' },
  { name: 'Bot Max', initials: 'BM', color: 'brown', symbol: 'moon' },
  { name: 'Bot Kit', initials: 'BK', color: 'olive', symbol: 'star' },
]

/** Player ids for the bots in a game. The skill is part of the id, so a host that reloads still knows it. */
export function botIds(count: number, skill: BotSkill): PlayerId[] {
  return BOTS.slice(0, count).map((_, i) => `bot-${skill}-${i + 1}`)
}

/** The bot behind a player id, or null for a real player. */
export function botFor(id: PlayerId): { skill: BotSkill; look: (typeof BOTS)[number] } | null {
  const match = /^bot-(casual|sharp)-(\d)$/.exec(id)
  const look = match ? BOTS[Number(match[2]) - 1] : undefined
  return match && look ? { skill: match[1] as BotSkill, look } : null
}
