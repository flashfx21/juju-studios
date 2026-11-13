// ABOUTME: Tests for Sketch Showdown room teams: bots always form their own team, people split evenly at random otherwise,
// ABOUTME: sizes the game can't play are refused with a reason, and bot teams solve more often and sooner when sharp.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { botRacePlan, splitTeams } from './roomTeams'

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)

describe('Sketch Showdown room teams', () => {
  it('puts the people against the bots', () => {
    const split = splitTeams(['p1', 'p2', 'bot-casual-1', 'bot-casual-2'], seededRandom('a'))
    expect(split).toEqual({ teams: [expect.arrayContaining(['p1', 'p2']), ['bot-casual-1', 'bot-casual-2']] })
  })

  it('refuses a single bot, and too few or too many people for a bot game', () => {
    expect('problem' in splitTeams(['p1', 'p2', 'p3', 'bot-sharp-1'], Math.random)).toBe(true)
    expect('problem' in splitTeams(['p1', 'bot-sharp-1', 'bot-sharp-2'], Math.random)).toBe(true)
    expect('problem' in splitTeams([...people(6), 'bot-sharp-1', 'bot-sharp-2'], Math.random)).toBe(true)
  })

  it('splits people into two teams, the bigger half first, everyone once', () => {
    const split = splitTeams(people(5), seededRandom('b'))
    if (!('teams' in split)) throw new Error(split.problem)
    expect(split.teams.map((team) => team.length)).toEqual([3, 2])
    expect([...split.teams[0], ...split.teams[1]].sort()).toEqual(people(5))
  })

  it('refuses fewer than 4 or more than 10 people without bots', () => {
    expect('problem' in splitTeams(people(3), Math.random)).toBe(true)
    expect('problem' in splitTeams(people(11), Math.random)).toBe(true)
  })

  it('sharp bot teams solve more often and sooner than casual ones', () => {
    const plans = (skill: 'sharp' | 'casual') => {
      const random = seededRandom(skill)
      return Array.from({ length: 400 }, () => botRacePlan(skill, random))
    }
    const solved = (list: ReturnType<typeof plans>) => list.filter((plan) => plan.solves).length
    const meanShare = (list: ReturnType<typeof plans>) => list.reduce((sum, plan) => sum + plan.share, 0) / list.length
    expect(solved(plans('sharp'))).toBeGreaterThan(solved(plans('casual')))
    expect(meanShare(plans('sharp'))).toBeLessThan(meanShare(plans('casual')))
    for (const plan of plans('casual')) expect(plan.share > 0 && plan.share < 1).toBe(true)
  })
})
