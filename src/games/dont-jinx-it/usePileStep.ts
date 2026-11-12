// ABOUTME: The pile's on-screen steps, shared by the TV clue drop and every phone so they move together.
// ABOUTME: 0 every clue, 1 matches found, 2 jinxed clues stamped, 3 what's left; reduced motion jumps to the end.
import { useEffect, useState } from 'react'

/** One step every this many milliseconds: about 7 s from cards landing to what's left, inside the 10 s pile. */
export const PILE_STEP_MS = 1700
export const LAST_PILE_STEP = 3

export function useReducedMotion(): boolean {
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  return reduced
}

/** Counts up from 0 once mounted. Give the component a key per turn so each pile starts again. */
export function usePileStep(): number {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (reduced || step >= LAST_PILE_STEP) return
    const timeout = setTimeout(() => setStep(step + 1), PILE_STEP_MS)
    return () => clearTimeout(timeout)
  }, [step, reduced])
  return reduced ? LAST_PILE_STEP : step
}
