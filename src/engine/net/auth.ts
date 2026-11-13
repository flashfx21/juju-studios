// ABOUTME: Sign-in for players and hosts: Google (a popup) or a one-time link emailed to them, and sign out.
// ABOUTME: Screens call these instead of Firebase directly; each returns a plain outcome the screen can word.

import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { firebaseBackend } from './firebase'

export interface SignedInPlayer {
  uid: string
  email: string
}

export type GoogleSignInOutcome = 'signed-in' | 'cancelled' | 'popup-blocked' | 'failed'
export type SendLinkOutcome = 'sent' | 'daily-limit' | 'failed'
export type FinishLinkOutcome = 'signed-in' | 'expired' | 'wrong-email' | 'failed'

function errorCode(error: unknown): string {
  return error instanceof FirebaseError ? error.code : ''
}

/** Calls back now with who is signed in on this device (null for nobody), and again on every change. Returns a stop function. */
export function watchSignedInPlayer(onChange: (player: SignedInPlayer | null) => void): () => void {
  return onAuthStateChanged(firebaseBackend().auth, (user) => {
    onChange(user ? { uid: user.uid, email: user.email ?? '' } : null)
  })
}

/** Who is signed in on this device right now, or null. Settled once watchSignedInPlayer has called back. */
export function signedInPlayer(): SignedInPlayer | null {
  const user = firebaseBackend().auth.currentUser
  return user ? { uid: user.uid, email: user.email ?? '' } : null
}

/** Opens Google's account picker. Call it straight from a tap, or the browser may block the popup. */
export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  try {
    await signInWithPopup(firebaseBackend().auth, new GoogleAuthProvider())
    return 'signed-in'
  } catch (error) {
    const code = errorCode(error)
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'cancelled'
    if (code === 'auth/popup-blocked') return 'popup-blocked'
    console.error('Google sign-in failed', error)
    return 'failed'
  }
}

/** The page a sign-in link opens: the front of this site, wherever it is served from. */
function linkLandingPage(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

/** Emails a one-time sign-in link. The free plan allows only a few of these a day for the whole site. */
export async function emailSignInLink(email: string): Promise<SendLinkOutcome> {
  try {
    await sendSignInLinkToEmail(firebaseBackend().auth, email, { url: linkLandingPage(), handleCodeInApp: true })
    return 'sent'
  } catch (error) {
    if (errorCode(error) === 'auth/quota-exceeded') return 'daily-limit'
    console.error('Sending the sign-in link failed', error)
    return 'failed'
  }
}

/** True if this address is a sign-in link from the email. */
export function isEmailSignInLink(address: string): boolean {
  return isSignInWithEmailLink(firebaseBackend().auth, address)
}

/** Signs in with the link from the email. The email must be the one the link was sent to. */
export async function finishEmailSignIn(email: string, link: string): Promise<FinishLinkOutcome> {
  try {
    await signInWithEmailLink(firebaseBackend().auth, email, link)
    return 'signed-in'
  } catch (error) {
    const code = errorCode(error)
    if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') return 'expired'
    if (code === 'auth/invalid-email') return 'wrong-email'
    console.error('Finishing the sign-in link failed', error)
    return 'failed'
  }
}

export function signOutOfThisDevice(): Promise<void> {
  return signOut(firebaseBackend().auth)
}
