// ABOUTME: Keeps a game's words, photos or cards from coming back game after game: this device remembers what it dealt,
// ABOUTME: and dealing puts everything not dealt lately first, then the rest from longest ago to most recent.

/** How many ids each game remembers. More than any pack holds today, so a pack is used up before anything repeats. */
const REMEMBERED = 1000

function storageKey(game: string): string {
  return `juju.recentlyDealt.${game}`
}

/** Ids this device dealt for the game, oldest first. Empty when nothing is saved or storage is blocked. */
export function recentlyDealt(game: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey(game)) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Adds the ids just dealt, as the most recent. */
export function rememberDealt(game: string, ids: readonly string[]): void {
  const dealt = new Set(ids)
  const kept = [...recentlyDealt(game).filter((id) => !dealt.has(id)), ...dealt].slice(-REMEMBERED)
  try {
    localStorage.setItem(storageKey(game), JSON.stringify(kept))
  } catch {
    // Storage is blocked (a private window): games still deal at random, they just may repeat.
  }
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * A dealing order for a pack: items not in `recent` first, shuffled; then recent ones, longest ago first.
 * `recent` is oldest first, as recentlyDealt returns it. With nothing recent this is a plain shuffle.
 */
export function freshFirst<T>(items: readonly T[], idOf: (item: T) => string, recent: readonly string[], random: () => number): T[] {
  const when = new Map(recent.map((id, i) => [id, i]))
  const fresh = shuffled(
    items.filter((item) => !when.has(idOf(item))),
    random,
  )
  const seen = items.filter((item) => when.has(idOf(item))).sort((a, b) => when.get(idOf(a))! - when.get(idOf(b))!)
  return [...fresh, ...seen]
}
