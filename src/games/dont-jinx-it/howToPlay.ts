// ABOUTME: The words on Don't Jinx It's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: The steps also appear on the big-screen Instructions; keep in step with rules.ts and Together.tsx.
import type { HowToPlay } from '../types'

export const howToPlay: HowToPlay = {
  intro: 'One player guesses a mystery word. Everyone else gives a one-word clue, and matching clues cancel out.',
  needs: [
    'Everyone plays on their own phone. The guesser sees only the clues that survive.',
    "No TV? The host's phone runs the game.",
  ],
  steps: [
    'One player guesses. Everyone else sees the word.',
    'Everyone else writes a one-word clue.',
    'Any clue written twice gets jinxed.',
    'Guess from what survives.',
  ],
  scoring: [
    'Right guess: the guesser gets 2, and everyone whose clue survived gets 1.',
    'Most points after everyone has guessed wins.',
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    "Table rule: react, but don't say any words.",
    'Close matches are jinxed too, like towel and towels, or run and ran.',
    'The guesser gets one guess a turn, or can pass.',
    'Hard word? Writers can skip it once a turn, in the first 15 seconds.',
    'With 3 players, each writer gives 2 clues.',
  ],
  hostPicks: [
    'Pace: Quick, Normal or Relaxed (45, 60 or 90 seconds to write)',
    'Everyone guesses: once or twice',
  ],
}
