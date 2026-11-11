# JuJu Studios

Phone party games for family and friends. One shared screen (TV or laptop) hosts, and everyone joins on their phone with a room code.

Live site: https://flashfx21.github.io/juju-studios/ (currently a holding page; no games yet).

## What works so far

- **Holding page** (`#/`): studio name, a Host settings button, and the build version.
- **Host settings** (`#/settings`): pick the lobby style (retro game show, 90s arcade, 70s rec room) and turn the arcade CRT scanlines on or off. Every screen restyles at once. Choices are saved in this browser until rooms exist.
- TV screens are laid out at 1280x720 and scaled to fit the window, letterboxed when the shape differs.
- **Dial It In rules** (`src/games/dial-it-in/`): game logic and tests only, no screens yet. Spectrum cards live in `packs/dial-it-in/spectrums.json`.

## Run it locally

Needs Node.js (CI uses Node 26).

```powershell
npm install      # first time only
npm run dev      # dev server at http://localhost:5173/juju-studios/
npm run build    # type-check and build into dist/
npm run preview  # serve the built dist/ folder
npm run lint     # ESLint
npm test         # run the game rules tests once (Vitest)
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which lints, builds and publishes `dist/` to GitHub Pages. Progress shows under the repo's **Actions** tab.

## Folders

```
src/
  app/            screens and routing (holding page, Host settings), later sign-in and profile
  engine/         rooms, presence, timer, voting, turns, teams, scoring, results
    net/          the only code that talks to the backend (Firebase)
  ui/             shared pieces, e.g. TvStage (the scaled 1280x720 TV frame)
    themes/       design tokens and the list of lobby styles
  games/
    _template/    starting point for a new game
    no-filler/    one folder per game
    dial-it-in/   Dial It In: manifest, rules and tests
    types.ts      draft cartridge contract types (manifest, rules)
packs/            content packs, one folder per game
docs/             requirements, tech stack, game specs, design handoff
.github/workflows/deploy.yml
```

Most folders are empty for now (each holds a `.gitkeep` so Git tracks it). See `docs/juju-engine-tech-stack-0852.md` for the architecture and build order.
