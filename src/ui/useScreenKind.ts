// ABOUTME: Decides whether this device gets the big-screen (TV) or phone version of a screen.
// ABOUTME: Wide landscape windows count as a TV, so a laptop shows the TV view; everything else is a phone.
import { useEffect, useState } from 'react'

export type ScreenKind = 'tv' | 'phone'

const TV_QUERY = '(min-width: 900px) and (orientation: landscape)'

function currentKind(): ScreenKind {
  return window.matchMedia(TV_QUERY).matches ? 'tv' : 'phone'
}

export function useScreenKind(): ScreenKind {
  const [kind, setKind] = useState(currentKind)

  useEffect(() => {
    const query = window.matchMedia(TV_QUERY)
    const onChange = () => setKind(currentKind())
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return kind
}
