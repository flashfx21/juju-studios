// ABOUTME: Which room games have a TV screen, by game id. Games not listed show a "playing on your phones" card on the TV.
// ABOUTME: TvGameScreen.tsx loads each one; keep the two lists in step.

export const TV_GAMES: readonly string[] = ['zero-in']

export function hasTvScreen(game: string): boolean {
  return TV_GAMES.includes(game)
}
