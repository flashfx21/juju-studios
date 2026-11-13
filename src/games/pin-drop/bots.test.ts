// ABOUTME: Tests for Pin Drop bots: every guess sits on a real city, and misses grow with difficulty and shrink with skill.
// ABOUTME: Uses a seeded random so each run checks the same few hundred guesses.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botFor, botGuess, botIds, BOTS, nearestCity, type BotSkill } from './bots'
import { distanceKm, PHOTOS, type Difficulty } from './rules'

function medianMiss(skill: BotSkill, difficulty: Difficulty): number {
  const random = seededRandom(`${skill}-${difficulty}`)
  const misses: number[] = []
  for (const photo of PHOTOS.filter((p) => p.difficulty === difficulty)) {
    for (let i = 0; i < 20; i++) misses.push(distanceKm(botGuess(photo, skill, random), photo))
  }
  misses.sort((a, b) => a - b)
  return misses[Math.floor(misses.length / 2)]
}

describe('botGuess', () => {
  it('always drops the pin within a few km of a real city, so never out at sea', () => {
    const random = seededRandom('on-land')
    for (const photo of PHOTOS) {
      for (const skill of ['casual', 'sharp'] as const) {
        for (let i = 0; i < 10; i++) {
          const pin = botGuess(photo, skill, random)
          expect(nearestCity(pin).km).toBeLessThan(15)
          expect(Math.abs(pin.lat)).toBeLessThanOrEqual(85)
          expect(Math.abs(pin.lng)).toBeLessThanOrEqual(180)
        }
      }
    }
  })

  it('misses by more on harder photos', () => {
    for (const skill of ['casual', 'sharp'] as const) {
      expect(medianMiss(skill, 'easy')).toBeLessThan(medianMiss(skill, 'medium'))
      expect(medianMiss(skill, 'medium')).toBeLessThan(medianMiss(skill, 'hard'))
    }
  })

  it('sharp bots miss by less than casual ones', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(medianMiss('sharp', difficulty)).toBeLessThan(medianMiss('casual', difficulty))
    }
  })

  it('a sharp bot usually lands near an easy landmark', () => {
    expect(medianMiss('sharp', 'easy')).toBeLessThan(400)
  })
})

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
