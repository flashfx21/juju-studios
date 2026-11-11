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
- 2026-11-11: **Style is personal** (Julian's call, launch requirement): each phone shows its own user's style, the TV shows the host's. Changed on the phone Profile screen ("Your style" row). Before sign-in, a phone uses its last style. This replaces the design's "host style restyles every screen". When profiles exist, the style is saved on the profile; until then per device in `juju.myStyle` (`src/app/useMyStyle.ts`, which also carries over the earlier `juju.hostSettings.style`). Host settings' style cards set the same personal style; the heading reads "Your style · the TV and your phone".
- 2026-11-11: Profile (`#/profile`) is built from the design plus an extrapolated "Your style" row (small `StyleCards`, shared with Host settings). Join saves a local profile (`juju.profile`: username, initials, color, email) so Profile has real data; no Verified badge and stats show 0 until the backend exists. In the rec-room phone card the "In use" ring is orange and focus is navy, since cream and walnut both blend in.
- 2026-11-11: All screens must exist in all three styles. The gaps handoff (`docs/handoffs/juju-design-gaps-handoff.md`) came back as a design update (34 screens per style). It did not include the Profile "Your style" row or the Host settings wording change; Julian chose to have me extrapolate those.
- 2026-11-11: Host settings gained a Room Open/Locked toggle in the design. Not built until rooms exist (same reason as Sound).
- 2026-11-11: All 12 games are "coming soon" (`src/games/lineup.ts`). The picker fills its six large slots with a large version of each style's coming-soon look, in each game's own tile color (`src/ui/gameTileColors.ts`). That large look is an extrapolation; the design only draws large playable tiles.
- 2026-11-11: No QR codes yet (Julian's call): screens show the real site address instead. A QR library would be a new dependency.
- 2026-11-11: Sign-in and Join are UI only. Forms validate, then move on; every such screen shows a "Preview: isn't connected yet" note. Both sign-in forms (email link and password) are built because the method is still open. Join sends you to "Check your email"; the email is kept in sessionStorage (`juju.pendingEmail`) to show there.
- 2026-11-11: Arcade asks for initials on Join (design open question 12 unresolved); they fill from the first 3 letters of the username until edited.
- 2026-11-11: Game-show swatch teal uses the token `#177A74` (design open question 19 had `#1E8C86` on the settings card).
- 2026-11-11: CSS approach: shared markup, per-style CSS under `:root[data-theme=...]`. Per-style wording lives in small data maps at the top of each screen file (`useLobbyStyle()` context). Style cards carry their own `data-theme` to preview a style.
- 2026-11-11: Focus rings: always a different color from the selection ring; inside cream cards (game-show cue card, rec-room phone card) they switch to the card's dark ink.
- 2026-11-11: Vitest adopted as the test runner (Julian OK'd), `npm test` runs `vitest run`.
- 2026-11-11: Draft cartridge types live in `src/games/types.ts` (made on game/chainword). Rules get a `RulesContext` ({ now, random }) as a last argument so they stay pure and testable; this adds to the tech stack doc section 7 signatures. Finishing order is `PlayerId[][]` (each inner list is one place; ties share a place). Other game branches should use the same file.
- 2026-11-11: Chainword: hard mode is a setting, off by default (Julian: forced hard mode made playtests less fun). When on, it keeps greens in place and reuses revealed letters as many times as revealed; refused guesses are not counted (`checkGuess` tells the phone why). No round timer. TV gets `tvProgress()`: marks only, no letters.
- 2026-11-11: Chainword practice (`#/practice/chainword`, Julian's call): one player in the browser running the real rules, no backend. `src/games/chainword/PhoneScreen.tsx` takes state, player and onGuess so the same screen serves real play later. Typed guesses use the phone keyboard, no on-screen keyboard. Tile colors are fixed across styles (green #2f7a3a, yellow #e6b422 with a dot, gray #5c6066) and pass contrast. No Chainword design exists; the layout is an extrapolation from the shared phone pieces.
- 2026-11-11: Chainword is the first cartridge (phase 1).
- 2026-11-11: Phase order reset (Julian): phase 1 Dial It In, Chainword, Don't Jinx It (one-word clue game, id `dont-jinx-it`, named Nov 11), Pin Drop; phase 2 No Filler, Sketch Showdown; phase 3 everything else in a suggested build order (Closest Without Going Over, Word Agents, hidden traitor, board game, maze chase, snake arena). Don't Jinx It ships individual mode in phase 1; team mode waits for phase 2 teams.
- 2026-11-11: Chainword's `src/games/types.ts` is the draft contract on main (Julian chose to merge game/chainword into main). Dial It In adopts it when resumed.
- 2026-11-11: Playtests (Julian): games in testing open at `#/playtest/<game-id>` behind one playtest code (Julian has it; never write it in the repo, which is public), reused for every game. Stored as an FNV hash in `src/app/playtestCode.ts` (not security; crypto.subtle was avoided because it fails over plain http on the home Wi-Fi). Unlock remembered per device. Pages are lazy-loaded from `src/app/playtests.ts`.
- 2026-11-11: Chainword level 1 playtest (Julian): no backend. A chain code (4 consonants + letters per word + words in chain + H for hard mode, e.g. KPDT53 or KPDT53H) seeds the deal, so every phone gets the same chain; players compare totals out loud. Word length is a setting: 4, 5, 6 or 7, default 5. 6 guesses at every length. End game counts the current word and every unreached word as 7.
- 2026-11-11: Chainword word lists: answers curated by hand per length (`packs/chainword/answers.json`); accepted guesses from ENABLE (public domain) plus answers (`guesses.json`, one string per length). ENABLE was downloaded once; the build script is not kept in the repo.
- 2026-11-11: No database work yet, and PC-as-player is on hold (Julian). Phone playtest first.
- 2026-11-11: Chainword phone play screen: on-screen QWERTY keyboard fills the boxes (no text box), keys colored per current word, chain progress bar, result panel after each word, End game is a modal dialog. Game screens use `PhoneFrame fit` (exactly one screen tall, `100dvh`, no scroll); the board sizes tiles with container query units.
- 2026-11-11: Dial It In rules: per-player closeness scoring, no team mode. Points: 10 for a bullseye, minus 1 per step away (step is 2 on 1 to 100, 1 on 1 to 50), floor 0. A guess is final once submitted. The round reveals when every guesser is in, or on the timer; the next timer starts the next clue giver. Clue givers rotate in player order, one round each. All rounds (card and target) are dealt at setup with `ctx.random`. Phones default to number entry; the dial is a later experiment.
- 2026-11-11: Dial It In playtest (Julian): single-player interface test only, at `#/playtest/dial-it-in` behind the playtest code. You plus two bots (random guesses); a dashed Dev box stands in for other phones and the engine timer (Bots lock in, Time's up, Next round). `PhoneScreen.tsx` takes state, player, names and onGuess so it can serve real play later. Number entry sits in a cue card because shared fields take their text color from the card. No Dial It In design exists; the layout is extrapolated from the shared phone pieces.
- 2026-11-11: Dial It In guess dial (Julian asked for a safe-style touch control, typing kept as a backup): drag the face; clockwise counts up (volume-knob convention, the reverse of a real safe); one turn covers the whole range; dragging wraps past either end, arrow keys stop at the ends (slider semantics). Starts mid-range. Dial and typed box always show the same number. Arithmetic lives in `dialTurns.ts` with tests. 1 has a tick but no label, since it would overlap the top number.
- 2026-11-11: Dial It In state holds secrets (every round's target). Whatever publishes state to `rooms/{code}/state` must strip targets and send the current one only to the clue giver's `private/{uid}`.
- Working rules in effect: W1, W3, W5, W6 (recorded in CLAUDE.md).

## Preferences
- Julian wants each step explained briefly as we go (relearning mode).
- Julian prefers getting to visible UI early rather than waiting on backend decisions.

## Lessons Learned
- Chainword's rules advance to the next word the moment a word is done, so any "how did that word go" view has to be held by the screen (PhoneScreen keeps a review index). That was the missing feedback on the last guess.
- Headless Edge test runs: give each run its own debugging port and kill the whole process tree (`taskkill /T /F`), or the next run attaches to a dead browser. A full Chainword run can take over 90 seconds on this PC; keep safety timers well above that.
- Don't put JS template literals (backticks) inside `node -e "..."` in the Bash tool: bash runs them as commands and silently blanks the text. Write the edit script to a file in the scratchpad instead.
- Most repo files use CRLF line endings; scripted find-and-replace must match `\r\n` (or normalize first).
- Headless Edge screenshots below about 500px wide are clipped by its minimum window size. Set the viewport over the DevTools protocol instead (`Emulation.setDeviceMetricsOverride`).
- Windows file names are case-insensitive: `HostSettings.tsx` and `hostSettings.ts` collide. Hooks live in `useX.ts` files, which avoids it.
- Stopping a background `npx vite preview` task leaves the node child running on its port. Find it with `Get-NetTCPConnection -LocalPort 4173` and stop that PID.
- Synthetic Enter key presses over the DevTools protocol need `text: "\r"` to activate a button.
- Bebas Neue (game-show label font) has no lowercase. Never set the site address in it: the `/juju-studios` path is case-sensitive on GitHub Pages, so an all-caps address would 404 if typed.
- Python isn't installed on this PC; use node for one-off scripts.
- Never clean up headless test browsers with `taskkill /IM msedge.exe`: it closes Julian's own Edge windows too. Kill only the spawned process tree by PID (`taskkill /PID <pid> /T /F`).
- Headless Edge touch drags (`Input.dispatchTouchEvent`) sometimes stall a run; a retry passes. Give scripts their own timeout so a stall can't hang the shell.

## Current State
- Build order step 1 done. Ahead of order: Host settings, game picker, Host or join, host sign-in, phone sign-in (4 states), Join.
- Next options: a first playable game wired as a live example (Julian wants this eventually), more designed screens (waiting room, leaderboard, instructions, pause, game over, errors), or step 2 Firebase once sign-in is decided.
- Not created yet, by design: `firebase.json`, `database.rules.json` (step 2); `src/games/registry.ts` and `_template/` contents (step 6, cartridge contract).
- Open decisions blocking step 2: sign-in method (tech stack doc section 9, A to D).
- Vitest installed (`npm test`). Chainword rules, tests, phone screen and level 1 playtest (chain codes, word lengths 4 to 7, End game) are done and on main. TV screen and Instructions not started. Next for Chainword: a real level 1 playtest on phones.
- Design handoffs live in `docs/handoffs/`.
- Game branches `game/dial-it-in` and `game/chainword` live in worktrees `../juju-studios-dial-it-in` and `../juju-studios-chainword`. Both are pushed.
- Dial It In (game/dial-it-in): main merged in, own types.ts dropped, rules adapted to main's contract. Rules, tests and spectrum pack done. Rules merged to main on 2026-11-11 (Julian's call) with status still "coming soon"; later Dial It In work continues on game/dial-it-in. Phone screen and single-player playtest merged to main and live on 2026-11-11 (Julian testing on his phone). Safe-style guess dial merged to main and live on 2026-11-11 for a phone test of the touch feel. TV screen, Instructions and registry line still to do.
- `manifest.ts` repeats each game's title, tag and pitch from `src/games/lineup.ts`. Once `registry.ts` exists, the lineup should read them from manifests.

## Development Log
### Week of 2026-11-09
- Done: docs and lobby design handoff committed; folder structure; Pages deploy workflow; Host settings (style, game choice, scanlines); game picker (TV) and vote (phone) with all games coming soon; Host or join (TV + phone); TV host sign-in; phone sign-in in four states; Join with validation; shared TV header, phone frame, form fields.
- Chainword rules, word pack and tests (branch game/chainword); draft `src/games/types.ts`; Chainword practice phone screen.
- Dial It In rules, tests and spectrum pack (branch game/dial-it-in), adapted to main's contract and merged to main. Phone screen, single-player playtest and safe-style guess dial merged to main and live.
- Chainword hard mode made an option (off by default, H on chain codes). Phase order reset: phase 1 is Dial It In, Chainword, one-word clue game, Pin Drop.
- In progress: none.
- Blockers: sign-in method decision before Firebase auth work.
- Next: Julian's pick (live example game, more screens, or Firebase).
