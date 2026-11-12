# Shared packs

Content any game can use. Games load these through `src/engine/`, never by importing the files directly.

## `english-words.txt`

The ENABLE word list (Enhanced North American Benchmark Lexicon): 172,823 lowercase English words, one per line. It is in the public domain and was made for word games; it is not the list from any commercial word game. Unchanged from the published `enable1.txt`.

Load it with `loadDictionary()` from `src/engine/dictionary.ts`. It downloads as its own file (about 1.7 MB, much smaller compressed) the first time a game asks for it, so games that don't use it never fetch it.

ENABLE is from the late 1990s: a few newer words are missing and some obscure ones are accepted. It has no proper nouns, so names and places are not in it. It has no one-letter words ("a", "i"), and it misses some everyday compounds ("sandcastle"), so a game that checks words against it should let players keep a word it doesn't know. Chainword's `packs/chainword/guesses.json` is the 4 to 7 letter part of this same list, plus a few words added by hand.

## `word-forms.json`

Irregular word forms (run / ran, mouse / mice), one group per word, that spelling rules can't spot. Check two words with `sameWordForm()` from `src/engine/wordForms.ts`; it also matches regular forms (towel / towels, bake / baking) by their endings, so those don't need listing. Lowercase letters only, each form listed once. Used by Don't Jinx It (close calls, near guesses) and Sketch Showdown (guess matching).
