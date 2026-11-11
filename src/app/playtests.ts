// ABOUTME: Games that can be playtested at #/playtest/<game-id>, behind the playtest code.
// ABOUTME: Each page loads only when opened, so its code and word lists stay out of the main download.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export const PLAYTESTS: Record<string, { title: string; Page: LazyExoticComponent<ComponentType> }> = {
  chainword: {
    title: 'Chainword',
    Page: lazy(() => import('../games/chainword/Playtest').then((module) => ({ default: module.Playtest }))),
  },
  'dial-it-in': {
    title: 'Dial It In',
    Page: lazy(() => import('../games/dial-it-in/Playtest').then((module) => ({ default: module.Playtest }))),
  },
}
