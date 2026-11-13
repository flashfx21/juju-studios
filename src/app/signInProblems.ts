// ABOUTME: What to tell someone when a sign-in step doesn't work, one message per outcome.
// ABOUTME: Shared by Sign in and Join so both word the same problem the same way.
import type { FinishLinkOutcome, GoogleSignInOutcome, SendLinkOutcome } from '../engine/net/auth'

type Problem = Exclude<GoogleSignInOutcome | SendLinkOutcome | FinishLinkOutcome, 'signed-in' | 'sent'>

const MESSAGES: Record<Problem, string> = {
  cancelled: '',
  'popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site, then try again.',
  'daily-limit':
    "Today's sign-in emails have run out (the free plan sends only a few a day). Use Google, or try again tomorrow.",
  'wrong-email': "That isn't the email this link was sent to. Check it and try again.",
  expired: 'That sign-in link has expired. Ask for a new one.',
  failed: "Something went wrong signing in. Check you're online and try again.",
}

export function signInProblem(outcome: Problem): string {
  return MESSAGES[outcome]
}
