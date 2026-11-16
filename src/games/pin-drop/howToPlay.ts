// ABOUTME: The words on Pin Drop's How to play page: what you need, the steps, scoring and the host's settings.
// ABOUTME: Keep in step with docs/games/06-pin-drop.md and the room's settings in Together.tsx.
import { paceHowToPlay } from '../../engine/pace'
import type { HowToPlay } from '../types'
import { PACE_SECONDS } from './paceSeconds'

export const howToPlay: HowToPlay = {
  intro: 'A photo of a real place appears. Drop your pin where you think it is. Closest wins.',
  needs: [
    'The TV shows the photo. Your phone shows a world map.',
    "No TV? Every phone shows the photo above the map, and the host's phone runs the game.",
  ],
  steps: [
    "A photo appears. It's a real place somewhere in the world: a landmark, a mountain, a city street, a market.",
    'Tap the map to drop your pin. Drag it to move it, and pinch to zoom.',
    "Tap Lock in when you're sure. Locking in is optional, but you can't change your pin after.",
    'When time runs out, whatever pin you placed counts, locked or not. No pin, no points.',
    'The answer is revealed. Pins drop from farthest to closest, each with its distance.',
    'Check your distance and place on your phone, then see the standings.',
    'Photos start easy (world-famous places) and get harder (few clues) as the game goes on.',
  ],
  scoring: [
    'Match play (usual): each round, the closest pin gets the most points and the farthest gets 1. No pin gets 0. Most points after the last round wins.',
    'Stroke play: your distances add up across rounds. Lowest total wins. A missed round counts as half the world away.',
    'Every game is worth 100 leaderboard points, shared out by finishing place.',
  ],
  goodToKnow: [
    "Bad photo? You get one flag per game. Flag a photo that's blurry or gives nothing away and it won't come up again. Your score doesn't change.",
    'Distances are measured in a straight line over the curve of the earth.',
    'Photos are from Wikimedia Commons. Credits show on each photo.',
  ],
  hostPicks: [
    'Scoring: Match or Stroke',
    'Rounds: 5, 7 or 9',
    paceHowToPlay(PACE_SECONDS, 'a round'),
    'Units: miles or km',
    'Map labels: on or off',
  ],
}
