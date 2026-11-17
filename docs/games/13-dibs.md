# Dibs

**Game ID:** `dibs` (working name was "Category race")  
**Status:** Development (Nov 16, 2026). Built: rules and tests, 40-category starter pack, phone screens in all three styles (the race types on an on-screen keyboard like Chainword's, Julian's call), TV screens T1 to T9 in all three styles, solo playtest (`#/playtest/dibs`, stand-in players typed from a Dev box), rooms (`#/playtest/dibs-together`) with Deal again and End game, How to play. Instructions on the TV before the game built Nov 17. Not built: a visual design handoff. Numbers marked placeholder get set at the first playtest. Launch phase not set  
**Players:** 2 to 10. No bots: there are no answer lists for a bot to draw from (rule 8). 2 players is a practice game (not saved) where the author votes too  
**Length:** about 9 to 12 min for 7 rounds (estimate, not measured)  
**Modes:** Individual

**Decided** = Julian's call. **Placeholder** = a starting number to tune at playtest.

## Pitch
A category, then a letter. Race to claim an answer that fits. First claim keeps it.

## How it plays (30 seconds)
The TV shows a category, then a letter, and the race starts. Everyone types one answer on their phone. If someone already claimed your answer, only your phone says "Taken," and the clock keeps running. Answers stay hidden until everyone is in or time runs out. Then every answer is revealed in claim order, players can challenge the questionable ones, and the group votes. Any valid answer scores; faster valid answers score more. Most points after the last round wins.

## Decided
1. **Order:** the category appears first, then the letter, then the race starts.
2. **Free-for-all race, individual.** Not a team game.
3. **One answer per player per round,** locked once it's in. No editing.
4. **Answers hidden** until everyone has submitted or the timer ends.
5. **Duplicates: private "Taken."** If your answer matches one already claimed, only your phone says "Taken, try another" and the clock keeps running. Nobody learns who had it during the race. First claim keeps it.
6. **Duplicate check:** exact matches after a text cleanup (case, punctuation, "&" = "and", leading "a", "an" or "the"). The nearest existing code is Sketch Showdown's `cleanGuess` (`src/games/sketch-showdown/matching.ts`): it already handles case, punctuation, a leading article and spaces, but drops "&" instead of reading it as "and" and doesn't fold accents. Move it to the engine and add both. Near matches (Rugrat / Rugrats) do not trigger "Taken"; they are flagged at review (rule 12).
7. **First-letter rule, checked by the phone on submit:**
   - Drop a leading "The", "A" or "An"; the first letter of what's left must match.
   - "Everybody Loves Raymond" counts for E, not R. "The Office" counts for O.
   - People: the name as typed must start with the letter. "Beyonce" works for B; "Kobe Bryant" does not.
   - Accents are ignored (Emile and Émile both count as E). Digits must be spelled out ("Seven Up" for S).
   - A wrong letter gets a private "Must start with R" and the clock keeps running, same as "Taken."
8. **Validation is group consensus.** No curated answer lists, no AI checking. The content pack is category names only.
9. **Scoring (accessible version):**
   - Any valid answer: 2 points.
   - Speed bonus for the first three valid answers: 1st +3, 2nd +2, 3rd +1.
   - So a round pays 5 / 4 / 3, then 2 for every other valid answer. Invalid or no answer: 0.
   - Order counts only among answers that survive review. If the 1st answer is ruled out, everyone below moves up.
   - Claim time is the moment an answer was **accepted**. "Taken" and wrong-letter bounces don't count; they only cost time.
10. **Challenges:**
    - Each player gets **1 challenge per round** (placeholder). You can't challenge your own answer.
    - Several challenges on the same answer merge into one vote.
    - Everyone except the author votes Valid or Not valid, the challenger included. **A tie goes to the author.** (No Filler's spec still has its own tie rule open.) No votes cast also goes to the author.
    - Not valid: the answer scores 0 for that round.
    - **A failed challenge costs the challenger 1 point** (placeholder). A total can't drop below 0.
    - Named vote reveal on the TV after each vote. No Filler will need the same (its judging is still open), so build it as an engine piece.
11. **Reasons to vote Not valid:** doesn't fit the category, padding ("Rotten banana" for R in Fruits is still a banana), made up, or a near duplicate of an earlier claim.
12. **Near duplicates:** the review shows near matches linked with a "?". Only the **later** answer can be challenged as a duplicate. If the challenge wins, the later answer scores 0 and the first claim keeps its points. (Opposite of Don't Jinx It, where close calls wipe both words.)
13. **No answer:** 0 points, no penalty. The player still challenges and votes. An **"I'm out"** button counts as submitted so the round can end early.
14. **Rounds:** host picks 5, 7 or 9 before the game.
15. **Letter pool:** 20 letters. Q, U, V, X, Y and Z are left out of normal rounds. No repeated letter within a game.
16. **Dead pairings:** the host can **Deal again** (new letter) until the first answer is accepted. A voided round doesn't count toward the round total.
17. **Tiebreaker at the end:** most round wins (rounds where you had the first valid answer). Still tied: they share the place (the engine splits the points).
18. **Reveal moment:** when someone bounced off a "Taken," the reveal names it: "Rugrats: KaliBear, 3 s before Juju." The secret holds during the race; this is the payoff after.

## Rules text (instructions screen)
**How to play**
1. A category appears, then a letter.
2. Race to type one answer that fits and starts with the letter.
3. If someone already claimed it, your phone says Taken. Try another. The clock keeps running.
4. When everyone's in, all answers are revealed.
5. Think an answer doesn't fit? Challenge it. Everyone votes. A tie goes to the answer.
6. A failed challenge costs you 1 point.
7. Any good answer scores 2. The first three good answers score 5, 4 and 3.
8. Most points after the last round wins.

**Letter rule:** skip "The", "A" or "An" at the start. Everybody Loves Raymond counts for E. People count by the name as you type it.
**No padding:** Rotten banana is still a banana.

## Settings (host)
| Setting | Options | Default |
|---|---|---|
| Rounds | 5, 7, 9 | 7 |
| Pace (race timer) | Quick 20 s, Normal 30 s, Relaxed 45 s | Normal |
| Categories | Family only, Everything | Family only |

That's the whole list. Anything else waits for playtest evidence.

## Round flow and timers (placeholders, start here)
| Step | Time | Notes |
|---|---|---|
| Category alone on the TV | 4 s | Phones show the category with "Get ready" |
| Letter drop | 0 s | The race starts the moment the letter lands |
| Race | 30 s default | Ends early when everyone has submitted or tapped I'm out |
| Reveal | about 1 s per answer | Answers fill in by claim order with seconds and author |
| Challenge window | 15 s | Closes early when everyone taps Done |
| Each challenge vote | 8 s | One at a time, in claim order |
| Round scores | 5 s | Points this round, totals |

## Game length (estimate, not measured)
One round is about 70 to 100 seconds depending on challenges.
| Rounds | Time |
|---|---|
| 5 | about 6 to 8 min |
| 7 | about 9 to 12 min |
| 9 | about 11 to 15 min |

Measure real round times at the first game night and replace this table.

## Who sees what
**TV**
- Category, then the letter, large. The timer.
- During the race: who has submitted (initials chips, filled or empty), never what.
- Reveal: every answer in claim order with author and seconds, Taken callouts, "?" links on near duplicates.
- Challenge window: challenge markers on answers, countdown, how many are done.
- Votes: the answer, author and challenger, votes-in count; then the named result.
- Round scores and round X of Y.

**Every phone**
- Race: category, letter, timer, answer box, Submit, I'm out. Private states: Taken, Must start with R, Locked in.
- Review: every answer with author and seconds. Challenge buttons on other players' answers, challenges left, Done.
- Vote: Valid or Not valid, full width. The author sees "Your answer is being challenged" instead.
- Round result: your points this round, total and place.

## Edge cases
| Situation | Result |
|---|---|
| Two answers accepted at nearly the same moment | Order by accepted time; the host handles inputs in that order |
| An answer is ruled out after someone bounced off it with Taken | No retro change. The bounced player's other answer stands as submitted |
| Every answer ruled out | Nobody scores; the round still counts |
| Player disconnects mid-race | Treated as I'm out when the timer ends |
| Player joins mid-game | Joins at 0 from the next round (follows engine lobby rules) |
| Host removes a player | They finish at their current score |
| Host ends the game early | Finishing order by current score, then round wins, then shared |
| Host taps Deal again | New letter, same category; the round doesn't count |

## Scoring (what the game reports)
Reports a finishing order only: by points, then round wins, then shared places. The engine applies the suite rules: 100 points per game; the top 50% score on a countdown split.

## Engine pieces it needs
- Timer, group voting with named reveal, content packs, private per-player screens, presence, host controls (pause, restart, end, Deal again)
- Shared text cleanup and near-match check, moved to the engine from Sketch Showdown's matching (exact matches for Taken; near matches only raise "?" flags here, never cancel)
- Accepted-time ordering: phones write to their own input, the host checks the claim and writes the private Taken / Locked in result back
- **Risk to test:** the round trip from phone to host and back must feel instant. If Taken takes a second to arrive, the race feels broken

## Content pack
- **Format:** `packs/dibs/categories.json`, each category with id, name and tag (JSON like the other packs in this repo).
- **Tags:** Family or Adult. Adult means grown-up topics, never explicit. The suite is played with ages 8 and up.
- **Writing rule:** a category needs answers for at least 15 of the 20 letters. All 40 starters pass (checked Nov 16, 2026: `packs/dibs/letter-check.md`); the lowest is Bills you pay at 18.
- **Launch:** 40 categories for playtests. Don't mark the game Playable until there are about 100, since a night shouldn't repeat a category.
- No category repeats within a night, across games.

### Starter list (40)
| ID | Category | Tag |
|---|---|---|
| DB-001 | Cartoons | Family |
| DB-002 | Things in a kitchen | Family |
| DB-003 | Animals | Family |
| DB-004 | Snacks | Family |
| DB-005 | Board games and card games | Family |
| DB-006 | Things at a birthday party | Family |
| DB-007 | Breakfast foods | Family |
| DB-008 | Things that are cold | Family |
| DB-009 | Toys | Family |
| DB-010 | Sports | Family |
| DB-011 | Cities | Family |
| DB-012 | Things with wheels | Family |
| DB-013 | Things at the beach | Family |
| DB-014 | Superpowers | Family |
| DB-015 | Movies | Family |
| DB-016 | Things that make noise | Family |
| DB-017 | Jobs | Family |
| DB-018 | Things in a backyard | Family |
| DB-019 | Things you pack for a trip | Family |
| DB-020 | First names | Family |
| DB-021 | Things that are green | Family |
| DB-022 | Sweet treats | Family |
| DB-023 | Countries | Family |
| DB-024 | TV shows | Family |
| DB-025 | Things in a classroom | Family |
| DB-026 | Things you do on a snow day | Family |
| DB-027 | Famous people | Family |
| DB-028 | Things at a wedding | Family |
| DB-029 | Drinks at a bar | Adult |
| DB-030 | Bad first-date moves | Adult |
| DB-031 | Things that cost too much | Adult |
| DB-032 | Bills you pay | Adult |
| DB-033 | Things in a medicine cabinet | Adult |
| DB-034 | Signs you're getting old | Adult |
| DB-035 | Things said in a work meeting | Adult |
| DB-036 | Reasons to leave a party early | Adult |
| DB-037 | Things at a hardware store | Adult |
| DB-038 | Shows to binge | Adult |
| DB-039 | Excuses to skip the gym | Adult |
| DB-040 | Things in a group chat | Adult |

## Screens for Claude Design
Canvas sizes from `docs/design/components.md`: TV 1280x720, phone 390x844. Phones portrait-first; TV text readable from the couch. Original look: no Scattergories branding and no 20-sided letter die. Keep the suite ban list (no colored accent borders, no soft-shadow rounded cards, no close-cousin palettes, no pastel or purple gradients, no emoji icons). Color is never the only identifier; pair player color with initials or name.

**TV**
1. **T1 Category reveal:** category alone, round X of Y, scoreboard strip
2. **T2 Letter drop and race:** category, the letter large, timer (normal and last-5-seconds state), submitted chips filling in. Never the answers
3. **T3 Reveal:** answers fill in by claim order with author and seconds; Taken callout ("Rugrats: KaliBear, 3 s before Juju"); "?" link on a near duplicate; I'm out shown as a dash
4. **T4 Challenge window:** the full list with challenge markers, countdown, "4 of 7 done"
5. **T5 Challenge vote:** the answer, author and challenger, votes-in count
6. **T6 Challenge result:** Valid or Not valid stamp, named votes, order shifting up, the challenger's -1 if it failed
7. **T7 Round scores:** points this round per player, totals, round wins
8. **T8 Deal again:** new letter dealt, "This round doesn't count"
9. **T9 Tie decided:** "Tied on 31. KaliBear wins on round wins, 4 to 3" (feeds the shared Game over)

**Phone**
10. **P1 Get ready:** category, "Letter coming"
11. **P2 Race:** category, letter, timer, answer box, Submit, I'm out. States: typing; **TAKEN, try another**; **Must start with R**
12. **P3 Locked in:** your answer, "Waiting for 3 players"
13. **P4 Review:** every answer with author and seconds; Challenge on others' answers, "1 challenge left," Done; your own answer marked and not challengeable; "?" tag on near duplicates. States: no challenge used, challenge used, done
14. **P5 Vote:** Valid / Not valid, 8 s, then a "Vote in" state
15. **P6 Being challenged (author):** "Juju challenged Robin Hood," the live votes-in count
16. **P7 Round result:** your points this round with the reason (2nd valid: 4 points; failed challenge: -1), total, place

Shared screens (instructions, pause, game over, leaderboard) come from the suite design.

### Sample data (use throughout)
7 players. Round 3 of 7. Category: **Cartoons**. Letter: **R**.
| Player | Answer | Accepted at | What happens | Points |
|---|---|---|---|---|
| KaliBear | Rugrats | 4.2 s | 1st valid | 5 |
| Juju | Recess | 9.0 s | Bounced off Rugrats at 7.1 s; 2nd valid; failed challenge on Robin Hood | 4 - 1 = 3 |
| RubyRed | Ren & Stimpy | 11.3 s | 3rd valid (shows "&" cleanup) | 3 |
| Sadrique | Road Runner | 12.0 s | Valid | 2 |
| GeeGee | Rugrat | 14.5 s | Near duplicate of Rugrats; challenged by JMohawk; Not valid | 0 |
| JMohawk | Rocko's Modern Life | 18.0 s | Valid | 2 |
| Angie | Robin Hood | 21.4 s | Challenged by Juju ("that's a movie"); vote 3 to 3, tie goes to Angie | 2 |

Also show: a Must start with R bounce (GeeGee tries "Bugs Bunny" first), an I'm out player, and a round where every answer was ruled out.

## Considered and not chosen
- **Flat 5 / 4 / 3 / 2 / 1 points:** the fastest typist wins almost every round. Replaced by 2 for any valid answer plus a top-3 speed bonus
- **Live shared answer board:** replaced by hidden answers plus the private Taken
- **Elimination with lives:** replaced by points only, so everyone plays all game
- **Judge-only version** (no race; matching answers cancel): overlaps Don't Jinx It and sits close to the published original
- **Duplicates that cancel each other:** Don't Jinx It's signature move
- **Several answers per round:** closer to the published original, review grows past 30 items, muddies "first claim wins"
- **2 challenges per player per round:** up to 20 votes at 10 players
- **Any word in the answer can match the letter:** lets "Everybody Loves Raymond" count for R and can't be checked cleanly
- **Sudden-death tiebreak as the default:** 8 players watch 2. Countback is instant
- **Curated answer lists / AI checking:** endless content work; AI needs paid server code

## Keep it distinct from Don't Jinx It
Don't Jinx It is cooperative clue-giving where matching words destroy each other. Dibs is every player for themselves, where the first claim wins. Opposite feel. Near duplicates here only ever cost the later answer.

## Later
- **Hard letters (Q, U, V, X, Y, Z) in tiebreakers** (Julian's idea, see Open questions)
- Chaos rounds with hard letters
- Three-answer mode
- Custom host categories (first in line: cheap and fun, but adds a lobby input screen and nobody checks the content)
- Judge-only mode
- Sudden-death tiebreak option

## Open questions
1. **Hard letters in tiebreakers:** add a one-round sudden-death race on a hard letter between "round wins" and "shared"? Only the tied players race; the rest vote on challenges. Leaning yes, pending playtest.
2. **2 players (decided Nov 16):** the author votes at 2 players, so a challenge only wins by agreement (a tie keeps the answer). Minimum is 2; a 2-player game is practice and isn't saved.
3. **Playtest numbers:** race timer, challenge window, vote time, challenge limit (1) and failed-challenge cost (1 point), point values.
4. **Taken speed:** does the phone-to-host-to-phone round trip feel instant on the free Firebase plan?
5. **Pack size:** grow from 40 to about 100 before Playable; check each new category against the 15-of-20-letters rule. Open from the check: six phrase categories (snow day, first dates, getting old, work meetings, leaving parties, skipping the gym) let any letter through by rewording, and Shows to binge overlaps TV shows.
6. **Look and brand:** palette, type and the letter-drop moment are open for Visual design.

## Naming and IP
- **Name: Dibs** (decided). One syllable, says the mechanic, reads from the couch. **TAKEN** is the stamp word on the phone, not the title.
- Clearance not checked: other games or apps named "Dibs" may exist. Low risk while the suite is private; check before anything goes public.
- Inspired by the category-and-letter genre. Original name, category list, rules text and look. No Scattergories branding, no letter-die imagery, no copied category lists.
