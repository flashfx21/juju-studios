// ABOUTME: Remembers the email a sign-in link was sent to, for "Check your email" and to finish the link.
// ABOUTME: Kept on this device (localStorage) because the link often opens in a new tab; cleared once signed in.

const KEY = 'juju.pendingEmail'

export function savePendingEmail(email: string) {
  try {
    localStorage.setItem(KEY, email)
  } catch {
    // Storage blocked: the next screen falls back to "your email", and the link asks for the email again.
  }
}

export function loadPendingEmail(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function clearPendingEmail() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing stored to clear.
  }
}
