# Pin Drop (working title)

**Game ID:** `pin-drop`  
**Status:** Playable, phase 1 (rules final Nov 11, 2026)  
**Players:** 2 to 10 (placeholder)  
**Length:** about 12 min at 7 rounds (estimate; 5 rounds about 8, 9 rounds about 15)  
**Modes:** Individual. Scoring modes: Match play (default), Stroke play

## Pitch
A photo appears on the TV. Everyone drops a pin on a map on their phone. Closest wins.

## Decided
### Setup (pre-game settings)
- Scoring mode: Match play (default) or Stroke play
- Pace: 45 / 60 (default) / 90 seconds per round
- Rounds: 5 / 7 (default) / 9
- Units: miles (default) or kilometers
- Map labels: on (default) or off. Off hides names but keeps borders

### Round flow
1. Photo appears on the TV. Each phone shows a world map, zoomed out
2. Players tap to place a pin and drag to move it. Lock in is optional and final; the round ends early when everyone has locked in
3. Last 10 seconds count down on the TV
4. A placed pin counts when time runs out, locked or not. No pin = no score for the round
5. Reveal (plays by itself): photo shrinks to a corner; map zooms out to all pins and the answer; pins drop one by one, farthest to closest, each with initials, color, a line to the answer and the distance; drum roll during the drop; then a close-up of the answer and closest pin with place name, "Closest: [name], [distance]" and full credit
6. Phones show each player their own distance, place and points
7. Round standings: round points and running totals. Waits for the host to tap Next round
8. After the last round, go to the engine's game-over screen

### Scoring
- Distance: straight line between the answer and the pin, measured on the curve of the earth
- Display: whole miles/km at 10 and above, one decimal below 10
- Match play (default): placement points each round. With N players, closest gets N, farthest gets 1, no pin gets 0. Highest total wins. Ties broken by lower total distance
- Stroke play: lowest total distance wins. No pin counts as 12,450 mi (20,037 km), about half the earth's circumference. Ties broken by more round wins
- No speed bonus

### Difficulty
- Each photo tagged Easy, Medium or Hard
  - Easy: world-famous landmark; a good guess lands in the right city
  - Medium: recognizable region; a good guess lands in the right country
  - Hard: few clues; a good guess lands on the right continent
  - Never used: photos with no clue at all (a blank wall, a generic forest)
- Every game ramps easy to hard: 5 rounds E E M M H; 7 rounds E E M M M H H; 9 rounds E E E M M M H H H
- No difficulty setting at launch

### Photos
- Whole world open. One launch pack: Around the World, about 200 photos
- Source: Wikimedia Commons photos, found through Wikidata (the photo and the place's coordinates sit on the same entry)
- Answer = Wikidata's coordinates for the place, never the camera's location data
- Curation is automatic so Julian can play fairly:
  - Places only: landmarks, buildings, natural features, with a minimum fame level (number of Wikipedia articles about the place)
  - Skip anything bigger than a city (rivers, mountain ranges, deserts, regions)
  - Skip non-photos: drawings and diagrams, and file names with map, plan, flag, logo, interior, coat of arms
  - Landscape orientation, enough resolution for a TV
  - Licenses: CC0, public domain, CC BY, CC BY-SA only. No GFDL-only files. No cropping
  - Difficulty pre-tagged from fame level
- No repeats within a game. Across game nights, prefer the photos played least often (random if play counts aren't available yet)
- Flags: each player gets 1 flag per game, used on the reveal. One flag removes the photo from future games. Flagging never changes the score; the round still counts
- Playtesting is the cleanup pass for anything the filters miss

### Credits
- During the photo: small line "Photo: [author] · [license] · Wikimedia Commons"
- If the author's name contains the place or its country, the credit waits until the reveal
- Never show the file title or description
- Reveal: place name and full credit
- End of game: credits screen listing every photo played
- Site credits page: every photo in the pack with source and license links
- Both maps (phone and TV): "© OpenStreetMap contributors"

### Map
- OpenStreetMap-based (e.g. Leaflet), free with attribution
- Map look is decided from the first build (no separate Claude Design pass)
- Avoid Google Street View (needs billing)

## Open questions
- Map look: the standard OSM map may clash with the lobby styles; a themed map may need another provider (cost not checked). Judge in the first build
- Explore an optional AI check on each photo when the pack is built (outdoor place? has clues? text naming the place? person as the subject?). Verify pricing first
- Fame thresholds that map to Easy / Medium / Hard; tune at playtest
- Exact definition of "bigger than a city" for the filter
- Store resized photo copies or load from Wikimedia (build decision); check current Wikimedia rate limits and User-Agent rules
- Map tile provider before anything goes public (OpenStreetMap's own tile servers forbid heavy use)
- Drum roll: confirm the sound file's license (royalty-free or CC0)

## Idea bank
1. Labels setting per player, so kids and adults can compete
2. Callouts ("Bullseye!", "Wrong hemisphere")
3. Fun fact about each place on the reveal
4. Difficulty setting: Mixed, Easy only, Hard only
5. Re-tag difficulty automatically from real results
6. More packs: US Landmarks, National Parks, Islands and Beaches, Famous Streets, continent packs (replaces a continent filter), family trip packs (private; never in the public repo)
7. Mapillary Street Level pack (hard mode; verify current terms, public token, image link lifetime)
8. Pack picker with more than one pack per game

## Engine pieces it needs
- Map on phone (world view, pin, drag, zoom, lock), map with animated pins on TV, photo packs with credits, distance calculation
- Reuses: timer, pre-game settings, host Next control, sound on/off, play counts and flags (shared with No Filler card stats)
- Phase 1 placement means the map pieces are launch-critical

## Content pack
Photo pack built by script from Wikidata and Commons. Pack level: name, description, date built, filter settings used, photo list.

| Field | Example | Used for |
|---|---|---|
| Photo ID | `pd-0042` | Tracking, flags |
| Wikidata ID | `Q243` | Source of photo and coordinates |
| Image | Commons file, or a resized copy | Showing the photo |
| Commons file page | Link | Credits page |
| Answer latitude, longitude | 48.8584, 2.2945 | Scoring |
| Place name | Eiffel Tower, Paris | Reveal |
| Country | France | Spoiler check, later continent packs |
| Fame count | Number of Wikipedia articles about the place | Auto difficulty |
| Difficulty | Easy | The ramp |
| Author | As the license asks to be credited | Credit line |
| License | CC BY-SA 4.0, plus a license link | Credit line, credits page |
| Credit spoiler | Yes or no | Hold the credit until the reveal |
| Play count, last played | Updated by the game | Avoid repeats |
| Flag status | Active or removed | Updated by the game |

## Screens
**TV**
1. Instructions
2. Pre-game settings: mode, pace, rounds, units, labels (if set on the TV)
3. Photo round: photo, round x of 7, timer, lock-in chips, credit line
4. Final 10-second countdown state
5. Reveal, part 1: wide map, pins dropping farthest to closest, distance list down the side, photo in a corner
6. Reveal, part 2: answer close-up, place name, "Closest: [name]", full credit
7. Round standings: round points, running totals, "Waiting for host"
8. End-of-game photo credits
9. Photo failed to load: skip or retry

**Phone**
1. Instructions and waiting
2. Guessing map: world view, pin, drag, zoom, timer, Lock in
3. Locked in, waiting
4. Your result: distance, place, points, Flag photo button with flags left
5. Host-only Next round control on standings
6. Final screen (before the engine's game-over screen)

**Site:** photo credits page.

Both maps need room for the OpenStreetMap credit. Pause, disconnect and game-over screens come from the engine.

## Scoring
Reports a finishing order only (Match play: highest points first; Stroke play: lowest distance first; tiebreakers above). The engine applies the suite rules: 100 points per game; top 50% score on a countdown split; 2 teams 80/20; 3+ teams top 2 score (67/33); team points split evenly.

## Naming and IP
Photos need licenses or credits unless they're your own. Credits shown as above. Only CC0, public domain, CC BY and CC BY-SA photos. Avoid photos where a person is the subject. OSM attribution on every map. Drum roll sound needs a license check.
