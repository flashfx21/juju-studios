// ABOUTME: Reads the current screen (and optional step, e.g. #/sign-in/password) from the URL hash.
// ABOUTME: Hash URLs work on GitHub Pages without server rewrites, and survive a refresh.
import { useEffect, useState } from 'react'

export type Screen = 'home' | 'host' | 'sign-in' | 'join' | 'lobby' | 'picker' | 'settings' | 'profile' | 'practice'

export interface Route {
  screen: Screen
  /** The part after the screen name, e.g. "password" in #/sign-in/password. */
  step: string
}

const SCREENS: Screen[] = ['home', 'host', 'sign-in', 'join', 'lobby', 'picker', 'settings', 'profile', 'practice']

function routeFromHash(hash: string): Route {
  const [name = '', step = ''] = hash.replace(/^#\/?/, '').split('/')
  const screen = SCREENS.find((s) => s === name && s !== 'home') ?? 'home'
  return { screen, step: screen === 'home' ? '' : step }
}

/** Link to a screen, optionally at a step: href('sign-in', 'password') is "#/sign-in/password". */
export function href(screen: Screen, step?: string): string {
  if (screen === 'home') return '#/'
  return step ? `#/${screen}/${step}` : `#/${screen}`
}

export function goTo(screen: Screen, step?: string) {
  window.location.hash = href(screen, step)
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => routeFromHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
