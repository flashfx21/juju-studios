// ABOUTME: Tests for room bots: ids carry the skill and name so a reloaded host knows each bot, and never match a real player.
// ABOUTME: Also checks the bot name pack: names, initials, colors and symbols a room entry accepts, none shared between skills.
import { describe, expect, it } from 'vitest'
import { PLAYER_COLOR_IDS } from '../../ui/playerColors'
import { PLAYER_SYMBOL_IDS } from '../../ui/playerSymbols'
import { allBotIds, BOT_NAMES, BOT_SKILLS, botFor, botIds, shuffledBotOrder } from './bots'

describe('bot ids', () => {
  it('carry the skill and name, so a reloaded host knows each bot', () => {
    const ids = botIds(3, 'sharp')
    expect(ids).toEqual(['bot-sharp-1', 'bot-sharp-2', 'bot-sharp-3'])
    expect(botFor(ids[1])).toEqual({ skill: 'sharp', look: BOT_NAMES.sharp[1] })
    expect(botFor('bot-casual-1')?.look.name).toBe(BOT_NAMES.casual[0].name)
  })

  it('follow a room order, reaching names past the third', () => {
    const ids = botIds(2, 'casual', [5, 3, 0])
    expect(ids).toEqual(['bot-casual-6', 'bot-casual-4'])
    expect(botFor(ids[0])?.look).toEqual(BOT_NAMES.casual[5])
  })

  it('never mistake a real player for a bot', () => {
    expect(botFor('gsArVLQwSdXr9WEUAkD8fvQlsea2')).toBeNull()
    expect(botFor('bot-sharp-99')).toBeNull()
    expect(botFor('bot-wild-1')).toBeNull()
    expect(botIds(0, 'casual')).toEqual([])
  })
})

describe('allBotIds', () => {
  it('lists every bot of a skill by its id, so a host can pick any of them by name', () => {
    for (const skill of BOT_SKILLS) {
      const ids = allBotIds(skill)
      expect(ids).toHaveLength(BOT_NAMES[skill].length)
      expect(ids.map((id) => botFor(id)?.look.name)).toEqual(BOT_NAMES[skill].map((look) => look.name))
      expect(ids.every((id) => botFor(id)?.skill === skill)).toBe(true)
    }
  })
})

describe('shuffledBotOrder', () => {
  it('uses every name of the skill once', () => {
    const order = shuffledBotOrder('sharp', () => 0.42)
    expect([...order].sort((a, b) => a - b)).toEqual(BOT_NAMES.sharp.map((_, i) => i))
  })
})

describe('bot name pack', () => {
  it('has at least 3 names per skill, enough for a full set of bots', () => {
    for (const skill of BOT_SKILLS) expect(BOT_NAMES[skill].length).toBeGreaterThanOrEqual(3)
  })

  it('only holds looks a room entry accepts', () => {
    for (const skill of BOT_SKILLS) {
      for (const look of BOT_NAMES[skill]) {
        expect(look.name.length, look.name).toBeGreaterThanOrEqual(2)
        expect(look.name.length, look.name).toBeLessThanOrEqual(25)
        expect(look.initials, look.name).toMatch(/^[A-Z]{1,3}$/)
        expect(PLAYER_COLOR_IDS, look.name).toContain(look.color)
        expect(PLAYER_SYMBOL_IDS, look.name).toContain(look.symbol)
      }
    }
  })

  it('never shares a name between skills', () => {
    const sharp = new Set(BOT_NAMES.sharp.map((look) => look.name))
    expect(BOT_NAMES.casual.filter((look) => sharp.has(look.name))).toEqual([])
  })
})
