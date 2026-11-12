# Sketch Showdown

**Game ID:** `sketch-showdown`  
**Status:** Rules final (Julian, Nov 11), pending playtest. Next: visual design. Phase 2 in this folder; the idea log says phase 3 (see open questions)  
**Players:** 4 to 10 (2 teams of 2 to 5; uneven teams allowed; 3 players not supported)  
**Length:** about 5 to 10 min (3 v 3, draw once) up to 15 to 30 min (5 v 5, draw twice). Claude's estimate, not playtested  
**Modes:** Teams

Supersedes `sketch-showdown-rules-spec-2024.md`.

## Pitch
Two teams, one clue, two drawers. Each team watches only its own drawer and races to guess first. Then both drawings go up side by side, wherever they stopped.

## Decided
**Teams and turns**
- Two teams. The engine splits players at random; the host can swap players, then locks teams
- Setting "Turns": everyone draws once (default) or twice
- Rounds = the bigger team's size, times 1 or 2. On the smaller team, one random player draws an extra time; in twice mode, a different player takes the second extra turn when possible
- The first drawer on each team is picked at random (the TV can run a quick spin). Each team's order then cycles; twice mode repeats the same order. Example: A B C vs X Y Z, B and Z picked first: B, C, A and Z, X, Y
- Drawers never guess

**Picking the clue**
- Both drawers see the same 3 options, a random mix from the bank. Nobody else sees them; the TV shows "Drawers are choosing"
- 15 second clock, which ends early once both drawers lock in
- Same pick: that clue. Different picks: a randomizer chooses between the two. One drawer votes: their pick. Neither votes: random from the 3
- Drawer phones show how the clue was chosen ("You both picked it" / "Coin flip: their pick")
- Every option is shown at most once per game, picked or not
- Then a 5 second countdown; both canvases unlock at the same moment. At most 20 seconds from options to drawing

**The race**
- Setting "Pace" (round time limit): Quick 90 s, Normal 120 s (default), Relaxed 180 s. The host can end a round early
- Each team's guessers see only their own drawer's sketch, live. Nothing of the clue (no blanks, no letter count)
- Guessers type guesses on their phones, as many as they like. The guess box clears after every guess (no turning "rat" into "rattle" by adding letters)
- A wrong guess locks that player out for 2 seconds. A guess a teammate already sent is refused ("Already guessed") with no lockout
- Team guess feed: every teammate sees the team's guesses as they arrive. The drawer sees them in a small strip that never covers the canvas. The other team never sees them
- The first correct guess the server records wins the round (no ties). Both canvases freeze where they are
- Talking is not policed (in person or on Zoom). The Instructions screen suggests teams sit apart

**The TV during the race**
- Timer, score, round number, each team's drawer, a live ink meter per team (moves while the drawer draws), and each team's wrong-guess count
- Never strokes, guess text or the clue. On a Zoom call the TV is screen-shared to everyone, so this matters even more

**Reveal (host taps Next to move on, like Pin Drop)**
- Correct guess, one step: "[Team] got it!", both drawings as they stood, the answer, who guessed it and how fast, the score
- Nobody got it: no points. Both drawings first, then the answer, then Next. The rotation moves on with no do-over
- Under each drawing: that team's wrong guesses (trimmed to fit, e.g. the last 8 plus "and 12 more")
- The reveal fits one screen with no scrolling, so it works as a screenshot
- Every phone shows both drawings too

**Matching guesses (lenient)**
1. Clean up: lowercase, trim, drop punctuation, ignore a leading "a", "an" or "the", ignore spaces and hyphens ("racecar" = race car)
2. Match the answer or one of its hand-picked alternates. Alternates are generous for things a drawing can't tell apart (burger for cheeseburger)
3. Plural and simple forms, using the shared rules and `word-forms.json` from Don't Jinx It (cars = car)
4. Typos: one wrong, missing or extra letter counts on answers of 5 or more letters, only if the guess isn't itself a real word in the shared dictionary ("lighthous" counts; "horse" never counts for house)
5. Never: part of a multi-word answer ("flag" for American flag) or part of a compound ("house" for lighthouse), unless that word is listed as an alternate

**Ties and ending**
- Level after the last round: sudden death. Each team votes on its phones for 15 seconds to nominate a drawer (anyone, including someone who drew twice; most votes wins; a tied vote or no votes means a random pick). Same 3-option pick, same race. If nobody guesses, the game ends tied
- Host ends early: the team with more round wins finishes first; level means a tie

**Game over**
- Gallery on the TV: every round's pair of drawings with its answer; the host pages through
- Then the result: winning team, round tally (e.g. 4 to 2), and the engine's standard points screen

**Drawing tools**
- Square canvas on every device and the TV; phones stay in portrait
- Brush in 4 preset sizes (S, M, L, XL), sized relative to the canvas so XL looks the same on a phone and a tablet
- 16 color swatches in two rows, including skin tones
- Brush, eraser, straight line, undo (removes the last whole stroke), clear (press and hold)

**Scoring**
- The game reports a finishing order only (team with more round wins first). Round wins are for display

## Decided against
- Seeing the other team's sketch during the race
- Any hint for guessers (blanks, letter counts, "part of it" notes)
- Drawer skips or host redeals (the 3-option pick replaces them)
- Fill bucket, shapes, redo, brush slider, full color picker
- Difficulty tags on clues
- Fun awards at game over (for now)
- Characters and brands in the clue bank

## Later
- Spectator mode: opt in to watch both drawings live as they're drawn
- Famous people as clues (last name alone would count)
- Saving drawings across game nights (Firebase storage)
- Game-over awards (fastest guess, most guesses in a round)

## Open questions
- Team names and colors: one suite-wide pair, or per game? (Don't Jinx It proposes Clovers / Horseshoes)
- Playtest: is the 15 second pick clock right, and is the 2 second lockout enough?
- Phase placement: phase 2 here, phase 3 in the idea log. Teams arrive with Don't Jinx It team mode
- Tablets (engine): today a wide landscape screen always gets the TV screens (`docs/later.md`), so a landscape tablet that joins becomes the TV. Needs the "join makes you a player on any device" change

## Engine pieces it needs
- Teams (split, swap, lock; shared with Don't Jinx It team mode)
- Live drawing sent from the drawer's phone to teammates' phones; full stroke sets sent to every screen at the reveal and the gallery
- Private per-team data (the other team's sketch, guesses and the clue options never reach your phone)
- Guess matching (shared dictionary and word forms)
- Server-decided first correct guess
- Voting (clue pick and sudden-death nomination reuse the shared voting block)
- Player on any device (for tablets)

## Phone and tablet drawing notes
- The page must not scroll, zoom, pull to refresh, swipe back, select text or show the long-press magnifier while drawing
- One finger counts; others are ignored. With a stylus, the pen wins and palm touches are ignored
- Strokes are stored relative to the canvas, so a drawing looks the same on every phone, tablet and the TV
- The guesser's keyboard covers about half an iPhone screen; the sketch must stay visible while typing. Test on a small iPhone
- Landscape tablet: canvas beside the tools instead of above them
- The screen stays awake; a teammate's view may trail the drawer slightly on a slow connection

## Content pack
`packs/sketch-showdown/clues.json` (proposed path), its own pack. Each clue: answer plus optional alternates. No difficulty tags.
- Start from the 214 Don't Jinx It words. Cut: yogurt. Rename: roller to roller coaster, birthday to birthday cake, alarm to alarm clock, thunder to lightning, treasure to treasure chest, bath to bathtub
- Add 30 multi-word and new clues (starter list below). About 243 clues; the longest game uses about 33
- No real people, characters or brands

Starter clues (alternates in parentheses): American flag (US flag, USA flag) · race car · cheeseburger (burger) · sushi · hot dog · ice cream cone (ice cream) · fire truck (fire engine) · school bus · traffic light (stoplight, traffic signal) · stop sign · hot air balloon · palm tree · polar bear · spider web (cobweb, web) · snow globe · light bulb · paper airplane (paper plane) · fire hydrant (hydrant) · teddy bear · french fries (fries) · Ferris wheel · Statue of Liberty (Lady Liberty) · Eiffel Tower · tic tac toe · jack-o'-lantern (carved pumpkin) · sand castle · shooting star · swimming pool (pool) · bunk bed · toilet paper (toilet roll)

## Scoring
Reports a finishing order only. The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Naming and IP
Original name and clue list. Pictionary-style mechanics; avoid that name and its card lists.
