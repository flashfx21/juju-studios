// ABOUTME: Which games tonight's lobby could start next: the game with the most votes, or every game tied for the most.
// ABOUTME: A tie is settled by the host's Random button, which picks one of the tied games and starts it.

/** The games with the most votes (by player id), among the games that can be voted for, in list order. Empty with no votes. */
export function mostVoted(votes: Record<string, string>, games: readonly string[]): string[] {
  const counts = games.map((game) => ({ game, votes: Object.values(votes).filter((vote) => vote === game).length }))
  const most = Math.max(0, ...counts.map((count) => count.votes))
  if (most === 0) return []
  return counts.filter((count) => count.votes === most).map((count) => count.game)
}

/** One of the tied games, at random. */
export function randomPick(tied: readonly string[], random: () => number): string {
  return tied[Math.floor(random() * tied.length)]
}
