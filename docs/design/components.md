# Components

Sizes are in CSS px at the design canvas sizes (TV 1280×720, phone 390×844). Token names refer to keys in `tokens/<style>.json` (CSS variables in `tokens/themes.css`, e.g. `color.primary` → `--color-primary`). Where a value isn't tokenized, it's written out.

Player colors are referred to as `palette.players.<color>`. Ink on a player color is picked for contrast: white `#FFFFFF` or near-black `#15120C`.

---

## Player chip
Initials in the player's color.

| | game-show | arcade | rec-room |
|---|---|---|---|
| Shape | Circle, 34–36 (leaderboard, game over), 96 on profile | No circle: 3-letter initials as text | Circle, 30–34; 88 on profile, tilted −6° |
| Text | 2 initials, `font.label` 18–19 (50 on profile) | 3 initials, `font.label` 12–20 (54 on profile, with glow) | 2 initials, `font.label` 700, 13–14 |
| Ring | `0 0 0 2px` `color.background` | none | none |
| Tokens | `palette.players.*`, `color.background` | `palette.players.*` | `palette.players.*` |

**States:** default. Selected in the color picker: a check mark plus a double ring.

## Signal bars
Connection strength for each player in the lobby.

- 3 bars, each 5 wide, heights 40% / 70% / 100%, gap 3. Container height: game-show 16, arcade 20, rec-room 18.
- **States:** level 1, 2 or 3. Accessible label "Signal N of 3".

| | On | Off |
|---|---|---|
| game-show | Ink chosen for contrast with the podium color | `rgba(255,255,255,.3)` or `rgba(0,0,0,.25)` |
| arcade | Level 1 `color.danger`, 2 `#FFE600`, 3 `color.success` | `color.line` |
| rec-room | `color.textOnSurface` | `#C9D3E3` |

Arcade pairs the bars with a status word: READY in `color.success`, or LAG in `color.danger` at level 1.

## Game tile: playable (games 1–6)
**Content:** number, tag, title, pitch, "players · length" (sample values), vote tally.

**States**
- default
- has votes
- **leading** (most votes)
- **host's pick** (leader-pick mode; the other tiles dim)
- **new** (badge)
- **my vote** (phone)

| | game-show "prize door" | arcade "cabinet" | rec-room "game box" |
|---|---|---|---|
| Size (TV) | 3×2 grid inside a 1200×420 panel; tiles about 384×191, gap 12 | 6 across, gap 19; marquee 64 + screen 150 + coin door 76 | 3 per shelf, height 186, gap 28 |
| Fill | `palette.games[n]` + `palette.gameInk[n]`, `shadow.tile` | Body `palette.games[n]`, own marquee and screen colors | `palette.games[n]` + `palette.gameInk[n]`, stripe band, round tag seal 62 |
| Title | `font.display` 34 (30 Sketch Showdown, 22 Closest Without Going Over) | Marquee `font.display` 14–30 (Anton for No Filler) | `font.display` 24–42 (Anton for No Filler) |
| Leading | "In the lead" badge, cream on `color.danger` ink | "▼ LEADING ▼" above, cabinet glows | "in the lead!" handwritten above; box lifts (`motion.liftSelected`) |
| Host's pick | Rotated "Host's pick" stamp; others at 45% opacity | "▼ HOST PICK ▼"; others at 40% | "host's pick"; box lifts; others at 50% |
| New | Rotated "New" tag | Yellow "NEW!" sticker with pink drop | Gold "NEW!" sticker |
| Phone row | 58 tall, number bulb 30, "My vote" tag | 62 tall, black screen + coin slot / "COIN IN" | 62 tall, 12-wide stripe, "my vote" note, row shifts 10 right |

**Long titles:** shrink the type rather than truncating.

## Game tile: coming soon (games 7–12)
**Content:** title and tag only. No players, length or votes. It can't be voted for or picked.

**States**
- default
- **teaser** (game 7: wider and more prominent)
- **not ready yet** (shown for `motion.notReadyNote` = 1.6s after a tap)

| | game-show | arcade | rec-room |
|---|---|---|---|
| Layout | Row of 6, 82 tall, columns 2fr + 5×1fr, gap 12 | Row of 6 cabinets, 150 tall, same columns, gap 19 | Top shelf, 62 tall (teaser 76), same columns, gap 18 |
| Fill | `texture.comingSoon` stripes; teaser `texture.comingSoonTeaser` red curtain | `palette.comingSoon` body, "COMING SOON" marquee, "OUT OF ORDER" | `palette.comingSoon[n]` + shrink-wrap sheen + "COMING SOON" sticker |
| Title size | 18 (teaser 24) | 13 (teaser 20) | 15 (teaser 22) |
| Not ready note | Orange overlay "Not ready yet" | Black overlay, pink ring, "NOT READY YET" | Cream overlay, "not ready yet" handwritten |
| Phone | Chips below a "Coming soon · can't vote yet" divider | Grey chips, "COMING SOON · NO COINS YET" | Shrink-wrapped chips, "top shelf · coming soon" |

## Vote tally
| | game-show | arcade | rec-room |
|---|---|---|---|
| Look | "Votes" label + 48×48 `color.background` box, count in `font.label` 44, `color.accent` | "COINS 03" `font.label` 11 `color.textStrong`; at zero, a blinking "INSERT COIN" (`motion.blink`) | Sticky note `#FFFAEE` rotated 4°: tally marks (`font.body` 28) + "N votes" (20) |
| Hidden when | Leader-pick mode | Leader-pick mode | Leader-pick mode |

The footer adds a total: "N of 7 votes in" / "N/7 COINS IN" / "N voted".

## Timer
A countdown on the picker and vote screens. The canvas shows 0:30 counting down (sample length). "Paused for" and "Reconnecting for" timers count up.

| | TV | Phone |
|---|---|---|
| game-show | "Voting closes" label + tote tile, `font.label` 60 on `color.secondary` | Tote tile, `font.label` 30 |
| arcade | "TIME" `font.label` 12 in pink + seconds `font.label` 36 | Seconds `font.label` 16 |
| rec-room | Note card: "Voting closes in 0:30" `font.body` 30, plus a votes line | `font.body` 28 in `color.accent` |

## Leaderboard row
**Columns:** rank, player chip or initials, name, total, games, average.

**States**
- ranked
- unranked (fewer than 3 games, average sort only, listed under its own label)
- me (phone "You" tag; arcade pink fill; rec-room name in `color.primary`)
- champion (rec-room 1st)

| | game-show | arcade | rec-room |
|---|---|---|---|
| Height | TV 50, phone 58 min | TV 44 | TV 56 ruled line |
| Rank | Bulb 38 | Ordinal ("1ST") `font.label` 16, colors cycle pink / cyan / yellow | Number in `#6B5F4F` |
| Row fill | 1st gold, 2nd cream, 3rd orange, then `color.surfaceRaised`; `shadow.tile` | none | none |
| Total | Four 30×40 tote digits | 5-digit padded `font.label` 20 | `font.body` 38 bold |
| Extra | — | — | Gold "CHAMP" seal (64) beside 1st |

Game over reuses this row: place, chip or initials, name, points earned this game (`+40`), new total.

## Filter chips (leaderboard)
**Options:** All games, the 6 playable games, Sort (Total / Average). Coming-soon games are never listed.
**States:** default, selected (`aria-pressed`).

| | Size | Selected | Default |
|---|---|---|---|
| game-show | 40 high, `font.label` 17 | `color.accent` / `color.accentInk` | `color.surfaceRaised` / `color.text` |
| arcade | 36 high, `font.body` 22, inset 2px `color.accent` ring | `color.primary` / `color.primaryInk` | `color.background` / `color.accent` |
| rec-room | 250×40 vertical list, `font.body` 24 | `color.surface` / `color.textOnSurface`, rotated −1.5°, shifted 8 right, shadow | `rgba(0,0,0,.32)` / `color.text` |

Host settings toggles (Game choice, Sound, Scanlines) use the same selected / default colors at 48 high, min-width 130.

## Buttons
| Role | game-show | arcade | rec-room |
|---|---|---|---|
| Primary | `color.primary` / `color.primaryInk`, `font.display` 24–30, height 62–64, `shadow.button` | `color.primary` / `color.primaryInk`, `font.label` 13–20, height 54–64, `shadow.button` | Phone: `color.primary`, `font.display` 23–26, height 58–60, radius 12, `shadow.button`. TV: slab button, see Secondary |
| Secondary | `color.secondary` / `color.secondaryInk`, `font.label` 24–26, height 54–56, `shadow.buttonSecondary` | `color.secondary` fill, `color.secondaryInk` text, inset 2px ring | TV: `color.secondary` slab, `font.display` 21–26, `shadow.buttonSecondary`. Phone: `color.accent`, radius 12 |
| Tertiary / destructive | Outline: inset 2px `color.text` | Pink outline: inset 2px `#FF2EA6` | Dark slab `color.frame` / `color.text` |
| Link | `font.label` 20 underlined | `font.label` 10 underlined, `color.accent` | `font.body` 700 26 underlined, `color.textOnSurface` |
| Disabled | 45% opacity, `aria-disabled` | 40% | 50% |

Minimum hit target on the phone: 44 (`space.hitTargetMin`).

## Room code
| | game-show | arcade | rec-room |
|---|---|---|---|
| Look | Four cream tote tiles, 84×96, `font.label` 92 | One yellow block, `font.label` 80, `shadow.frame` | Four tilted index cards, 88×120, `font.display` 64 on the felt table |
| Phone input | 4 boxes 52 high, 2px ring | 4 boxes 50 high, ring `color.primary` | 4 cards 54 high, tilted |
| Error | Ring `color.danger` 3px, text `color.danger` | Ring and text `color.danger` | Ring 3px `color.primary` |

## Stamp / sticker / badge
Status labels on screens ("New", "Host's pick", "Expired", "Locked", "No such room", "Just you", "On hold", "In use", "✓ Verified").
- game-show: rotated −7° to 4°, `font.display` 24 or `font.label`, hard `color.background` drop.
- arcade: flat block, `font.label` 9–14.
- rec-room: rotated −6° to −8° sticker, `font.display` 18.

## Cue card / form card (phone)
- game-show: `color.secondary` card rotated −1°, `shadow.card`, `font.label` header over a 2px `color.line` rule; 48-high fields in `color.field` with a 2px `color.fieldBorder` ring.
- arcade: no card. Fields sit on `color.surface` with a `color.fieldBorder` ring; message boxes get a colored inset ring (`color.success` for link sent, `color.danger` for expired or errors).
- rec-room: the phone card itself; fields are a 2px underline.

## Footer bar (TV)
- game-show: `color.footer`, 5px `color.frame` top rule, 64–106 high.
- arcade: carpet texture, 72–104 high, black message box with a blinking cursor.
- rec-room: shag rug, 96 high, with handwritten captions and buttons sitting over it.

---

## Signature components

### game-show: tote board
The game picker's prize-door grid, plus the tote-board tiles used for every readout: room code, timers, ranks, scores and leaderboard digits.
- Board: `color.surface` panel 1200×420, `shadow.frame` (4px gold, then 10px navy), 3×2 doors with gap 12.
- Tile: `color.secondary` fill, `color.secondaryInk` text, `font.label`, inset `0 -6px 0 rgba(0,0,0,.18)`. Sizes: 84×96 (room code), 60 type (timer), 30×40 (leaderboard digit).
- Related: the **marquee bulb frame** (`texture.feature`, `motion.chase` 0.8s), used for the logo, paused, host-disconnected and phone-pause headers. Also the **contestant podium** (cream name plate 40 high, trapezoid body 92 high in the player color, seat bulb 44) and the **buzzer** (116 circle, gold ring, orange dome).

### arcade: cabinet
- Marquee 64 high, radius 8 on top. Title in `font.display` (Anton for No Filler), with its own marquee color and glow.
- Screen: black, radius 10, inset 4px `#222` bezel, 150 high, holding the pitch, players · length and tag.
- Coin door: `color.surfaceRaised`, 76 high, two coin slots with red lights (`#FF3B3B`), then "COINS NN" or a blinking "INSERT COIN".
- **States:** lit (has votes or host's pick: `shadow.tile` glow), unlit (60% opacity), dimmed (40% in leader pick), out of order (coming soon).
- Related: **neon sign** logo (`font.logo`, `motion.flicker` on one letter), **hi-score table**, **scanlines** overlay (`texture.overlay`).

### rec-room: game box shelf
- Shelf: `color.frame` bar 16–20 high, inset `0 4px 0 #7A5233`, drop `0 8px 0 rgba(0,0,0,.25)`.
- Two shelves of 3 playable boxes; the coming-soon boxes sit on a top shelf.
- Box: `palette.games[n]`, radius 3, 12-high stripe band, title, pitch, round tag seal (62, rotated −10°), and a "PLAYERS · LENGTH" strip at the bottom.
- **States:** standing, lifted (leading or host's pick: `motion.liftSelected`, bigger shadow), dimmed (50%), shrink-wrapped (coming soon).
- Related: the **notepad** (`texture.paper`), the **felt table** (`texture.feature`), the **phone card** (walnut header + tri-stripe `palette.triStripe`), and **round seals** for rank and pause.
