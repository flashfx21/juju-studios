// ABOUTME: The words on Dibs' How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with docs/games/13-dibs.md and the room's settings in Together.tsx.
import { paceHowToPlay } from '../../engine/pace'
import type { HowToPlay } from '../types'
import { PACE_SECONDS } from './paceSeconds'

export const howToPlay: HowToPlay = {
  intro: 'A category, then a letter. Race to claim an answer that fits. First claim keeps it.',
  needs: ["Every phone shows the category, the letter and the answers. The host's phone runs the game."],
  steps: [
    'A category appears, then a letter.',
    'Race to type one answer that fits and starts with the letter.',
    'If someone already claimed it, your phone says Taken. Try another. The clock keeps running.',
    "No answer? Tap I'm out.",
    "When everyone's in, all answers are revealed.",
    "Think an answer doesn't fit? Challenge it. Everyone votes. A tie goes to the answer.",
  ],
  scoring: [
    'Any good answer scores 2. The first three good answers score 5, 4 and 3.',
    'An answer voted out scores 0, and everyone after it moves up.',
    'A failed challenge costs you 1 point. A total never drops below 0.',
    'Most points after the last round wins. A tie goes to the most rounds with the first good answer.',
    "With 2 players, the person challenged votes too, so an answer is only thrown out if you both agree. A 2-player game is practice and isn't saved.",
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    'Letter rule: skip "The", "A" or "An" at the start. Everybody Loves Raymond counts for E. People count by the name as you type it.',
    'No padding: Rotten banana is still a banana.',
    'Spell out numbers: Seven Up for S.',
    'No Q, U, V, X, Y or Z, and no letter comes up twice in a game.',
  ],
  hostPicks: [
    paceHowToPlay(PACE_SECONDS, 'to race'),
    'Rounds: 5, 7 or 9',
    'Categories: Family only, or Everything (adds grown-up topics, never explicit)',
    'Deal again: a new letter, until the first answer is in. The round still counts once.',
  ],
}
