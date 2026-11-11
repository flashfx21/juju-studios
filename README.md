# JuJu Studios

Phone party games for family and friends. One shared screen (TV or laptop) hosts, and everyone joins on their phone with a room code.

Live site: https://flashfx21.github.io/juju-studios/ (screens only for now: no backend, no playable games yet).

## What works so far

Screens are built from the lobby design (`docs/design/`) in all three styles: retro game show, 90s arcade, 70s rec room. The same address shows the TV version on wide landscape windows (900px and up) and the phone version everywhere else.

| Screen | Address | TV | Phone |
|---|---|---|---|
| Host or join (front door) | `#/` | Host a game / Join a game | Join, Host, Sign in |
| Host sign-in | `#/host` | "Finish on your phone" | Sign-in form |
| Sign in | `#/sign-in`, `/password`, `/sent`, `/expired` | | Email link, password, check your email, link expired |
| Join (profile setup) | `#/join` | | Room code, username, email, color (arcade adds initials) |
| Lobby placeholder | `#/lobby` | Links to the game picker, Host settings and Chainword practice, plus the version | same |
| Chainword practice | `#/practice/chainword` | | One player, on this device: 3 or 5 words, hard mode, nothing saved |
| Game picker | `#/picker` | Full lineup, all coming soon | Coming-soon list, nothing to vote on |
| Host settings | `#/settings` | Your style, game choice (group vote / leader pick), CRT scanlines | |
| Profile | `#/profile` | | Initials, username, email, color, **your style**, stats |

- **Everyone picks their own style.** The TV shows the host's style; each phone shows its own user's, changed on Profile (or in Host settings on the TV). It's saved on the device until profiles move to the backend.
- Sign-in and joining are **not connected yet**: forms check their fields and move on, but nothing is sent. Each screen says so. Join remembers your profile on this phone; "Sign out of this phone" clears it.
- Host settings are saved in this browser until rooms exist.
- Addresses stand in for the design's QR codes (see `docs/later.md`).
- TV screens are laid out at 1280x720 and scaled to fit the window, letterboxed when the shape differs.
- The game lineup is `src/games/lineup.ts`. Every game is "coming soon".
- Chainword has its rules and tests (`src/games/chainword/`, word pack in `packs/chainword/words.json`) and a one-player practice page (phone screen only, no room needed). No TV screen yet.

## Run it locally

Needs Node.js (CI uses Node 26).

```powershell
npm install      # first time only
npm run dev      # dev server at http://localhost:5173/juju-studios/
npm run build    # type-check and build into dist/
npm run preview  # serve the built dist/ folder
npm run lint     # ESLint
npm test         # game rules tests (Vitest)
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which lints, builds and publishes `dist/` to GitHub Pages. Progress shows under the repo's **Actions** tab.

## Folders

```
src/
  app/            screens, routing, settings and form checks
  engine/         rooms, presence, timer, voting, turns, teams, scoring, results
    net/          the only code that talks to the backend (Firebase)
  ui/             shared pieces: TvStage (scaled TV frame), TvHeader, PhoneFrame, GameTile, form fields
    themes/       design tokens and the list of lobby styles
  games/
    lineup.ts     the 12 games shown in the picker, with status
    _template/    starting point for a new game
    types.ts      draft cartridge contract: manifest and rules shapes
    no-filler/    one folder per game
    chainword/    Chainword manifest, rules and phone screen
packs/            content packs, one folder per game
docs/             requirements, tech stack, game specs, design handoff
.github/workflows/deploy.yml
```

Most folders are empty for now (each holds a `.gitkeep` so Git tracks it). See `docs/juju-engine-tech-stack-0852.md` for the architecture and build order.
