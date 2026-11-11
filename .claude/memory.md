# JuJu Studios project memory

## Key Decisions
- 2026-11-11: Folder structure follows `docs/juju-engine-tech-stack-0852.md` section 4. Empty folders hold `.gitkeep`.
- 2026-11-11: Deploy via GitHub Actions (`.github/workflows/deploy.yml`) to https://flashfx21.github.io/juju-studios/. Pages source set to "GitHub Actions". Vite `base` is `/juju-studios/`.
- 2026-11-11: Theme tokens copied from `docs/design/tokens/themes.css` into `src/ui/themes/themes.css`. If the design tokens change, re-copy and keep the two ABOUTME lines at the top.
- 2026-11-11: The lobby placeholder (`#/lobby`) shows the package.json version (requirements: version number on screen) and follows the active lobby style.
- 2026-11-11: UI work goes ahead of the Firebase and sign-in decisions (Julian's call).
- 2026-11-11: Routing uses URL hashes with an optional step (`#/sign-in/password`), no router library. Works on GitHub Pages without rewrites. Screens: home (Host or join), host, sign-in, join, lobby, picker, settings.
- 2026-11-11: TV or phone version is chosen by screen shape: landscape and 900px+ wide is TV (`src/ui/useScreenKind.ts`). Julian's call over separate links.
- 2026-11-11: TV screens are laid out at the designed 1280x720 inside `TvStage` and scaled to fit (letterboxed). Phone screens are fluid up to 430px (`PhoneFrame`).
- 2026-11-11: Host settings has lobby style, Game choice (group vote / leader pick) and CRT scanlines. **Sound on the TV is tabled** until Julian finds commission-free music and sound files (`docs/later.md`).
- 2026-11-11: Host settings are saved in localStorage (`juju.hostSettings`) for now.
- 2026-11-11: **Style is personal** (Julian's call, launch requirement): each phone shows its own user's style, the TV shows the host's. Changed on the phone Profile screen ("Your style" row). Before sign-in, a phone uses its last style. This replaces the design's "host style restyles every screen". When profiles exist, the style is saved on the profile; until then per device. Code still keeps style in `useHostSettings`; split it into a personal setting when Profile is built.
- 2026-11-11: All screens must exist in all three styles. The gaps handoff (`docs/handoffs/juju-design-gaps-handoff.md`) came back as a design update (34 screens per style). It did not include the Profile "Your style" row or the Host settings wording change; Julian chose to have me extrapolate those.
- 2026-11-11: Host settings gained a Room Open/Locked toggle in the design. Not built until rooms exist (same reason as Sound).
- 2026-11-11: All 12 games are "coming soon" (`src/games/lineup.ts`). The picker fills its six large slots with a large version of each style's coming-soon look, in each game's own tile color (`src/ui/gameTileColors.ts`). That large look is an extrapolation; the design only draws large playable tiles.
- 2026-11-11: No QR codes yet (Julian's call): screens show the real site address instead. A QR library would be a new dependency.
- 2026-11-11: Sign-in and Join are UI only. Forms validate, then move on; every such screen shows a "Preview: isn't connected yet" note. Both sign-in forms (email link and password) are built because the method is still open. Join sends you to "Check your email"; the email is kept in sessionStorage (`juju.pendingEmail`) to show there.
- 2026-11-11: Arcade asks for initials on Join (design open question 12 unresolved); they fill from the first 3 letters of the username until edited.
- 2026-11-11: Game-show swatch teal uses the token `#177A74` (design open question 19 had `#1E8C86` on the settings card).
- 2026-11-11: CSS approach: shared markup, per-style CSS under `:root[data-theme=...]`. Per-style wording lives in small data maps at the top of each screen file (`useLobbyStyle()` context). Style cards carry their own `data-theme` to preview a style.
- 2026-11-11: Focus rings: always a different color from the selection ring; inside cream cards (game-show cue card, rec-room phone card) they switch to the card's dark ink.
- Working rules in effect: W1, W3, W5, W6 (recorded in CLAUDE.md).

## Preferences
- Julian wants each step explained briefly as we go (relearning mode).
- Julian prefers getting to visible UI early rather than waiting on backend decisions.

## Lessons Learned
- Headless Edge screenshots below about 500px wide are clipped by its minimum window size. Set the viewport over the DevTools protocol instead (`Emulation.setDeviceMetricsOverride`).
- Windows file names are case-insensitive: `HostSettings.tsx` and `hostSettings.ts` collide. Hooks live in `useX.ts` files, which avoids it.
- Stopping a background `npx vite preview` task leaves the node child running on its port. Find it with `Get-NetTCPConnection -LocalPort 4173` and stop that PID.
- Synthetic Enter key presses over the DevTools protocol need `text: "\r"` to activate a button.
- Bebas Neue (game-show label font) has no lowercase. Never set the site address in it: the `/juju-studios` path is case-sensitive on GitHub Pages, so an all-caps address would 404 if typed.
- Python isn't installed on this PC; use node for one-off scripts.

## Current State
- Build order step 1 done. Ahead of order: Host settings, game picker, Host or join, host sign-in, phone sign-in (4 states), Join.
- Next options: a first playable game wired as a live example (Julian wants this eventually), more designed screens (waiting room, leaderboard, instructions, pause, game over, errors), or step 2 Firebase once sign-in is decided.
- Not created yet, by design: `firebase.json`, `database.rules.json` (step 2); `src/games/registry.ts` and `_template/` contents (step 6, cartridge contract).
- Open decisions blocking step 2: sign-in method (tech stack doc section 9, A to D).
- Design handoffs live in `docs/handoffs/`.
- Game branches `game/dial-it-in` and `game/chainword` live in worktrees `../juju-studios-dial-it-in` and `../juju-studios-chainword`. As of Nov 11 both had no commits and nothing pushed, each with its own `src/games/types.ts` (they differ) and Vitest added separately. Suggested fix: one contract and Vitest on main first, then rebase both.
- No unit test runner yet. Vitest is "Proposed" in the tech stack doc and needs Julian's OK as a new dependency.

## Development Log
### Week of 2026-11-09
- Done: docs and lobby design handoff committed; folder structure; Pages deploy workflow; Host settings (style, game choice, scanlines); game picker (TV) and vote (phone) with all games coming soon; Host or join (TV + phone); TV host sign-in; phone sign-in in four states; Join with validation; shared TV header, phone frame, form fields.
- In progress: none.
- Blockers: sign-in method decision before Firebase auth work.
- Next: Julian's pick (live example game, more screens, or Firebase).
