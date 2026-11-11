// ABOUTME: The address people type on their phone to reach this site, shown where the design has QR codes.
// ABOUTME: Built from the current page, so it is right on GitHub Pages and on a local dev server alike.

/** e.g. "flashfx21.github.io/juju-studios" */
export function siteAddress(): string {
  const path = window.location.pathname.replace(/\/(index\.html)?$/, '')
  return window.location.host + path
}
