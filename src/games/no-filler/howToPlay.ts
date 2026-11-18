// ABOUTME: The words on No Filler's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with docs/games/01-no-filler.md and the room's settings in Together.tsx.
import type { HowToPlay } from '../types'

export const howToPlay: HowToPlay = {
  intro: 'Name 3 things in the category before time runs out, with no um, uh, er or like.',
  needs: [
    'The TV shows the card, the clock and the scores. No TV? The card and the scores are on every phone too.',
    "You speak out loud. Phones pick the card and take the votes. The host's phone runs the game.",
  ],
  steps: [
    'On your turn, pick Easy (1 point), Medium (2 points) or Hard (3 points).',
    'A card appears and the clock starts. Name 3 things that fit.',
    'No um, uh, er or like.',
    'Everyone else votes Clean or Filler. A tie goes to you.',
    "Clean scores the card's points. Filler scores 0.",
    'When someone reaches the target, the round finishes. Most points wins.',
  ],
  scoring: [
    'Clean scores the card: Easy 1, Medium 2, Hard 3. Filler scores 0.',
    'The game ends after the round in which someone reaches the target, so everyone gets the same number of turns.',
    'A tie for first plays one sudden-death round: only the tied players, Hard cards only. Still tied after that, they share first.',
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    "It's Filler if you say a filler word, name fewer than 3, give a wrong or repeated answer, or run out of time.",
    'You pick the difficulty before you see the card. No skipping a card.',
    'Tap Done when you have named 3 to stop the clock.',
    "The vote stays open 8 seconds. A vote that isn't in by then doesn't count, and if nobody votes it goes to the speaker.",
    'After each vote, everyone sees who voted what.',
  ],
  hostPicks: [
    'Timer: 5, 10 or 15 seconds to name 3',
    'Target score: 10 or 15',
    'Void turn: no score, and the speaker picks again for a different card (a bad card or an interruption).',
    'Skip turn: the speaker keeps their score and waits for the next round (someone stepped away).',
  ],
}
