# Game Night Suite: Idea Log

Status: concept review and phase planning. Phases set Nov 10. Engine requirements: `juju-engine-requirements-2149.md`. Stack: `juju-engine-tech-stack-0852.md`. Per-game specs: `games/`.
Started Nov 9, 2026. Updated Nov 11.

## The suite concept
A set of phone party games hosted from Julian's GitHub (`flashfx21/juju-studios`) under the JuJu Studios name. One shared screen (laptop or TV) hosts, and everyone joins on their phone with a room code, the way Jackbox works. Private for friends and family at first. Must work on the road, not tied to the home PC. Target up to 8 to 10 players.

**Core principle: one shared engine, many games.** The engine is the console and each game is a cartridge. Each game only adds its own rules and screens. Build No Filler first; it becomes the engine everything else reuses.

Tech: static site on GitHub Pages; Firebase for sign-in, live play and saved data (decided Nov 11). Local testing with the Firebase emulators and browser tabs.

---

## Phase planning

### What each game needs
The point of phasing: each phase should add as few new engine pieces as possible, and each new piece should unlock several games.

| Game | Status | Engine pieces it needs | Content it needs | Relative effort* |
|---|---|---|---|---|
| No Filler | Keep | Lobby, turns, timer, voting, packs, leaderboard | Prompt deck (exists) | M (builds the engine) |
| Dial It In | Approved | Private number entry, optional dial | Spectrum card pack | S |
| Closest Without Going Over | Liked | Private number entry | Question pack (prices, years, numbers) | S |
| Chainword (working name) | Active | Private text entry, per-player progress on TV | Word list | M |
| Sketch Showdown | Active | Teams, live drawing sent phone to TV | Clue list | M to L |
| Pin Drop | To test | Map on phone, photo packs | Photo packs with locations | M |
| Don't Jinx It (one-word clue game) | New, phase 1 | Private text entry, duplicate matching, teams (for team mode) | Mystery word list | S to M |
| Hidden traitor (working title) | Marquee candidate | Secret roles, multi-step rounds, missions borrowed from other games | Mission set | L |
| Word Agents | Deep dive later | Teams, secret key on some phones, grid on TV | Word list | M |
| Curated board game | Deep dive later | Board on TV, spinner, choices, longer saves | Board, events, careers | L to XL |
| Maze chase | Deep dive later | Real-time controls, fast connection | Maze levels | L |
| Snake arena | Backlog | Real-time controls, fast connection | None | M (after maze tech) |

*Relative effort is Claude's estimate, not a schedule: S = small, M = medium, L = large.

### Phases (set Nov 10, reordered Nov 11)
Julian's goal: the engine and a few games ready **in a few weeks, if possible**. Phase order reset by Julian on Nov 11.

**Phase 1 (current): Engine + four games**
Lobby (designed in Claude Design), room codes, phones joining, profiles, timer, private input on each phone, game-pick voting, content packs, leaderboard. Games: Dial It In, Chainword, Don't Jinx It (the one-word clue game) and Pin Drop. Chainword is the first cartridge. Don't Jinx It ships its individual mode here; team mode waits for teams in phase 2. Pin Drop brings maps and photo packs.

**Phase 2: No Filler, Sketch Showdown**
No Filler brings turns and Clean / Filler voting. Sketch Showdown brings teams and live drawing; teams also unlock Don't Jinx It's team mode.

**Phase 3: Everything else, in suggested build order**
Each game reuses what an earlier one built.
1. Closest Without Going Over: private number entry from Dial It In; the smallest game left
2. Word Agents: teams from phase 2, plus a secret key on some phones
3. Hidden traitor marquee game: secret roles and multi-step rounds; its missions borrow from other games, so it comes after several exist
4. Curated board game: the biggest scope item
5. Maze chase: real-time controls and a fast connection
6. Snake arena: reuses maze chase's real-time tech

Scope note (Nov 11): phase 1 is now four games on top of the engine, and Pin Drop needs a map (likely a new dependency) and photo packs. "A few weeks" fits the engine plus two or three phase 1 games; treat Pin Drop as the stretch until the engine is proven at a real game night.

---

## Suite lobby and interface (decided Nov 10)
- Everyone joins the lobby from their phone
- Game choice: the group votes, or the leader (host) picks. Host setting.
- **Persistent leaderboard in the lobby, filterable by game, plus an overall view**
- **Profile screen:** username, preferred color; avatar later
- Three lobby styles, switched from a Settings screen
- Design in Claude Design, lock it down, then build

Design briefs: `juju-lobby-dynamic-handoff-2226.md` (interactive refresh), `juju-game-picker-lineup-handoff-2238.md` (full game lineup for the picker).

## Game details
Full specs per game live in `games/`. Summary:

- **No Filler (keep):** name 3 before time runs out, no filler words. Easy 1 / Medium 2 / Hard 3; first to 15; others vote Clean or Filler. Also a prompt test bench.
- **Dial It In (approved):** private guesses on a spectrum; number entry 1 to 50 or 1 to 100; experiment with a dial. Open: individual or team-average scoring.
- **Closest Without Going Over (liked):** guess a price, year or number; closest without going over. Open: content and penalty.
- **Chainword (working name):** chain of 3 or 5 words, fewest guesses wins; hard mode is an option, off by default (Nov 11). Open: name, hard mode scope, caps and tiebreakers.
- **Sketch Showdown:** two teams, two drawers, same clue; first team to guess wins; both sketches shown after. Open: can teams see each other's sketch.
- **Pin Drop:** photos only; Wikimedia Commons and Mapillary to explore; OpenStreetMap on the phone.
- **Don't Jinx It (one-word clue game, added Nov 10, named Nov 11):** matching clues cancel; individual mode plus a team defense mode, likely 2 clues per person. Open: defense balance, matching rules, scoring.
- **Hidden traitor (marquee):** secret roles, missions grow a pot, roundtable banishment, night eliminations, ghosts keep playing. Needs its own design pass.
- **Word Agents:** team word grid with spymasters; Julian's twist to come.
- **Curated board game:** start-to-finish path with life choices.
- **Maze chase / snake arena:** real-time action, later.

## Archived (Nov 10; kept for reference)
- **Fib Finder** (fake-out trivia answers)
- **The Odd One** (secret word, find the imposter)
- **Hot takes** (vote, then guess how the group voted)
- **Family trivia** (questions about your own family)
- **Story chain** (each player adds a sentence; not picked up)

Removed: Quick-reaction party (buzzer races, reflex mini-games).

## Data storage (decided Nov 11)
**Firebase** on the free Spark plan. Alternatives considered: host laptop storage, results file in the repo, Google Sheets, Supabase and Appwrite (free projects pause when inactive), Convex, InstantDB, Cloudflare Durable Objects (kept in mind for later).
What gets saved:
- **Players:** username, color, initials, avatar (later). Email stays in Firebase Authentication.
- **Game nights:** date, who came
- **Results:** game, player, score, placement, winner
- **Card stats:** card ID, times played, pass rate, flags (No Filler prompt testing)
Must-do: security rules, because the site's code is public. Keep an "export to file" backup.
Sign-in method: open, because the free plan allows only 5 sign-in-link emails a day (see tech stack doc, section 9).

## Naming and IP note
Wavelength, Codenames, Wordle, Just One, The Traitors, Pac-Man, Candy Land, Chutes and Ladders, Sorry and The Game of Life are other companies' products. Mechanics generally aren't protected; names, artwork, characters, card text and word lists are. Photos need licenses or credits unless they're your own. Fine for a private family build; use original names and content before anything goes public. (Not legal advice; a CLO review item.)

## Open questions for review
- Sign-in method (tech stack doc, section 9)
- Don't Jinx It: defense balance; matching rules; scoring
- Chainword: name; guess cap, miss penalty, tiebreaker
- Sketch Showdown: can teams see each other's sketch; drawer rotation; scoring
- Dial It In: individual scoring or team average?
- Closest Without Going Over: what gets guessed; going-over penalty
- Pin Drop: Wikimedia or Mapillary first
- Hidden traitor: name, rounds, mission types
- Lobby game choice: default to group vote or leader pick?
- No Filler judging and timer length
