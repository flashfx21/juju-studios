# Handoff: Don't Jinx It (game #12, `one-word-clue`), Team mode

## Overview
Game screens for **Don't Jinx It**, game #12 in the JuJu Studios lineup. One player (the guesser) tries to guess a mystery word. Their teammates each write 2 one-word clues, and the other team (the defense) writes 1 jinx each. Any word written more than once gets jinxed and wiped out. The guesser sees only the clues that survive and gets one guess.

These screens fill the "game-screen placeholder" in the lobby's Instructions live state. They keep the lobby header and the host bar.

`original-brief.md` is the product brief: rules, vocabulary, sample data and open questions. **Where this README and the brief differ, the brief's rules win and this README's visuals win.**

## About the design files
`dont-jinx-it.dc.html` is a **design reference built in HTML**: a clickable prototype showing the intended look and behavior. It is not production code. Rebuild it inside the existing JuJu codebase using the same patterns, components and token files as the two games that are already built. To open the prototype, serve the folder (for example `npx serve`) and load the file; `support.js` must sit next to it.

How the prototype works:
- The top row of tabs walks through the turn flow. The second row picks a state for the current screen.
- Every view shows the TV (1280×720) plus three phones (390×844): the guesser (GeeGee), a guessing-team player and a defense player. Buttons above each phone switch which player you are looking at.
- **Play the drop** runs the clue drop in real time.
- The Tweaks panel has `reducedMotion` and `teamNames` (Placeholder: Team A / Team B; Proposed: Clovers / Horseshoes).

## Fidelity
**High fidelity, for the retro game show style only.** Colors, type, spacing and motion are final for game-show. They come from `tokens/game-show.json` with no new values, except the team identity noted below.

**Arcade and rec room were not designed.** Build them from the same screen structure, using each style's tokens and signature components and the approach the two existing games use for those styles. One requirement from the brief: each style needs its own stamp treatment.
- **game-show:** a rubber-stamp block (shown in the prototype)
- **arcade:** a glitch or "GAME OVER"-style hit
- **rec room:** a tilted rubber stamp or sticker

## Hard rules (write tests for these)
1. The TV never shows the mystery word, or the text of a jinxed clue, before the full reveal (T9). The face-down card DOM must not contain the word. The prototype leaves `front` empty until a card flips, and only survivors ever flip.
2. The guesser's phone never shows the word, the pile or any clue author before T9.
3. Non-guesser phones show the whole pile during P6: every clue and jinx, with author and team.
4. Survivors appear on every phone and the TV at the same moment, without authors.
5. Close-call and near-guess votes show **counts only** on the TV.
6. Color is never the only signal. Teams always use shape plus label (● solid badge / ◆ outlined badge). Teammate jinxes and defense jinxes use different stamps plus text attribution.
7. If both teammates and the defense jinxed a clue, it is attributed to the defense.

## Turn flow → screens
| Step | TV | Guesser phone | Guessing team phone | Defense phone |
|---|---|---|---|---|
| Settings | T1 | Get ready | Get ready | Get ready |
| Teams | T2 | P1 | P1 | P1 |
| Turn intro | T3 | P2 (guesser) | P2 (your team is guessing) | P2 (you're on defense) |
| Write | T4 | P5 waiting | P3 write clues | P4 write a jinx |
| The pile | T6a–e, with T5 during a close call | P5 "Clues are getting jinxed…" | P6a–g | P6a–g, with the vote at P6d |
| Guess | T7 | P7 survivors + keyboard | P8 survivors, no keyboard | P8 |
| Verdict | T8 | P7 result | P8 result | P8 result, or P9 vote on a near guess |
| Full reveal | T9 | P10 (who wrote what) | P10 | P10 |
| Game over | T10 | P11 | P11 | P11 |

## Shared shell (game-show)
**TV, 1280×720, background `#12204A`**
- **Glow:** `radial-gradient(ellipse 60% 60% at 50% -15%, rgba(255,246,214,.16), transparent 70%)`.
- **Header:** absolute at left 40, right 40, top 22; height 90.
  - Badge "JuJu Studios": Shrikhand 30, `#12204A` on `#F2B630`, padding 6/16/10.
  - Title: Shrikhand 48, `#F6E7C8`. It reads "Don't Jinx It" (or "Game over" on T10).
  - Right label: Bebas Neue 28, letter-spacing .08em, `#F2B630`, e.g. "Inning 2 of 4 · Turn 3 of 8".
- **Game panel:** absolute at left 40, top 128; 1200×458; `#0B1533`; `box-shadow: 0 0 0 4px #F2B630, 0 0 0 10px #0B1533`. All game content lives inside it.
- **Host bar:** bottom 0, height 106, `#0c1636`, 5px `#F2B630` top rule.
  - Left: status text in Bebas 30.
  - Then the buttons: Next (T2, T3 and T9 only; `#F0592A` with a `0 5px 0 #7A2508` drop), Pause game (`#F2B630`), Restart game (`#F6E7C8`), and End and return to lobby (2px cream outline). All are 56 high, Bebas 26, letter-spacing .1em.
  - T1 replaces this with "Everyone read it?" + Start game. T10 uses Play again + Back to lobby.

**Phone, 390×844, radius 44, background `#12204A`**
- Padding 54 / 20 / 26; flex column with gap 12.
- Header row: the team badge (height 32, Bebas 20) on the left and "Turn 3 of 8" (Bebas 20, `#F2B630`) on the right.

**Team badge (proposed identity, not final)**
- **Team A:** solid `#F6E7C8` fill, `#12204A` text, ● glyph.
- **Team B:** transparent fill, `#F6E7C8` text, `inset 0 0 0 2–3px #F6E7C8` ring, ◆ glyph.

There are no new hues, so the badges never collide with the six player colors. If the team identity becomes tokens, add `team.a.*` / `team.b.*` under the same keys in all three token files.

**Other shared parts**
- **Tote tile** (timers, scores, word letters): `#F6E7C8` fill, `#12204A` text, Bebas, `inset 0 -6px 0 rgba(0,0,0,.18)`.
- **Player chip:** a circle in the player color with 2 initials in Bebas, plus a `0 0 0 2px #12204A` ring. Ink is `#FFF6D6` on red, teal and blue, and `#15120C` on pink and olive.

| Player | Team | Color |
|---|---|---|
| GeeGee | A | gold `#F2B630` |
| JMohawk | A | red `#C2302B` |
| Sadrique | A | teal `#177A74` |
| KaliBear | A | blue `#3D6FD9` |
| RubyRed | B | pink `#E8489A` |
| Juju | B | olive `#7A8B3A` |
| Angie | B | gold |

- **Cue card:** `#F6E7C8`, rotated −1°, `6px 8px 0 rgba(0,0,0,.3)`, a Bebas header over a 2px `#E0473A` rule.
- **Buttons:** follow `components.md`. Primary is `#F0592A` with a `0 6px 0 #7A2508` drop and Shrikhand type. Secondary is cream with a `#8A7A5A` drop. Phone hit targets are at least 44 px.
- **Focus:** every button and input shows a visible focus ring.
- **Loader:** 3 cream bulbs, 16 px, blinking with `1s steps(1)` and staggered 0.33 s.

## Screens

### T1 Game settings
The panel is a grid: `1fr 430px`, gap 36, padding 24/34.
- **Left column:**
  - "Don't Jinx It": Shrikhand 52 with a `4px 4px 0 #F0592A` shadow.
  - The 4 steps: numbered 44 circles, Oswald 23.
  - Scoring line: Bebas 22 `#F2B630`, "Correct guess: guessing team +1 · Miss or pass: defense +1 · Team games split 80 / 20".
  - Table-rule strip: `#C2302B`, Shrikhand 23 cream, rotated −1°, "Table rule: react, but don't say any words."
- **Right column, a cue card titled "Game settings · host":**
  - Mode: Team / Individual, 46 high.
  - Pace: Quick 45/30 s, Normal 60/45 s (default), Relaxed 90/60 s, 58 high. Selected is a navy fill with cream text; unselected is transparent with a 2px navy ring.
  - Long game checkbox (`role=checkbox`): "Everyone guesses twice".
  - Summary bar: navy, Bebas 24.
- **Length estimate (placeholder math):**
  - Team mode: turns = 2 × largest team size × (long ? 2 : 1).
  - Individual mode: turns = players × (long ? 2 : 1).
  - Minutes per turn: Quick 2, Normal 2.5, Relaxed 3.5.
  - Output: "7 players · 4 innings · about 20 min".

### T2 Teams are set
- Two columns with gap 44. Each has a team badge (48 high, Bebas 30) and a count, then one 50-high row per player (`#1A2B5E`, 36 chip, Shrikhand 26).
- Uneven-team note under Team B: Bebas 23 gold, "Team B has 3: RubyRed guesses twice".
- Bottom line: "Team A guesses first", Shrikhand 50 with an orange shadow.
- No coin flip. It advances automatically after 5 s, or when the host taps Next.

### T3 Turn intro
- The grid is `1fr 330px`.
- **Left:** the team badge + "is guessing"; the guesser's chip at 140 (Bebas 72, double ring `0 0 0 5px #12204A, 0 0 0 9px #F2B630`) and name in Shrikhand 92; then two strips, a cream one "GeeGee: eyes on the TV." and an outlined one "Everyone else: check your phone." (Shrikhand 28).
- **Right:** "Score", then two 84-high rows of team badge + tote score (Bebas 60).
- Advances automatically after 5 s.

### T4 Writing
The grid is `290px 1fr`.
- **Left:**
  - "Writing closes" label, then the tote timer (Bebas 124).
  - Counts: "Clues 4 of 6 · Jinxes 2 of 3" (Bebas 30).
  - A gold "Everyone's in" stamp, rotated −3°, when all words are in. The timer shows 0:00 and the stage ends early.
- **Right, two lanes:**
  - Team A: "writing clues". Team B: "writing jinxes".
  - Tiles sit in a 4-column grid with gap 10, each 132 high and `#1A2B5E`: a chip with the name, then tick boxes, 2 per clue writer or 1 per jinxer. Each box is 40×40 with a cream ring and turns cream with a ✓ when that word is in.
  - The guesser's tile reads "Guessing / Eyes on the TV" instead of showing ticks.
  - A disconnected player's tile drops to 40% opacity and reads "Disconnected · counts as blank".
- **No words appear anywhere on this screen.**

### T6 Clue drop (signature moment), with T5 close calls
- **Layout:**
  - Header: "The clue drop · 6 clues from Team A" / "No words until the reveal".
  - Cards: one per guessing-team clue, **172×236, gap 18**, centered.
  - Card back: `repeating-linear-gradient(135deg,#1A2B5E 0 12px,#22356E 12px 24px)`, an inset 4px gold ring, the clue number in Shrikhand 70 gold and "Clue" in Bebas 19.
  - Card front, rotated 180° on Y: `#F6E7C8` with the word in Shrikhand 36 navy. The front only gets its text if the clue survived.
- **Teammate stamp:**
  - Cream block, top 40, overhanging the card by 8 px on each side.
  - Red text with a triple ring: `inset 0 0 0 3px #C2302B, inset 0 0 0 6px #F6E7C8, inset 0 0 0 8px #C2302B, 4px 4px 0 #0B1533`.
  - Rotated −8°. "JINXED!" in Shrikhand 29, then "● JMohawk + Sadrique" in Bebas 18 navy.
- **Defense stamp:**
  - Solid `#C2302B` with cream text and a cream triple ring, top 118, rotated 5°.
  - "JINXED!" then "◆ Team B · RubyRed".
  - It sits below the teammate stamp so both stay readable when both apply.
- **Close-call marker:** a gold tag above the card, rotated −4°: "?" in Shrikhand 30 + "Close call".
- **Caption under the cards:** a Shrikhand 48 head + a Bebas 26 sub. During T5, a "Vote closes" tote timer sits next to it.
- **The sequence** (one `step` value drives both the TV and P6):

| step | TV | Caption | Phones (P6) |
|---|---|---|---|
| 0 | T6a: cards land | "Clues are in" / "6 face down · no peeking" | P6a full pile |
| 1 | T6a (unchanged) | "Checking for matches…" | P6b: matches highlighted |
| 2 | T6b: teammate stamps hit | "Jinxed by teammates!" | P6c: teammate stamps on rows |
| 3 | T6c: defense stamps hit | "Jinxed by Team B!" | P6c: defense stamps; missed jinxes fade |
| 4 | T5: close-call card marked "?" | "1 close call" / "Team B is deciding" + 10 s timer | P6d: vote / wait |
| 5 | T6c: close-call result | "Team B said Same / Different" | P6e |
| 6 | T6d: survivors flip ("3 of 6 survived"), or T6e "Shutout!" / "GeeGee can guess blind or pass" | | P6f what's left, or P6g shutout |

- Steps 4 and 5 only happen when the engine made a soft match. Several close calls run one at a time.
- At step 6, jinxed cards stay face down at 50% opacity.
- **Motion:**
  - Land: `translateY(-300px) rotate(-8deg)` to identity, `transform .55s cubic-bezier(.2,1.3,.4,1)`, staggered 80 ms per card.
  - Stamp hit: scale 1.9 to 1 with opacity, `.3s cubic-bezier(.3,1.6,.5,1)`.
  - Flip: `rotateY(180deg) .6s ease`, same stagger.
  - In the prototype each step lasts about 1.7 s.
- **Reduced motion:** no transitions. Jump straight to step 4 if there is a close call, otherwise to step 6. After a vote, go straight to step 6.

### T7 Guess
- Top: "Survived · 3 of 6" (Shrikhand 40) and the tote timer "Guess closes 0:45" (Bebas 64).
- Survivor cards: flex `1 1 0`, max 330×196, cream, Shrikhand 60, rotations −1.5° / 1° / −0.5° / 1.5°.
- Bottom bar: `#C2302B`, 62 high, "Quiet! No hints." (Shrikhand 34).
- Shutout: a dashed box (3px `rgba(246,231,200,.5)`) with "Shutout" + "Nothing survived · GeeGee can guess blind or pass".

### T8 Verdict
- Centered stamp, rotated −3°, Shrikhand 104, with a triple inset ring in its own ink.
- Below it: "GeeGee guessed", the guess in tote letter tiles (62×74, Bebas 66), and a team badge + result.

| State | Fill / ink | Copy |
|---|---|---|
| Correct | `#177A74` / cream | "Correct!", "Team A +1" |
| Miss | `#C2302B` / cream | "Miss!", "Team B +1" |
| Pass | `#F6E7C8` / navy | "Pass", "GeeGee passed", no tiles, "Team B +1" |
| Deciding | `#F2B630` / navy | "Near guess", "Team B is deciding", "Votes in 1 of 3" (count only) + 0:10 |

### T9 Full reveal
The grid is `300px 1fr`.
- **Left:**
  - "The word was" + BEACH in 54×66 tiles (Bebas 60).
  - "This turn" + Team A badge "+1 · Correct".
  - "Score" rows (Team A 2, Team B 1).
- **Right:** a 3-column grid of 152-high clue cards.
  - Each card: the writer's chip + "<name> wrote" (Bebas 20), then the word (Shrikhand 36).
  - Survived: cream fill + a teal "✓ Survived" tag.
  - Jinxed: `#D9CCAE` fill, word struck through, and a stamp "JINXED! · ◆ Team B · RubyRed" (red fill) or "JINXED! · ● A + B" (cream fill, red text).
  - Close call: an extra gold tag "? Close call · Team B said Same".
- **Missed jinxes tray:** `#1A2B5E`, "Missed jinxes" + chip "◆ Juju · ocean".
- Host taps Next; it falls back to advancing after 20 s.

### T10 Game over
- **Left:**
  - "● Team A" badge + "wins 5 to 3" (Shrikhand 38).
  - Rows (38 high): Team / Contestant / Leaderboard points. The winning team's rows are gold `#F2B630` with navy text; the others are `#1A2B5E`.
  - Points: 80 to the winning team and 20 to the losing team, split evenly. Team B's 20 rounds to 7 / 7 / 6.
- **Right:** two cream callout cards, "Top Jinxer" (most jinxes landed) and "Clue MVP" (most surviving clues in correct turns). Below them, a dashed **tiebreak slot** to keep for the format that's still being decided.

### Phones
- **Get ready (T1):** "Up next · word game", "Don't Jinx It" (Shrikhand 42), the 4 steps, the table-rule strip, the settings line and an "I'm ready" button.
- **P1 Your team:** "You're on" + a large badge (88 high, Bebas 60), the team's members (you tagged "You") and "Team A guesses first."
- **P2 Role card:** a cue card with "Your role this turn" and a Shrikhand 42 head. Three versions:
  - Guesser: "You're the guesser." / "Don't look at anyone's phone. Eyes on the TV."
  - Guessing team: "Your team is guessing" / "You'll see the word. Write 2 one-word clues for GeeGee."
  - Defense: "You're on defense" / "You'll see the word. Write a jinx: guess one of Team A's clues."
- **P3 Write clues / P4 Write a jinx:**
  - Top: the word in tote tiles (44×54) and the timer.
  - A cue card with the heading ("Write 2 clues" / "Jinx them"), a hint, and one 52-high input per word (`#FFFDF6`, 2px navy ring, Bebas 30). On error the ring turns 3px `#C2302B`, with a "✕ message" below and `role=alert`.
  - Submit button.
  - **Skip word (P3 only):** usable for the first 15 s, once per turn. Its states are open, "· used" and "· expired" (45% opacity, `aria-disabled`).
  - **Submitted:** a teal "You're in" stamp, your words as chips, "Keep it to yourself. The pile opens when everyone's in.", "N of 9 in", the loader.
- **Validation, in order, per field:**
  1. empty → "Write one word"
  2. not `^[a-z]+$` → "Letters only"
  3. equals the word → "That's the mystery word"
  4. length ≥ 3 and contains the word, or the word contains it → "That's part of the mystery word"
  5. (clues only) the two clues are equal → "Your two clues match" on field 2
  6. not in the dictionary → the **"Is this a name?"** panel (navy, with Use it / Edit)
- **Disconnected phone:** "You dropped out" / "Reconnecting. If the timer runs out, your jinx counts as blank."
- **P5 Guesser waiting:** a 110 chip, "You're guessing", "Don't look at anyone's phone.", "N of 9 in" while writing, then "Clues are getting jinxed…" during the pile. It never shows the word or the pile.
- **P6 The pile:**
  - Top: the word in small tiles (28×34) and the stage id + "The pile".
  - Then "● Team A clues" rows and "◆ Team B jinxes" rows.
  - Rows are at least 36 high, gap 3: chip 28, word in Bebas 26, author in Oswald 14, an optional tag on the right, and an optional second line for the stamp.
  - Clue rows are `#1A2B5E`. Jinx rows are transparent with a 2px cream ring, which keeps them visually apart.

| Row state | Look |
|---|---|
| match | cream fill, gold "Match ×3" tag |
| jinxed | `#0B1533` fill, 60% opacity, slides 6px right, word struck through, stamp line "JINXED! · ◆ Team B · RubyRed" (red) or "JINXED! · ● JMohawk + Sadrique" (cream with red text) |
| landed jinx | red "Landed" tag |
| missed jinx | 45% opacity, struck through, outlined "Missed" tag |
| close call | gold fill, navy "? Close call" tag |
| close call, Different | teal "Stays" tag |
| what's left | only the surviving clue rows, still with authors |

- **P6 bottom area:**
  - Close call, defense phones: a cue card "towel / towels: same word?" with the timer, **Same / Different** buttons (52 high) and "No vote counts as Different."
  - Close call, guessing-team phones: "Team B is deciding. Stay quiet." + the timer.
  - Otherwise: a navy status line.
  - **Fit budget:** 9 words fit in 844 with the vote card showing. Check the 13-word case (5v5: 8 clues + 5 jinxes) and tighten further if needed, without scrolling if possible.
- **P7 Guesser guess:**
  - The same survivor layout as P8, no authors. Cards are 70 high (Shrikhand 36).
  - Below them: the guess input (56 high, 2px gold ring) + a Guess button (112 wide), a Pass outline button, then the system keyboard.
  - After the guess, the controls are replaced by a verdict block: a Shrikhand 46 stamp, "GeeGee guessed “beach”" and the team badge + result.
- **P8 Everyone else:** the same layout, cards 112 high (Shrikhand 52), a red "No hints, no faces." bar and no keyboard. It shows the verdict after the guess.
- **P9 Near-guess vote (defense):** "GeeGee guessed **beaches**. Count it?" with Yes / No (66 high), a 0:10 timer and "The TV shows the count only, never who voted."
- **P10 Your result:**
  - "Your result" + the word tiles + "Team A +1 · Correct".
  - One line per own word: "Your clue **waves** survived" / "**sand** got jinxed by RubyRed" / "**towel** got jinxed by Angie · close call…" / "Your jinx **ocean** missed".
  - The guesser instead gets a "Who wrote what" list of every word with author and fate.
  - A score bar at the bottom.
- **P11 Game over:** the team result, "Your team won · you got" + a tote with the points, the two callouts, the tiebreak slot and "The host picks what's next".

## State management (suggested)
```
game: { mode: 'team'|'individual', pace: 'quick'|'normal'|'relaxed', long: bool, innings, turnIndex, score: {A,B} }
turn: { guesserId, guessingTeam, word, phase: 'intro'|'write'|'pile'|'guess'|'verdict'|'reveal', timerEndsAt, skipUsed }
submissions: [{ playerId, team, kind: 'clue'|'jinx', word }]
resolution (engine output): clues[{ word, by, jinxedBy: null|'teammates'|'defense', teammates?: [ids], defender?: id, closeCall?: { with: jinxId } }], jinxes[{ word, by, result: 'landed'|'missed'|'closeCall' }]
pile: { step: 0..6, closeCallQueue: [...], currentVote: { same, different, endsAt } }
guess: { text, result: 'correct'|'miss'|'pass'|'nearPending', nearVote }
```
- **Write → pile:** when every word is in, or the write timer ends. Missing words count as blank.
- **Pile timing:** about 10 s, plus about 10 s per close call. A close call with no votes resolves as Different.
- **Pile → guess:** at step 6. Survivors reach every client at the same moment.
- **Near guess:** the engine flags forms like "beaches", and the defense votes. What silence means here is still open (see the brief's section 10).
- **Role-filtered payloads:** the guesser's client must never receive the word or the pile. Enforce this on the server, not just by hiding UI.

## Design tokens
Everything comes from `docs/design/tokens/game-show.json` and its arcade and rec-room counterparts. Values used here:
- **Colors:** background `#12204A`, surface `#0B1533`, surfaceRaised `#1A2B5E`, footer `#0c1636`, frame/accent `#F2B630`, text `#F6E7C8`, textStrong `#FFF6D6`, primary `#F0592A` (shade `#7A2508`), secondary `#F6E7C8` (shade `#8A7A5A`), danger `#C2302B`, success `#177A74`, line `#E0473A`, field `#FFFDF6`.
- **New, non-token values:**
  - card-back stripe `#22356E`
  - jinxed reveal card `#D9CCAE`
  - verdict drop `#050B1F`

  Add these to all three token files if you keep them.
- **Fonts:** Shrikhand (display), Bebas Neue (labels and numbers), Oswald 400/500/600 (body).
- **Radius:** 0 everywhere except round chips and the phone device (44).
- **Shadows:** button `0 6px 0 #7A2508`, secondary `0 5px 0 #8A7A5A`, card `6px 8px 0 rgba(0,0,0,.3)`, frame `0 0 0 4px #F2B630, 0 0 0 10px #0B1533`, tile `inset 0 -6px 0 rgba(0,0,0,.18)`.

## Individual mode (phase 1 ships this first)
It reuses these screens with the defense removed: no T2, P1 or P4; one lane on T4; one clue each (2 each with 3 players); no jinx section in P6. Scoring: guesser +2, and +1 to each player whose clue survived. See section 8 of the brief.

## Assets
None. Everything is CSS and type. The game picker tile for #12 becomes "Don't Jinx It" and is playable in phase 1.

## Files
- `dont-jinx-it.dc.html`: the prototype. The screen markup is in the template; sample data, the pile state machine and validation are in the `Component` class (`MAIN` / `SHUT` datasets, `renderVals`).
- `support.js`: the prototype runtime. It's only needed to open the HTML; don't port it.
- `original-brief.md`: the product brief, with rules, copy and open questions.
