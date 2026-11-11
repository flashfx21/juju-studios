# JuJu Studios Lobby: Dynamic Refresh Handoff (for Claude Design)

**Starting point:** `JuJu_Lobby_Suite.html` (the current Lobby Suite canvas, attach it with this brief). Keep its three directions, layouts, fonts and signature moves. This brief describes what to change, not a redesign.
**Goal:** turn the static exploration into an interactive prototype that behaves like a real game night, with all three styles still available, now switched from a Settings screen.
Related docs: `juju-engine-requirements-2149.md`, `game-night-suite-ideas-2233.md`, `juju-game-picker-lineup-handoff-2238.md` (replaces section 6 below).

---

## 1. Keep as-is
- Direction A (retro game show), B (90s arcade), C (70s rec room): palettes, type, textures, signature moves (tote board, arcade cabinets, game box shelf)
- Big screen 1280×720 next to a phone 390×844, scaled to fit the window
- Screen tabs in the exploration toolbar (Join, Lobby, Waiting room, Game picker, Leaderboard)
- Ban list from the original handoff: no colored accent borders, no soft-shadow rounded cards, no close-cousin palettes, no pastel or purple gradients, no emoji icons

## 2. Settings screen (new)
- Remove the A / B / C switch from the toolbar. Style is now chosen **inside the product** on a Settings screen.
- **Big screen: Host settings**
  - Lobby style: three cards (Retro game show, 90s arcade, 70s rec room), each with its palette and "JuJu Studios" in its display font. Selected card marked "In use." Tapping one restyles every screen at once.
  - Game choice: Group vote / Leader pick
  - Sound on the TV: On / Off
  - CRT scanlines: On / Off (only affects the arcade style)
  - Back to lobby
- **Phone: Your profile** (the phone side of Settings)
  - Initials in the player's color, username, email marked verified
  - Color picker
  - Stats: games played, total points, average
  - Save and go back; Sign out of this phone
- Settings and profile take on the current style's colors and fonts. Choices persist between visits.

## 3. Join screen = profile setup (change)
- Remove the 4-digit PIN everywhere.
- Fields: room code, username, **email**, **color** (6 swatches, selectable)
- Arcade keeps its 3-letter initials field
- Note under email: "We'll email you a sign-in link. Tap it once and this phone remembers you. Check your spam folder." (Sign-in method may change to email + password; see the tech stack doc. Leave room for a password field.)
- Setup should read as quick (under a minute). No guest option.

## 4. Live behavior (the "dynamic refresh")
Simulate a game night so the prototype moves on its own:
- **Lobby:** players join one at a time (start at 3, fill to 7 of 10). Every "X of 10" count updates live.
- **Connection strength:** small 3-bar signal indicator per player in every style (podium in A, status column in B, next to the name in C). Bars change occasionally. In B, a weak signal shows "LAG" instead of "READY."
- **Game picker:** votes arrive one by one; tallies, coin counts and the leading game update live. Leader pick mode shows the host's choice instead.
- Toolbar controls for the demo: **Pause / resume** and **Restart demo**. Mark the data as sample data.

## 5. Leaderboard (change)
- **Filter by game:** All games, plus each playable game
- **Sort:** Total (default) or Average
- Every row shows **total points, games played and average**
- Average sort: players with fewer than **3 games** are listed below the ranked players, unranked
- Big screen controls: A in the bottom bar, B in the bottom bar, C as stacked chips down the left wall
- Phone leaderboard reflects the current filter and sort in its header
- Scoring rules (for any copy or tooltips): every game is worth 100 points; individual games pay the top 50% on a countdown split (8 players: 40/30/20/10); 2-team games split 80/20; 3+ teams pay the top 2 teams (67/33); team points split evenly among members

## 6. Game lineup
See `juju-game-picker-lineup-handoff-2238.md` (12 games: 6 playable, 6 coming soon).

## 7. Host controls to show (decided, not yet drawn)
Add where they fit naturally, at least on the big screen: **Start game, Pause / resume, Restart game, End and return to lobby,** and an **Instructions screen** shown before each game starts. Keep per-game settings minimal.

## 8. Accessibility
- Real buttons for everything tappable; touch targets 44 px or more
- Color never the only identifier: always pair player color with initials or name
- Text contrast 4.5:1, including small labels

## 9. Open items (don't decide in the design)
- Final name for Chainword
- Whether the lobby frame stays visible during a game
- Avatar (later; color only for now)
- QR join (nice to have; not in this pass)
