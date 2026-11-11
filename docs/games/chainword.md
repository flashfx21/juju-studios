# Chainword (working name)

**Game ID:** `chainword`  
**Status:** Playable, phase 1 (first cartridge)  
**Players:** 2 to 10 (placeholder)  
**Length:** 10 min (placeholder)  
**Modes:** Individual race

## Pitch
Race through a chain of hidden words in hard mode. Fewest guesses wins.

## Decided
- Win condition: fewest total guesses; ties go to the faster total time (start of the game to finishing the chain)
- A chain of 5-letter words, the same chain for everyone. Chain length is a host setting: 3 or 5 words, default 3
- Hard mode enforced: green letters stay in place, and every revealed letter (green or yellow) is used again, as many times as it was revealed. Hints apply only within the same word
- 6 guesses per word. A missed word counts as 7 and the player moves on to the next word
- Guesses must be in the word list. A refused guess (not a word, wrong length, breaks hard mode) doesn't count, and the phone says why
- Everyone guesses on their own phone; the TV shows each player's colored squares and counts, never letters
- One-player practice page (`#/practice/chainword`) for trying the rules without a room

## Open questions
- Name: Chainword is the strongest so far; keep looking
- What happens when a player drops out mid-chain (the game ends only when everyone finishes)
- Word list size: about 2,000 accepted guesses today; real players will hit "not a word" on real words
- Player count and length are still placeholders

## Engine pieces it needs
- Private text input, per-player progress on TV

## Content pack
Word list (original, curated)

## Scoring
Reports a finishing order only. The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Naming and IP
Inspired by Wordle. Avoid '-dle' names and the original word list.
