// ABOUTME: Lets the page around a game offer a way out: when set, every phone frame inside it shows an Exit game button.
// ABOUTME: Holds what leaving does (forget a room, go back to Solo play); null outside games.
import { createContext } from 'react'

export const GameExitContext = createContext<(() => void) | null>(null)
