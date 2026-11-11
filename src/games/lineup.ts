// ABOUTME: The full game lineup shown in the game picker, in picker order, with each game's status.
// ABOUTME: Ids match docs/games/<id>.md. A game becomes "playable" only after its tests pass and a local playtest.

export type GameStatus = 'playable' | 'coming-soon'

export interface LineupGame {
  id: string
  title: string
  tag: string
  pitch: string
  status: GameStatus
  /** The marquee coming-soon game gets a larger teaser tile. */
  teaser?: boolean
}

/** The first six fill the picker's large tiles; the rest sit in the coming-soon row. */
export const LINEUP: LineupGame[] = [
  {
    id: 'no-filler',
    title: 'No Filler',
    tag: 'Party',
    pitch: 'Name 3 before time runs out. No um, no uh, no like.',
    status: 'coming-soon',
  },
  {
    id: 'dial-it-in',
    title: 'Dial It In',
    tag: 'Brainy',
    pitch: 'Guess where the clue lands between two opposites, 1 to 100.',
    status: 'coming-soon',
  },
  {
    id: 'closest-without-going-over',
    title: 'Closest Without Going Over',
    tag: 'Game show',
    pitch: 'Guess the price, year or number. Closest without going over.',
    status: 'coming-soon',
  },
  {
    id: 'chainword',
    title: 'Chainword',
    tag: 'Words',
    pitch: 'Race a chain of words in hard mode. Fewest guesses wins.',
    status: 'coming-soon',
  },
  {
    id: 'sketch-showdown',
    title: 'Sketch Showdown',
    tag: 'Teams',
    pitch: 'Two teams, one clue, two drawers. First team to guess wins.',
    status: 'coming-soon',
  },
  {
    id: 'pin-drop',
    title: 'Pin Drop',
    tag: 'Travel',
    pitch: 'A photo appears. Drop your pin on the map. Closest wins.',
    status: 'coming-soon',
  },
  {
    id: 'hidden-traitor',
    title: 'Hidden traitor game',
    tag: 'Bluff',
    pitch: 'Grow the prize pot together while secret traitors sabotage. Banish them.',
    status: 'coming-soon',
    teaser: true,
  },
  {
    id: 'word-agents',
    title: 'Word Agents',
    tag: 'Teams',
    pitch: 'Two teams, one grid of words, spymasters give one-word clues.',
    status: 'coming-soon',
  },
  {
    id: 'board-game',
    title: 'Curated board game',
    tag: 'Family',
    pitch: 'Race start to finish with life choices, careers and events along the way.',
    status: 'coming-soon',
  },
  {
    id: 'maze-chase',
    title: 'Maze chase',
    tag: 'Action',
    pitch: 'A chase through a maze on the TV; steer from your phone.',
    status: 'coming-soon',
  },
  {
    id: 'snake-arena',
    title: 'Snake arena',
    tag: 'Action',
    pitch: 'Everyone steers a snake on one shared screen.',
    status: 'coming-soon',
  },
  {
    id: 'one-word-clue',
    title: 'One-word clue game',
    tag: 'Words',
    pitch: 'Give one-word clues to the guesser. Matching clues cancel out.',
    status: 'coming-soon',
  },
]
