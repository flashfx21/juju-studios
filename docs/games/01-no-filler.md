# No Filler

**Game ID:** `no-filler`  
**Status:** Development (Nov 17, 2026). Built: rules and tests (the Proposed rules below, as written), a 90-card starter pack, phone screens and TV screens in all three lobby styles, Instructions on the TV, solo playtest (`#/playtest/no-filler`, stand-in players run from a Dev box), rooms (`#/playtest/no-filler-together`) with the host's Void turn, Skip turn and End game, How to play. Not built: prompt testing (card stats, Flag this card, test cards, CSV export), the No Filler brand look (black, Anton), pause, removing a player mid-game, offline detection, the printed deck. See Build decisions. Numbers marked placeholder get set at the first playtest. Launch phase 2  
**Players:** 3 to 10 in a room (the physical game is 4 to 10; see Build decisions)  
**Length:** 15 to 40 min, depending on group size (estimate, see "Game length")  
**Modes:** Individual

Repo path: `docs/games/01-no-filler.md`. Rules pass dated Nov 11, 2026; adopted as this spec Nov 17, 2026. **Decided** = Julian's call. **Proposed** = Claude's recommendation, confirm before design and build.

## Pitch
Name 3 things in the category before time runs out, with no um, uh, er or like.

## Decided
- Easy 1, Medium 2, Hard 3 points; first to 15 wins (see Proposed rule 7 for the round change)
- Other players vote Clean or Filler on their phones
- Doubles as a test bench for new prompts and packs: per-card pass rates and bad-prompt flags, exportable
- Keep the physical game's brand: black, Anton, green/yellow/red
- No em dashes in rules text

## Proposed rules (confirm)
1. **Difficulty:** the speaker picks Easy, Medium or Hard on their phone, then gets a random card from that pile. They never see the card before picking. The "random difficulty" setting from the first plan is cut; the pick is the strategy.
2. **Turn order:** shuffled once when the game starts, then fixed. The TV always shows who is up next.
3. **The turn:** the card and the timer appear at the same moment, on the TV and the speaker's phone. No reading time, same as flipping a card. The speaker can tap **Done** to stop the clock early; the TV shows when they stopped.
4. **Timer:** 10 seconds by default; host setting 5, 10 or 15.
5. **Judging: group vote.** Everyone except the speaker votes Clean or Filler. Votes close when every connected voter has voted, or after 8 seconds (placeholder). Missing votes don't count. A tie goes to the speaker, and so does a vote with nobody voting.
6. **The vote decides everything.** The app can't hear the speaker, so it never scores a turn by itself. Filler, fewer than 3 answers, a wrong or repeated answer and not finishing in time are all reasons to vote Filler. Clean scores the card's points; Filler scores 0.
7. **Ending: reach the target and the round plays out.** When someone reaches 15, everyone who hasn't gone yet this round gets their turn, so all players get the same number of turns. Highest score wins.
8. **Tie for first:** one sudden-death round. Only the tied players go, Hard cards only. Still tied after that: they share first place (the engine splits the points).
9. **Named vote reveal:** after each vote, the TV shows who voted what. It makes bad-faith votes visible and makes the reveal a moment ("You voted Filler on me?").
10. **No skipping:** the speaker can't skip a card. Only the host can void a turn (see Edge cases).

## Rules text (instructions screen)
**How to play**
1. On your turn, pick Easy (1 point), Medium (2 points) or Hard (3 points).
2. A card appears and the clock starts. Name 3 things that fit.
3. No um, uh, er or like.
4. Everyone else votes Clean or Filler. A tie goes to you.
5. Clean scores the card's points. Filler scores 0.
6. When someone reaches 15, the round finishes. Most points wins.

**It's Filler if you:** say a filler word, name fewer than 3, give a wrong or repeated answer, or run out of time.

## Settings (host)
| Setting | Options | Default |
|---|---|---|
| Timer | 5, 10, 15 seconds | 10 |
| Target score | 10, 15 | 15 |
| Test cards | Off, Mix in | Off |

That's the whole list. Anything else waits for playtest evidence.

## Game length (estimate, not measured)
One turn is about 25 seconds: pick 3, timer 10, vote up to 8, reveal 4. If players average about 1.5 points a turn (a guess until prompt stats exist), each player needs about 10 turns to reach 15.
| Players | Turns | Time |
|---|---|---|
| 4 | about 40 | about 17 min |
| 6 | about 60 | about 25 min |
| 10 | about 100 | about 40 min |

Big groups at 15 run long, which is why Target score has a 10 option. Measure real turn times at the first game night and replace this table.

## Who sees what
**TV**
- Scoreboard strip: every player's initials chip and score, a marker at the target, the current speaker highlighted, connection state
- During the pick: "[Name] is choosing"
- During the turn: the card, large, in the physical card's style (difficulty color bar, points, prompt, category, card ID), and the timer. The timer turns red for the last 3 seconds
- During the vote: how many have voted, never how
- Reveal: Clean or Filler, the named votes, points added, who's up next
- "Final round" banner once someone reaches the target

**Speaker's phone**
- Pick screen: three large buttons, Easy, Medium, Hard, in green, yellow, red with points
- Turn screen: the prompt, the timer and a large Done button

**Everyone else's phone**
- During the turn: the prompt small, with "Eyes up." The point is to watch the speaker, not the phone
- Vote screen: Clean and Filler, full width
- Result screen: the outcome and a "Flag this card" option

## Prompt deck
- Format: the Canva CSV (id, difficulty, prompt, category). The card ID on screen matches the printed card, so a flag points at a real card.
- Drawn without repeats for the whole session, across games played that night. When a pile runs out it reshuffles.
- **Test cards:** new prompts live in a separate test pack. With "Mix in" on, they're dealt like normal cards and look the same, so players don't judge them differently.
- Launch: core deck and test pack only. Choosing among multiple packs waits until there are packs to choose from.

## Prompt testing
**Collected for every card from the first game (in `cardStats/{cardId}`):**
- Plays, Clean count, pass rate
- **Split votes:** how often the vote wasn't unanimous. A card that splits the room is usually unclear, not hard. That is a different fix from "too hard."
- Flags, with reason
- Voids by the host (counted as a flag)

**Flagging:** on the result screen, any player, including the speaker, can tap "Flag this card" and pick one reason: Wrong difficulty, Unclear, Not fun. No typing.

**Reading the data:**
- Pass rate is hidden until a card has 5 plays (placeholder). Fewer is noise.
- Pass rate by difficulty is the most important number. Picking Hard every turn is the best play unless Hard passes much less often than Easy. Example: if Easy passes 90% of the time, Hard must pass under 30% before Easy is ever worth picking (1 x 0.9 = 0.9 points vs 3 x 0.3 = 0.9). If game nights show everyone picks Hard, the deck or the points need a look. This applies to the physical game too.
- All data comes from one friends-and-family group. Treat it as a signal for the physical deck, not proof.

**Launch:** collect everything, plus an "Export card stats (CSV)" button in host settings. A designed report screen waits (see Later).

## Edge cases
| Situation | Rule |
|---|---|
| Speaker offline when their turn starts | TV shows "Waiting for [Name]." After 20 seconds (placeholder) the host can skip the turn. They keep their score and play next round |
| Speaker drops mid-turn | The turn keeps going. They're talking out loud; the phone isn't needed. The vote runs as normal |
| A voter drops | Their vote doesn't count. The vote closes without them |
| Pause during a turn | The turn is voided. On resume the speaker picks again and gets a new card (they had thinking time) |
| Host voids a turn (bad card, interruption) | No score, the card is auto-flagged, the speaker picks again |
| Players drop below 3 | Game pauses until someone returns or the host ends it. 4 needed to start |
| Host removes a player | They leave the turn order and finish at their current score |
| Two players pass the target in the same round | Highest score wins; tie goes to sudden death (rule 8) |
| Host ends the game early | Finishing order by current score; ties share |

## Cut or waiting (scope)
- **Buzz button. Cut for launch.** In the room, people yell "um!" anyway; that is the call-out moment, same as the physical game. A phone buzz pulls voters' eyes down during the 10 seconds that matter. Revisit only if playtests ask for it. If it returns, the better version marks buzz times on the timer bar at the reveal as evidence, with no scoring effect.
- **Rotating judge. Rejected.** One person's ear, more arguments, and everyone else idles. The group vote is what phones add.
- **Automatic filler detection with the phone mic. Rejected.** Browser speech recognition varies by phone and browser, and speech-to-text often drops filler words (unverified for every engine; test before reconsidering). Also an always-on mic at a party with ages 8+.
- **Different timers per difficulty, steal rounds, double-or-nothing, team mode.** Not until the base game has been played.
- Later: designed prompt report screen, multiple packs per game, sudden-death variations, house rules.

## Engine pieces it needs
- Turns, timer, voting (with named reveal), content packs, private per-player screens (speaker vs voters), pause/void, presence

## Content pack
Prompt deck (exists: Easy / Medium / Hard CSV from the Canva workflow). Check: the landing page says 369 cards (123 per difficulty); earlier print notes say 303. The phone pack should match the final print deck.

## Scoring
Reports a finishing order only: by score, ties share, sudden-death result decides first. The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Screens for Claude Design
Canvas sizes from `docs/design/components.md`: TV 1280x720, phone 390x844. All in the No Filler brand.

**TV**
1. Turn start: scoreboard strip, "[Name] is choosing," up next
2. Card live: card, timer (normal and last-3-seconds red), speaker name
3. Voting: votes-in count
4. Reveal: Clean or Filler, named votes, points added
5. Final round banner and sudden-death intro
6. Waiting for speaker / turn voided

**Phone**
7. Pick difficulty (speaker)
8. Speaking: prompt, timer, Done (speaker)
9. Watching: "Eyes up" (others)
10. Vote: Clean / Filler, then a "Vote in" state
11. Result with "Flag this card" and the three reasons
12. Between turns: scores and up next

Shared screens (instructions, pause, game over, leaderboard) come from the suite design; see open question 3.

## Build decisions (Nov 17, 2026)
Julian asked for the build on Nov 17. The Proposed rules above are built as written.
1. **Rules:** Proposed rules 1 to 10. Blind pick, then a random card from that pile; turn order shuffled once; card and timer together; Done; everyone else votes; votes close when all are in or after 8 s; missing votes don't count; a tie or no votes goes to the speaker; Clean scores 1, 2 or 3, Filler 0; the round plays out at the target; highest score wins; a tie for first plays one sudden-death round (tied players, Hard only), then they share first; named vote reveal; no skipping by the speaker.
2. **Settings:** Timer 5, 10 or 15 s (default 10) and Target score 10 or 15 (default 15), in the waiting room. Test cards is not built.
3. **Pace:** the reveal moves on by itself after 5 s. The pick has no timer.
4. **Host actions:** Void turn (no score, the speaker picks again and gets a different card) and Skip turn (the speaker keeps their score and waits for the next round), in the host's top-left menu beside End game. They go through inputs like every move, and the rules refuse them from anyone but the host.
5. **Players:** 3 to 10 in a room. 3 is the floor because the edge case above keeps a game going at 3. No bots: the app can't hear anyone.
6. **Secrets:** cards still in the piles never reach the room, and during the vote the room shows only who has voted. The host's phone keeps the full game at `roomSecrets/{code}/host`; a player's own vote comes back in their private view. Leak tests in `roomViews.test.ts`.
7. **Look:** the three lobby styles, with the difficulty colors fixed across them (green Easy, yellow Medium, red Hard; green Clean, red Filler), always with a word or mark beside the color. No new fonts.
8. **Content:** `packs/no-filler/cards.json`, a 90-card starter pack (30 per difficulty) written for this build. It stands in until the printed deck (the Canva CSV) is added, so card ids on screen don't match printed cards yet.
9. **Not in this build** (each is in `docs/later.md`): prompt testing (card stats, Flag this card, test cards, CSV export), the No Filler brand look (black, Anton), pause, removing a player mid-game, and "Waiting for [Name]" offline detection (the host's Skip turn covers it by hand).
10. **Phones:** the pick (three large buttons with points), speaking (prompt, timer, large Done), Eyes up with the prompt small, the vote (Clean and Filler full width, then "Vote in"), the result (outcome, named votes, points), and between turns the scores and who is up next.
11. **TV:** scoreboard strip with the target and the speaker marked, "[Name] is choosing", the card with its timer (the last 3 seconds get a frame and the word Hurry), the votes-in count, the reveal with named votes and who is next, the Final round banner, the sudden-death intro and the final standings. Instructions show before the game.
12. **How to play:** from the rules text above, with the suite's leaderboard line.
13. **Scoring:** the rules report a finishing order only. End game early ranks by current score.

Choices the spec left open:
- Sudden-death points only break the tie for first. Scores stay as they were, so a tied 15 still reads 15.
- In sudden death the speaker's pick screen has one button, Hard. Tapping it flips the card, so the speaker still chooses the moment.
- Void turn works while the card is up, during the vote and on the reveal (it takes the points back). Skip turn works until the verdict is in.
- "Up next" is left blank on the last turn of a round when that turn could end the game.
- A pile that runs out is shuffled again without the card just dealt. The host's phone remembers each card it deals, so later games that night deal the others first.
- A vote nobody cast in time is listed as "No vote" on the reveal.
- The TV and voters' phones show when the speaker stopped ("Stopped at 6.4 s") or "Time ran out".
- Someone who joins mid-game waits for the next game. Someone who leaves mid-game stays in the turn order; the host skips their turns.
- A room host who hands the room on (Leave room) hands on Void turn and Skip turn with it.

## Open questions
1. Physical timer: the landing page animates 0:05. What does the printed rulebook say? If it's 5, should the phone default to 5 to feel like the same game?
2. Card front on TV: which physical layout won (Bottom Bar, Color Frame or Top Bar)? Prompt type: Anton (landing page) or Archivo 600 (card system)?
3. Instructions and game-over screens: No Filler brand, or the suite's lobby style?
4. Target 10 for big groups: a host choice, or automatic at 7+ players?
5. Color clash: green and red mean Clean and Filler here. Suite player colors that are close to them may need care in the scoreboard.

## Naming and IP
Original game. The physical card game is a separate product with its own Kickstarter timeline; keep its brand (black, Anton, green/yellow/red). The phone version is private for now, so it doesn't affect the Kickstarter.
