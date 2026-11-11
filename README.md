# JuJu Studios

Phone party games for family and friends. One shared screen (TV or laptop) hosts, and everyone joins on their phone with a room code.

Live site: https://flashfx21.github.io/juju-studios/ (screens only for now: no backend, no playable games yet).

## What works so far

Screens are built from the lobby design (`docs/design/`) in all three styles: retro game show, 90s arcade, 70s rec room. The same address shows the TV version on wide landscape windows (900px and up) and the phone version everywhere else.

| Screen | Address | TV | Phone |
|---|---|---|---|
| Host or join (front door) | `#/` | Host a game / Join a game | Join, Host, Sign in, Playtest a game |
| Host sign-in | `#/host` | "Finish on your phone" | Sign-in form |
| Sign in | `#/sign-in`, `/password`, `/sent`, `/expired` | | Email link, password, check your email, link expired |
| Join (profile setup) | `#/join` | | Room code, username, email, color (arcade adds initials) |
| Lobby placeholder | `#/lobby` | Links to the game picker, Host settings, Profile and Playtests, plus the version | same |
| Playtests | `#/playtest`, `#/playtest/chainword`, `#/playtest/dial-it-in` | | Behind the playtest code: games still in testing |
| Game picker | `#/picker` | Full lineup, all coming soon | Coming-soon list, nothing to vote on |
| Host settings | `#/settings` | Your style, game choice (group vote / leader pick), CRT scanlines | |
| Profile | `#/profile` | | Initials, username, email, color, **your style**, stats |

- **Everyone picks their own style.** The TV shows the host's style; each phone shows its own user's, changed on Profile (or in Host settings on the TV). It's saved on the device until profiles move to the backend.
- Sign-in and joining are **not connected yet**: forms check their fields and move on, but nothing is sent. Each screen says so. Join remembers your profile on this phone; "Sign out of this phone" clears it.
- Host settings are saved in this browser until rooms exist.
- Addresses stand in for the design's QR codes (see `docs/later.md`).
- TV screens are laid out at 1280x720 and scaled to fit the window, letterboxed when the shape differs.
- The game lineup is `src/games/lineup.ts`. Every game is "coming soon".
- Chainword has its rules, tests and a phone playtest (see Playtests below). No TV screen yet.
- Dial It In has its rules, tests, a phone screen and a single-player interface playtest (see Playtests below). No TV screen yet. Spectrum cards live in `packs/dial-it-in/spectrums.json`.

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

## Playtests

Games still in testing open at `#/playtest` (phone front door: **Playtest a game**; lobby page: **Playtests**). A playtest code keeps casual visitors out; each device asks once and remembers it. It is not real security: the code can be worked out from the site's code.

**Chainword playtest, no server:** one person taps **Make a code for everyone** (pick letters per word, words in the chain and hard mode first) and reads the code out, for example `KPDT53` (a code ending in `H`, like `KPDT53H`, plays in hard mode). Everyone else types it under **Got a chain code?** and gets the same words. Say go, play, then compare totals: fewest guesses wins, faster time breaks a tie. **End game** stops early (the word you're on and any left count 7 each). Everyone should load the site fresh first: a code deals from the word lists, so phones on different versions of the site can get different words.

**Dial It In playtest, one player:** an interface test on one phone. Pick 1 to 100 or 1 to 50, then play three rounds against two bots that guess at random; you give the clue in round 1. To guess, turn the safe-style dial (clockwise goes up, counterclockwise goes down, and it wraps past the top like a safe) or type the number in the box under it. The dashed **Dev** box stands in for the other phones and the timer: **Bots lock in**, **Time's up** (ends guessing; anyone who hasn't guessed scores 0) and **Next round**.

**To change the playtest code**, run this in the project folder with the new code in place of `newcode`, then put the number it prints into `PLAYTEST_CODE_HASH` in `src/app/playtestCode.ts`. Every device then asks for the new code.

```powershell
node -e "import('./src/engine/hashText.ts').then((m) => console.log(m.hashText('newcode')))"
```

**To add a game's playtest**, give it a `Playtest.tsx` in its game folder and one line in `src/app/playtests.ts`.

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
    chainword/    Chainword manifest, rules, phone screen and playtest
    dial-it-in/   Dial It In manifest, rules, phone screen and playtest
packs/            content packs, one folder per game; shared/ holds the English word list (ENABLE) any game can load
docs/             requirements, tech stack, game specs, design handoff
.github/workflows/deploy.yml
```

Most folders are empty for now (each holds a `.gitkeep` so Git tracks it). See `docs/juju-engine-tech-stack-0852.md` for the architecture and build order.
