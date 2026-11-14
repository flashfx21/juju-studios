// ABOUTME: The words on Chainword's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with docs/games/04-chainword.md and the room's settings in Together.tsx.
import type { HowToPlay } from '../types'

export const howToPlay: HowToPlay = {
  intro: 'Race through a chain of hidden words. Fewest guesses wins.',
  needs: [
    'Everyone guesses on their own phone. The TV shows colored squares and counts, never letters.',
    'No TV? Every phone shows your place and how many have finished.',
  ],
  steps: [
    'Everyone gets the same chain of hidden words.',
    'Type a guess on the keyboard. It has to be a real word with the right number of letters.',
    "Green: right letter, right spot. Yellow: in the word, wrong spot. Gray: not in the word.",
    'You get 6 guesses a word. Solve it and move on to the next word. Miss it and it counts as 7.',
    'The chain has a clock: 100 seconds a word. When it runs out, every word you have left counts as 7.',
    "Finished a word? Tap it in the chain bar to see everyone's guesses on it.",
  ],
  scoring: [
    'Your guesses add up across the chain. Fewest wins.',
    'Tied? The faster time wins.',
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    "A guess that isn't a word doesn't count, and your phone says why.",
    'Hard mode: green letters stay in place, and every letter you have found must be used again.',
    'The host can end the game early. Words not finished count as 7.',
  ],
  hostPicks: ['Letters: 4, 5, 6 or 7', 'Words: 3 or 5', 'Hard mode: on or off'],
}
