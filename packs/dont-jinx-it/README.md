# Don't Jinx It packs

- `words.json`: the mystery words. Chosen by hand: common, family-friendly things that are easy to clue in one word. Lowercase letters only, 3 or more letters, no repeats. Edit freely; the tests check the shape. Changing the list changes which words a playtest deals.
- `word-forms.json`: irregular word forms (run / ran, mouse / mice) that the rules can't spot from spelling. Two clues in the same group are a close call, and so is a guess in the same group as the mystery word. Regular forms (towel / towels, bake / baking) are matched by the rules and don't need listing.

Clues are also checked against the shared English word list (`packs/shared/`) for the "Is this a name?" prompt.
