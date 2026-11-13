// ABOUTME: Which page each room game plays on, so Join, the lobby and a switching room know where to send a phone.
// ABOUTME: Pages are Solo play pages (#/playtest/<page>) while the games are in testing; the lobby has its own screen.

/** Game id to its room page. Games not listed can't be played in a room yet. */
const ROOM_PAGES: Record<string, string> = {
  'pin-drop': 'pin-drop-together',
  chainword: 'chainword-together',
}

export function roomPageFor(game: string): string | undefined {
  return ROOM_PAGES[game]
}

export const ROOM_GAMES = Object.keys(ROOM_PAGES)
