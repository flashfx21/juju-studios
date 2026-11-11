# JuJu Studios lobby: design handoff

The lobby suite for JuJu Studios party games: a big-screen view (TV, 1280×720) and a phone view (390×844). It comes in three styles that share the same screens, content and actions:

| Style id | Name | Tokens |
|---|---|---|
| `game-show` | Retro game show | `tokens/game-show.json` |
| `arcade` | 90s arcade | `tokens/arcade.json` |
| `rec-room` | 70s rec room | `tokens/rec-room.json` |

All three token files use the same keys, so the app can switch themes by changing one value (`<html data-theme="arcade">` with `tokens/themes.css`). The host picks the style in Host settings, and it restyles every screen.

## Folder

```
docs/design/
  README.md        this file: screen inventory and open questions
  components.md    reusable components, sizes, states, tokens
  assets.md        fonts, textures and images, and where they come from
  tokens/          game-show.json, arcade.json, rec-room.json, themes.css
  screens/         PNG exports, one per screen per style (for reference)
  source/          the canvas's HTML (open lobby-suite.dc.html next to support.js)
```

## How to read this inventory

- **States** uses four labels: **empty** (nothing to show yet), **loading**, **error** and **live** (normal data). A state not listed for a screen isn't designed.
- **Shared** means the screen has the same content, states and actions in all three styles; only the look changes. Differences are called out.
- **Sample data:** every name, email, room code, score, timer, player count, game length, round number and finishing order in the designs is sample data. That includes the players JMohawk, GeeGee, Sadrique, KaliBear, RubyRed, Juju and Angie, room `KTZB`, `jmohawk@example.com`, "4–10 players · 15 min" and "Round 2 of 5". The QR codes are decorative patterns, not real codes.
- `screens/<style>/` has one PNG per canvas tab, each showing the TV and phone side by side (for example `09-pause.png`). Tabs with several states get one PNG per state, lettered `a`, `b`, `c`… (sign-in, loading, phone lobby, game picker, instructions, leaderboard, errors). The PNGs show the host views of Pause and Game over; the player views are in the source.
- **Proposed** marks behavior the design introduces that isn't in the product brief yet. Confirm these before building.

---

## Big screen (TV)

### 1. Host or join
**States:** live.
**Components:** logo (style signature: marquee bulb frame / neon sign / game-box lid), two choice panels (Host, Join), QR block, footer.
**Buttons**
- **Host a game** (game-show: "Host on this screen"; arcade: "1P · HOST"; rec-room: "Host on this screen →") → Host sign-in.
- **Join a game** → shows the QR code and `juju.games` for joining from a phone. On the canvas, tapping it opens the phone Join screen.

**Styles:** shared. Footer copy differs: "Pick a door" (game-show), "SELECT MODE_" (arcade), "Pick a box" (rec-room).

### 2. Host sign-in
**States:** live (waiting for the host on their phone: email link, password, create account or forgot password), loading (sending link, signing in), live (link sent / reset link sent), error (link expired). Each state follows the phone.
**Components:** large QR ("Scan to sign in", `juju.games/host`), status tag, headline, body copy, loader (loading states), "Expired" stamp (expired state only), footer.
**Buttons:** none; the host acts on the phone.
**Styles:** shared.

### 3. Lobby
**States:** empty (open seats), live (seats fill as players join, with a signal level per player).
**Components:** logo, room code, QR + `juju.games`, 10 player seats (game-show: contestant podiums; arcade: player table with NO / INIT / NAME / STATUS; rec-room: "Who's here" notepad), signal bars, "N of 10 in" count, footer with "Waiting for players".
**Buttons**
- **Settings** (rec-room: "Host settings") → Host settings.
- **Standings** (arcade: "HI-SCORES"; rec-room: "standings →" link) → Leaderboard.

**Locked:** when the host locks the room in Host settings, a **Locked** stamp sits on the room code.

**Styles:** shared content. Arcade also shows a per-player status (READY, or LAG at signal level 1), and an empty seat reads PRESS START for the next slot and OPEN after that.

### 4. Game picker
**States:** live in two modes, set in Host settings → Game choice:
- **Group vote:** live vote counts, a "leading" marker, a voting countdown and "N of 7 votes in".
- **Leader pick:** "The host is picking / JMohawk is choosing". Only the host's pick shows at full strength; the other tiles dim, and no vote counts are shown.

Coming-soon tiles have a short "Not ready yet" note (1.6s) when tapped.

When the vote timer runs out:
- **Tie:** a highlight spins between the tied games only (about 170ms a step), then lands. The footer banner reads "It's a tie! Spinning…", then "[Game] it is!".
- **No votes:** the same spin runs across all 6 playable games, with the banner "No votes! Spinning all 6…".
- Leader-pick mode never spins.

**Remote focus (TV remote or keyboard):** one playable tile at a time has the focus ring plus an "OK to open" hint. The footer shows the keys:
- Arrow keys move. Arcade moves left and right only; the other styles also move up and down between the two rows.
- **OK** / Enter opens the focused game's instructions.
- **Back** / Esc returns to the lobby (proposed key mapping).

**Components:** 6 playable game tiles (games 1–6), 6 coming-soon tiles (games 7–12; game 7 is the larger teaser), vote tally, timer, "New" badge (Pin Drop), leader and host-pick markers, spin highlight, focus ring, footer (or spin banner / remote key hints).
**Buttons**
- **Playable tile** (host taps) → Instructions for that game.
- **Coming-soon tile** → shows "Not ready yet". It can't be voted for or picked.

**Styles:** same lineup and rules. Layout differs per style:
- game-show: tote board of prize doors (3×2) with a coming-soon row underneath.
- arcade: a row of 6 cabinets with a row of out-of-order cabinets underneath.
- rec-room: coming-soon boxes on the top shelf, playable boxes on two shelves below.

### 5. Instructions (how to play)
**States**
- **Ready:** before start, "Everyone read it?"
- **Live:** game on, round status; a game-screen placeholder replaces the instructions.
- **Paused:** reached from the live state; see Pause.
- **Template:** placeholder slots for any game: title, tag, players, length, up to 4 steps, scoring line.

**Components:** header with tag · players · length; game title; numbered steps (3, or 4 in the template); scoring line; host bar.
- rec-room adds the game box with pitch and seal, next to a notepad holding the steps.

**Buttons**
- **Start game** → live state.
- **Pause / Resume** (live) → toggles pause.
- **Restart game** (live) → back to the start of the live state.
- **End and return to lobby** (arcade: "END · TO LOBBY") → Lobby.

**Styles:** shared. Scoring copy depends on the game type: individual games pay the top half of the room; team games split 80 / 20.

### 6. Paused
**States:** live (paused; the "paused for" timer counts up).
**Components:** dimmed game-screen placeholder; "Paused" panel saying who paused it; Round and Paused-for readouts; host bar.
- Panel per style: game-show marquee, arcade blinking PAUSED, rec-room cream card.

**Buttons**
- **Resume** → back to the live game.
- **Restart game** → restarts the game.
- **End and return to lobby** → Lobby.

**Styles:** shared.

### 7. Game over
**States:** live.
**Components:** finishing order for 7 players: place, player chip or initials, name, leaderboard points earned, new leaderboard total. Also a payout note and the host bar.
**Buttons**
- **Play again** → Instructions for the same game (ready state).
- **Back to lobby** → Lobby.

**Styles:** shared content. Each style highlights rows its own way:
- game-show: top three rows get gold, cream and orange faces.
- arcade: rank colors cycle pink / cyan / yellow, and my row is tinted pink.
- rec-room: 1st place is circled in orange.

### 8. Leaderboard (standings)
**States:** live, plus an unranked section. When sorting by average, players with fewer than 3 games are listed separately as unranked.
**Empty (no games played yet):** the column headers stay, with "No scores yet" / "NO HIGH SCORES YET" / "Nobody's on the board yet" and "Play a game…" in their place.
**Components:** title (filter · sort), leaderboard rows (rank, player chip or initials, name, total, games, average), game filter chips (All games + the 6 playable games), sort chips (Total, Average).
**Buttons**
- **Game filter chip** → filters by that game.
- **Sort chip** → re-sorts the list.

**Styles:** shared data.
- game-show: totals on 4-digit tote tiles, filters in the footer.
- arcade: "HIGH SCORES" table with 5-digit scores, filters in the carpet footer.
- rec-room: notepad with a CHAMP seal on 1st, filters as a list down the left side.

### 9. Host settings
**States:** live.
**Components:** three style cards ("In use" badge on the current one), Game choice toggle (Group vote / Leader pick), **Room** toggle (Open / Locked; locked rooms don't let new players join), Sound on the TV toggle (On / Off), CRT scanlines toggle (On / Off, labelled "Arcade style only").
**Buttons**
- **Style card** → switches the style everywhere.
- **Toggles** → set each option.
- **Back to lobby** → Lobby.

**Styles:** shared. Scanlines only affect arcade. The style choice lives only here; the canvas toolbar no longer has a style switch.

### 10. Errors (TV)
- **Host disconnected.** State: error, with a "Reconnecting for" timer counting up. Components: dimmed game placeholder, alert panel ("Waiting for JMohawk to reconnect"), footer "The game picks up where it left off". Buttons: none.
- **Host still away** (after about a minute, proposed). Same panel with "Host still away", "Anyone can take over from their phone", an "Away for" timer and the footer "First to tap Take over becomes the host".
- **New host.** "New host: GeeGee", "GeeGee can resume, restart or end the game", a "Paused for" timer and the footer "JMohawk can rejoin as a player" (proposed).
- **Only 1 player.** State: empty. Components: room code + QR, one filled seat and one open seat, "Games need at least 2 players", disabled **Start game**.
- **Room not found**, **Room locked** and **Room full:** these errors only appear on the phone that tried to join. The TV stays on the lobby: a Locked stamp shows when the room is locked, and 10 of 10 when it's full.

### 11. Loading (TV)
- **Sending link** and **Signing in:** the Host sign-in screen with a style loader (game-show bulbs, arcade LOADING blocks, rec-room colored dots) and the copy "Sending your link" or "Signing you in".
- **Joining** and **Reconnecting:** phone only. The TV lobby adds the seat once the player is in; a reconnecting player's signal bars drop to zero.

**Styles:** shared.

---

## Phone

### 1. Host or join
**States:** live.
**Components:** logo, two choice panels (Join first, then Host), sign-in link.
**Buttons**
- **Join a game** → Join.
- **Host a game** → Sign in.
- **Already have an account? Sign in** → Sign in.

**Styles:** shared.

### 2. Sign in
**States**
- live: email link (default).
- live: email + password.
- live: check your email. A resend countdown runs, and **Resend link** is disabled until it reaches 0.
- error: link expired.
- live: create account (username, email, password).
- live: forgot password (email only).
- live: reset link sent (same layout as check your email).

**Components:** cue card / form card, username field (create account only), email field, password field with **Show**, "Forgot your password?" and "New here? Create an account" (password state only), helper copy, "Expired" sticker or stamp.
**Buttons**
- **Email me a link** → check-your-email state.
- **Sign in** (password state) → Lobby.
- **Use a password instead** / **Email me a link instead** → switches between the two forms.
- **Back** → Host or join.
- **Resend link** → restarts the countdown.
- **Use a different email** → email-link form.
- **Send a new link** (expired) → check-your-email state.
- **Back to start** → Host or join.
- **Forgot your password?** → forgot-password form. **Send reset link** → reset link sent. **Back to sign in** → password form.
- **New here? Create an account** → create-account form. **Create account** → check your email (the account is confirmed through the emailed sign-in link). **Already have an account? Sign in** → password form.

**Styles:** shared.

### 3. Join
**States:** live (filled-in sample shown).
**Components:** room code (4 boxes), username, email, sign-in-link helper copy, color picker (6 player colors).
- arcade also has an **INITIALS** field (3 letters).

**Buttons**
- **Color swatch** → selects that color.
- **Join** (game-show buzzer "Join"; arcade "PRESS START"; rec-room "Pull up a chair") → Waiting room.

**Styles:** shared, except the arcade initials field.

### 4. Lobby (phone)
- **rec-room:** two tabs plus a link. Buttons: **Who's here**, **Game library**, **Standings** (→ Leaderboard).
  - **Who's here** (state: live): the player list.
  - **Game library** (state: live): 6 playable boxes ("On the shelf · 6 to play") and the 6 coming-soon games ("Top shelf · coming soon").
- **game-show:** the same two tabs plus a Standings link, on cream-on-navy Bebas tabs.
  - Who's here: 10 seat rows (seat bulb, player chip, name, signal bars; open seats dimmed as "Open seat").
  - Tonight's lineup: the 6 playable games plus coming-soon chips.
- **arcade:** WHO'S HERE / LIBRARY / HI-SCORES tabs.
  - Who's here: a player table (slot, initials, name, signal, READY / LAG).
  - Library: cabinet rows plus OUT OF ORDER chips.

### 5. Waiting room
**States:** live (count of players in, all-time rank, tonight's points).
**Components**
- game-show: podium with seat number, rank and tonight tiles.
- arcade: PLAYER 1 READY, initials, top-5 all-time table.
- rec-room: rank seal, Tonight and All-time lines.

**Buttons**
- **Standings** (arcade: "HI-SCORES ▸") → Leaderboard.
- **Your profile** (arcade: "PROFILE ▸") → Profile.

**Styles:** shared actions, different content blocks (above).

### 6. Vote
**States:** live (my vote marked, countdown); tie or no votes (a banner reads "It's a tie! Watch the TV" or "No votes in. Watch the TV", then "[Game] it is!"). Only the 6 playable games can be voted for; coming-soon games sit below a divider as chips that can't be selected.
**Components:** timer, playable game rows, "My vote" marker (arcade: "COIN IN"), "New" badge, coming-soon chips, lock-in button.
**Buttons**
- **Game row** → sets my vote.
- **Lock in [game]** → Waiting room.

**Styles:** shared.

### 7. Get ready
**States:** live (ready toggle off / on), live (game on: "Game on! Eyes on the TV."), live (paused by the host).
**Components:** "Up next · tag", game title, steps, scoring line, ready button.
**Buttons:** **I'm ready** ↔ **You're ready** (arcade: "I'M READY" ↔ "READY!") toggles ready.
**Styles:** shared.

### 8. Paused
**States:** live, with two views:
- **Host view:** "Every screen is on hold. Only you can resume."
- **Player view:** "Hang tight", score so far, "Keep this screen open".

**Components:** round · game line, paused panel with the paused-for timer, score readout (player view).
**Buttons (host view)**
- **Resume** → live game.
- **Restart game** → restarts the game.
- **End and return to lobby** → Lobby.

The player view has no buttons.
**Styles:** shared.

### 9. Game over
**States:** live, with host and player views.
**Components:** "You finished [place]", points earned, new total, compact finishing order.
**Buttons (host view)**
- **Play again** → Instructions.
- **Back to lobby** → Lobby.

Player view: no buttons, just "The host picks what's next".
**Styles:** shared.

### 10. Leaderboard (standings)
**States:** live, plus the unranked section (same rule as the TV); empty ("No scores yet").
**Components:** title showing the current filter · sort (the phone has no filter controls; it shows the TV's filter), leaderboard rows with a "You" marker.
**Buttons:** **Back to the show** (or the style's equivalent) → Waiting room.
**Styles:** shared.

### 11. Profile
**States:** live.
**Components:** avatar (initials in my color), username, email, **Verified** badge, color picker, stats (games played, total points, average).
**Buttons**
- **Color swatch** → selects that color.
- **Save and go back** → Waiting room.
- **Sign out of this phone** → Join.

**Styles:** shared.

### 12. Errors (phone)
Each error uses one template: room / status line, stamp, label, headline, body, optional code tiles, optional reconnect line, primary button, secondary link.

- **Room not found.** State: error. The code tiles show the entered code ringed in the danger color.
  - **Try again** → Join.
  - **Back to start** → Host or join.
- **Room locked.** State: error. "The host locked the room…"
  - **Try again** → Join.
  - **Join a different room** → Join.
- **Room full.** State: error. "All 10 seats are taken…"
  - **Try again** → Join.
  - **Join a different room** → Join.
- **Host disconnected.** State: error, with a "Reconnecting…" timer and "Keep this screen open".
  - **Leave room** → Host or join.
- **Host away: take over** (proposed timing: after about a minute). "The host is still away", with an away timer.
  - **Take over as host** → New host.
  - **Keep waiting** → Host disconnected.
- **New host.** "You're the host now".
  - **Resume game** → live game.
  - **End and return to lobby** → Lobby.
- **Only 1 player.** State: empty, on the host's phone. Shows the room code and a disabled **Start game · need 1 more**.
  - **Back to lobby** → Lobby.

**Styles:** shared.

### 13. Loading (phone)
These use the error template with a style loader and no primary button ("Keep this screen open").
- **Joining room:** "Finding your seat". **Cancel** → Join.
- **Sending link:** "Sending your link". **Cancel** → Sign in.
- **Signing in:** "Signing you in". **Cancel** → Host or join.
- **Reconnecting:** "Your phone lost its connection…", with the reconnect timer. **Leave room** → Host or join.

---

## Shared vs. different, summary

- **Same in all three styles:** every screen, state, button and its action, and the game lineup and rules. All copy is shared, except where noted under each screen (style-specific button labels and footer lines, for example).
- **Different per style:**
  - Layout of the game picker, lobby seats, leaderboard and waiting room.
  - Signature components (see `components.md`).
  - Arcade only: the initials field on Join, the scanlines overlay, and the uppercase Press Start copy.
  - Phone lobby tabs exist in all three styles, each in its own look.

## Resolved in this pass

- **Loading:** joining a room, sending a link, signing in and reconnecting are designed, with a loader per style.
- **Phone lobby:** game-show and arcade now have one too.
- **Sign-in:** forgot password, reset link sent and create account are designed.
- **Room full** is designed.
- **Room lock:** Host settings has a Room Open / Locked toggle, and the lobby shows a Locked stamp.
- **Host never returns:** another player can take over as host (Host away → New host).
- **TV remote:** focus states are designed on the game picker.
- **Leaderboard empty state** is designed.
- **Vote tie or no votes:** a random spin picks among the tied games (or all 6 with no votes).
- The canvas toolbar's style switch is removed; style lives only in Host settings (handoff §2).

## Open questions

1. **Proposed timings:**
   - takeover offered after "over a minute" away
   - sign-in link "works once and expires in 15 minutes"
   - 45-second resend wait
   - spin of about 170ms a step, landing after about 2.5–3.5s
2. **Takeover rules:**
   - Who can take over: the first player to tap, or a vote?
   - What happens to the old host: the design says "JMohawk can rejoin as a player" (proposed).
   - What if no one takes over?
3. **Remote keys:** the Back / Esc → lobby mapping is proposed. Focus is only designed on the game picker. Every other TV screen still needs a focus order. Use the same focus ring (see `components.md`).
4. **Loading the leaderboard** and **pairing the TV after sign-in** still have no loading state.
5. **Password vs. email link:** is the password optional, or does it replace the email link? Create account currently confirms through an emailed sign-in link.
6. **Game over payouts:**
   - The brief sets 40 / 30 / 20 / 10 for 8 players.
   - For 7 players the design uses the same four payouts.
   - For team games it shows 20 each for the winners and 7 / 7 / 6 for the others.
   - Confirm rounding for odd player counts.
7. **Pause:** only the host (or a new host) can pause or resume. Confirm players can't.
8. **Play again** goes back to the same game's instructions. Confirm it shouldn't go to the Game picker.
9. **Phone leaderboard** has no filter or sort controls and mirrors the TV. Confirm.
10. **Initials:** only arcade asks for them on Join. Should all styles store them, or should they be derived from the username?
11. **Coming-soon games on the phone** are shown below a divider. Whether to show them at all is still open (game picker supplement).
12. **Working titles, player counts and lengths:**
    - Final names are still needed for Chainword, Hidden traitor game, Curated board game, Maze chase, Snake arena and One-word clue game.
    - All player counts and lengths are placeholders.
13. **Game screens** are placeholders.
14. **Sound on the TV** is a setting, but no audio is specified.
15. **QR join:** the lobby brief lists QR join as "nice to have; not in this pass", but the design shows QR codes, which are decorative. Decide whether to ship QR, and define the real join and sign-in URLs.
16. **Color mismatch:** the game-show style card in Host settings uses teal `#1E8C86` in its swatch row, but the screens use `#177A74`. Pick one.
17. **Scanlines:** the setting is labelled "Arcade style only". Should it be hidden in the other styles?
18. **Lobby during a game:** whether the lobby frame stays visible during a game is still open (lobby brief §9).
