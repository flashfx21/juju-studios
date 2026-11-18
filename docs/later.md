# Later

Ideas and features deliberately left out for now. Each line says why it waits.

## Tabled

- **Sound on the TV** (Host settings toggle, music and buzzers). Tabled Nov 11, 2026: Julian needs to find commission-free (royalty-free) music and sound files first. The design's Sound row is not built until there is audio to control.

## Waiting on another piece

- **Playing from a PC as a player.** On hold (Julian, Nov 11) while phone playtests come first. Today a wide landscape screen always gets the TV screens; the proposal is that joining makes you a player on any device and hosting makes you the TV. Fits with the rooms work.

- **Sketch Showdown: team swap, mid-stroke sync, drawing bots.** Rooms pick teams at random; the spec's host swap and lock waits for the engine's teams. Teammates see each stroke when the drawer lifts their finger, not while it's drawn. Bots don't draw, so a bot team's canvas stays blank.
- **One host account open twice.** If the host's account has the same room game open in two tabs or on two devices, both run the game and fight over it (seen in testing with a leftover tab). The TV view's display-only mode will need the same guard: only one runner per room.
- **Admin room controls** (close a stuck room, remove a player). Wanted (Julian, Nov 13); waits for rooms.
- **Shared host runner** (audit, Nov 16; Julian: next). The runner is copied in six games. One in `src/games/room/` would also fix: Zero In writing every view one after another on each draft; Sketch Showdown re-uploading the whole game per stroke; late inputs landing in the wrong turn in Don't Jinx It (Skip word racing Submit) and Dial It In (Pin Drop's inputs already name their round); a failed publish going unnoticed; no tests on any runner.
- **Chainword: saved order can differ from the final standings** (audit, Nov 16). A phone that is locked when the clock runs out is saved last, then ranked higher on screen once it reports. The host could count that player's remaining words as missed, as it does for bots.
- **Contrast** (audit, Nov 16, by calculation): arcade vote rows (white on bright tile colors, as low as 1.27:1), the rec room's room code (gold on cream, 1.93:1), small selected-state text in game show (3.15:1).
- **Lobby and sign-in loose ends** (audit, Nov 16): the recap's "start a new lobby" leads back to the finished room; a per-game room code left over from a lobby night redirects that game's page; sign-in lands on the placeholder lobby; flags and profile read as "no" for a moment while loading; a failed profile read shows first-time setup.
- **Small accessibility fixes** (audit, Nov 16): focus is lost after picking a menu item or closing the End game dialog; room join errors aren't announced; Admin's Color and Symbol labels aren't tied to their buttons; "Tap again to delete" may stay armed on iPhone (untested).
- **Stale docs** (audit, Nov 16): the Chainword spec (others' guesses show only at the end) and the Dibs spec (scores wait for Next; a late joiner waits for the next game) disagree with the code.
- **Answers that can still be looked up** (audit, Nov 16). The packs ship with the site, so a player who opens dev tools can match Pin Drop's photo address (its file name often names the place) or a Zero In question to its answer. Hiding them needs the answers kept off the phones, which the free plan has no server for.
- **Admin score fixes** (fix or remove a game result). Wanted (Julian, Nov 13); waits for saved results.
- **Real QR codes** on the Host or join, Host sign-in and lobby screens. Screens show the address as text for now; scannable codes need a QR library (a new dependency).
- **"New" badge** on Pin Drop's picker tile. Only shown on playable games, and every game is coming soon for now.
- **Lobby vote timer, "Lock in", ties (spin), "In the lead", remote focus.** Tonight's lobby votes on phones and shows on a TV at `#/tv` (Nov 16, display only).
- **Chainword on the TV during play** (Nov 17). The TV shows which word each player is on; phones show only Finished or Still playing. Julian to confirm, or drop the word position from the TV.
- **Chainword's phone clock** (Nov 17). `InfoLine` in `Together.tsx` compares a server-time deadline with the phone's own clock, so a phone with a wrong clock shows a wrong countdown (the game still ends on the shared clock). The TV converts with `fromSharedTime`; the phone needs the same.
- **Sketch Showdown's end-of-game TV view** (Nov 17) carries every round's strokes; a long game of very heavy drawings could pass the 1,000,000 character limit, and the TV would then stay on its last screen while phones carry on.
- **A shared step timer for TV reveals** (Nov 17). `useSteps` is copied in the Zero In, Dibs, Dial It In and Pin Drop TV screens.
- **No Filler prompt testing** (No Filler, Nov 17). Card stats in the database (plays, pass rate, split votes, flags, voids), Flag this card on the result screen, test cards mixed in, and the CSV export. Waits for a first game night with the starter pack.
- **No Filler brand look** (No Filler, Nov 17). Black with Anton, as on the printed cards. Anton would be a new font; the build uses the three lobby styles with the game's own green, yellow and red.
- **No Filler pause** (No Filler, Nov 17). The spec voids a turn that is paused; the suite has no pause in rooms yet.
- **No Filler: removing a player mid-game** (No Filler, Nov 17). The spec takes them out of the turn order at their current score. Until then the host skips their turns.
- **No Filler "Waiting for [Name]"** (No Filler, Nov 17). Spotting an offline speaker after 20 s needs presence. The host's Skip turn covers it by hand.
- **Pause on the TV.** Zero In's spec has a paused overlay; there's no pause in rooms yet.
- **Phone lobby, waiting room, TV lobby, instructions, pause, game over, leaderboard, loading states, error screens, create account / password reset, picker spin and remote focus.** Designed in all three styles (Nov 11 design update), not built yet.
- **Room Open / Locked** toggle in Host settings. Designed; built when rooms exist, since it has nothing to lock yet.
- **Verified badge** on Profile. Left off until sign-in is connected, so nothing claims an email is verified when it isn't.
- **Profile stats** (games played, total points, average) show 0 until results are saved.
- **"Save and go back"** on Profile returns to the front door until the waiting room is built.
- **Unit tests** for the form checks (`src/app/formRules.ts`) and settings. Vitest is installed now (`npm test`); these tests are not written yet.
