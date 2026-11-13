// ABOUTME: The username, initials and color being typed on Join, profile setup or Profile, with their checks.
// ABOUTME: Initials follow the username until the player types their own.
import { useState } from 'react'
import type { Profile } from '../engine/net/profiles'
import type { PlayerColorId } from '../ui/playerColors'
import { checkInitials, checkUsername, INITIALS_LENGTH, lettersOnly } from './formRules'

export interface ProfileDraft {
  username: string
  initials: string
  color: PlayerColorId
  errors: { username: string; initials: string }
  changeUsername: (name: string) => void
  changeInitials: (initials: string) => void
  setColor: (color: PlayerColorId) => void
  /** Shows any errors; returns the id suffix of the first bad field ("username" or "initials"), or "". */
  check: (asksInitials: boolean) => string
  /** The draft as a profile to save; initials fall back to the username's letters. */
  toProfile: () => Profile
}

export function useProfileDraft(start: Profile | null): ProfileDraft {
  const [username, setUsername] = useState(start?.username ?? '')
  const [initials, setInitials] = useState(start?.initials ?? '')
  const [initialsEdited, setInitialsEdited] = useState(start !== null)
  const [color, setColor] = useState<PlayerColorId>(start?.color ?? 'red')
  const [errors, setErrors] = useState({ username: '', initials: '' })

  return {
    username,
    initials,
    color,
    errors,
    changeUsername(name) {
      setUsername(name)
      if (!initialsEdited) setInitials(lettersOnly(name, INITIALS_LENGTH))
    },
    changeInitials(value) {
      setInitials(value)
      setInitialsEdited(true)
    },
    setColor,
    check(asksInitials) {
      const noLetters = !initials && !lettersOnly(username, INITIALS_LENGTH)
      const found = {
        username: checkUsername(username) || (noLetters && !asksInitials ? 'Use at least one letter (it makes your initials).' : ''),
        initials: asksInitials ? checkInitials(initials) : '',
      }
      setErrors(found)
      return found.username ? 'username' : found.initials ? 'initials' : ''
    },
    toProfile() {
      return {
        username: username.trim(),
        initials: initials || lettersOnly(username, INITIALS_LENGTH),
        color,
      }
    },
  }
}
