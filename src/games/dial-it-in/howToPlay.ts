// ABOUTME: The words on Dial It In's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with rules.ts (closeness points) and the room's settings in Together.tsx.
import type { HowToPlay } from '../types'

export const howToPlay: HowToPlay = {
  intro: 'Two opposites, one hidden number. One player gives a clue, and everyone guesses where it lands.',
  needs: [
    'Everyone guesses on their own phone, so the loudest person never decides.',
    "No TV? Every phone shows the card, and the host's phone runs the game.",
  ],
  steps: [
    'Each round, one player is the clue giver. Everyone takes a turn.',
    'A card shows two opposites, like Cold and Hot, on a dial from 1 to 100.',
    'Only the clue giver sees the secret target number.',
    "The clue giver says a clue out loud that lands near the target. Not the number!",
    'Everyone else turns the dial (or types a number) and sends their guess. A guess is final.',
    'Time runs out or everyone has guessed: the target is revealed and points go up.',
  ],
  scoring: [
    'A bullseye scores 10. Every 2 numbers away costs a point (every 1 number on the 1 to 50 dial), down to 0.',
    "No guess scores 0. The clue giver doesn't score in their own round.",
    'Most points after the last round wins.',
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    'Turn the dial clockwise to go up and counterclockwise to go down. It stops at 1 and at the top number.',
    'The 1 to 50 dial is easier: every guess is closer to the target.',
  ],
  hostPicks: ['Range: 1 to 100 or 1 to 50', 'Turns each: 1, 2 or 3', 'Seconds to guess: 60, 90 or 2 min'],
}
