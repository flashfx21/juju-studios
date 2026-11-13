# JuJu Studios Engine: Tech Stack and Architecture

Purpose: the starting brief for building the engine in Claude Code. Pairs with `juju-engine-requirements-2149.md` (what it must do), `docs/games/` (one spec per game) and the lobby design (how it looks).
Status: Nov 11, 2026. **Decided** = Julian's call. **Proposed** = Claude's recommendation, confirm before building.
Replaces: `juju-engine-tech-stack-2244.md`. Change: Firebase is now the decided backend; the email-link sign-in limit on the free plan needs a decision (section 9).

---

## 1. The stack at a glance
| Layer | Choice | Status | Why |
|---|---|---|---|
| Language | TypeScript | Decided (repo scaffolded) | Catches mistakes early across many games |
| Build tool | Vite | Decided (repo scaffolded) | Fast local dev server, simple static build for GitHub Pages |
| UI | React | Decided (repo scaffolded) | Familiar from SPFx work; the Claude Design files are React-based |
| Linter | ESLint | Decided | The standard; most React checks and examples |
| Repo | `flashfx21/juju-studios`, public | Decided | Public keeps GitHub Pages free |
| Hosting | GitHub Pages at `flashfx21.github.io/juju-studios/`, deployed by GitHub Actions | Decided (Pages) / Proposed (Actions) | Free; push to main and the site rebuilds |
| Backend | **Firebase** | **Decided (Nov 11)** | One service for sign-in, live play and saved data. Alternatives (Convex, InstantDB, Cloudflare) kept in mind for later |
| Live game connection | Firebase Realtime Database | Proposed | See section 3 |
| Saved data (profiles, results, leaderboard) | Firebase Realtime Database | Proposed | One database for live and saved data keeps setup small |
| Sign-in | Firebase Authentication: Google sign-in plus email link (passwordless) for everyone else | **Decided (Nov 13), option D in section 9** | Free plan allows only 5 sign-in-link emails per day, so non-Google players sign up ahead of game night |
| Firebase plan | Spark (free) | Decided direction | No card, stops at caps instead of charging |
| Local testing | Firebase Emulator Suite + browser tabs | Proposed | Full game night on one PC with fake players, no quota used, no real emails sent |
| Unit tests | Vitest | Proposed | Tests each game's rules without a browser |

**Big constraint from the free plan:** Spark has no server code (Cloud Functions need the paid Blaze plan). So the **host's browser runs the game**, like a referee holding the rulebook. Phones only send their inputs; the host decides what happens and publishes the result.

Keep every Firebase call behind `src/engine/net/` so the backend can be swapped later without touching games.

## 2. How a game night flows (simple version)
1. The TV opens the site and taps **Host**. It creates a room with a 4-letter code.
2. Phones open the same site, sign in (first time only on that phone), enter the code, and join.
3. The host's browser is the referee: it reads phone inputs, runs the active game's rules, and writes the new public game state.
4. Every screen (TV and phones) listens to that state and redraws.
5. When a game ends, the host converts the finishing order into leaderboard points and saves the result.

Comparison: the database is a shared whiteboard in the room. Phones can only write on their own sticky note (their input). Only the referee (host) erases and rewrites the main board (game state). Everyone watches the board.

## 3. Live connection: why Firebase over PeerJS
| | Firebase Realtime Database | PeerJS (direct phone-to-TV) |
|---|---|---|
| Works on hotel / cellular / corporate networks | Yes, it's normal web traffic | Sometimes blocked without a relay server |
| "Player disconnected" detection | Built in (presence, `onDisconnect`) | Build it yourself |
| Host refresh recovery | State already saved in the database | State lost unless saved separately |
| Speed | Fine for turn-based games | Faster, better for real-time action |
| Moving parts | One service for live + saved data | Two systems |
Revisit direct connections only for the later real-time games (maze chase, snake arena).

Free plan fit: the Realtime Database allows 100 simultaneous connections, 1 GB stored and 10 GB downloaded per month. A 10-player game night uses about 11 connections.

## 4. Folder structure
```
juju-studios/
  index.html
  CLAUDE.md
  src/
    app/            routing: host vs. phone, sign-in, profile, settings
    engine/         rooms, presence, connection bars, timer, voting,
                    turn order, teams, pause/restart, scoring, results
      net/          the only place that talks to Firebase
    ui/             shared components + the three lobby styles (themes)
    games/
      registry.ts   the list of installed games
      no-filler/    one folder per game (see section 7)
      _template/    copy this to start a new game
  packs/            content packs (CSV/JSON), one folder per game
  docs/             requirements, this doc, handoffs
    games/          one spec per game
    design/         exported designs and tokens from Claude Design
  firebase.json, database.rules.json   Firebase + emulator config, security rules
  .github/workflows/deploy.yml
```

## 5. Data model (proposed, Realtime Database paths)
**Live room (deleted when the room closes)**
- `rooms/{code}`: host ID, status (lobby / playing / paused), current game, style, settings
- `rooms/{code}/players/{uid}`: username, color, initials, connected, last ping
- `rooms/{code}/state`: the public game state. **Host writes, everyone reads.**
- `rooms/{code}/private/{uid}`: secrets for one player (a secret role, a spymaster key, the word only defense sees). **Host writes, only that player reads.**
- `rooms/{code}/inputs/{uid}`: a player's answer, vote or clue. **Only that player writes.**

**Saved (kept)**
- `profiles/{uid}`: username, color, initials (email stays in Firebase Authentication)
- `usernames/{name}`: claims a username so it's unique
- `nights/{nightId}`: date, who came
- `results/{resultId}`: game, night, finishing order, points per player
- `leaderboard/{uid}/{gameId}`: games played and points, updated when a game ends
- `cardStats/{cardId}`: No Filler prompt testing (plays, pass rate, flags)

**Security rules (must-have):** players can only write their own input and their own profile; only the room's host writes room state and results; nobody can delete results. The Firebase config keys in the site are public by design; the rules are what protect the data.

## 6. Engine features and where they live
| Requirement | Engine piece |
|---|---|
| Join by code, profiles, sign-in | `app/` + Firebase Auth |
| Group vote / leader pick | `engine/voting` |
| Pause, resume, restart, end game | `engine/session` (works the same for every game) |
| Instructions screen before each game | Each game provides it; the engine shows it |
| Auto-rejoin, host refresh recovery | Room state lives in the database |
| Connection strength bars | `engine/presence`: host and phones exchange a timestamp every few seconds |
| Equal-weight scoring (100-point pool, top 50%, 80/20 teams, top 2 teams) | `engine/scoring`: games never calculate leaderboard points themselves |
| Leaderboard filters and sort | `ui/` reads `leaderboard/` |
| Three styles from Settings | `ui/themes`: one set of colors and fonts per style |

## 7. How games are added (the cartridge contract)
Every game is one folder that plugs into the engine. The engine is the console; the game is a cartridge with a label, a rulebook and two screens. Each game's spec lives in `docs/games/{nn}-{game}.md` (nn is the two-digit lineup number).

**A game folder contains:**
1. **`manifest.ts`: the label.** ID, title, pitch, tag, players (min/max), length, modes, status (playable / coming soon), and its few settings.
2. **`rules.ts`: the rulebook.** Pure logic, no screens:
   - `setup(players, settings)` → the starting state
   - `onInput(state, player, input)` → the new state
   - `onTimer(state)` → the new state when a timer ends
   - `isOver(state)` → finished yet?
   - `finishingOrder(state)` → players or teams in order, with ties
3. **`TvScreen.tsx`**: what the big screen shows.
4. **`PhoneScreen.tsx`**: what each phone shows, including private info and input controls.
5. **`Instructions.tsx`**: the how-to-play screen shown before the game starts.
6. **`rules.test.ts`**: tests for the rules.
7. **Content pack (optional)** in `packs/{game}/`.

**What a game gets for free from the engine:** rooms, joining, presence, timer, voting, turn order, teams, pause/restart, private per-player data, theming, scoring and saving results. A game never touches the leaderboard; it only reports the finishing order.

**Steps to add a game:**
1. Copy `games/_template/` to `games/{new-game}/`.
2. Fill in `manifest.ts`; set status to **coming soon**. It appears in the picker as a locked tile.
3. Write `rules.ts` and its tests. Run the tests.
4. Build the TV, phone and instructions screens with the shared UI pieces.
5. Add its content pack, if it needs one.
6. Add one line to `games/registry.ts`.
7. Play it locally with the emulator and fake players in browser tabs.
8. Flip status to **playable** and push. GitHub Actions redeploys the site.

Work on one game per branch (e.g. `game/dial-it-in`) and merge to `main` when it's playable.

## 8. Build order for Claude Code
1. Folder structure + GitHub Actions deploy to GitHub Pages
2. Firebase project, emulators, sign-in, profile screen
3. Rooms: host creates, phones join by code, presence and connection bars
4. Lobby with one style first; Settings with the style switch
5. Engine pieces: session controls, timer, voting, scoring, results, leaderboard
6. The cartridge contract and `_template/`
7. Chainword as the first cartridge
8. The rest of phase 1 (Dial It In, Don't Jinx It, Pin Drop), a real game night test, then phase 2 (No Filler, Sketch Showdown)

## 9. Verified limits and the sign-in decision (Nov 11)
From Firebase's published limits:
- **Realtime Database (Spark):** 100 simultaneous connections, 1 GB stored, 10 GB downloaded per month. **Fits.**
- **Sign-in-link emails (Spark): 5 per day.** (Blaze: 25,000 per day.) **Doesn't fit** a family signing up on the same night.
- Address verification emails (Spark): 1,000 per day.
- Email, email-link and Google sign-in themselves are free up to 50,000 monthly users on both plans.

Each phone only needs a sign-in email once, then it stays signed in. The limit hurts at first setup.

**Options (decision needed):**
| Option | Cost | Friction | Notes |
|---|---|---|---|
| A. Email + password, with a verification email | Free (Spark) | A password to create | Verification emails allow 1,000 per day; still proves the email is real |
| B. Email link, sign-ups spread over a few days | Free (Spark) | Planning ahead; max 5 new phones a day | Works once everyone's set up |
| C. Blaze plan with a budget alert | Card on file; likely $0 at family scale | Lowest (email link as designed) | 25,000 link emails/day; also unlocks Cloud Functions (server code). Budget alerts warn but don't stop charges |
| D. Google sign-in plus email link for non-Google users | Free (Spark) | One tap for Google users | AOL and college users still use the 5/day link |

**Claude's recommendation:** start with **A** (email + password + verification) on Spark for launch: free, no daily wall, still verified. Revisit C if you later want server code or one-tap links.

**Decided Nov 13 (Julian): D.** Google sign-in for Google users, email link for everyone else, on Spark. Non-Google family members sign up before a game night so the 5-a-day link limit is not hit on the night. The link limit counts every link sent, including a resend or a new phone or browser, so a new non-Google guest on the night may have to wait for tomorrow. The Email/Password provider has to be switched on in the console for email link to work; no password screens are offered.

Also before game night:
- Add `flashfx21.github.io` to Firebase Authentication's authorized domains
- Test sign-in emails with an AOL and a .edu address (spam folders)

## 10. Open decisions
1. ~~Sign-in option A, B, C or D (section 9)~~ Decided Nov 13: D
2. When a room closes: host taps "Close room," or rooms expire after inactivity
