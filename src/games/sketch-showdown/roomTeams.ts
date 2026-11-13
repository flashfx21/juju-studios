// ABOUTME: Sketch Showdown teams in a room, and how a bot team plays: bots can't draw, so they always make a team of their own,
// ABOUTME: and with no bots the people are split at random. A bot team solves the clue (or not) at a moment set by its skill.
import type { BotSkill } from '../room/bots'
import { botFor } from '../room/bots'
import type { PlayerId } from '../types'
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from './rules'

export type TeamSplit = { teams: [PlayerId[], PlayerId[]] } | { problem: string }

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** People against bots when there are bots; otherwise the people split at random, the bigger half first. */
export function splitTeams(players: readonly PlayerId[], random: () => number): TeamSplit {
  const bots = players.filter((id) => botFor(id))
  const people = shuffled(
    players.filter((id) => !botFor(id)),
    random,
  )
  if (bots.length > 0) {
    if (bots.length < MIN_TEAM_SIZE) return { problem: `Bots play as their own team, so pick ${MIN_TEAM_SIZE} or more bots, or none.` }
    if (people.length < MIN_TEAM_SIZE) return { problem: `Playing the bots needs at least ${MIN_TEAM_SIZE} people.` }
    if (people.length > MAX_TEAM_SIZE) return { problem: `Playing the bots allows at most ${MAX_TEAM_SIZE} people. Pick no bots to split into two teams.` }
    return { teams: [people, bots] }
  }
  if (people.length < MIN_TEAM_SIZE * 2) return { problem: `Two teams need at least ${MIN_TEAM_SIZE * 2} people, or add bots.` }
  if (people.length > MAX_TEAM_SIZE * 2) return { problem: `Two teams allow at most ${MAX_TEAM_SIZE * 2} people.` }
  const half = Math.ceil(people.length / 2)
  return { teams: [people.slice(0, half), people.slice(half)] }
}

/** How a bot team does in one race: whether it gets the clue, and how far through the race (0 to 1) it does. */
export interface BotRacePlan {
  solves: boolean
  share: number
}

/** Sharp bot teams solve more often and sooner. */
export function botRacePlan(skill: BotSkill, random: () => number): BotRacePlan {
  const [chance, earliest, latest] = skill === 'sharp' ? [0.75, 0.25, 0.65] : [0.5, 0.45, 0.9]
  const solves = random() < chance
  return { solves, share: earliest + (latest - earliest) * random() }
}
