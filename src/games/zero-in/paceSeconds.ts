// ABOUTME: How long each pace gives in Zero In.
// ABOUTME: Kept apart from the rules so a page that only shows the times doesn't load the rules and their pack.
import type { Pace } from '../../engine/pace'

/** Seconds to guess at each pace. */
export const PACE_SECONDS: Record<Pace, number> = { quick: 20, normal: 30, relaxed: 45 }
