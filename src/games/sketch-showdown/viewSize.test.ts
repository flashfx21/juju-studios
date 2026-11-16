// ABOUTME: Checks that a phone's Sketch Showdown view of two busy drawings still fits the database's limit on a player's view.
// ABOUTME: The room writes each view to roomSecrets/{code}/views/{uid}; a view over the limit is refused and the game stops updating.

import databaseRules from '../../../database.rules.json?raw'
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import { currentRound, DEFAULT_SETTINGS, MAX_STROKE_POINTS, playerView, sketchShowdownRules, type Stroke } from './rules'

const rules = sketchShowdownRules(() => false)

/** The longest view the database rules accept, read from database.rules.json. */
function viewLimit(): number {
  const match = /"views":\s*\{\s*"\$uid":\s*\{[^}]*length <= (\d+)/.exec(databaseRules)
  if (!match) throw new Error('No length limit found on roomSecrets views.')
  return Number(match[1])
}

/** A long scribble with points rounded the way the canvas rounds them (4 decimal places). */
function scribble(random: () => number, points: number): Stroke {
  return {
    tool: 'brush',
    color: 0,
    size: 'M',
    points: Array.from({ length: points }, () => [Math.round(random() * 10000) / 10000, Math.round(random() * 10000) / 10000]),
  }
}

describe('player view size', () => {
  it('fits two drawings of 60 long strokes each at the reveal', () => {
    const random = seededRandom('busy')
    let state = rules.setup(['a', 'b', 'c', 'd'], DEFAULT_SETTINGS, { now: 0, random }, [
      ['a', 'b'],
      ['c', 'd'],
    ])
    const [first, second] = currentRound(state).drawers
    state = rules.onInput(state, first, { type: 'pick', option: 0 }, { now: 0, random })
    state = rules.onInput(state, second, { type: 'pick', option: 0 }, { now: 0, random })
    state = rules.onTimer(state, { now: 1000, random })
    for (let i = 0; i < 60; i++) {
      state = rules.onInput(state, first, { type: 'stroke', stroke: scribble(random, 200) }, { now: 2000, random })
      state = rules.onInput(state, second, { type: 'stroke', stroke: scribble(random, 200) }, { now: 2000, random })
    }
    state = rules.onTimer(state, { now: 3000, random })
    expect(state.phase).toBe('reveal')

    const length = JSON.stringify(playerView(state, 'a')).length
    expect(length).toBeGreaterThan(100_000)
    expect(length).toBeLessThanOrEqual(viewLimit())
  })

  it('allows a single stroke at its longest', () => {
    const stroke = scribble(seededRandom('long'), MAX_STROKE_POINTS)
    expect(JSON.stringify(stroke).length).toBeLessThan(viewLimit())
  })
})
