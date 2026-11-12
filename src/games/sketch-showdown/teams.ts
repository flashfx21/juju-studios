// ABOUTME: Sketch Showdown's team names, colors and badge shapes, by team index.
// ABOUTME: Names are placeholders until Julian picks this game's pair; badges differ by shape as well as color.

export interface TeamLook {
  name: string
  color: string
  /** Text color on the team color. */
  ink: string
  badge: string
}

export const TEAM_LOOKS: readonly [TeamLook, TeamLook] = [
  { name: 'Pencils', color: '#1f5fa8', ink: '#ffffff', badge: '●' },
  { name: 'Crayons', color: '#b02a5b', ink: '#ffffff', badge: '◆' },
]
