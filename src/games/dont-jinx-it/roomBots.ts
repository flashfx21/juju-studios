// ABOUTME: Don't Jinx It bots for rooms: they write clues from a hand-made list for each mystery word,
// ABOUTME: and guess by matching the surviving clues against those lists. A bot guesser never sees the word.
import botCluePack from '../../../packs/dont-jinx-it/bot-clues.json'
import { sameWordForm } from '../../engine/wordForms'
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

/** Chance a casual bot settles on a runner-up instead of its best match. */
export const CASUAL_SLIP_CHANCE = 0.4

/**
 * Every candidate word that any surviving clue points to, best first. A clue points to a word when it, or another
 * form of it, is on that word's clue list; clues higher on the list (the more obvious ones) count for more.
 */
export function rankGuesses(survivors: readonly string[], candidates: readonly string[]): { word: string; score: number }[] {
  const clues = survivors.map((clue) => clue.toLowerCase())
  return candidates
    .map((word) => {
      const listed = BOT_CLUES[word] ?? []
      const score = clues.reduce((sum, clue) => {
        const index = listed.findIndex((entry) => sameWordForm(entry, clue))
        return index === -1 ? sum : sum + listed.length - index
      }, 0)
      return { word, score }
    })
    .filter((ranked) => ranked.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * A bot guesser's move, from the surviving clues and the words it could be (the deck, less words already played).
 * Pass with no clues left. Sharp bots take the best match; casual bots sometimes take a runner-up.
 * When no clue points anywhere, the bot guesses blind, as a person would: a miss costs nothing.
 */
export function botGuess(survivors: readonly string[], skill: BotSkill, random: () => number, candidates: readonly string[] = MYSTERY_WORDS): DontJinxItInput {
  if (survivors.length === 0) return { type: 'pass' }
  const ranked = rankGuesses(survivors, candidates)
  if (ranked.length === 0) return { type: 'guess', word: candidates[Math.floor(random() * candidates.length)] }
  const best = ranked.filter((entry) => entry.score === ranked[0].score)
  const pool = skill === 'casual' && random() < CASUAL_SLIP_CHANCE ? ranked.slice(0, 3) : best
  return { type: 'guess', word: pool[Math.floor(random() * pool.length)].word }
}
