# JuJu Studios Engine: Requirements (Draft)

The shared engine behind the JuJu Studios game night suite: lobby, profiles, host controls, connection, game framework, leaderboard. Each game plugs into it like a cartridge.
Goal: expedited launch. Engine + Chainword first, then a few more games, aiming for a few weeks. No Filler is a later release.
Status: draft, updated Nov 11, 2026. Decisions from Julian marked **Decided**; Claude's suggestions marked **Proposed**.
Related: `juju-engine-tech-stack-0852.md` (stack and architecture), `game-night-suite-ideas-2233.md` (games and phases), `games/` (one spec per game).

Priority key: **Launch** = needed for the first game night. **Later** = after launch.

## 1. Joining and profiles
| Requirement | Priority | Status |
|---|---|---|
| Players join by going to the website and entering the room code | Launch | Decided |
| Everyone has a profile; no guest play | Launch | Decided |
| Profile setup is short (target: under a minute) | Launch | Decided |
| Profile: username + preferred color | Launch | Decided |
| **Sign-in with a verified email, any email provider** (Gmail, AOL, college, etc.) | Launch | Decided (method open, see below) |
| Device stays signed in after first sign-in | Launch | Proposed |
| Initials shown with color so color is never the only identifier | Launch | Proposed |
| Duplicate username check | Launch | Proposed |
| Avatar | Later | Decided (nice to have) |
| QR code to join | Later | Decided: nice to have; explore the tech |
| Profile stats (games played, wins, favorite game) | Later | Proposed |
| Delete my profile | Later | Proposed |

**Sign-in method (open as of Nov 11):** email sign-in links were decided Nov 10, but Firebase's free plan allows only 5 sign-in-link emails per day. Options and a recommendation (email + password with a verification email) are in `juju-engine-tech-stack-0852.md`, section 9.
Rejected: phone number (text codes cost money), Google-only sign-in (excludes AOL and college emails), name + PIN (nothing verified).
Watch: school and older email providers may send emails to spam. Setup screen should say "check your spam folder." Test with an AOL and a .edu address before game night.

## 2. Lobby
| Requirement | Priority | Status |
|---|---|---|
| Big screen shows room code and joined players | Launch | Decided |
| Game choice: group vote or host pick (host setting) | Launch | Decided |
| Persistent leaderboard in the lobby | Launch | Decided |
| Three lobby styles (retro game show, 90s arcade, 70s rec room), switched in Settings | Launch | Decided |
| Design from the Claude Design lobby work | Launch | Decided |

## 3. Host controls
| Requirement | Priority | Status |
|---|---|---|
| Start a game | Launch | Decided |
| Pause and resume | Launch | Decided |
| Restart the current game | Launch | Decided |
| End game and return to lobby | Launch | Proposed |
| Instructions screen for each game before it starts | Launch | Decided |
| Per-game settings, kept minimal for launch | Launch | Decided |
| Remove a player | Launch | Proposed |
| Lock the room once a game starts | Launch | Proposed |
| Late-join rules, hand off host role | Later | Proposed |
| Saved house rules per game | Later | Proposed |

## 4. Connection
| Requirement | Priority | Status |
|---|---|---|
| Auto-rejoin when a phone sleeps or refreshes | Launch | Proposed |
| Host screen recovers after a refresh without losing the game | Launch | Proposed |
| "Player disconnected" shown on the TV | Launch | Proposed |
| **Connection strength shown per player, if possible** | Launch | Decided (if feasible) |
| Keep phone screens awake during play | Launch | Proposed |

Connection strength is feasible: the host pings each phone every few seconds and measures the round trip, then shows signal bars (e.g. under 150 ms = full, under 400 ms = medium, slower or missed pings = weak). Thresholds are placeholders to tune at a real game night.

## 5. Game framework (the cartridge contract)
| Requirement | Priority | Status |
|---|---|---|
| Shared building blocks: timer, voting, private answer box, turn order, round results, game-over screen | Launch | Proposed |
| Every game reports a **final finishing order** (players or teams, with ties) | Launch | Proposed |
| Every game provides its instructions screen and its (minimal) settings | Launch | Decided |
| Pause and restart work the same in every game | Launch | Decided |
| Team builder with auto-balance | Later (phase 3) | Proposed |

## 6. Leaderboard
| Requirement | Priority | Status |
|---|---|---|
| Overall view | Launch | Decided |
| Filter by game | Launch | Decided |
| **Default sort: total points** | Launch | Decided |
| **Each row shows total, games played and average per game** | Launch | Decided |
| **Toggle to sort by average** | Launch | Decided |
| Minimum games to rank in the average sort (e.g. 3) | Launch | Proposed |
| **Every game has the same fixed points pool**, so games are weighted equally | Launch | Decided |
| **Only top places score; everyone else gets 0** (except the 2-team rule below) | Launch | Decided |
| Works for individual and team games | Launch | Decided |
| Tonight vs. all-time | Launch | Proposed |
| Game night history | Later | Proposed |

**Average sort minimum (proposed):** without one, a player who won their only game (100 average) would top the average sort over regulars. Players under the minimum still appear in the average view, listed below the ranked players as "not enough games yet." The minimum number is a placeholder.

### Scoring system (decided Nov 10)
**Every game puts the same pool on the table: 100 points (proposed number).** The pool is split among the places that score. Bigger or smaller games never change the total.

**Who scores (decided):**
- **Individual games:** the **top 50%** of players score, scaled by place. 8 players: top 4. Odd counts round down (5 players: top 2) (proposed).
- **2-team games:** **80 / 20.** Winning team gets 80, losing team gets 20.
- **3 or more teams:** the top 2 teams score; the rest get 0.

**How the pool splits by place (proposed): a countdown split.** With N scoring places, 1st gets N shares, 2nd gets N − 1, down to 1 share for the last scoring place.
| Scoring places | Split of 100 |
|---|---|
| 1 | 100 |
| 2 | 67 / 33 |
| 3 | 50 / 33 / 17 |
| 4 | 40 / 30 / 20 / 10 |
| 5 | 33 / 27 / 20 / 13 / 7 |

**Teams:** a team's points are split evenly among its members. Rationale (Julian): in team games the result is less controlled by any one player, so an even split is fair.
| Situation | Result |
|---|---|
| Individual, 8 players | 1st 40, 2nd 30, 3rd 20, 4th 10, 5th to 8th 0 |
| 2 teams of 4 | Winners 80 total, 20 each. Losers 20 total, 5 each |
| 3 teams of 3 | 1st team: 67 total, about 22 each. 2nd team: 33 total, 11 each. 3rd team: 0 |

Consequence accepted: a team win is worth less per person than a solo win, because the team shares the pool. That keeps every game weighted the same.

**Rounding and ties (proposed):** round to whole points and give any leftover point to the top finisher. Tied players share the combined points of the places they cover. Uneven teams split their team's total by headcount.

## 7. Content packs
| Requirement | Priority | Status |
|---|---|---|
| One pack format for all games (prompts, words, questions, photos) | Launch | Proposed |
| CSV import (matches the No Filler Canva workflow) | Launch | Proposed |
| Choose packs per game | Launch | Proposed |
| Family-friendly / age tags | Later | Proposed |

## 8. Testing and quality
| Requirement | Priority | Status |
|---|---|---|
| Local test mode (host and phones as browser tabs, Firebase emulators) | Launch | Proposed |
| Version number on screen | Launch | Proposed |
| Bot players | Not needed for launch | Decided |

## 9. Readability and feel
| Requirement | Priority | Status |
|---|---|---|
| TV text readable from the couch | Launch | Proposed |
| Sound on/off on the TV | Launch | Proposed |
| Phone screens portrait-first | Launch | Proposed |
| Don't rely on phone vibration (not supported in iPhone browsers) | Launch | Proposed |

## 10. Data, privacy and safety
| Requirement | Priority | Status |
|---|---|---|
| Cloud storage so it works on the road: **Firebase** (free Spark plan) | Launch | Decided (Nov 11) |
| Security rules: signed-in players can add results; nobody can delete or edit others' data | Launch | Proposed |
| Game screens show usernames only, never emails | Launch | Proposed |
| Export results to a file as a backup | Later | Proposed |

## Open decisions
1. Sign-in method (tech stack doc, section 9)
2. Scoring numbers: 100-point pool and countdown split OK? Round down on odd player counts?
3. Average sort: minimum games to rank (3 proposed)?
4. Which "Proposed" Launch items to cut for speed?
