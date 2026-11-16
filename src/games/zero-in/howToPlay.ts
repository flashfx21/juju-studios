// ABOUTME: The words on Zero In's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with docs/games/03-zero-in.md and the room's settings in Together.tsx.
import { paceHowToPlay } from '../../engine/pace'
import type { HowToPlay } from '../types'
import { PACE_SECONDS } from './rules'

export const howToPlay: HowToPlay = {
  intro: 'Guess a price, a year or a number. The closest guess wins the round, over or under. The final round flips it: don\'t go over.',
  needs: [
    'The TV shows the question and the reveal. Your phone is your private guess.',
    "No TV? Every phone shows the question, and the host's phone runs the game.",
  ],
  steps: [
    'A question appears: an old price, the year something happened, or a number like how many keys are on a piano.',
    'Type your guess on your phone. Whole numbers only. You can change it until you tap Lock it in.',
    'When everyone has locked in, or time runs out, the answer is revealed. A typed guess you never locked still counts.',
    'See how far off everyone was, then the standings. The host taps Next to move on.',
    "The last round is Don't Go Over: the closest guess without going over wins. Go over and you bust.",
  ],
  scoring: [
    'Each round: closest guess 3 points, second 2, third 1. Over or under counts the same.',
    'An exact hit scores 2 more.',
    'Equal guesses share a place, and the next place is skipped.',
    "Final round: double points (6, 4, 2, and 4 more for an exact hit). A guess over the answer scores 0. If everyone goes over, nobody scores.",
    'Most points wins. A tie goes to the most round wins, then the most exact hits.',
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    'Prices are from the year in the question, not today.',
    'No looking it up. The clock is short for a reason.',
  ],
  hostPicks: [paceHowToPlay(PACE_SECONDS, 'to guess'), 'Rounds: 5, 10 or 15', 'Lanes: a mix, or only prices, years or numbers'],
}
