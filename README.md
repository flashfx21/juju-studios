# JuJu Studios

Phone party games for family and friends. One shared screen (TV or laptop) hosts, and everyone joins on their phone with a room code.

Live site: https://flashfx21.github.io/juju-studios/ (screens and sign-in for now: no rooms, no playable games yet).

## What works so far

Screens are built from the lobby design (`docs/design/`) in all three styles: retro game show, 90s arcade, 70s rec room. The same address shows the TV version on wide landscape windows (900px and up) and the phone version everywhere else.

| Screen | Address | TV | Phone |
|---|---|---|---|
| Host or join (front door) | `#/` | Host a game / Join a game | Join, Host; signed out: Sign up button and Sign in link; signed in: Start hosting and Solo play |
| Host sign-in | `#/host` | "Finish on your phone" | Sign-in form |
| Sign up, Sign in | `#/sign-up`, `#/sign-in`, `/sent`, `/finish`, `/expired` | | One flow with different words (a new email makes an account): Google or email link (or who is signed in), check your email, finishing the link, link expired |
| Tonight's lobby | `#/room` | | A room for the night: the code, who's in, and a vote on the next room game with voters' icons; the host starts their pick (or the leading game) and every phone follows; Back to lobby brings everyone back |
| Join | `#/join` | | Two steps: a phone not signed in signs up first (then sets up its profile) and comes back; then the room code, which opens that game's room (Pin Drop today) |
| Lobby placeholder | `#/lobby` | The logo (with a house icon) goes home. Who is signed in, links to the game picker, Host settings, Profile (cream), Admin (admins, outlined with a gear) and Sign in (signed out), plus the version | same |
| Admin | `#/admin` | | Admins only: every player with a profile; turn Solo play on or off, rename, reset a profile |
| Solo play | `#/playtest`, `#/playtest/chainword`, `#/playtest/dial-it-in`, `#/playtest/dont-jinx-it`, `#/playtest/pin-drop`, `#/playtest/sketch-showdown` | | Signed-in players only: games still in testing, played against bots |
| Game picker | `#/picker` | Every game six to a page with Previous and Next; games in testing can be picked (and re-picked) and offer their Solo play pages; the rest show In development or Coming soon | Games in testing as rows to pick, then their buttons; the rest as chips |
| Host settings | `#/settings` | Your style, game choice (group vote / leader pick), CRT scanlines | |
| Profile | `#/profile` | | Symbol (arcade: initials), username, email, color, symbol, **your style**; Stats on its own tab; first time after sign-in it is profile setup; signed out it offers Sign in |

- **Everyone picks their own style.** The TV shows the host's style; each phone shows its own user's, changed on Profile (or in Host settings on the TV). Signed in, your style is saved in your profile and follows you to any device; signed out, it is kept on the device.
- **Sign-in works** (Firebase Authentication): Google, or a one-time link emailed to you. The free plan sends only 5 link emails a day for the whole site, so non-Google players should sign up before game night. A phone stays signed in. Rooms are **not connected yet**: Join doesn't check the room code, and signing in leads to the lobby placeholder. - **Profiles are saved in the database** (`profiles/{uid}`: username, color, symbol, initials, style), so they follow you to any device you sign in on. Your email stays in sign-in, not the profile. Everyone has a profile: after a first sign-in you set it up, and you can change your name and color on Profile any time. Each player has a color and a symbol (16 animals and objects, drawn in `src/ui/playerSymbols.ts`), shown together like "brown wolf"; a new profile starts with a random symbol. A badge with your symbol in your color sits in the top corner of the phone menu screens and opens Profile; the arcade style shows initials instead, for its high-score look. Profile has two tabs: Profile (name, color, symbol, style) and Stats. "Sign out of this phone" is on Profile.
- Host settings are saved in this browser until rooms exist.
- Addresses stand in for the design's QR codes (see `docs/later.md`).
- TV screens are laid out at 1280x720 and scaled to fit the window, letterboxed when the shape differs.
- The game lineup is `src/games/lineup.ts`, with each game's lineup number and phase (keep these in step with `docs/games/README.md`). Every game's status is still "coming soon"; for a playtester, games with a Solo play page show as **In testing** in the picker and can be picked before anyone joins. Picking a game offers its Solo play pages (Pin Drop also offers Start a room). Votes, the timer and Lock in wait for rooms.
- Chainword has its rules, tests and a phone playtest (see Playtests below). No TV screen yet.
- Dial It In has its rules, tests, a phone screen and a single-player interface playtest (see Playtests below). No TV screen yet. Spectrum cards live in `packs/dial-it-in/spectrums.json`, and the clues bots give in solo play in `packs/dial-it-in/bot-clues.json`.
- Don't Jinx It (branch `game/dont-jinx-it`) has its individual-mode rules, tests, phone and TV screens with instructions and host settings (game-show style), and a single-player interface playtest (see Playtests below). Rooms on phones work too (see Playtests below). Mystery words, irregular word forms and the clues room bots write live in `packs/dont-jinx-it/`.
- Pin Drop (branch `game/pin-drop`) has its rules, tests, a phone screen with a world map (Leaflet, OpenStreetMap tiles) and a solo playtest (see Playtests below). No TV screen yet. The 23-photo starter pack lives in `packs/pin-drop/`.
- Sketch Showdown (branch `game/sketch-showdown`) has its rules (teams, clue pick, race, sudden death), lenient guess matching, tests, a drawing canvas, the drawer's phone screens and a drawer playtest (see Playtests below). The guesser screen and the TV screen are not built yet. Clues live in `packs/sketch-showdown/`; word forms shared with Don't Jinx It live in `packs/shared/`.

## Run it locally

Needs Node.js (CI uses Node 26).

```powershell
npm install      # first time only
npm run dev      # dev server at http://localhost:5173/juju-studios/
npm run build    # type-check and build into dist/
npm run preview  # serve the built dist/ folder
npm run lint     # ESLint
npm test         # game rules tests (Vitest)
npm run emulators  # local Firebase (sign-in and database) on this PC
```

`npm run emulators` needs the Firebase CLI (`npm install -g firebase-tools`) and Java 11 or later. It runs a local copy of sign-in and the database, so testing never touches the real project. Ports: sign-in 9099, database 9000, Emulator UI at http://127.0.0.1:4000/. Stop it with Ctrl+C. `npm run dev` signs in against the emulators, so start them first: Google sign-in shows a stand-in account picker, and sign-in emails are not sent (the link appears in the emulator's terminal and under Authentication in the Emulator UI).

## Playtests

Games still in testing open at `#/playtest`, reached from the game picker (pick a game in testing, then its button) or the **Solo play** link on the phone front door, for admins and playtesters. Signed out, Solo play asks you to sign in first; signed in but not a playtester, it says to ask an admin. The addresses keep the word "playtest" for now; Solo play is a temporary menu item until real game nights work.

**Chainword playtest, no server:** one person taps **Make a code for everyone** (pick letters per word, words in the chain and hard mode first) and reads the code out, for example `KPDT53` (a code ending in `H`, like `KPDT53H`, plays in hard mode). Everyone else types it under **Got a chain code?** and gets the same words. Say go, play, then compare totals: fewest guesses wins, faster time breaks a tie. **End game** stops early (the word you're on and any left count 7 each). Everyone should load the site fresh first: a code deals from the word lists, so phones on different versions of the site can get different words.

**Dial It In playtest, one player:** an interface test on one phone. Pick 1 to 100 or 1 to 50, then play three rounds against two bots that guess at random; you give the clue in round 1, and in the bots' rounds the bot's clue shows on screen (the card's clue that lands closest to its target). To guess, turn the safe-style dial (clockwise goes up, counterclockwise goes down, and it stops at 1 and at the top number; a red peg marks the stop) or type the number in the box under it. The dashed **Dev** box stands in for the other phones and the timer: **Bots lock in**, **Time's up** (ends guessing; anyone who hasn't guessed scores 0) and **Next round**.

**Don't Jinx It playtest, one player:** an interface test for checking the screens. On a phone it shows your phone: pick 3, 5 or 7 players; the rest are bots. On a laptop (a wide window) it shows the TV, your phone and the dev box side by side: pick the player count in the dev box and the pace and long game on the TV, then **Start game**. You guess on turn 1 and write a clue on every turn after. The dashed **Dev** box stands in for the other phones and the timer: type a bot's clue (or leave it blank to deal a common word, so jinxes happen), **Bots send**, a bot guesser's **Bot guesses** / **Guess right** / **Pass**, and the timer button (**Time's up**, **Pile done**, **Show reveal**, **Next turn**). The shared word list loads with the game, so an unknown clue asks "Is this a name?".

**Pin Drop playtest, one player:** a solo test on one phone. Pick scoring (match or stroke play), rounds and units, then play against two bots that guess near the answer. The round's photo sits above the map in place of the TV: tap it to see it full screen. Tap the map to drop your pin, drag it to move it, then **Lock in**; with a keyboard, focus the map, move it with the arrow keys and press Enter to drop the pin at the crosshair. The dashed **Dev** box stands in for the other phones and the timer: **Bots lock in**, **Time's up** (an unlocked pin still counts) and **Reveal done**. You are the host, so **Next round** is on your standings. Flags work for the game but nothing is saved.

**Don't Jinx It with others, three or more phones (bots count):** pick Don't Jinx It in the game picker, then **Start a room**; others join with the code. The host picks the pace and whether everyone guesses once or twice, plus bots. Each turn one player guesses and everyone else writes clues on their own phone (two each with three players); matching clues are jinxed, the guesser sees the survivors, and the reveal waits for the host's **Next turn** (or 20 seconds). Each phone gets only its own view from `roomSecrets/{code}`, so the guesser's phone never receives the word, and the room itself holds only who is playing and the phase. Bots write clues from a list for each word (`packs/dont-jinx-it/bot-clues.json`): Casual bots often write the most obvious one and get jinxed, Sharp bots skip it. A bot guesser is right more often with more surviving clues, and when Sharp.

**Dial It In with others, two or more phones:** pick Dial It In in the game picker, then **Start a room**; others join with the code. The host picks the range, turns each (how many times the clue goes round) and seconds to guess, plus bots. People take turns giving the clue (bots only guess); everyone else guesses on their own dial. The round reveals when everyone has guessed or time runs out, and waits for the host's **Next round**. Secrets stay secret: the room shows the game with unrevealed targets hidden and guesses shown only as "guessed", and each phone gets its own secrets (the clue giver's target, your own guess) from `roomSecrets/{code}`, which only that player can read. The host's phone keeps the full game there too, so a reload carries on (the host's phone does hold the answers). Bots can't hear the clue, so they guess near the target, closer when Sharp.

**Chainword with others, two or more phones:** pick Chainword in the game picker, then **Start a room**; others join with the code (the home Join screen works too). The host picks letters per word, words in the chain, hard mode and bots, then **Start game**. Everyone races the same hidden chain on their own phone: only a chain code goes through the room, never the words, and each phone shares just its word results and guess counts. The top bar shows your place; after your chain the standings update live until everyone finishes. The host can **End game** from the top bar (a second tap confirms): anyone still playing has the rest of their chain counted as missed. Bots solve words at a believable pace (Sharp bots in fewer guesses). A refresh carries on where you were.

**Tonight's lobby** (`#/room`): **Start hosting** on the phone home screen opens it; others join with its code from Join. Everyone votes for the next game (each game row shows its voters' icons and a count); the host taps **Start**, which starts the host's own vote or else the leading game, and every phone follows into that game's room with the same code. The host's **Back to lobby** (in the waiting room and after the game) brings every phone back for the next vote. **Exit game** inside the lobby room goes to the lobby, which offers **Rejoin**. Only room games (Pin Drop, Chainword) can be voted for; a vote timer, ties and a TV view come later.

**Room games share their pieces** in `src/games/room/`: start or join, the waiting room (room code, players, bots), player looks and bot identities.

**Pin Drop with others, two or more phones, no TV:** in Solo play, pick **Pin Drop with others**. One person taps **Start a room** and reads out the 4-letter code; everyone else types it and taps **Join**. The host picks scoring, rounds, seconds and units, then **Start game**. Every phone shows the photo above its own map with a countdown. The round reveals when everyone has locked in or time runs out (a placed pin counts), the reveal shows for 10 seconds, then the standings wait for the host's **Next round**. The host's phone runs the game, so keep it open; a refresh on any phone goes straight back into the room. The host can add up to 3 bots (Bot Ada, Bot Max, Bot Kit) at Casual or Sharp skill; bots always guess a real city, miss by more on harder photos, lock in partway through the round, and lock in at once when every person has. Rooms live in the database at `rooms/{code}` and are not cleaned up yet.

**Sketch Showdown playtest, drawer only:** you draw every round for Pencils (you, Bot A, Bot B) against three bots on Crayons. Pick turns and pace, then **Start**. Pick one of three clues; the dev box's **Bot picks** is the other drawer (different picks are a coin flip), and **Time's up** / **Go** stand in for the pick clock and the countdown. Draw with brush, eraser or line, four sizes and 16 colors, chosen from the Brush and Color buttons in the canvas's top-left corner (**OK** closes each menu); **Undo** removes the last stroke and **Hold to clear** wipes the canvas. Your team's guesses show in the strip under the canvas. The dev box sends a teammate's guess (type one to test the matching, or **Wrong guess**), lets the other team win (**Other team got it**) or ends the round (**Time's up**). A wrong guess locks that bot out for 2 seconds. The reveal shows both drawings and the score; you are the host, so **Next** is yours. If it's level after the last round, vote for yourself to draw the sudden-death round. The result screen pages through every round's drawings. The other team's canvas stays empty: bots don't draw.

Every game in Solo play has **Exit game** at the top of its phone screen; a second tap confirms and goes back to the game picker (leaving a room game also makes the phone forget that room). It comes from the phone frame, so the TV-shaped desk view of Don't Jinx It on a wide window does not show it.

**To add a game's playtest**, give it a `Playtest.tsx` in its game folder and one line in `src/app/playtests.ts` (add `onExit` there for any clean-up when a player leaves).

## Admins

An admin is a signed-in account with `admins/{uid}: true` in the database. There is no way to become one from the app: add the entry by hand in the Firebase console (Realtime Database, Data tab), using the account's User UID from Authentication, Users. The database rules enforce what admins can do (read every profile, rename or reset one, choose who gets Solo play); the app only shows or hides the buttons.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which lints, builds and publishes `dist/` to GitHub Pages. Progress shows under the repo's **Actions** tab. The build reads the Firebase settings from the repo's Actions secrets (the same `VITE_FIREBASE_*` lines as `.env.local`); after changing `.env.local`, run `gh secret set -f .env.local` to update them.

## Firebase

The backend is the Firebase project `juju-studios` (Spark plan, Realtime Database). `.firebaserc` names the project, `firebase.json` sets up the rules file and the emulators, and `database.rules.json` holds the database rules: everything is locked except `profiles/{uid}` (that player reads and writes their own, admins read and change any; fields checked), `admins/{uid}` and `playtesters/{uid}` (each player reads their own flag; admins set playtesters; admins are added only in the console), and `rooms/{code}` (signed-in players read a room; the host writes the game, each player writes only their own entry and inputs; room entries have their name, initials, color and symbol checked like profiles), and `roomSecrets/{code}` (only the host reads and writes the full game; each player reads only their own view). The repo is the source of truth for the rules: change the file, then push it with `firebase deploy --only database`. The web app's config lives in `.env.local` (`VITE_FIREBASE_*`, not committed).

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
firebase.json, .firebaserc, database.rules.json   Firebase project, emulators and database rules
```

Most folders are empty for now (each holds a `.gitkeep` so Git tracks it). See `docs/juju-engine-tech-stack-0852.md` for the architecture and build order.
