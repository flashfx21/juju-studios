// ABOUTME: Tests for the No Filler rules: the blind pick and dealing, Done and the clock, the vote (ties, missing votes, closing early),
// ABOUTME: points, the round playing out at the target, sudden death, the host's Void and Skip, and the finishing order. Run with `npm test`.
import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../engine/seededRandom'
import type { PlayerId, RulesContext } from '../types'
import { manifest } from './manifest'
import {
  canSkip,
  canVoid,
  CARDS,
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  hostedBy,
  isFinalRound,
  outcomeOf,
  POINTS,
  rules,
  TARGET_SCORES,
  TIMER_SECONDS,
  upNext,
  votersFor,
  type Difficulty,
  type NoFillerInput,
  type NoFillerSettings,
  type NoFillerState,
  type Vote,
} from './rules'

const PLAYERS = ['ana', 'bo', 'cy', 'di']
const HOST = PLAYERS[0]
const ctx = (now = 0, seed = '1'): RulesContext => ({ now, random: seededRandom(seed) })

function newGame(players: PlayerId[] = PLAYERS, settings: NoFillerSettings = DEFAULT_SETTINGS): NoFillerState {
  return rules.setup(players, settings, ctx(0, '42'))
}

function play(state: NoFillerState, moves: [PlayerId, NoFillerInput, number?][]): NoFillerState {
  return moves.reduce((next, [player, input, now]) => rules.onInput(next, player, input, ctx(now ?? 0)), state)
}

const timeUp = (state: NoFillerState) => rules.onTimer(state, ctx())

/** The speaker picks and taps Done: the vote is open. */
function spoken(state: NoFillerState, difficulty: Difficulty = 'easy'): NoFillerState {
  const { speaker } = state.turn
  return play(state, [
    [speaker, { type: 'pick', difficulty }, 1000],
    [speaker, { type: 'done' }, 5000],
  ])
}

/** A whole turn up to its verdict: every voter votes the same way. */
function judged(state: NoFillerState, difficulty: Difficulty, vote: Vote): NoFillerState {
  const open = spoken(state, difficulty)
  return play(
    open,
    votersFor(open).map((id) => [id, { type: 'vote', vote }]),
  )
}

/** A whole turn, on to the next speaker's pick (or the end of the game). */
function turn(state: NoFillerState, difficulty: Difficulty, vote: Vote): NoFillerState {
  return timeUp(judged(state, difficulty, vote))
}

function withScores(state: NoFillerState, scores: Record<PlayerId, number>): NoFillerState {
  return { ...state, scores: { ...state.scores, ...scores } }
}

describe('manifest', () => {
  it('offers the settings the rules use', () => {
    const setting = (id: string) => manifest.settings.find((s) => s.id === id)
    expect(setting('timer')?.options).toEqual(TIMER_SECONDS)
    expect(setting('target')?.options).toEqual(TARGET_SCORES)
    expect(setting('timer')?.default).toBe(DEFAULT_SETTINGS.timer)
    expect(setting('target')?.default).toBe(DEFAULT_SETTINGS.target)
    expect(manifest.players).toEqual({ min: 3, max: 10 })
  })
})

describe('the card pack', () => {
  it('has 30 cards of each difficulty with unique ids and prompts', () => {
    for (const difficulty of DIFFICULTIES) expect(CARDS.filter((card) => card.difficulty === difficulty)).toHaveLength(30)
    expect(new Set(CARDS.map((card) => card.id)).size).toBe(CARDS.length)
    expect(new Set(CARDS.map((card) => card.prompt)).size).toBe(CARDS.length)
  })

  it('names every card by its difficulty and asks for 3 things', () => {
    for (const card of CARDS) {
      expect(card.id).toMatch(new RegExp(`^nf-${card.difficulty[0]}-\\d{3}$`))
      expect(card.prompt).toMatch(/^Name 3 \S/)
      expect(card.category).not.toBe('')
    }
  })
})

describe('setup', () => {
  it('needs at least 3 players', () => {
    expect(() => newGame(['ana', 'bo'])).toThrow()
    expect(newGame(['ana', 'bo', 'cy']).players).toHaveLength(3)
  })

  it('shuffles the turn order once and starts with its first speaker picking', () => {
    const state = newGame()
    expect([...state.order].sort()).toEqual([...PLAYERS].sort())
    expect(state.phase).toBe('pick')
    expect(state.turn.speaker).toBe(state.order[0])
    expect(state.turn.card).toBeNull()
    expect(Object.values(state.scores)).toEqual([0, 0, 0, 0])
    const orders = new Set(['1', '2', '3', '4', '5', '6'].map((seed) => rules.setup(PLAYERS, DEFAULT_SETTINGS, ctx(0, seed)).order.join()))
    expect(orders.size).toBeGreaterThan(1)
  })

  it('puts every card in its own pile, and cards dealt lately at the bottom', () => {
    const state = newGame()
    for (const difficulty of DIFFICULTIES) {
      expect(state.piles[difficulty]).toHaveLength(30)
      expect(state.piles[difficulty].every((id) => id.startsWith(`nf-${difficulty[0]}-`))).toBe(true)
    }
    const recent = ['nf-e-001', 'nf-e-002']
    const later = rules.setup(PLAYERS, DEFAULT_SETTINGS, { ...ctx(0, '9'), recent })
    expect(later.piles.easy.slice(-2)).toEqual(recent)
  })

  it('makes the first player the host until the room says otherwise', () => {
    expect(newGame().host).toBe(HOST)
    expect(hostedBy(newGame(), 'cy').host).toBe('cy')
  })
})

describe('the pick', () => {
  it('deals the top card of the chosen pile and starts the clock at the same moment', () => {
    const start = newGame()
    const top = start.piles.hard[0]
    const state = play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'hard' }, 1000]])
    expect(state.phase).toBe('speak')
    expect(state.turn.card).toMatchObject({ id: top, difficulty: 'hard' })
    expect(state.turn.startedAt).toBe(1000)
    expect(state.piles.hard).not.toContain(top)
    expect(state.piles.hard).toHaveLength(29)
    expect(state.piles.easy).toHaveLength(30)
  })

  it('is the speaker alone who picks, and only a real difficulty', () => {
    const start = newGame()
    const other = start.order[1]
    expect(play(start, [[other, { type: 'pick', difficulty: 'easy' }]])).toBe(start)
    expect(play(start, [['stranger', { type: 'pick', difficulty: 'easy' }]])).toBe(start)
    expect(play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'impossible' as Difficulty }]])).toBe(start)
  })

  it('has no timer, and no skipping the card once it is up', () => {
    const start = newGame()
    expect(timeUp(start)).toBe(start)
    const speaking = play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'easy' }]])
    expect(play(speaking, [[start.turn.speaker, { type: 'pick', difficulty: 'hard' }]])).toBe(speaking)
  })

  it('shuffles a pile that runs out, without the card just dealt', () => {
    let state = newGame()
    const lastOne = 'nf-m-007'
    state = { ...state, piles: { ...state.piles, medium: [lastOne] } }
    state = play(state, [[state.turn.speaker, { type: 'pick', difficulty: 'medium' }]])
    expect(state.turn.card?.id).toBe(lastOne)
    expect(state.piles.medium).toHaveLength(29)
    expect(state.piles.medium).not.toContain(lastOne)
  })
})

describe('speaking', () => {
  it('lets the speaker tap Done to stop the clock, and records when', () => {
    const state = spoken(newGame())
    expect(state.phase).toBe('vote')
    expect(state.turn.stoppedAt).toBe(4000)
  })

  it('ignores Done from anyone else', () => {
    const start = newGame()
    const speaking = play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'easy' }]])
    expect(play(speaking, [[start.order[1], { type: 'done' }]])).toBe(speaking)
  })

  it('opens the vote when the clock runs out', () => {
    const start = newGame()
    const state = timeUp(play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'easy' }]]))
    expect(state.phase).toBe('vote')
    expect(state.turn.stoppedAt).toBeNull()
  })
})

describe('the vote', () => {
  it('is everyone but the speaker, one vote each', () => {
    const open = spoken(newGame())
    const { speaker } = open.turn
    expect(votersFor(open)).toEqual(PLAYERS.filter((id) => id !== speaker))
    expect(play(open, [[speaker, { type: 'vote', vote: 'clean' }]])).toBe(open)
    const [first] = votersFor(open)
    const once = play(open, [[first, { type: 'vote', vote: 'filler' }]])
    expect(play(once, [[first, { type: 'vote', vote: 'clean' }]])).toBe(once)
    expect(play(open, [[first, { type: 'vote', vote: 'maybe' as Vote }]])).toBe(open)
  })

  it('closes as soon as every voter has voted', () => {
    const open = spoken(newGame())
    const [a, b, c] = votersFor(open)
    const two = play(open, [
      [a, { type: 'vote', vote: 'clean' }],
      [b, { type: 'vote', vote: 'clean' }],
    ])
    expect(two.phase).toBe('vote')
    expect(play(two, [[c, { type: 'vote', vote: 'filler' }]]).phase).toBe('reveal')
  })

  it('closes on the timer, and votes not in by then do not count', () => {
    const open = spoken(newGame(), 'hard')
    const [a] = votersFor(open)
    const state = timeUp(play(open, [[a, { type: 'vote', vote: 'filler' }]]))
    expect(state.phase).toBe('reveal')
    expect(state.turn.outcome).toBe('filler')
    expect(state.turn.votes).toEqual({ [a]: 'filler' })
    expect(state.scores[open.turn.speaker]).toBe(0)
  })

  it('gives a tie, and a vote nobody cast, to the speaker', () => {
    expect(outcomeOf({ a: 'clean', b: 'filler' })).toBe('clean')
    expect(outcomeOf({})).toBe('clean')
    expect(outcomeOf({ a: 'filler', b: 'filler', c: 'clean' })).toBe('filler')
    const open = spoken(newGame(), 'medium')
    const nobody = timeUp(open)
    expect(nobody.turn.outcome).toBe('clean')
    expect(nobody.scores[open.turn.speaker]).toBe(2)
    const [a, b] = votersFor(open)
    const tied = timeUp(
      play(open, [
        [a, { type: 'vote', vote: 'clean' }],
        [b, { type: 'vote', vote: 'filler' }],
      ]),
    )
    expect(tied.turn.outcome).toBe('clean')
  })

  it("scores the card's points for Clean and nothing for Filler", () => {
    for (const difficulty of DIFFICULTIES) {
      const start = newGame()
      const clean = judged(start, difficulty, 'clean')
      expect(clean.turn.points).toBe(POINTS[difficulty])
      expect(clean.scores[start.turn.speaker]).toBe(POINTS[difficulty])
      const filler = judged(start, difficulty, 'filler')
      expect(filler.turn.points).toBe(0)
      expect(filler.scores[start.turn.speaker]).toBe(0)
    }
    expect(POINTS).toEqual({ easy: 1, medium: 2, hard: 3 })
  })

  it('shows the verdict, then moves on to the next speaker when its time is up', () => {
    const start = newGame()
    const reveal = judged(start, 'easy', 'clean')
    expect(reveal.phase).toBe('reveal')
    expect(play(reveal, [[votersFor(reveal)[0], { type: 'vote', vote: 'filler' }]])).toBe(reveal)
    const next = timeUp(reveal)
    expect(next.phase).toBe('pick')
    expect(next.turn.speaker).toBe(start.order[1])
    expect(next.turn.votes).toEqual({})
    expect(next.turnCount).toBe(start.turnCount + 1)
  })
})

describe('turn order', () => {
  it('keeps the same order round after round', () => {
    let state = newGame()
    const speakers: PlayerId[] = []
    for (let i = 0; i < 9; i++) {
      speakers.push(state.turn.speaker)
      state = turn(state, 'easy', 'filler')
    }
    const { order } = state
    expect(speakers).toEqual([...order, ...order, order[0]])
    expect(state.roundIndex).toBe(2)
  })

  it('says who is up next, and nobody when the game may end first', () => {
    const start = newGame()
    expect(upNext(start)).toBe(start.order[1])
    const lastOfRound = turn(turn(turn(start, 'easy', 'filler'), 'easy', 'filler'), 'easy', 'filler')
    expect(lastOfRound.turn.speaker).toBe(start.order[3])
    expect(upNext(lastOfRound)).toBe(start.order[0])
    const inReach = withScores(lastOfRound, { [start.order[3]]: 12 })
    expect(upNext(inReach)).toBeNull()
    const easyCard = play(inReach, [[start.order[3], { type: 'pick', difficulty: 'easy' }]])
    expect(upNext(easyCard)).toBe(start.order[0])
    const reached = judged(inReach, 'hard', 'clean')
    expect(upNext(reached)).toBeNull()
  })
})

describe('the end of the game', () => {
  const quick: NoFillerSettings = { timer: 5, target: 10 }

  it('plays the round out after someone reaches the target, so everyone has the same number of turns', () => {
    const start = newGame(PLAYERS, quick)
    const [first, second, third, fourth] = start.order
    let state = withScores(start, { [first]: 8, [second]: 4, [third]: 2 })
    expect(isFinalRound(state)).toBe(false)
    state = turn(state, 'hard', 'clean')
    expect(state.scores[first]).toBe(11)
    expect(state.phase).toBe('pick')
    expect(state.turn.speaker).toBe(second)
    expect(isFinalRound(state)).toBe(true)
    state = turn(state, 'hard', 'clean')
    state = turn(state, 'easy', 'filler')
    expect(state.turn.speaker).toBe(fourth)
    expect(rules.isOver(state)).toBe(false)
    state = turn(state, 'medium', 'clean')
    expect(rules.isOver(state)).toBe(true)
    expect(rules.finishingOrder(state)).toEqual([[first], [second], expect.arrayContaining([third, fourth])])
    expect(state.roundIndex).toBe(start.roundIndex)
    expect(state.turnIndex).toBe(start.order.length - 1)
  })

  it('ends at once when the last speaker of the round is the one who reaches the target', () => {
    const start = newGame(PLAYERS, quick)
    let state = turn(turn(turn(start, 'easy', 'filler'), 'easy', 'filler'), 'easy', 'filler')
    state = withScores(state, { [start.order[3]]: 9 })
    state = turn(state, 'easy', 'clean')
    expect(rules.isOver(state)).toBe(true)
    expect(rules.finishingOrder(state)[0]).toEqual([start.order[3]])
  })

  it('goes to the highest score when two players pass the target in the same round', () => {
    const start = newGame(PLAYERS, quick)
    const [first, second] = start.order
    let state = withScores(start, { [first]: 9, [second]: 9 })
    state = turn(state, 'easy', 'clean')
    state = turn(state, 'hard', 'clean')
    state = turn(turn(state, 'easy', 'filler'), 'easy', 'filler')
    expect(rules.isOver(state)).toBe(true)
    expect(rules.finishingOrder(state).slice(0, 2)).toEqual([[second], [first]])
  })

  it('keeps going round after round until someone reaches the target', () => {
    let state = newGame(PLAYERS, quick)
    for (let i = 0; i < 12; i++) state = turn(state, 'easy', 'clean')
    expect(rules.isOver(state)).toBe(false)
    expect(Object.values(state.scores)).toEqual([3, 3, 3, 3])
  })

  it('ranks by current score when the host ends the game early, ties sharing a place', () => {
    const start = newGame()
    const [first, second, third, fourth] = start.order
    const ended: NoFillerState = { ...withScores(start, { [first]: 2, [second]: 5, [third]: 2 }), phase: 'over' }
    expect(rules.finishingOrder(ended)).toEqual([[second], expect.arrayContaining([first, third]), [fourth]])
    expect(rules.finishingOrder(ended)[1]).toHaveLength(2)
  })
})

describe('sudden death', () => {
  const quick: NoFillerSettings = { timer: 5, target: 10 }

  /** The last speaker of a round is about to speak, with the first two players tied on 10. */
  function tiedAtTheTarget(): NoFillerState {
    const start = newGame(PLAYERS, quick)
    const [first, second] = start.order
    const state = turn(turn(turn(start, 'easy', 'filler'), 'easy', 'filler'), 'easy', 'filler')
    return withScores(state, { [first]: 10, [second]: 10 })
  }

  it('is one round for the players tied for first, in turn order, on Hard cards only', () => {
    const before = tiedAtTheTarget()
    const [first, second] = before.order
    const state = turn(before, 'easy', 'filler')
    expect(state.suddenDeath).toBe(true)
    expect(state.phase).toBe('pick')
    expect(state.speakers).toEqual([first, second])
    expect(state.turn.speaker).toBe(first)
    expect(isFinalRound(state)).toBe(false)
    expect(play(state, [[first, { type: 'pick', difficulty: 'easy' }]])).toBe(state)
    expect(play(state, [[first, { type: 'pick', difficulty: 'medium' }]])).toBe(state)
    expect(play(state, [[first, { type: 'pick', difficulty: 'hard' }]]).turn.card?.difficulty).toBe('hard')
  })

  it('decides first place without changing the scores', () => {
    const before = tiedAtTheTarget()
    const [first, second, third, fourth] = before.order
    let state = turn(before, 'easy', 'filler')
    state = turn(state, 'hard', 'filler')
    expect(state.turn.speaker).toBe(second)
    state = turn(state, 'hard', 'clean')
    expect(rules.isOver(state)).toBe(true)
    expect(state.scores[first]).toBe(10)
    expect(state.scores[second]).toBe(10)
    expect(rules.finishingOrder(state)).toEqual([[second], [first], expect.arrayContaining([third, fourth])])
  })

  it('shares first place when the tied players are still tied after it', () => {
    const before = tiedAtTheTarget()
    const [first, second] = before.order
    for (const vote of ['clean', 'filler'] as Vote[]) {
      const state = turn(turn(turn(before, 'easy', 'filler'), 'hard', vote), 'hard', vote)
      expect(rules.isOver(state)).toBe(true)
      expect(rules.finishingOrder(state)[0]).toEqual(expect.arrayContaining([first, second]))
      expect(rules.finishingOrder(state)[0]).toHaveLength(2)
    }
  })

  it('never follows a clear winner', () => {
    const before = withScores(tiedAtTheTarget(), { [tiedAtTheTarget().order[0]]: 11 })
    const state = turn(before, 'easy', 'filler')
    expect(state.suddenDeath).toBe(false)
    expect(rules.isOver(state)).toBe(true)
  })
})

describe("the host's Void turn", () => {
  it('takes the card away with no score, and the speaker picks again for a different card', () => {
    const start = newGame()
    const { speaker } = start.turn
    const speaking = play(start, [[speaker, { type: 'pick', difficulty: 'easy' }]])
    const voided = play(speaking, [[HOST, { type: 'void' }]])
    expect(voided.phase).toBe('pick')
    expect(voided.turn.speaker).toBe(speaker)
    expect(voided.turn.card).toBeNull()
    expect(voided.turn.hostCall).toEqual({ kind: 'voided' })
    expect(voided.turnCount).toBe(start.turnCount + 1)
    const again = play(voided, [[speaker, { type: 'pick', difficulty: 'easy' }]])
    expect(again.turn.card?.id).not.toBe(speaking.turn.card?.id)
  })

  it('works during the vote, and takes back a verdict already shown', () => {
    const start = newGame()
    const { speaker } = start.turn
    const open = spoken(start, 'hard')
    expect(play(open, [[HOST, { type: 'void' }]]).phase).toBe('pick')
    const reveal = judged(start, 'hard', 'clean')
    expect(reveal.scores[speaker]).toBe(3)
    const voided = play(reveal, [[HOST, { type: 'void' }]])
    expect(voided.scores[speaker]).toBe(0)
    expect(voided.turn.speaker).toBe(speaker)
    expect(voided.turn.votes).toEqual({})
  })

  it('is refused from anyone but the host, and before a card is up', () => {
    const start = newGame()
    const notHost = PLAYERS.find((id) => id !== HOST)!
    const speaking = play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'easy' }]])
    expect(play(speaking, [[notHost, { type: 'void' }]])).toBe(speaking)
    expect(play(speaking, [['stranger', { type: 'void' }]])).toBe(speaking)
    expect(canVoid(start)).toBe(false)
    expect(play(start, [[HOST, { type: 'void' }]])).toBe(start)
    expect(play(hostedBy(speaking, notHost), [[HOST, { type: 'void' }]]).phase).toBe('speak')
    expect(play(hostedBy(speaking, notHost), [[notHost, { type: 'void' }]]).phase).toBe('pick')
  })
})

describe("the host's Skip turn", () => {
  it('moves on to the next speaker; the skipped one keeps their score and plays next round', () => {
    const start = withScores(newGame(), { [newGame().order[0]]: 4 })
    const [first, second] = start.order
    const skipped = play(start, [[HOST, { type: 'skip' }]])
    expect(skipped.turn.speaker).toBe(second)
    expect(skipped.phase).toBe('pick')
    expect(skipped.scores[first]).toBe(4)
    expect(skipped.turn.hostCall).toEqual({ kind: 'skipped', player: first })
    let state = skipped
    for (let i = 0; i < 3; i++) state = turn(state, 'easy', 'filler')
    expect(state.turn.speaker).toBe(first)
  })

  it('works while the card is up and during the vote, but not once the verdict is in', () => {
    const start = newGame()
    const second = start.order[1]
    const speaking = play(start, [[start.turn.speaker, { type: 'pick', difficulty: 'hard' }]])
    expect(play(speaking, [[HOST, { type: 'skip' }]]).turn.speaker).toBe(second)
    const open = spoken(start, 'hard')
    const skipped = play(open, [[HOST, { type: 'skip' }]])
    expect(skipped.turn.speaker).toBe(second)
    expect(skipped.scores[start.turn.speaker]).toBe(0)
    const reveal = judged(start, 'hard', 'clean')
    expect(canSkip(reveal)).toBe(false)
    expect(play(reveal, [[HOST, { type: 'skip' }]])).toBe(reveal)
  })

  it('is refused from anyone but the host', () => {
    const start = newGame()
    const notHost = PLAYERS.find((id) => id !== HOST)!
    expect(play(start, [[notHost, { type: 'skip' }]])).toBe(start)
    expect(play(start, [['stranger', { type: 'skip' }]])).toBe(start)
  })

  it('ends the game when it skips the last turn of the final round', () => {
    const start = newGame(PLAYERS, { timer: 5, target: 10 })
    let state = turn(turn(turn(start, 'easy', 'filler'), 'easy', 'filler'), 'easy', 'filler')
    state = withScores(state, { [start.order[0]]: 10 })
    state = play(state, [[HOST, { type: 'skip' }]])
    expect(rules.isOver(state)).toBe(true)
    expect(rules.finishingOrder(state)[0]).toEqual([start.order[0]])
  })
})
