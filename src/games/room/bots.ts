// ABOUTME: The bots any room game can add: their names, colors, symbols and skill, and the player ids that carry them.
// ABOUTME: How a bot plays is up to each game (Pin Drop: guessing a city; Chainword: solving words at a believable pace).
import type { PlayerColorId } from '../../ui/playerColors'
import type { PlayerSymbolId } from '../../ui/playerSymbols'
import type { PlayerId } from '../types'

export type BotSkill = 'casual' | 'sharp'
export const BOT_SKILLS: readonly BotSkill[] = ['casual', 'sharp']
export const BOT_SKILL_NAMES: Record<BotSkill, string> = { casual: 'Casual', sharp: 'Sharp' }

/** How many bots a host can add. */
export const BOT_COUNTS = [0, 1, 2, 3] as const
export type BotCount = (typeof BOT_COUNTS)[number]
export const BOT_COUNT_NAMES: Record<BotCount, string> = { 0: 'None', 1: '1', 2: '2', 3: '3' }

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
