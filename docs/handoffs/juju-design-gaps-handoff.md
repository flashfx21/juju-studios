# JuJu Studios Lobby: Design Gaps Handoff (for Claude Design)

**Starting point:** `docs/design/source/lobby-suite.dc.html` with `support.js` (the current Lobby Suite canvas). Keep its three directions, layouts, fonts, tokens and signature moves. This brief lists only what is missing or changes.
**Goal:** every screen exists in all three styles (retro game show, 90s arcade, 70s rec room), and each person picks their own style.
Related docs: `juju-lobby-dynamic-handoff-2226.md`, `juju-game-picker-lineup-handoff-2238.md`, `design/README.md` (screen inventory and open questions).
Status: Nov 11, 2026.

---

## 1. Decided: everyone picks their own style
- Style is a **personal** setting, not a room setting. Each phone shows its own user's style; the TV shows the host's style.
- The host's style cards in Host settings set the host's own style (TV and the host's phone).
- Before anyone signs in (Host or join, Sign in, Join), a phone shows the last style used on that phone; first visit defaults to retro game show.
- One room can show several styles at once: the TV in one, phones in others. Player colors keep their name (Red, Gold, ...) across styles even though each style shades them differently.

## 2. Add: "Your style" on the phone Profile screen (all three styles)
- New row on Profile, between the color picker and the stats: **Your style**, three small style cards (name plus "JuJu Studios" in that style's logo font and its swatch row), the current one marked "In use".
- Tapping a card restyles the phone immediately, the same way Host settings restyles the TV.
- Fit it on the 390×844 phone without pushing "Save and go back" off screen.

## 3. Change: Host settings copy
- "Lobby style · restyles every screen" is no longer true. Suggested: "Your style · the TV and your phone". Keep the three style cards as they are.

## 4. Missing screen: phone lobby in retro game show and 90s arcade
- Only 70s rec room has it today (Who's here tab, Game library tab, Standings link). The canvas shows "Phone lobby (not designed)" for the other two.
- Design the same content and actions for game show and arcade:
  - **Who's here:** the joined players with initials, color and signal bars.
  - **Game library:** playable games, then coming-soon games below a divider (none can be chosen here).
  - **Standings** link to the Leaderboard.
- Note: every game is coming soon for now, so show the library with zero playable games too (empty state).

## 5. Missing states (all three styles)
**Loading states** (design README open question 1). None are designed anywhere:
- Joining a room
- Sending a sign-in link
- Signing in with a password
- Loading the leaderboard
- Waiting for the TV to pair after sign-in

**Room full** (open question 8): a join attempt when 10 of 10 seats are taken. Use the existing phone error template (status line, stamp, label, headline, body, primary button, secondary link), like Room not found and Room locked.

## 6. Keep consistent
- Ban list still applies: no colored accent borders, no soft-shadow rounded cards, no close-cousin palettes, no pastel or purple gradients, no emoji icons.
- Original names only on screen.
- Accessibility: real buttons, touch targets 44 px or more, color never the only identifier, text contrast 4.5:1. Please also show a **keyboard focus state** for buttons and style cards (open question 17), distinct from the selected / "In use" state.
- Addresses stand in for QR codes in the built app for now; QR blocks can stay as they are in the canvas.

## 7. Deliverables
- Updated canvas (`lobby-suite.dc.html`) and PNG exports for the new and changed screens, in `screens/<style>/`, following the existing numbering.
- Token files unchanged unless a new value is needed; if so, add it to all three token files with the same key.
- Update `design/README.md`: add the new screens and states to the inventory and close the open questions this answers (1, 2, 8, 17).

## 8. Open (don't decide in the design)
- **CRT scanlines on phones:** a personal setting on Profile (shown only while the arcade style is picked), or follow the TV's Host setting?
- **Forgot your password and account creation:** wait until the sign-in method is chosen (email link vs. password, tech stack doc section 9).
- **Sound:** tabled until royalty-free music and sound files are found.
