# Zero In

**Game ID:** `zero-in` (was `closest-without-going-over`, working title Closest Without Going Over)  
**Status:** Development (rules final Nov 16, 2026). Launch phase 3. Built Nov 16: rules and tests, the 32-question test pack (`packs/zero-in/questions.json`, answers unverified), phone screens, a solo playtest with bots, and rooms on phones with bots and End game. TV screens built Nov 16 for rooms shown at `#/tv` (question with lock lights, final intro card, ring reveal with points and totals, climb reveal, final standings); no Claude Design screens yet, so the look is extrapolated from the shared TV pieces. Pause overlay waits for pause in rooms  
**Players:** 3 to 10  
**Length:** about 10 min at 10 rounds (estimate, not playtested)  
**Modes:** Individual

## Pitch
Guess a price, year or number. Closest guess wins, over or under. The final round flips it: don't go over.

## Decided
- Name: Zero In. Lineup position stays #3. Game ID `zero-in`, set before any results are saved
- Closest guess wins the round. Going over is allowed: over and under count the same (answer 14: 16 beats 8)
- Final round, "Don't Go Over": closest without going over; a guess above the answer is a BUST
- One TV hosts; 3 to 10 players guess privately on their phones
- Three lanes: Price Tag, What Year, By the Numbers
- Topics are tags across the lanes, for wide variety (list below)
- The host taps Next to move on, like the other games
- Timer is a host setting called Pace
- Bots for solo testing: yes
- Original question pack. Claude drafts, Julian checks the answers. Start with the 32-question test pack and grow it
- Reports a finishing order only; the engine handles leaderboard points
- Fits the retro game show lobby style

## Lanes
- **Price Tag:** a dated past price (at launch, or in a named year). No current prices at launch. Each question is in dollars or cents, never both
- **What Year:** the year something happened, history included
- **By the Numbers:** a count or measurement that doesn't change, or is tied to a date
- Every answer is one whole number. Dollar prices are rounded to the nearest dollar

## Topics
History, Science & Nature, Space, Animals, Human Body, Food & Drink, Sports, Music, Movies & TV, Games & Toys, Tech, Geography & Landmarks, Money & Everyday Life, Philly & Local (marked local).
- Draw rule: no topic twice in a row, no topic more than twice per game. Best effort: the rule bends when the pack or a single-lane setting can't meet it; the game never stalls
- Movies & TV and Music: facts only. No posters, stills or lyrics

## Host settings
- **Pace:** Quick 20 s / Normal 30 s (default) / Relaxed 45 s per guess
- **Rounds:** 5, 10 or 15 (default 10). The last round is always Don't Go Over
- **Lanes:** Mix (default) or one lane

## How a round plays
1. The TV shows the lane, topic, question and unit. Phones show the same question with a number pad
2. The unit sits in the entry box ($ before; cents, years, feet and so on after). Phones add commas as you type
3. A player can change their guess until they tap Lock It In. A locked guess is final
4. The round ends when everyone has locked in or the Pace timer runs out. A typed but unlocked guess is submitted automatically; an empty box is "No guess"
5. Reveal, with round points and running totals on the same screen (Julian, Nov 16): from round 2, a Total column sits beside the round's points
6. The host taps Next once to start the next question. The host can pause at any point, including during the reveal

## Regular rounds
**Reveal (ring reveal)**
- Guesses appear on a number line with names, colors and initials. During guessing the TV shows only lock lights, never numbers
- The answer drops onto the line, and a ring grows outward from it in both directions. Guesses light up in the order the ring reaches them (1st, 2nd, 3rd)
- An exact hit gets the "On the Mark!" celebration
- The line is scaled to the guesses near the answer. A wild guess sits at the edge with an arrow and "way off"
- Optional fact line with the source under the answer
- Must look clearly different from Dial It In's reveal

**Points**
- Closeness is distance from the answer, over or under
- Closest: 3. Second: 2. Third: 1. Everyone else: 0
- Exact hit: +2 on top
- No guess: 0
- Same distance shares the place, and the next place is skipped. Example: answer 14, guesses 12, 16, 8, 30. 12 and 16 tie for 1st (3 each), 8 is 3rd (1), 30 gets 0
- If everyone guesses the same number, all tie for 1st (3 each). With fewer than three guesses, only the places that exist score

## Final round: Don't Go Over
- Phones and the TV warn before the question is shown: "Final round: don't go over"
- Question: drawn from Price Tag when Lanes is Mix (the lane chosen otherwise). Never a question whose answer is under 10
- Closest guess without going over wins. Equal to the answer is safe. Above the answer is a BUST and scores 0
- Points doubled: 6 / 4 / 2 for the three closest safe guesses, +4 for an exact hit
- If every guess goes over, nobody scores that round, and the TV plays it up
- Reveal (climb reveal): the count rises from the lowest guess; guesses turn SAFE as it passes, guesses above the answer turn red BUST, the closest safe guess flashes as the winner
- Known tension, accepted: a player far ahead can guess low to protect the lead. Check at the first playtest

## Finishing order
- Ranked by total round points
- Tiebreakers in order: most round wins (closest guess; shared places count; the final round counts), then most exact hits
- Players still tied stay tied; the engine shares points for tied places

## Edge cases
- Input: whole numbers only, no negatives, 9 digits at most
- A player who drops and rejoins while the timer is running can still guess; otherwise "No guess"
- Searching on phones: honor system, limited by Pace

## Bots (solo testing)
- Bots only guess, like Dial It In and Pin Drop
- A bot guesses the answer plus a random error, sometimes wide, so the ring reveal and ties get tested
- In the final round, bots sometimes go over, so busts and "everyone busted" get tested

## Engine pieces it needs
- Private number input (unit shown before or after the number), Pace timer, host Next control, round results, game-over screen, bots, play counts (shared with No Filler card stats)

## Content pack
`packs/zero-in/questions.json` (path proposed, matches the other packs).
Fields: id, lane (price / year / number), topic, prompt, answer (whole number), unit, unit position (before / after), as-of date, source, fact (optional), local (yes / no).
Rules for writing:
- one unambiguous number
- prices and changing stats carry a date
- no current prices at launch
- every answer checked against a source before it goes in
- keep answers under 10 rare (they make exact hits too easy)

No repeats within a game; the least-played questions are drawn first.
Pack plan: start with the 32-question test pack below; grow to about 90 (30 per lane) before the first real game night (estimate).

## Engine note: Pace sweep (done Nov 16)
Done: `src/engine/pace.ts` holds the names and labels; Pin Drop, Dial It In, Sketch Showdown and Don't Jinx It use it, each with its own seconds. Chainword's clock isn't a host setting, so it has no Pace. The original note:

"Pace" is the suite-wide name for any game's timer setting. Labels: Quick / Normal (default) / Relaxed, with seconds set per game. Sweep every game that uses a timer so the setting is called Pace with these labels:
- Already Pace with labels: Sketch Showdown, Don't Jinx It
- Pace without labels: Pin Drop (45 / 60 / 90 s); add Quick / Normal / Relaxed
- Timer not yet called Pace: No Filler (turn timer), Word Agents (turn timer)
- Check: Dial It In and any game added later
Suggested home: the engine's shared settings, so each game passes only its three times.

## Later
- Contestants' Row: one guess at a time in turn, visible on the TV, no duplicate guesses
- House packs (family or friend numbers) through CSV import; the question writer sits out
- Current-prices pack with dates and a refresh plan
- Host filter by topic
- Item photos (licensed or your own)
- Team mode
- Range format (low and high guess; narrowest range that contains the answer wins)
- Final wager round
- Decimals and metric units
- Difficulty and kids tags
- Extra sound cues

## Scoring
Reports a finishing order only. The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Naming and IP
Closest-guess trivia is a common mechanic; mechanics aren't protected. The final round's rule echoes The Price Is Right: avoid that show's names, catchphrases, segment names and sound cues. Trademark search on "Zero In" before anything goes public (CLO; not yet done). Original questions only; facts aren't owned, but write each question yourself.

## Screens for Claude Design
Style note: break from Claude Design's defaults (no colored accent borders, no palettes of near-identical colors).

**TV**
1. Instructions
2. Pre-game settings: Pace, Rounds, Lanes
3. Question and guessing: lane, topic, question, unit, timer, lock lights
4. Ring reveal: guesses on the number line, answer drops in, ring grows, places light up (with ties), "way off" edge, "On the Mark!" celebration, fact line
5. Round standings: points this round, running totals (on phones these share the reveal screen; the TV may still show them as a step after the ring reveal)
6. Final round intro card: "Don't Go Over", double points
7. Climb reveal: SAFE, BUST, winner, exact hit, "Everybody busted"
8. Final results: finishing order, then hand off to the engine's game-over and leaderboard screens
9. Paused (engine overlay)

**Phone (portrait)**
1. Get ready / waiting for the question
2. Guess entry: question, number pad, unit before or after, commas, timer, Lock It In
3. Locked in: your guess, waiting on others
4. Time's up (auto-submitted, or "No guess")
5. Round result: your guess, the answer, how far off ("2 away"), place, points
6. Final round warning
7. Final round result: SAFE or BUST, place, points
8. Final: your finishing place

## Starter test pack (32, Claude draft; answers from Claude's knowledge, unverified, check each against the listed source)
| # | Lane | Topic | Question | Answer | Check against |
|---|---|---|---|---|---|
| 1 | Price | Tech | Original Apple Macintosh at launch, 1984 | $2,495 | Apple 1984 launch materials |
| 2 | Price | Tech | Original iPhone, 8 GB, at launch, 2007 | $599 | Apple 2007 press release |
| 3 | Price | Tech | PlayStation 2 at US launch, 2000 | $299 | Sony launch coverage |
| 4 | Price | Tech | Nintendo Wii at US launch, 2006 | $250 | Nintendo launch coverage |
| 5 | Price | History | Ford Model T when introduced, 1908 | $850 | Ford historical archive |
| 6 | Price | Sports | Most expensive ticket to the first Super Bowl, 1967 | $12 | Pro Football Hall of Fame |
| 7 | Price | Tech | Original iPod at launch, 2001 | $399 | Apple 2001 press release |
| 8 | Price | Money & Everyday Life | First-class US stamp, 1971 | 8 cents | USPS rate history |
| 9 | Year | Geography & Landmarks | Golden Gate Bridge opens | 1937 | Golden Gate Bridge District |
| 10 | Year | History | Wright brothers' first powered flight | 1903 | Smithsonian |
| 11 | Year | Games & Toys | Rubik's Cube invented | 1974 | Rubik's official history |
| 12 | Year | Tech | NES released in North America | 1985 | Nintendo history |
| 13 | Year | Geography & Landmarks | Eiffel Tower completed | 1889 | Official Eiffel Tower site |
| 14 | Year | Sports | Eagles win their first Super Bowl | 2018 | NFL record book |
| 15 | Year | Food & Drink | Hershey's Kisses introduced | 1907 | Hershey company history |
| 16 | Year | History | Berlin Wall falls | 1989 | History reference |
| 17 | Year | Space | First crewed Moon landing | 1969 | NASA |
| 18 | Year | Food & Drink | Coca-Cola invented | 1886 | Coca-Cola company history |
| 19 | Year | Music | The Beatles first appear on The Ed Sullivan Show | 1964 | History reference |
| 20 | Year | Movies & TV | First Star Wars film released | 1977 | Film reference |
| 21 | Year | Games & Toys | Monopoly first published by Parker Brothers | 1935 | Hasbro history |
| 22 | Number | Music | Keys on a standard piano | 88 | Music reference |
| 23 | Number | Human Body | Bones in the adult human body | 206 | Medical reference |
| 24 | Number | Philly & Local (local) | Steps up to the Philadelphia Museum of Art | 72 | Philadelphia Museum of Art |
| 25 | Number | Geography & Landmarks | Height of Mount Everest, 2020 survey (feet) | 29,032 | 2020 China-Nepal survey |
| 26 | Number | Science & Nature | Elements on the periodic table | 118 | IUPAC |
| 27 | Number | Geography & Landmarks | Member states of the United Nations | 193 | un.org |
| 28 | Number | History | Signers of the Declaration of Independence | 56 | National Archives |
| 29 | Number | Animals | Hearts in an octopus | 3 | Biology reference |
| 30 | Number | Sports | Feet between bases in Major League Baseball | 90 | MLB rules |
| 31 | Number | Geography & Landmarks | Countries in Africa | 54 | UN / atlas |
| 32 | Number | Human Body | Teeth in a full adult set | 32 | Dental reference |

Final-round eligible (Price Tag, answer 10 or more): #1 to #7. Pack gaps to fill as it grows: non-tech prices (food, toys, tickets), Movies & TV, Animals.
