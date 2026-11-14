// ABOUTME: Which game tonight's lobby starts next: the game with the most votes, with a tie settled at random.
// ABOUTME: The random pick is seeded from the votes, so every phone shows the same game for the same votes.
import { hashText } from '../engine/hashText'
import { seededRandom } from '../engine/seededRandom'

export interface LobbyPick {
  game: string
  /** Every game that shared the most votes, in list order, when the pick broke a tie; empty otherwise. */
  tiedWith: string[]
}

/** The next game from the votes (by player id), among the games that can be voted for. Null with no votes. */
export function lobbyPick(votes: Record<string, string>, games: readonly string[]): LobbyPick | null {
  const counts = games.map((game) => ({ game, votes: Object.values(votes).filter((vote) => vote === game).length }))
  const most = Math.max(0, ...counts.map((count) => count.votes))
  if (most === 0) return null
  const leaders = counts.filter((count) => count.votes === most).map((count) => count.game)
  if (leaders.length === 1) return { game: leaders[0], tiedWith: [] }
  const seed = Object.entries(votes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([player, vote]) => `${player}:${vote}`)
    .join('|')
  const random = seededRandom(String(hashText(seed)))
  return { game: leaders[Math.floor(random() * leaders.length)], tiedWith: leaders }
}
