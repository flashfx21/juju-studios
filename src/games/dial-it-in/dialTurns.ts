// ABOUTME: The arithmetic behind the safe-style guess dial: turning the face changes the number under the top mark.
// ABOUTME: One full turn covers the whole range; clockwise counts up, and the dial stops at 1 and at the top number.

/** Degrees clockwise from the top of the dial to a point, 0 to 360. */
export function angleFromTop(dx: number, dy: number): number {
  const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI
  return (degrees + 360) % 360
}

/** The shortest turn from one angle to another, -180 to 180; positive is clockwise. */
export function turnBetween(from: number, to: number): number {
  const turn = (((to - from) % 360) + 540) % 360 - 180
  return turn === -180 ? 180 : turn
}

/** Keeps a number within 1 to range: turning past either end stops there, since the ends are opposites on the scale. */
export function clampToRange(value: number, range: number): number {
  return Math.min(range, Math.max(1, value))
}

/** The unrounded number after turning a dial that started at `start` by `degrees` (clockwise positive). */
export function turnedValue(start: number, degrees: number, range: number): number {
  return clampToRange(start + (degrees / 360) * range, range)
}

/** How far the face is turned so `value` sits under the top mark. Numbers run counterclockwise around the face. */
export function faceRotation(value: number, range: number): number {
  return ((value - 1) / range) * 360
}

/** Where `value` is printed on the face, in degrees clockwise from the top of the unturned face. */
export function numberAngle(value: number, range: number): number {
  return -faceRotation(value, range)
}

/** The whole number a turned dial shows, always 1 to range. */
export function shownNumber(value: number, range: number): number {
  return clampToRange(Math.round(value), range)
}
