# Chainword (working name)

**Game ID:** `chainword`  
**Status:** Development. Launch phase 1 (first cartridge). Rules and phone screen done; chain-code playtest live. TV screen and Instructions to do  
**Players:** 2 to 10 (placeholder)  
**Length:** 10 min (placeholder)  
**Modes:** Individual race

## Pitch
Race through a chain of hidden words. Fewest guesses wins.

## Decided
- Win condition: fewest total guesses; ties go to the faster total time (start of the game to finishing the chain)
- A chain of words, the same chain for everyone. Host settings: letters per word 4, 5, 6 or 7 (default 5), and 3 or 5 words in the chain (default 3)
- Normal rules by default: any word in the list is a valid guess. Hard mode is a setting chosen before the chain starts (default off; Julian, Nov 11, after playtests found forced hard mode less fun). In hard mode green letters stay in place, and every revealed letter (green or yellow) is used again, as many times as it was revealed. Hints apply only within the same word
- 6 guesses per word. A missed word counts as 7 and the player moves on to the next word
- Guesses must be in the word list. A refused guess (not a word, wrong length, or breaks hard mode when it is on) doesn't count, and the phone says why
- Everyone guesses on their own phone; the TV shows each player's colored squares and counts, never letters
- Phone play screen (Julian, Nov 11): letters go straight into the boxes from an on-screen keyboard (keys take each letter's best color for the current word; a physical keyboard also works), a progress bar shows the chain with each word's guess count (green solved, gray missed at 7) and a running total, and the screen never scrolls. After a word's last guess the phone shows how it went ("Solved in 3 guesses!" or the missed word) before moving on
- The host can end the game early. Anyone still playing has the word they are on and every word not reached count as 7
- Playtest without a server (`#/playtest/chainword`, behind the playtest code): a chain code such as `KPDT53` (4 letters, then letters per word and words in the chain, then `H` if hard mode is on, e.g. `KPDT53H`) deals the same chain on every phone; players compare totals out loud

## Open questions
- Name: Chainword is the strongest so far; keep looking
- Player count and length are still placeholders

## Engine pieces it needs
- Private text input, per-player progress on TV

## Content pack
Hidden words: curated by hand, by length (`packs/chainword/answers.json`, about 290 to 620 per length). Accepted guesses: the ENABLE word list (public domain, made for word games) plus every answer (`packs/chainword/guesses.json`). See `packs/chainword/README.md`.

## Scoring
Reports a finishing order only. The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Naming and IP
Inspired by Wordle. Avoid '-dle' names and the original word list.
