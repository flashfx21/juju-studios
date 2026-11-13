// ABOUTME: The game room this device is in, per game, so a refresh or the home Join screen goes straight into it.
// ABOUTME: Kept on this device (localStorage); a blank code forgets the room.

function key(game: string): string {
  return `juju.room.${game}`
}

export function rememberedRoom(game: string): string {
  try {
    return localStorage.getItem(key(game)) ?? ''
  } catch {
    return ''
  }
}

export function rememberRoom(game: string, code: string) {
  try {
    if (code) localStorage.setItem(key(game), code)
    else localStorage.removeItem(key(game))
  } catch {
    // Storage blocked: a refresh asks for the code again.
  }
}
