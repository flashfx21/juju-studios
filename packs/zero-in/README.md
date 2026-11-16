# Zero In packs

- `questions.json`: the question pack. Each question has one whole-number `answer` and these fields:
  - `id`: `zi-` and a number; never reuse one.
  - `lane`: `price` (a dated past price), `year`, or `number` (a count or measurement).
  - `topic`: one of the topics in `docs/games/03-zero-in.md`. `local: true` marks Philly & Local questions.
  - `prompt`: the question as players read it.
  - `unit` and `unitPosition`: what sits in the entry box, before the number (`$`) or after it (`cents`, `feet`, `keys`). Years have no unit.
  - `asOf`: the year a price or a changing count belongs to, when it matters.
  - `source`: where to check the answer. `fact` (optional) is a line shown under the answer.
- Writing rules: one unambiguous number; prices in dollars or cents, never both, rounded to the nearest dollar; no current prices; answers under 10 kept rare. Price questions with an answer of 10 or more can be the final round.
- **The 32 starter questions are unverified.** They were drafted from memory with the source to check each against. Check every answer before a real game night. Two to look at closely: the Model T price (sources give $825 and $850) and the Eagles question (the game was played in 2018 for the 2017 season; the prompt asks for the year it was played).
