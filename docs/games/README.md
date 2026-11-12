# Games

One spec per game. Source of truth for ideas and history: `../game-night-suite-ideas-2233.md`. Updated Nov 12, 2026.

Games are named with their number in this repo's docs and notes ("06 Pin Drop"). Ids, folders and on-screen titles have no number.

## Phases

Every game is in exactly one phase. It moves on when it meets that phase's exit rule. Parts of a game can be solo-tested while it is still in Development; the game stays in Development until the exit rule is met.

| Phase | Means | Exit rule |
|---|---|---|
| Not Started | An idea in the lineup. The spec still has core open questions and nobody is working on it | Work on the rules begins |
| Design | The rules are being settled in the spec | Rules final in the spec. A visual design handoff is optional |
| Development | Building the cartridge | Rules and tests, phone screen, TV screen, Instructions, all three lobby styles, a playtest page |
| Solo test | Played on one device, with bots and a Dev box standing in for other phones and the engine | Julian signs off the screens and flow |
| Group test | Played on real phones through the backend | A full game played start to finish by a group, with fixes done |
| Production | Released: status "playable" in the game picker | |

"Launch phase" (1, 2, 3) is separate: it is the order games are planned to ship.

## Lineup

| # | Game | File | Phase | Launch phase |
|---|---|---|---|---|
| 01 | No Filler | `01-no-filler.md` | Design | 2 |
| 02 | Dial It In | `02-dial-it-in.md` | Development | 1 |
| 03 | Closest Without Going Over (working title) | `03-closest-without-going-over.md` | Not Started | 3 |
| 04 | Chainword (working name) | `04-chainword.md` | Development | 1 (first cartridge) |
| 05 | Sketch Showdown | `05-sketch-showdown.md` | Development | 2 (the idea log says 3) |
| 06 | Pin Drop (working title) | `06-pin-drop.md` | Development | 1 |
| 07 | Hidden traitor game (working title) | `07-hidden-traitor.md` | Not Started | 3 (marquee candidate) |
| 08 | Word Agents | `08-word-agents.md` | Not Started | 3 |
| 09 | Curated board game (name open) | `09-board-game.md` | Not Started | 3 |
| 10 | Maze chase (name open) | `10-maze-chase.md` | Not Started | 3 |
| 11 | Snake arena (name open) | `11-snake-arena.md` | Not Started | 3, last |
| 12 | Don't Jinx It | `12-dont-jinx-it.md` | Development | 1 (individual mode; team mode follows teams in phase 2) |

Each spec's Status line carries the detail: what is done and what is left.

Archived (not in this folder): Fib Finder, The Odd One, Hot takes, Family trivia, Story chain. Removed: Quick-reaction party.
