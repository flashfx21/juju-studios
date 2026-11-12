# Sketch Showdown packs

- `clues.json`: things to draw. Each clue is an `answer` with optional `alternates`, other answers a drawing can't tell apart (burger for cheeseburger). Built from the Don't Jinx It words with the cuts and renames in `docs/games/05-sketch-showdown.md` (no yogurt; roller coaster, birthday cake, alarm clock, lightning, treasure chest, bathtub), plus 30 multi-word clues. 243 clues; the longest game shows about 33. No real people, characters or brands. Answers must be unique once cleaned up (lowercase, letters only); the tests check that.

Guesses match the answer or an alternate, plural and simple forms (via `packs/shared/word-forms.json`), and one-letter typos on answers of 5 or more letters when the typo isn't itself a real word (checked against `packs/shared/english-words.txt`).
