// ABOUTME: The bots any room game can add: their names, colors, symbols and skill, and the player ids that carry them.
// ABOUTME: Names come from packs/shared/bot-names.json, one list per skill. How a bot plays is up to each game.
import botNamePack from '../../../packs/shared/bot-names.json'
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

export interface BotLook {
  name: string
  initials: string
  color: PlayerColorId
  symbol: PlayerSymbolId
}

/** Each skill's own names; a name is only ever used by bots of its skill. Checked by bots.test.ts. */
export const BOT_NAMES = { sharp: botNamePack.sharp, casual: botNamePack.casual } as Record<BotSkill, readonly BotLook[]>

/** The skill's names in a random order, so each room draws different bots. */
export function shuffledBotOrder(skill: BotSkill, random: () => number): number[] {
  const order = BOT_NAMES[skill].map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/**
 * Player ids for the bots in a game, taking names in the given order (list order when left out).
 * The skill and name are part of the id, so a host that reloads still knows each bot.
 */
export function botIds(count: number, skill: BotSkill, order: readonly number[] = BOT_NAMES[skill].map((_, i) => i)): PlayerId[] {
  return order.slice(0, count).map((index) => `bot-${skill}-${index + 1}`)
}

/** The bot behind a player id, or null for a real player. */
export function botFor(id: PlayerId): { skill: BotSkill; look: BotLook } | null {
  const match = /^bot-(casual|sharp)-(\d+)$/.exec(id)
  if (!match) return null
  const skill = match[1] as BotSkill
  const look = BOT_NAMES[skill][Number(match[2]) - 1]
  return look ? { skill, look } : null
}
