// ABOUTME: Tests for Pin Drop bots: every guess sits on a real city, and misses grow with difficulty and shrink with skill.
// ABOUTME: Uses a seeded random so each run checks the same few hundred guesses.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { BotSkill } from '../room/bots'
import { botGuess, nearestCity } from './bots'
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

