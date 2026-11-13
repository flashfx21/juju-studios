// ABOUTME: Field checks for the sign-in and join forms, each returning an error message or an empty string.
// ABOUTME: Kept loose on purpose: Firebase checks the address when it sends the sign-in link.

export const ROOM_CODE_LENGTH = 4
export const INITIALS_LENGTH = 3
const USERNAME_MIN = 2
const USERNAME_MAX = 16

/** Keeps only letters, upper-cased, up to the given length (room codes and initials). */
export function lettersOnly(value: string, max: number): string {
  return value
    .replace(/[^a-z]/gi, '')
    .toUpperCase()
    .slice(0, max)
}

export function checkEmail(email: string): string {
  if (!email.trim()) return 'Enter your email.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : "That email doesn't look right."
}

export function checkRoomCode(code: string): string {
  return code.length === ROOM_CODE_LENGTH ? '' : `Enter the ${ROOM_CODE_LENGTH}-letter code from the TV.`
}

export function checkUsername(name: string): string {
  const length = name.trim().length
  if (length < USERNAME_MIN) return `Pick a username of at least ${USERNAME_MIN} characters.`
  return length > USERNAME_MAX ? `Keep it to ${USERNAME_MAX} characters.` : ''
}

export function checkInitials(initials: string): string {
  return initials.length > 0 ? '' : 'Enter up to 3 initials.'
}
