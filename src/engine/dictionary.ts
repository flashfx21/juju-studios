// ABOUTME: The shared English word list (ENABLE, packs/shared/english-words.txt) any game can check words against.
// ABOUTME: Downloads on first use as its own file, so games that never ask for it never fetch it.

export interface Dictionary {
  /** True if the word is in the list. Ignores case and spaces around the word. */
  has(word: string): boolean
}

let loading: Promise<Dictionary> | null = null

/** Loads the word list once; later calls get the same dictionary. A failed download is retried on the next call. */
export function loadDictionary(): Promise<Dictionary> {
  loading ??= import('../../packs/shared/english-words.txt?raw')
    .then(({ default: text }) => {
      const words = new Set(text.split(/\r?\n/).filter(Boolean))
      return { has: (word: string) => words.has(word.trim().toLowerCase()) }
    })
    .catch((error: unknown) => {
      loading = null
      throw error
    })
  return loading
}
