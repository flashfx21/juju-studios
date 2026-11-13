# JuJu Studios

A suite of phone party games for family and friends, played like Jackbox: one shared screen (TV or laptop) hosts, everyone joins on their phone with a room code. Private for now. Hosted on GitHub Pages.

## How this repo is organized
- One shared **engine** (the console) and many **games** (cartridges).
- `src/engine/` rooms, joining, presence and connection bars, timer, voting, turn order, teams, pause/restart, scoring, results.
- `src/app/` routing (host vs. phone), sign-in, profile, settings.
- `src/ui/` shared components and the three lobby styles: retro game show, 90s arcade, 70s rec room.
- `src/games/<game-id>/` one folder per game. `src/games/_template/` is the starting point for a new game. `src/games/registry.ts` lists installed games.
- `packs/<game-id>/` content packs (prompts, words, questions, photos). `packs/shared/` holds content any game can use, such as the English word list loaded by `src/engine/dictionary.ts`.
- `docs/` requirements, tech stack, design handoffs. `docs/design/` exported designs and tokens.
- Games keep their lineup number (`docs/games/<nn>-<id>.md`) whenever docs, notes and reports in this repo name them: "06 Pin Drop", "05 Sketch Showdown". Ids, folders and on-screen titles have no number.

## Rules for games (the cartridge contract)
- Each game folder has: `manifest.ts` (title, pitch, tag, players, modes, status), `rules.ts` (pure logic: setup, onInput, onTimer, isOver, finishingOrder), `TvScreen.tsx`, `PhoneScreen.tsx`, `Instructions.tsx`, `rules.test.ts`.
- Games never calculate leaderboard points. They report a finishing order; `src/engine/scoring` applies the rules.
- New games start with status "coming soon" and only become "playable" after tests pass and a local playtest.
- Every game is in one phase: Not Started, Design, Development, Solo test, Group test, Production. Definitions and exit rules: `docs/games/README.md`. Only Production sets `status: 'playable'` in code. Keep each spec's Status line and the README table current when a game changes phase.
- Games in testing get a `Playtest.tsx` listed in `src/app/playtests.ts`; they open at `#/playtest/<game-id>` under Solo play, for signed-in players only (README, Playtests).

## Scoring (decided)
- Every game is worth 100 points total.
- Individual games: top 50% score on a countdown split (8 players: 40/30/20/10).
- 2-team games: 80/20. 3+ teams: top 2 teams score (67/33). Team points split evenly among members.
- Leaderboard: overall and per game; default sort by total, toggle to average; show games played. Average sort ranks only players with 3+ games.

## Stack
- TypeScript, Vite, React. Deploy to GitHub Pages with GitHub Actions (`.github/workflows/deploy.yml`, every push to `main`). Site: https://flashfx21.github.io/juju-studios/ (Vite `base` is `/juju-studios/`).
- Backend: **Firebase** (decided Nov 11), Spark free plan, Realtime Database. Keep backend calls behind `src/engine/net/` so it can be swapped. Full stack and data model: `docs/juju-engine-tech-stack-0852.md`.
- Sign-in: verified email, any provider. No guest play. Profiles: username, color, initials. Method is **decided** (Nov 13): Google sign-in plus email link, option D (tech stack doc, section 9). Non-Google players sign up ahead of game night because of the 5-a-day link limit.
- Lobby styles: tokens in `src/ui/themes/themes.css` (copied from `docs/design/tokens/`), selected with `data-theme` on `<html>`.

## Working style
**Working rules in effect:** W1, W3, W5, W6
- Julian learns best with simple examples and comparisons. Explain new concepts briefly.
- Keep scope tight. Push back on feature additions; log them in `docs/later.md` instead.
- Small commits with clear messages. Ask before adding a dependency.
- Don't use other companies' game names, characters or art on screen.
