// ABOUTME: The playtest code that unlocks unfinished games on a device, stored as a hash so the repo doesn't show it.
// ABOUTME: Keeps casual visitors out, nothing more: anyone reading the site's code could work it out.
import { hashText } from '../engine/hashText'

/** Hash of the current playtest code. To change the code, see README "Playtests". */
const PLAYTEST_CODE_HASH = 4078872567

const STORAGE_KEY = 'juju.playtestUnlocked'

/** Codes are not case-sensitive and ignore spaces around them. */
export function isPlaytestCode(typed: string): boolean {
  return hashText(typed.trim().toLowerCase()) === PLAYTEST_CODE_HASH
}

/** Unlocked devices store the hash, so changing the code locks every device again. */
export function isUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === String(PLAYTEST_CODE_HASH)
  } catch {
    return false
  }
}

export function rememberUnlock() {
  try {
    localStorage.setItem(STORAGE_KEY, String(PLAYTEST_CODE_HASH))
  } catch {
    // Private browsing can block storage; the gate just asks again next time.
  }
}
