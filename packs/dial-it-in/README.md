# Dial It In packs

- `spectrums.json`: spectrum cards, a pair of opposites each. The dial runs from `left` (1) to `right` (the top of the range).
- `bot-clues.json`: the clues a bot gives in solo play, by card id. Each clue has the `text` the bot says and `at`, where it lands on the 1 to 100 dial (the 1 to 50 dial scales it). The bot says the card's clue closest to its target. Every card needs clues, and every spot on the dial must be within 12 of one; the tests check both. No real people, characters or brands.
