# Pin Drop packs

- `around-the-world.json`: the starter set for the solo playtest, 23 world landmarks (7 easy, 8 medium, 8 hard). Each photo comes from Wikimedia Commons through the place's Wikidata entry; the answer is Wikidata's coordinates for the place. Difficulty comes from fame (the number of Wikipedia articles about the place); the thresholds are in the pack's `filters` and get tuned at playtest. The full pack (about 200 photos) will be built by script, as `docs/games/06-pin-drop.md` describes.

Every photo is landscape and licensed CC0, public domain, CC BY or CC BY-SA. Credit each one as "Photo: [author] · [license] · Wikimedia Commons". `creditSpoiler` is true when the author's name contains the place, its city or its country; that credit waits until the reveal.

Play counts and flags are saved game data, not part of the pack file.
