// ABOUTME: Don't Jinx It bots for rooms: they write clues from a hand-made list for each mystery word,
// ABOUTME: and guess from the surviving clues, right more often with more clues and when Sharp.
import botCluePack from '../../../packs/dont-jinx-it/bot-clues.json'
import type { BotSkill } from '../room/bots'
import { clueProblems, MYSTERY_WORDS, type DontJinxItInput } from './rules'

const BOT_CLUES: Record<string, string[]> = botCluePack.clues

/** The clues a bot may write for this word: every listed clue that passes the clue checks. */
export function cluesFor(word: string): string[] {
  return (BOT_CLUES[word] ?? []).filter((clue) => clueProblems([clue], word)[0] === null)
}

/**
 * A bot's clues for this word. Casual bots pick from every listed clue, so they often write the most obvious one
 * and jinx each other; Sharp bots skip the most obvious one.
 */
export function botClues(word: string, count: number, skill: BotSkill, random: () => number): string[] {
  const listed = cluesFor(word)
  const pool = skill === 'sharp' && listed.length > count ? listed.slice(1) : [...listed]
  const picks: string[] = []
  while (picks.length < count && pool.length > 0) {
    picks.push(...pool.splice(Math.floor(random() * pool.length), 1))
  }
  return picks
}

/** Chance a bot guesses right from this many surviving clues. */
export function rightChance(survivorCount: number, skill: BotSkill): number {
  if (survivorCount === 0) return 0
  const [base, perClue] = skill === 'sharp' ? [0.5, 0.15] : [0.25, 0.1]
  return Math.min(0.9, base + perClue * survivorCount)
}

/** A bot guesser's move: pass with no clues left, otherwise the word or (on a miss) some other mystery word. */
export function botGuess(word: string, survivorCount: number, skill: BotSkill, random: () => number): DontJinxItInput {
  if (survivorCount === 0) return { type: 'pass' }
  if (random() < rightChance(survivorCount, skill)) return { type: 'guess', word }
  const others = MYSTERY_WORDS.filter((other) => other !== word)
  return { type: 'guess', word: others[Math.floor(random() * others.length)] }
}
