# Later

Ideas and features deliberately left out for now. Each line says why it waits.

## Tabled

- **Sound on the TV** (Host settings toggle, music and buzzers). Tabled Nov 11, 2026: Julian needs to find commission-free (royalty-free) music and sound files first. The design's Sound row is not built until there is audio to control.

## Waiting on another piece

- **Real QR codes** on the Host or join, Host sign-in and lobby screens. Screens show the address as text for now; scannable codes need a QR library (a new dependency).
- **Forgot your password** flow. Not designed (design open question 4), and the sign-in method is still undecided.
- **"New" badge** on Pin Drop's picker tile. Only shown on playable games, and every game is coming soon for now.
- **Playable picker tile, phone vote rows, vote counts, timer and "Lock in"**. Build them with the first playable game; the picker only draws coming-soon tiles today.
- **Phone lobby / waiting room, profile screen, error screens** (room not found, locked, host disconnected, only 1 player). Designed, not built yet; they need rooms.
- **Unit tests** for the form checks (`src/app/formRules.ts`) and settings. Needs a test runner (Vitest is proposed in the tech stack doc), which is a new dependency.
