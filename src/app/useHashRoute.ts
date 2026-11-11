// ABOUTME: Reads the current screen from the URL hash (e.g. #/settings) and follows changes.
// ABOUTME: Hash URLs work on GitHub Pages without server rewrites, and survive a refresh.
import { useEffect, useState } from 'react'

export type Route = 'home' | 'settings'

function routeFromHash(hash: string): Route {
  return hash === '#/settings' ? 'settings' : 'home'
}

export const routeHref: Record<Route, string> = {
  home: '#/',
  settings: '#/settings',
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
