// ABOUTME: Games that can be playtested in Solo play at #/playtest/<game-id>, for signed-in players.
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
  'dont-jinx-it': {
    title: "Don't Jinx It",
    Page: lazy(() => import('../games/dont-jinx-it/Playtest').then((module) => ({ default: module.Playtest }))),
  },
  'pin-drop': {
    title: 'Pin Drop',
    Page: lazy(() => import('../games/pin-drop/Playtest').then((module) => ({ default: module.Playtest }))),
  },
  'pin-drop-together': {
    title: 'Pin Drop with others (two or more phones)',
    Page: lazy(() => import('../games/pin-drop/Together').then((module) => ({ default: module.Together }))),
  },
  'sketch-showdown': {
    title: 'Sketch Showdown',
    Page: lazy(() => import('../games/sketch-showdown/Playtest').then((module) => ({ default: module.Playtest }))),
  },
}
