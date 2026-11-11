# JuJu Studios Lobby: Expanded Game Picker (Handoff Supplement for Claude Design)

**Use with:** `juju-lobby-dynamic-handoff-2226.md` and `JuJu_Lobby_Suite.html`. This supplement replaces section 6 (Game lineup) of that handoff.
**Goal:** expand the game picker from 6 games to the full active lineup of 12, in all three styles (retro game show, 90s arcade, 70s rec room), on the big screen and the phone vote screen.
Updated Nov 10: added game #12 (one-word clue game). Per-game specs: `games/`.

---

## 1. The lineup
Titles marked * are working names. Design them as placeholders that are easy to retitle.

| # | Title | One-line pitch | Tag | Status |
|---|---|---|---|---|
| 1 | No Filler | Name 3 before time runs out. No um, no uh, no like. | Party | Playable (phase 1) |
| 2 | Dial It In | Guess where the clue lands between two opposites, 1 to 100. | Brainy | Playable (phase 2) |
| 3 | Closest Without Going Over | Guess the price, year or number. Closest without going over. | Game show | Playable (phase 2) |
| 4 | Chainword* | Race a chain of words in hard mode. Fewest guesses wins. | Words | Playable (phase 2) |
| 5 | Sketch Showdown | Two teams, one clue, two drawers. First team to guess wins. | Teams | Playable (phase 3) |
| 6 | Pin Drop | A photo appears. Drop your pin on the map. Closest wins. | Travel | Playable (phase 3), "New" badge |
| 7 | Hidden traitor game* | Grow the prize pot together while secret traitors sabotage. Banish them. | Bluff | Coming soon (marquee) |
| 8 | Word Agents | Two teams, one grid of words, spymasters give one-word clues. | Teams | Coming soon |
| 9 | Curated board game* | Race start to finish with life choices, careers and events along the way. | Family | Coming soon |
| 10 | Maze chase* | A chase through a maze on the TV; steer from your phone. | Action | Coming soon |
| 11 | Snake arena* | Everyone steers a snake on one shared screen. | Action | Coming soon |
| 12 | One-word clue game* | Give one-word clues to the guesser. Matching clues cancel out. Team mode adds a defense. | Words | Coming soon |

Player counts and lengths are not set for any game; show them as placeholder fields (e.g. "4–10 players · 15 min") on playable games only.

Game #12 has two modes (individual and team defense). If it becomes playable, its tile can show a small "Solo / Teams" mode marker; not needed while it's coming soon.

## 2. Two tile states
**Playable (games 1 to 6)**
- Full tile: title, pitch, players, length, tag
- Votable in group vote mode; live vote count and "leading" state
- Selectable as the host's pick in leader pick mode

**Coming soon (games 7 to 12)**
- Same tile shape so the picker stays one system, but clearly not playable: e.g. dimmed, covered, or marked "Coming soon"
- Title and tag only; no players, length or vote count
- Can't be voted for or picked. Tapping one does nothing, or shows a short "Not ready yet" note.
- The marquee game (#7) can get slightly more presence than the other coming-soon tiles, as a teaser

Style ideas (suggestions, not requirements):
- **A, retro game show:** coming-soon games as closed prize doors or covered tote board panels
- **B, 90s arcade:** cabinets with "OUT OF ORDER" or "COMING SOON" on a dark marquee
- **C, 70s rec room:** boxes still in shrink-wrap, or on the top shelf out of reach

## 3. Layout needs
- 12 tiles won't fit at the current 6-tile size on a 1280×720 screen. Options to explore: playable games large with coming-soon games as a smaller row or shelf; or paging/scrolling through the lineup.
- Playable games must stay readable from the couch; coming-soon tiles can be smaller.
- Phone vote screen: show the playable games only for voting; coming-soon games, if shown, sit below a divider and can't be selected.
- Watch long titles ("Closest Without Going Over," "Sketch Showdown," "Hidden traitor game," "One-word clue game") in marquees and box spines: shrink type rather than truncate.

## 4. Keep consistent with the rest of the handoff
- Leaderboard game filter: include only playable games (1 to 6); coming-soon games have no scores yet.
- Each game gets its own color or art within the chosen style, so tiles never look like one repeated card.
- Ban list still applies: no colored accent borders, no soft-shadow rounded cards, no close-cousin palettes, no pastel or purple gradients, no emoji icons.
- Original names only on screen. Don't use other companies' game names, characters or art (Pac-Man, Wordle, Codenames, Just One, The Traitors and similar are inspiration only).

## 5. Open (don't decide in the design)
- Final names for Chainword, the hidden traitor game, the curated board game, the maze chase and the one-word clue game
- Player counts and lengths for every game
- Whether coming-soon games appear on the phone at all
