# JuJu Studios project memory

## Key Decisions
- 2026-11-11: Folder structure follows `docs/juju-engine-tech-stack-0852.md` section 4. Empty folders hold `.gitkeep`.
- 2026-11-11: Deploy via GitHub Actions (`.github/workflows/deploy.yml`) to https://flashfx21.github.io/juju-studios/. Pages source set to "GitHub Actions". Vite `base` is `/juju-studios/`.
- 2026-11-11: Theme tokens copied from `docs/design/tokens/themes.css` into `src/ui/themes/themes.css`. If the design tokens change, re-copy and keep the two ABOUTME lines at the top.
- 2026-11-11: Holding page shows the package.json version (requirements: version number on screen) and follows the active lobby style.
- 2026-11-11: UI work goes ahead of the Firebase and sign-in decisions (Julian's call). Host settings is the first screen.
- 2026-11-11: Routing uses URL hashes (`#/settings`), no router library. Works on GitHub Pages without rewrites.
- 2026-11-11: TV screens are laid out at the designed 1280x720 inside `TvStage` and scaled to fit (letterboxed). Not responsive.
- 2026-11-11: Host settings built with only the controls that do something: lobby style and CRT scanlines. Game choice and Sound on the TV wait for the game picker and audio.
- 2026-11-11: Host settings are saved in localStorage (`juju.hostSettings`) for now. When rooms exist, the host's settings should move into the room so phones follow the host's style.
- 2026-11-11: Game-show swatch teal uses the token `#177A74` (design open question 19 had `#1E8C86` on the settings card).
- 2026-11-11: Page-level theme CSS uses `:root[data-theme=...]`; style cards carry their own `data-theme` to preview a style. Focus ring color always differs from the selection ring.
- 2026-11-11: Vitest added as the unit test runner (Julian approved). `npm test` runs `vitest run`.
- 2026-11-11: Dial It In (branch `game/dial-it-in`): rules and tests first, no screens. Per-player closeness scoring, no team mode. Points: 10 for a bullseye, minus 1 per step away (step is 2 on 1 to 100, 1 on 1 to 50), floor 0. A guess is final once submitted. The round reveals when every guesser is in, or on the timer. All rounds (card and target) are dealt at setup so the rules stay pure.
- 2026-11-11: `src/games/types.ts` is a DRAFT cartridge contract made for Dial It In. `setup` takes an optional `random` so tests are repeatable. `finishingOrder` returns places as arrays of tied player ids. Revisit at build order step 6.
- 2026-11-11: Game state holds secrets (every round's target). Whatever publishes state to `rooms/{code}/state` must strip targets and send the current one only to the clue giver's `private/{uid}`.
- Working rules in effect: W1, W3, W5, W6 (recorded in CLAUDE.md).

## Preferences
- Julian wants each step explained briefly as we go (relearning mode).
- Julian prefers getting to visible UI early rather than waiting on backend decisions.

## Lessons Learned
- Headless Edge screenshots below about 500px wide are clipped by its minimum window size. To check phone width, render the page in a 390px iframe instead, or set the viewport over the DevTools protocol.
- Windows file names are case-insensitive: `HostSettings.tsx` and `hostSettings.ts` collide. Hooks live in `useX.ts` files, which avoids it.
- Stopping a background `npx vite preview` task leaves the node child running on its port. Find it with `Get-NetTCPConnection -LocalPort 4173` and stop that PID.
- Synthetic Enter key presses over the DevTools protocol need `text: "\r"` to activate a button.

## Current State
- Build order step 1 (folders + Pages deploy) done. Host settings (style switch + scanlines) done ahead of step 4.
- Next options: more lobby UI from the designs (lobby, game picker, leaderboard with sample data), or step 2 Firebase once sign-in is decided.
- Not created yet, by design: `firebase.json`, `database.rules.json` (step 2); `src/games/registry.ts` and `_template/` contents (step 6, cartridge contract).
- Open decisions blocking step 2: sign-in method (tech stack doc section 9, A to D).
- Vitest installed. Dial It In rules, manifest and spectrum pack done on `game/dial-it-in` (30 tests). Screens, registry line and playtest still to do.
- `manifest.ts` repeats Dial It In's title, tag and pitch from `src/games/lineup.ts`. Once `registry.ts` exists, the lineup should read them from manifests.

## Development Log
### Week of 2026-11-09
- Done: docs and lobby design handoff committed; folder structure; Pages deploy workflow; holding page; Host settings screen with lobby style switch and CRT scanlines, saved per browser; TvStage scaled frame.
- In progress: none.
- Blockers: sign-in method decision before Firebase auth work.
- Done (game/dial-it-in): Vitest; Dial It In manifest, rules, tests, spectrum pack; draft `src/games/types.ts`.
- Next: Julian's pick between more lobby UI and Firebase setup.
