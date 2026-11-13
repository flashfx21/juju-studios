// ABOUTME: The full game lineup shown in the game picker, in lineup-number order, with each game's phase and status.
// ABOUTME: Ids match docs/games/<nn>-<id>.md, where nn is the game's lineup number. A game becomes "playable" only after its tests pass and a local playtest.

export type GameStatus = 'playable' | 'coming-soon'

/** The phases in docs/games/README.md. Keep each game's phase in step with its spec. */
export type GamePhase = 'not-started' | 'design' | 'development' | 'solo-test' | 'group-test' | 'production'

export interface LineupGame {
  id: string
  /** The two-digit lineup number from docs/games ("06"). */
  number: string
  phase: GamePhase
  title: string
  tag: string
  pitch: string
  status: GameStatus
  /** The marquee coming-soon game gets a larger teaser tile. */
  teaser?: boolean
}

/** In lineup-number order; the picker shows them six to a page. */
export const LINEUP: LineupGame[] = [
  {
    id: 'no-filler',
    number: '01',
    phase: 'design',
    title: 'No Filler',
    tag: 'Party',
    pitch: 'Name 3 before time runs out. No um, no uh, no like.',
    status: 'coming-soon',
  },
  {
    id: 'dial-it-in',
    number: '02',
    phase: 'development',
    title: 'Dial It In',
    tag: 'Brainy',
    pitch: 'Guess where the clue lands between two opposites, 1 to 100.',
    status: 'coming-soon',
  },
  {
    id: 'closest-without-going-over',
    number: '03',
    phase: 'not-started',
    title: 'Closest Without Going Over',
    tag: 'Game show',
    pitch: 'Guess the price, year or number. Closest without going over.',
    status: 'coming-soon',
  },
  {
    id: 'chainword',
    number: '04',
    phase: 'development',
    title: 'Chainword',
    tag: 'Words',
    pitch: 'Race a chain of hidden words. Fewest guesses wins.',
    status: 'coming-soon',
  },
  {
    id: 'sketch-showdown',
    number: '05',
    phase: 'development',
    title: 'Sketch Showdown',
    tag: 'Teams',
    pitch: 'Two teams, one clue, two drawers. First team to guess wins.',
    status: 'coming-soon',
  },
  {
    id: 'pin-drop',
    number: '06',
    phase: 'development',
    title: 'Pin Drop',
    tag: 'Travel',
    pitch: 'A photo appears. Drop your pin on the map. Closest wins.',
    status: 'coming-soon',
  },
  {
    id: 'hidden-traitor',
    number: '07',
    phase: 'not-started',
    title: 'Hidden traitor game',
    tag: 'Bluff',
    pitch: 'Grow the prize pot together while secret traitors sabotage. Banish them.',
    status: 'coming-soon',
    teaser: true,
  },
  {
    id: 'word-agents',
    number: '08',
    phase: 'not-started',
    title: 'Word Agents',
    tag: 'Teams',
    pitch: 'Two teams, one grid of words, spymasters give one-word clues.',
    status: 'coming-soon',
  },
  {
    id: 'board-game',
    number: '09',
    phase: 'not-started',
    title: 'Curated board game',
    tag: 'Family',
    pitch: 'Race start to finish with life choices, careers and events along the way.',
    status: 'coming-soon',
  },
  {
    id: 'maze-chase',
    number: '10',
    phase: 'not-started',
    title: 'Maze chase',
    tag: 'Action',
    pitch: 'A chase through a maze on the TV; steer from your phone.',
    status: 'coming-soon',
  },
  {
    id: 'snake-arena',
    number: '11',
    phase: 'not-started',
    title: 'Snake arena',
    tag: 'Action',
    pitch: 'Everyone steers a snake on one shared screen.',
    status: 'coming-soon',
  },
  {
    id: 'dont-jinx-it',
    number: '12',
    phase: 'development',
    title: "Don't Jinx It",
    tag: 'Words',
    pitch: 'Give one-word clues to the guesser. Matching clues cancel out.',
    status: 'coming-soon',
  },
]
