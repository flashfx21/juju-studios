// ABOUTME: Tests for room bot ids: they carry the skill so a reloaded host knows each bot, and never match a real player.
// ABOUTME: Bot ids are how every room game tells bots from people.
import { describe, expect, it } from 'vitest'
import { botFor, botIds, BOTS } from './bots'

describe('bot ids', () => {
  it('carry the skill, so a reloaded host knows each bot', () => {
    const ids = botIds(3, 'sharp')
    expect(ids).toEqual(['bot-sharp-1', 'bot-sharp-2', 'bot-sharp-3'])
    expect(botFor(ids[1])).toEqual({ skill: 'sharp', look: BOTS[1] })
    expect(botFor('bot-casual-1')?.skill).toBe('casual')
  })

  it('never mistake a real player for a bot', () => {
    expect(botFor('gsArVLQwSdXr9WEUAkD8fvQlsea2')).toBeNull()
    expect(botFor('bot-sharp-9')).toBeNull()
    expect(botFor('bot-wild-1')).toBeNull()
    expect(botIds(0, 'casual')).toEqual([])
  })
})
