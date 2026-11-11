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
- `screens/<style>/` has one PNG per canvas tab, each showing the TV and phone side by side (for example `08-pause.png`). Sign-in, instructions and errors get one PNG per state (`02a`–`02d`, `07a`–`07b`, `12a`–`12d`). The PNGs show the host views of Pause and Game over; the player views are in the source.

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
**States:** live (waiting for the host to sign in on their phone), live (link sent), error (link expired). Each state follows the phone sign-in state.
**Components:** large QR ("Scan to sign in", `juju.games/host`), status tag, headline, body copy, "Expired" stamp (expired state only), footer.
**Buttons:** none; the host acts on the phone.
**Styles:** shared.

### 3. Lobby
**States:** empty (open seats), live (seats fill as players join, with a signal level per player).
**Components:** logo, room code, QR + `juju.games`, 10 player seats (game-show: contestant podiums; arcade: player table with NO / INIT / NAME / STATUS; rec-room: "Who's here" notepad), signal bars, "N of 10 in" count, footer with "Waiting for players".
**Buttons**
- **Settings** (rec-room: "Host settings") → Host settings.
- **Standings** (arcade: "HI-SCORES"; rec-room: "standings →" link) → Leaderboard.

**Styles:** shared content. Arcade also shows a per-player status (READY, or LAG at signal level 1), and an empty seat reads PRESS START for the next slot and OPEN after that.

### 4. Game picker
**States:** live in two modes, set in Host settings → Game choice:
- **Group vote:** live vote counts, a "leading" marker, a voting countdown and "N of 7 votes in".
- **Leader pick:** "The host is picking / JMohawk is choosing". Only the host's pick shows at full strength; the other tiles dim, and no vote counts are shown.

Coming-soon tiles have a short "Not ready yet" note (1.6s) when tapped.
**Components:** 6 playable game tiles (games 1–6), 6 coming-soon tiles (games 7–12; game 7 is the larger teaser), vote tally, timer, "New" badge (Pin Drop), leader and host-pick markers, footer.
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
**Components:** three style cards ("In use" badge on the current one), Game choice toggle (Group vote / Leader pick), Sound on the TV toggle (On / Off), CRT scanlines toggle (On / Off, labelled "Arcade style only").
**Buttons**
- **Style card** → switches the style everywhere.
- **Toggles** → set each option.
- **Back to lobby** → Lobby.

**Styles:** shared. Scanlines only affect arcade.

### 10. Errors (TV)
- **Host disconnected.** State: error, with a "Reconnecting for" timer counting up. Components: dimmed game placeholder, alert panel ("Waiting for JMohawk to reconnect"), footer "The game picks up where it left off". Buttons: none.
- **Only 1 player.** State: empty. Components: room code + QR, one filled seat and one open seat, "Games need at least 2 players", disabled **Start game**.
- **Room not found** and **Room locked:** the TV doesn't change. These errors only appear on the phone that tried to join.

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

**Components:** cue card / form card, email field, password field with **Show** and "Forgot your password?" (password state only), helper copy, "Expired" sticker or stamp.
**Buttons**
- **Email me a link** → check-your-email state.
- **Sign in** (password state) → Lobby.
- **Use a password instead** / **Email me a link instead** → switches between the two forms.
- **Back** → Host or join.
- **Resend link** → restarts the countdown.
- **Use a different email** → email-link form.
- **Send a new link** (expired) → check-your-email state.
- **Back to start** → Host or join.

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
- **game-show, arcade:** not designed (the canvas shows a placeholder).

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
**States:** live (my vote marked, countdown). Only the 6 playable games can be voted for; coming-soon games sit below a divider as chips that can't be selected.
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
**States:** live, plus the unranked section (same rule as the TV).
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
- **Host disconnected.** State: error, with a "Reconnecting…" timer and "Keep this screen open".
  - **Leave room** → Host or join.
- **Only 1 player.** State: empty, on the host's phone. Shows the room code and a disabled **Start game · need 1 more**.
  - **Back to lobby** → Lobby.

**Styles:** shared.

---

## Shared vs. different, summary

- **Same in all three styles:** every screen, state, button and its action, and the game lineup and rules. All copy is shared, except where noted under each screen (style-specific button labels and footer lines, for example).
- **Different per style:**
  - Layout of the game picker, lobby seats, leaderboard and waiting room.
  - Signature components (see `components.md`).
  - Arcade only: the initials field on Join, the scanlines overlay, and the uppercase Press Start copy.
  - Rec-room only: the phone lobby tabs; game-show and arcade have no phone lobby yet.

## Open questions

1. **Loading states aren't designed anywhere:**
   - joining a room
   - sending a sign-in link
   - signing in with a password
   - loading the leaderboard
   - waiting for the TV to pair after sign-in
2. **Phone lobby** exists only in rec-room. Do game-show and arcade need one, or does the phone go straight to the Waiting room?
3. **Sign-in link lifetime:** the copy says the link "works once and expires in 15 minutes", and the resend wait is 45 seconds. Both are placeholder values.
4. **Password sign-in:**
   - The "Forgot your password?" flow isn't designed.
   - Account creation isn't designed.
   - It's unclear whether a password is optional or replaces the email link.
5. **Game over payouts:**
   - 40 / 30 / 20 / 10 for the top four of 7 players is a proposal, as is the team split (80 shared by the winning team, 20 by the other, shown as 20 each and 7 / 7 / 6).
   - Confirm the rule for odd player counts and rounding.
6. **Host disconnected:**
   - What happens if the host never comes back? There's no timeout or end state.
   - Can another player take over?
7. **Room locked:** there's no control for the host to lock or unlock a room.
8. **Room full:** a join attempt when 10 of 10 seats are taken isn't designed.
9. **Pause:** only the host can pause or resume in the designs. Confirm players can't pause.
10. **Play again** goes back to the same game's instructions. Confirm it shouldn't go to the Game picker.
11. **Phone leaderboard** has no filter or sort controls and mirrors the TV. Confirm.
12. **Initials:** only arcade asks for them on Join. Should all styles store them, or should they be derived from the username?
13. **Coming-soon games on the phone:** they're shown below a divider. Whether to show them at all is still open (from the game picker supplement).
14. **Working titles, player counts and lengths:**
    - Final names are still needed for Chainword, Hidden traitor game, Curated board game, Maze chase, Snake arena and One-word clue game.
    - All player counts and lengths are placeholders.
15. **Game screens** are placeholders ("Game screen placeholder").
16. **Sound on the TV** is a setting, but no audio is specified.
17. **TV input:** remote or keyboard focus states aren't designed. Hover and focus states in general aren't defined.
18. **QR codes** are decorative. The real join and sign-in URLs and the QR generation need to be defined.
19. **Color mismatch:** the game-show style card in Host settings uses teal `#1E8C86` in its swatch row, but the screens use `#177A74`. Pick one.
20. **Scanlines:** the setting is labelled "Arcade style only". Should it be hidden in the other styles?
