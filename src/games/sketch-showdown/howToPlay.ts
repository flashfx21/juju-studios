// ABOUTME: The words on Sketch Showdown's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with docs/games/05-sketch-showdown.md and the room's settings in Together.tsx.
import type { HowToPlay } from '../types'

export const howToPlay: HowToPlay = {
  intro: 'Two teams, one clue, two drawers. First team to guess it wins the round.',
  needs: [
    "Drawers draw on their phone. Guessers watch their own drawer's sketch live on theirs and type guesses.",
    'Sit with your team, away from the other team.',
  ],
  steps: [
    'Players split into two teams. Each round, one player on each team draws.',
    'Both drawers see the same 3 clues and pick one in 15 seconds. Different picks? A coin flip decides.',
    'After a 5 second countdown, both drawers start at the same moment.',
    'Guessers see only their own drawing and type as many guesses as they like. No hints, no letter counts.',
    'The first right guess wins the round for that team. Both drawings freeze.',
    'Both drawings go up side by side with the answer. Then the next drawers are up.',
  ],
  scoring: [
    'The team with more rounds won wins the game.',
    'Level after the last round? Sudden death: each team votes for a drawer and plays one more round.',
    'Every game is worth 100 leaderboard points: the winning team shares 80 and the other team shares 20.',
  ],
  goodToKnow: [
    'A wrong guess makes you wait 2 seconds before your next one.',
    'Near misses in spelling count, and so do plurals. Part of the answer does not: "house" is not lighthouse.',
    'Drawers never guess.',
    'Only 2 or 3 of you? Two bots join as the other team. A game with 2 people is practice and is not saved to the leaderboard.',
    'Drawing tools: a brush in 4 sizes, 16 colors, eraser, straight line, undo, and press and hold to clear.',
  ],
  hostPicks: ['Turns: draw once or draw twice', 'Pace: 90 s, 2 min or 3 min a round'],
}
