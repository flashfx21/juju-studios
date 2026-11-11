# Don't Jinx It: Game Screens Handoff (for Claude Design)

**Game:** #12 in the JuJu Studios lineup (game ID `one-word-clue`; spec `docs/games/12-one-word-clue.md`). Was "One-word clue game (name open)".
**Starting point:** the Lobby Suite canvas (`docs/design/source/lobby-suite.dc.html` with `support.js`), its three styles (retro game show, 90s arcade, 70s rec room), tokens and components (`docs/design/components.md`). Game screens fill the "game-screen placeholder" in the Instructions live state and keep the host bar.
**Scope:** key screens for **Team mode**. Individual mode ships first (phase 1) and reuses these screens with the defense removed; deltas are listed in section 7.
**Suggested order:** lock the layouts in retro game show first, then port to arcade and rec room. Every screen still has to exist in all three styles in the end.
Status: Nov 11, 2026 (updated 17:32: the pile on non-guesser phones; shared survivors screen). Rules are agreed in conversation; copy marked *(proposed)* can change.

---

## 1. The game in 30 seconds
- Two teams. One player (the **guesser**) tries to guess a mystery word. Everyone else sees the word on their phone.
- The guesser's teammates each write 2 one-word **clues** in secret (3 when the team is small).
- The other team (the **defense**) also sees the word and each writes 1 **jinx**: a guess at one of the guessing team's clues.
- **Any word written more than once is jinxed and wiped out.** Teammates can jinx each other by accident; the defense jinxes on purpose.
- Once everything is in, everyone except the guesser watches **the pile** on their phone: every word, with who wrote it, as the jinxed words get removed. Then the guesser and everyone else see the same survivors screen (no authors); only the guesser gets a keyboard.
- One guess. Correct: guessing team +1. Miss or pass: defense +1.
- Teams take turns. An **inning** = each team guesses once. Default: everyone guesses once.

## 2. Hard rules the screens must respect
- **The TV never shows the mystery word, and never shows the text of a jinxed clue, until the full reveal.** The guesser is watching the TV.
- **The guesser's phone never shows the word, the pile or who wrote a clue.**
- **Non-guesser phones show everything during the pile:** every clue and jinx, with its author and team.
- Survivors appear on every phone and the TV at the same moment, **without authors**.
- Close-call votes show **counts only** on the TV.
- Color is never the only way to tell the teams apart, or a teammate jinx from a defense jinx: always add a label, initials or a shape.
- Table rule (on the Instructions screen): react all you want during the pile, but **never say a word out loud**.

## 3. On-screen vocabulary *(proposed)*
| Term | Meaning | Where it appears |
|---|---|---|
| Clue | A guessing-team word | Phones, clue cards |
| Jinx (noun) | A defense word | Defense phone: "Write a jinx" |
| **JINXED!** | The stamp on a wiped clue | The pile, clue drop, full reveal |
| Jinxed by teammates | Two guessing-team players wrote the same word | Stamp attribution: "JMohawk + Sadrique" |
| Jinxed by the defense | The defense matched it | Stamp attribution: "Team B · RubyRed" |
| Missed | A defense jinx that matched nothing | The pile, full reveal |
| The pile | Every submitted word, shown to non-guessers | Non-guesser phones |
| Survived | Clues the guesser sees | "3 of 6 survived" |
| Shutout | Nothing survived | Banner |
| Close call | A match the engine made from a different form (towel / towels, run / ran, bird / birdhouse) | The pile (defense votes) |

If a word was jinxed by teammates and the defense, it shows as jinxed by the defense.

## 4. Sample data (use throughout)
7 players, uneven teams, so the uneven case gets designed.
- **Team A (4):** GeeGee (guesser this turn), JMohawk, Sadrique, KaliBear
- **Team B (3):** RubyRed, Juju, Angie
- **Turn:** Inning 2 of 4, Turn 3 of 8. Score Team A 1, Team B 1. Pace: Normal (60 s write, 45 s guess).
- **Mystery word:** BEACH

| Player | Team | Wrote | Result |
|---|---|---|---|
| JMohawk | A | sand, waves | sand jinxed, waves survived |
| Sadrique | A | sand, towel | sand jinxed, towel jinxed (close call) |
| KaliBear | A | shells, summer | both survived |
| RubyRed | B | sand | jinx landed |
| Juju | B | ocean | missed |
| Angie | B | towels | close call; defense voted Same, so it landed |

Survivors: waves, shells, summer (3 of 6). GeeGee guesses "beach": correct, Team A +1.
Also show a **shutout** state and a **miss** state with sample data of your choice. Team names and colors are open (section 9); use "Team A" and "Team B" as placeholders.

## 5. Turn flow at a glance
| Step | TV | Guesser's phone | Everyone else's phone |
|---|---|---|---|
| Write | T4 progress, no words | P5 waiting | P3 clues / P4 jinx |
| The pile + close calls | T5 / T6 clue drop (stamps, no words) | P5 waiting | **P6 the pile** (words + authors, jinxed words removed, close-call vote) |
| Guess | T7 survivors | **P7 survivors + keyboard** | **P8 the same survivors, no keyboard** |
| Verdict | T8 | P7 result | P8 result, P9 vote if it's a near guess |
| Full reveal | T9 | P10 | P10 |

The pile (P6) and the TV clue drop (T6) run **in sync**: when a word is removed on the phones, its card gets stamped on the TV.

## 6. TV screens (1280×720)

**T1. Game settings (Instructions, ready state)**
The existing Instructions template, plus a settings row the host sets before Start:
- Mode: Team / Individual
- Pace: Quick (45 s write / 30 s guess), Normal (default; 60 / 45), Relaxed (90 / 60)
- Long game checkbox: "Everyone guesses twice"
- A line that states what will happen: "7 players · 4 innings · about 20 min" (length is a placeholder estimate)
Instructions steps (4) *(proposed copy)*: 1. One player guesses; everyone else sees the word. 2. Teammates write 2 clues. The other team writes a jinx. 3. Any word written twice gets jinxed. 4. Guess from what survives. Scoring line: team games split 80 / 20. Table rule: react, but don't say any words.

**T2. Teams are set**
Two team lists with player chips, the uneven-team note ("Team B has 3: RubyRed guesses twice"), and the result of the random draw: "Team A guesses first". There's no coin flip animation; this is a reveal, not a ceremony. About 5 s, or the host taps Next.

**T3. Turn intro**
Inning and turn, the score, the guessing team, the guesser large with chip and name. Two instructions: "GeeGee: eyes on the TV." / "Everyone else: check your phone." About 5 s, automatic.

**T4. Writing**
Countdown timer (60 s on Normal). Two lanes: the guessing team's writers (one tick per clue submitted) and the defense (one tick each). Counts: "Clues 4 of 6 · Jinxes 2 of 3". The guesser's tile reads "Guessing". **No words.** Ends early when everyone is in.
States: in progress, everyone in, a player disconnected (their tile dims; their boxes will count as blank).

**T5. Close calls** (only when the engine made a soft match; runs during the pile)
The clue drop pauses with the close-call cards marked "?", plus "1 close call · Team B is deciding". Count and a 10 s timer only.

**T6. Clue drop: the signature moment** (about 10 s, plus any close-call vote; synced with P6)
Design as a sequence of states:
- a. Face-down clue cards land, one per guessing-team clue (6)
- b. Teammate jinx stamps hit ("JINXED! · JMohawk + Sadrique")
- c. Defense jinx stamps hit in the defense's team identity ("JINXED! · Team B")
- d. Survivors flip face up: "3 of 6 survived" (this hands off to T7)
- e. Alternate end state: **Shutout**. Nothing survived; "GeeGee can guess blind or pass"
Stamps show who jinxed a clue, never the word on it. Give each style its own stamp treatment (game-show stamp, arcade glitch or "GAME OVER"-style hit, rec-room rubber stamp). Respect reduced motion: with it on, go straight to state d or e.

**T7. Guess**
Survivors large and readable from the couch, the guess timer (45 s on Normal), "Quiet! No hints." Matches P7 / P8.

**T8. Verdict**
States: CORRECT (shows the guess), MISS (shows the guess), PASS, and "Team B is deciding" (a near guess under review, 10 s).

**T9. Full reveal: the moment for the guesser and the room**
Non-guessers already saw the pile; this is where the guesser finds out what was jinxed.
- The mystery word, large
- Every clue face up with its writer
- Jinxed clues paired with whoever jinxed them; teammate jinxes shown as a pair
- A close-call tag on towel / towels with the vote result ("Team B said Same")
- A **Missed jinxes** tray: "Juju · ocean"
- The turn's point and the updated score
- Host taps Next (20 s fallback)
The score lives here and on T3; no separate scoreboard screen.

**T10. Game over**
The existing Game over screen with a team header ("Team A wins 5 to 3"), member rows showing the split (80 / 20, split evenly per team) and callouts *(proposed names)*: **Top Jinxer** (most jinxes landed) and **Clue MVP** (most surviving clues in correct turns). Leave a slot for a tiebreak line; the tiebreaker format is still being decided.

## 7. Phone screens (390×844)

**P1. Your team** (game start): "You're on Team A. Team A guesses first."

**P2. Turn role card**: three versions. "Your team is guessing" / "You're on defense" / "You're the guesser. Don't look at anyone's phone."

**P3. Write clues** (guessing team): the word, "Write 2 clues" (or 3), the inputs, Submit, the timer, and **Skip word** (available for the first 15 s, once per turn).
States:
- empty, typing
- rejected, with a message per reason *(proposed copy)*: "Letters only", "That's the mystery word", "That's part of the mystery word", "Your two clues match"
- **"Is this a name?"** prompt for words not in the dictionary: **Use it** / **Edit**
- submitted and waiting ("4 of 9 in")
- Skip word used or expired (disabled)

**P4. Write a jinx** (defense): the word, "Jinx them: guess one of their clues", one input. Same states as P3, minus Skip word.

**P5. Guesser waiting**: "You're guessing. Don't look at anyone's phone." Progress ("5 of 9 in"), then "Clues are getting jinxed…" while the pile runs. No word, no pile.

**P6. The pile** (every non-guesser, both teams) *(new)*
Opens the moment the last word is in (or the write timer ends). Shows the mystery word at the top, then **every submitted word with its author and team**: the guessing team's clues, and the defense's jinxes set apart from them.
Design as a sequence of states:
- a. **Full pile:** all 9 words with author chips (sample: 6 clues, 3 jinxes)
- b. **Matches found:** matching words are linked and highlighted (sand ↔ sand ↔ sand)
- c. **Removal:** each jinxed word gets the JINXED! stamp and is pulled out of the pile, with attribution ("Team B · RubyRed", "JMohawk + Sadrique"). Missed jinxes fade out marked "Missed" (Juju · ocean)
- d. **Close call:** the soft match stays in the pile marked "?" (towel / towels).
  - Defense phones get **Same** / **Different** right on the pile, a 10 s timer, and the note "No vote counts as Different."
  - Guessing-team phones show the same pile with "Team B is deciding. Stay quiet."
  - Several close calls come one at a time.
- e. **Close call result:** Same → the stamp and removal play out as in c. Different → both words stay in the pile.
- f. **What's left:** only the survivors remain, still with authors. Then it hands off to P8.
- g. Alternate end state: **Shutout** (the pile is empty).
Synced with the TV clue drop (T5 / T6). Length: about 10 s plus any vote.

**P7. Guesser: guess** *(updated)*
The survivors, **no authors**, the same layout as P8, plus the **keyboard**: a guess input with **Guess** / **Pass**, and the timer. After the guess: CORRECT / MISS / PASS.

**P8. Everyone else: survivors** *(updated)*
The **same screen as P7**: survivors with no authors, the timer and "No hints, no faces." **No keyboard.** Shows the verdict after the guess.

**P9. Near-guess vote** (defense): "GeeGee guessed **beaches**. Count it?" Yes / No, 10 s.

**P10. Your result** (per player, during the full reveal). Examples: "Your clue **waves** survived" / "Your jinx **sand** landed" / "**towel** got jinxed by Angie" / "Your jinx **ocean** missed". For the guesser, this is the first time they see who wrote what.

**P11. Game over**: the existing phone Game over, with the team result and callouts.

## 8. Individual mode deltas (phase 1, design after team mode)
- No T2, P1 or P4; one lane on T4; Mode = Individual on T1
- Everyone except the guesser writes 1 clue (2 each with 3 players)
- The pile (P6) works the same way, with no jinx section: every clue with its author, and teammate-style jinxes only
- Survivors (P7 / P8): the same as team mode
- Scoring line: correct guess = guesser +2 and each player whose clue survived +1
- Game over: individual finishing order (top half scores)
- Who votes on close calls in individual mode is still open; leave the vote state on P6 generic

## 9. Keep consistent
- The ban list still applies: no colored accent borders, no soft-shadow rounded cards, no close-cousin palettes, no pastel or purple gradients, no emoji icons. Julian wants this game to feel distinct, not like Claude Design's defaults.
- Original names only on screen; nothing from the game that inspired this one.
- Accessibility: real buttons, touch targets 44 px or more, text contrast 4.5:1, a keyboard focus state, color never the only identifier.
- Phones portrait-first. Don't rely on vibration. The pile must fit 9 to 13 words on a 390×844 phone (10 players, 5v5: 8 clues + 5 jinxes) without scrolling if possible.
- Sound is still tabled.
- The game picker tile for #12 becomes **Don't Jinx It**, and it's playable in phase 1.

## 10. Open (don't decide in the design)
- **Team names and colors:** propose two team identities that work in all three styles and don't clash with player colors. Don't finalize.
- **Tiebreaker format:** being decided next. Leave a slot on T10.
- **Near-guess vote with no answers:** does silence count as Yes or No? (For close calls on clues, silence counts as Different, so the clue survives.)
- **Individual mode:** who votes on close calls.
- **Vocabulary:** "jinx" for the defense's word, and the callout names.

## 11. Deliverables
- A new canvas for this game (follow the lobby canvas's structure), plus PNG exports per style. Suggested path: `screens/<style>/games/12-dont-jinx-it/`, numbered T1 to T10 and P1 to P11, with lettered states (T6a to T6e, P6a to P6g)
- Token files unchanged unless a new value is needed (for example team identity colors); if so, add it to all three token files with the same key
- Update `design/README.md` with a Don't Jinx It section listing the screens and states
