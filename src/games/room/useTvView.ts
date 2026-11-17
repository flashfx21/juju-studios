// ABOUTME: What the host published for the room's TV, kept up to date: null until the first one arrives.
// ABOUTME: For games whose TV screen needs more than the room's public game (a drawing, a pile of clues).
import { useEffect, useState } from 'react'
import { watchTvView } from '../../engine/net/rooms'

export function useTvView<View>(code: string): View | null {
  const [view, setView] = useState<View | null>(null)
  useEffect(() => watchTvView(code, (value) => setView(value as View | null)), [code])
  return view
}
