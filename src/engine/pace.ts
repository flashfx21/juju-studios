// ABOUTME: Pace, the one name every game uses for its timer setting: Quick, Normal (the default) or Relaxed.
// ABOUTME: Each game sets its own seconds for each pace; the names and the host's labels come from here.

export type Pace = 'quick' | 'normal' | 'relaxed'

export const PACES: readonly Pace[] = ['quick', 'normal', 'relaxed']

export const DEFAULT_PACE: Pace = 'normal'

export const PACE_NAMES: Record<Pace, string> = { quick: 'Quick', normal: 'Normal', relaxed: 'Relaxed' }

/** "45 s" under 2 minutes, "2 min" or "2.5 min" from there. */
export function secondsText(seconds: number): string {
  return seconds < 120 ? `${seconds} s` : `${Math.round((seconds / 60) * 10) / 10} min`
}

/** The host's labels, each pace with its time: "Quick 45 s". */
export function paceLabels(seconds: Record<Pace, number>): Record<Pace, string> {
  return {
    quick: `${PACE_NAMES.quick} ${secondsText(seconds.quick)}`,
    normal: `${PACE_NAMES.normal} ${secondsText(seconds.normal)}`,
    relaxed: `${PACE_NAMES.relaxed} ${secondsText(seconds.relaxed)}`,
  }
}

/** The How to play line: "Pace: Quick, Normal or Relaxed (45, 60 or 90 seconds a round)". */
export function paceHowToPlay(seconds: Record<Pace, number>, per: string): string {
  const times = PACES.map((pace) => secondsText(seconds[pace]))
  return `Pace: Quick, Normal or Relaxed (${times[0]}, ${times[1]} or ${times[2]} ${per})`
}
