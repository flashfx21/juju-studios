# Don't Jinx It

**Game ID:** `dont-jinx-it`  
**Status:** Playable, phase 1 (individual mode; team mode follows teams in phase 2)  
**Players:** 3 to 10 (placeholder)  
**Length:** 15 min (placeholder)  
**Modes:** Individual and Team (defense)

## Pitch
One player guesses a mystery word; everyone else gives a one-word clue; matching clues cancel out before the guesser sees them.

## Decided
- Name: Don't Jinx It (Julian, Nov 11)
- Individual mode: clue givers write clues privately; duplicates are removed; the guesser sees what's left
- Team mode: one team guesses, the other plays defense. Teammates write 2 clues each (3 when the team is small); each defender writes 1 jinx, a guess at one of the clues. Teams take turns; an inning is each team guessing once
- Any word written more than once is jinxed. A word jinxed by both teammates and the defense counts as jinxed by the defense
- Settings: Mode (Team / Individual), Pace (Quick 45 s write / 30 s guess, Normal 60 / 45 default, Relaxed 90 / 60), Long game ("Everyone guesses twice")
- One guess per turn, or pass. Team mode: correct gives the guessing team +1; a miss or pass gives the defense +1
- Individual mode (phase 1): everyone except the guesser writes 1 clue (2 each with 3 players). Correct guess: guesser +2 and each player whose clue survived +1. Finishing order by points. Turns = players, doubled for a long game; the guesser rotates
- Clue checks, in order: empty, letters only, the mystery word, part of the mystery word (3+ letters), your two clues match, then "Is this a name?" (Use it / Edit) for words not in the dictionary
- Dictionary: the full ENABLE word list (public domain), shared so other games can use it: `packs/shared/`, loaded on demand through `src/engine/dictionary.ts` (Julian, Nov 11)
- Close calls (soft matches such as towel / towels, run / ran, bird / birdhouse): team mode, the defense votes Same / Different (10 s, no vote counts as Different). Individual mode: no vote, every soft match is jinxed automatically (Julian, Nov 11)
- Skip word: once per turn, usable in the first 15 s
- The guesser's phone never gets the word, the pile or clue authors; the TV never shows the word or a jinxed clue's text before the full reveal. Survivors reach every screen at the same moment, without authors
- Screens: `docs/handoffs/design_handoff_dont_jinx_it/` (game-show style designed; arcade and rec room to extrapolate)
- First playtest (Julian, Nov 11): you plus bots, like Dial It In, at `#/playtest/dont-jinx-it`

## Open questions
- Team names and colors (proposed: Clovers / Horseshoes, solid ● and outlined ◆ badges)
- Tiebreaker format
- Near guess (beaches for beach): team mode, does a defense vote with no answers count as Yes or No? Individual mode: proposed that plural and simple forms count automatically, no vote
- Skip word in individual mode: proposed any clue writer can use it, which deals a new word for everyone

## Engine pieces it needs
- Private text input, duplicate matching, private per-player data (the word is hidden from the guesser), teams

## Content pack
Mystery word list

## Scoring
Reports a finishing order only. The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Naming and IP
Inspired by Just One. Original name and word list before anything goes public.
