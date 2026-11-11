// ABOUTME: Turns text into a 32-bit number (FNV-1a hash). Fast and works on any page, including plain http.
// ABOUTME: Not for security: it only keeps a value from being readable at a glance.

export function hashText(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
