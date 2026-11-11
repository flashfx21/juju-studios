# JuJu Studios

Phone party games for family and friends. One shared screen (TV or laptop) hosts, and everyone joins on their phone with a room code.

Live site: https://flashfx21.github.io/juju-studios/ (currently a holding page; no games yet).

## Run it locally

Needs Node.js (CI uses Node 26).

```powershell
npm install      # first time only
npm run dev      # dev server at http://localhost:5173/juju-studios/
npm run build    # type-check and build into dist/
npm run preview  # serve the built dist/ folder
npm run lint     # ESLint
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which lints, builds and publishes `dist/` to GitHub Pages. Progress shows under the repo's **Actions** tab.

## Folders

```
src/
  app/            routing (host vs. phone), sign-in, profile, settings
  engine/         rooms, presence, timer, voting, turns, teams, scoring, results
    net/          the only code that talks to the backend (Firebase)
  ui/
    themes/       design tokens for the three lobby styles
  games/
    _template/    starting point for a new game
    no-filler/    one folder per game
packs/            content packs, one folder per game
docs/             requirements, tech stack, game specs, design handoff
.github/workflows/deploy.yml
```

Most folders are empty for now (each holds a `.gitkeep` so Git tracks it). See `docs/juju-engine-tech-stack-0852.md` for the architecture and build order.
