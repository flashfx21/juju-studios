# JuJu Studios project memory

## Key Decisions
- 2026-11-11: Folder structure follows `docs/juju-engine-tech-stack-0852.md` section 4. Empty folders hold `.gitkeep`.
- 2026-11-11: Deploy via GitHub Actions (`.github/workflows/deploy.yml`) to https://flashfx21.github.io/juju-studios/. Pages source set to "GitHub Actions". Vite `base` is `/juju-studios/`.
- 2026-11-11: Theme tokens copied from `docs/design/tokens/themes.css` into `src/ui/themes/themes.css`. If the design tokens change, re-copy and keep the two ABOUTME lines at the top.
- 2026-11-11: Holding page uses the game-show style and shows the package.json version (requirements: version number on screen).
- Working rules in effect: W1, W3, W5, W6 (recorded in CLAUDE.md).

## Preferences
- Julian wants each step explained briefly as we go (relearning mode).

## Lessons Learned
- Headless Edge screenshots below about 500px wide are clipped by its minimum window size. To check phone width, render the page in a 390px iframe instead.

## Current State
- Build order step 1 (folders + Pages deploy) done. Next: step 2, Firebase project, emulators, sign-in, profile screen.
- Not created yet, by design: `firebase.json`, `database.rules.json` (step 2); `src/games/registry.ts` and `_template/` contents (step 6, cartridge contract).
- Open decisions blocking step 2: sign-in method (tech stack doc section 9, A to D).

## Development Log
### Week of 2026-11-09
- Done: docs and lobby design handoff committed; folder structure; holding page with game-show tokens; Pages deploy workflow.
- In progress: none.
- Blockers: sign-in method decision before Firebase auth work.
- Next: Firebase setup (step 2).
