// ABOUTME: Tests for the words around Sketch Showdown's TV screens: the round label, the status bar and the reveal's lines.
// ABOUTME: Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { RulesContext } from '../types'
import { currentRound, DEFAULT_SETTINGS, sketchShowdownRules, tvView, type SketchShowdownState, type TeamGuess } from './rules'
import { resultHeadline, revealHeadline, sketchRoundLabel, sketchStatus, winTimeText, wrongGuessText } from './tvText'

const rules = sketchShowdownRules(() => false)
const TEAMS = [
  ['ana', 'bo'],
  ['di', 'ed'],
]

const at = (now: number): RulesContext => ({ now, random: seededRandom('7') })

function newGame(): SketchShowdownState {
  return rules.setup(TEAMS.flat(), DEFAULT_SETTINGS, at(0), TEAMS)
}

/** Both drawers pick, and the countdown ends at time 1000. */
function racing(state: SketchShowdownState): SketchShowdownState {
  let next = state
  for (const drawer of currentRound(state).drawers) next = rules.onInput(next, drawer, { type: 'pick', option: 0 }, at(0))
  return rules.onTimer(next, at(1000))
}

function guesserOn(state: SketchShowdownState, team: 0 | 1): string {
  return state.teams[team].find((id) => id !== currentRound(state).drawers[team])!
}

/** A whole round won by `team` 12 seconds in, left at its reveal. */
function wonBy(state: SketchShowdownState, team: 0 | 1): SketchShowdownState {
  const race = racing(state)
  return rules.onInput(race, guesserOn(race, team), { type: 'guess', text: currentRound(race).clue!.answer }, at(13000))
}

describe('Sketch Showdown TV words', () => {
  it('labels the round, sudden death and the end', () => {
    expect(sketchRoundLabel(tvView(newGame()))).toBe('Round 1 of 2')
    expect(sketchRoundLabel(tvView({ ...newGame(), phase: 'vote' }))).toBe('Sudden death')
    expect(sketchRoundLabel(tvView({ ...newGame(), phase: 'over' }))).toBe('Game over')
  })

  it('says what is happening in each step', () => {
    const start = newGame()
    expect(sketchStatus(tvView(start))).toBe('Drawers are choosing')
    const picked = currentRound(start).drawers.reduce((state, drawer) => rules.onInput(state, drawer, { type: 'pick', option: 0 }, at(0)), start)
    expect(sketchStatus(tvView(picked))).toBe('Get ready')
    expect(sketchStatus(tvView(racing(start)))).toBe('Draw and guess on your phone')
    expect(sketchStatus(tvView({ ...start, phase: 'vote' }))).toBe('Nominate a drawer on your phone')
    expect(sketchStatus(tvView({ ...start, phase: 'over' }))).toBe('Game over')
  })

  it('tells the host what Next leads to from the reveal', () => {
    const first = wonBy(newGame(), 0)
    expect(sketchStatus(tvView(first))).toBe('Host: tap Next on your phone for the next round')
    const level = wonBy(rules.onTimer(first, at(0)), 1)
    expect(sketchStatus(tvView(level))).toBe('Host: tap Next on your phone for sudden death')
    const ahead = wonBy(rules.onTimer(first, at(0)), 0)
    expect(sketchStatus(tvView(ahead))).toBe('Host: tap Next on your phone for the result')
  })

  it('names the team that got it and how fast', () => {
    const won = tvView(wonBy(newGame(), 1))
    expect(revealHeadline(won)).toBe('Crayons got it!')
    expect(winTimeText(won)).toBe('12 s')
    const timeUp = tvView(rules.onTimer(racing(newGame()), at(200000)))
    expect(revealHeadline(timeUp)).toBe('Nobody got it')
    expect(winTimeText(timeUp)).toBe('')
  })

  it('names the winning team, or a tie', () => {
    expect(resultHeadline([3, 1])).toBe('Pencils win!')
    expect(resultHeadline([1, 2])).toBe('Crayons win!')
    expect(resultHeadline([2, 2])).toBe("It's a tie")
  })

  it('trims wrong guesses to the last few and leaves the winning guess out', () => {
    const guesses: TeamGuess[] = ['cat', 'dog', 'cow', 'pig'].map((text, i) => ({ player: 'ana', text, at: i }))
    expect(wrongGuessText([], null, 3)).toBe('No wrong guesses')
    expect(wrongGuessText(guesses, null, 3)).toBe('dog, cow, pig and 1 more')
    expect(wrongGuessText(guesses, guesses[3], 3)).toBe('cat, dog, cow')
    expect(wrongGuessText([guesses[3]], guesses[3], 3)).toBe('No wrong guesses')
  })
})
