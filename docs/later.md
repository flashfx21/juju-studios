# Later

Ideas and features deliberately left out for now. Each line says why it waits.

## Tabled

- **Sound on the TV** (Host settings toggle, music and buzzers). Tabled Nov 11, 2026: Julian needs to find commission-free (royalty-free) music and sound files first. The design's Sound row is not built until there is audio to control.

## Waiting on another piece

- **Playing from a PC as a player.** On hold (Julian, Nov 11) while phone playtests come first. Today a wide landscape screen always gets the TV screens; the proposal is that joining makes you a player on any device and hosting makes you the TV. Fits with the rooms work.

- **Admin room controls** (close a stuck room, remove a player). Wanted (Julian, Nov 13); waits for rooms.
- **Admin score fixes** (fix or remove a game result). Wanted (Julian, Nov 13); waits for saved results.
- **Real QR codes** on the Host or join, Host sign-in and lobby screens. Screens show the address as text for now; scannable codes need a QR library (a new dependency).
- **"New" badge** on Pin Drop's picker tile. Only shown on playable games, and every game is coming soon for now.
- **Picker vote counts, timer, "Lock in", "In the lead" and remote focus.** Wait for rooms in the lobby. The picker already lets a playtester pick an in-testing game and open its Solo play pages (Nov 14).
- **Phone lobby, waiting room, TV lobby, instructions, pause, game over, leaderboard, loading states, error screens, create account / password reset, picker spin and remote focus.** Designed in all three styles (Nov 11 design update), not built yet.
- **Room Open / Locked** toggle in Host settings. Designed; built when rooms exist, since it has nothing to lock yet.
- **Verified badge** on Profile. Left off until sign-in is connected, so nothing claims an email is verified when it isn't.
- **Profile stats** (games played, total points, average) show 0 until results are saved.
- **"Save and go back"** on Profile returns to the front door until the waiting room is built.
- **Unit tests** for the form checks (`src/app/formRules.ts`) and settings. Vitest is installed now (`npm test`); these tests are not written yet.
