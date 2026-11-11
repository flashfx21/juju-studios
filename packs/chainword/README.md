# Chainword word pack

- `answers.json`: the hidden words, by word length (4 to 7 letters). Chosen by hand: common, family-friendly words, no plurals. Edit freely; every word must be lowercase, the right length, and also appear in `guesses.json`. The tests check both.
- `guesses.json`: every word a player may type, by word length, stored as one space-separated string per length to keep the download small.

## Where the guesses come from

The ENABLE word list (Enhanced North American Benchmark Lexicon), which is in the public domain and was made for word games. It is not the list from any commercial word game. Every answer is added, plus a few common words ENABLE lacks (`email`, `inbox`).

ENABLE is from the late 1990s, so a few newer words are missing and some obscure ones are accepted. Accepting an odd word is harmless; a word people expect and can't use is worth adding to `guesses.json` by hand.

Changing either file changes which words a chain code deals, so everyone in a playtest should load the site fresh.
