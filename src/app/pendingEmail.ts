// ABOUTME: Remembers the email typed on Join or Sign in so "Check your email" can show where the link went.
// ABOUTME: Kept for this browser tab only (sessionStorage), and never sent anywhere.

const KEY = 'juju.pendingEmail'

export function savePendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email)
  } catch {
    // Storage blocked: the next screen falls back to "your email".
  }
}

export function loadPendingEmail(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}
