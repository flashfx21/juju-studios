// ABOUTME: Games with a How to play page at #/how-to-play/<game-id>, in lineup order, with the facts the page shows.
// ABOUTME: Each game's words live in its own howToPlay.ts; title, tag, players and length come from its manifest.
import { howToPlay as chainword } from '../games/chainword/howToPlay'
import { manifest as chainwordManifest } from '../games/chainword/manifest'
import { howToPlay as dialItIn } from '../games/dial-it-in/howToPlay'
import { manifest as dialItInManifest } from '../games/dial-it-in/manifest'
import { howToPlay as dontJinxIt } from '../games/dont-jinx-it/howToPlay'
import { manifest as dontJinxItManifest } from '../games/dont-jinx-it/manifest'
import { LINEUP } from '../games/lineup'
import { howToPlay as pinDrop } from '../games/pin-drop/howToPlay'
import { manifest as pinDropManifest } from '../games/pin-drop/manifest'
import { howToPlay as sketchShowdown } from '../games/sketch-showdown/howToPlay'
import { manifest as sketchShowdownManifest } from '../games/sketch-showdown/manifest'
import type { GameManifest, HowToPlay } from '../games/types'

export interface HowToPlayPage {
  manifest: GameManifest
  words: HowToPlay
}

const PAGES: Record<string, HowToPlayPage> = {
  'dial-it-in': { manifest: dialItInManifest, words: dialItIn },
  chainword: { manifest: chainwordManifest, words: chainword },
  'sketch-showdown': { manifest: sketchShowdownManifest, words: sketchShowdown },
  'pin-drop': { manifest: pinDropManifest, words: pinDrop },
  'dont-jinx-it': { manifest: dontJinxItManifest, words: dontJinxIt },
}

export function howToPlayFor(gameId: string): HowToPlayPage | undefined {
  return PAGES[gameId]
}

/** Every game with a page, in lineup order. */
export const HOW_TO_PLAY_GAMES = LINEUP.filter((game) => game.id in PAGES)

/** "Travel · 2 to 10 players · about 12 min" */
export function gameFacts({ manifest }: HowToPlayPage): string {
  return `${manifest.tag} · ${manifest.players.min} to ${manifest.players.max} players · about ${manifest.minutes} min`
}
