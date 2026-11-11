# Assets

The designs use no image files: no photos, illustrations, icon files or game art. Everything visual is web fonts, CSS, or unicode text glyphs.

## Fonts (all from Google Fonts)

All fonts are loaded from Google Fonts as web fonts, in one request:

```
https://fonts.googleapis.com/css2?family=Shrikhand&family=Bebas+Neue&family=Oswald:wght@300;400;500;600&family=Monoton&family=Bungee&family=Press+Start+2P&family=VT323&family=Anton&family=Righteous&family=Caveat:wght@500;700&family=Courier+Prime:wght@400;700&display=swap
```

| Font | Weights used | Style | Use |
|---|---|---|---|
| Shrikhand | 400 | game-show | Logo, titles, game titles, primary buttons |
| Bebas Neue | 400 | game-show | Labels, numbers, tote tiles, secondary buttons |
| Oswald | 400, 500 (300 and 600 are loaded but not used) | game-show | Body copy |
| Monoton | 400 | arcade | Neon logo |
| Press Start 2P | 400 | arcade | Labels, buttons, titles, scores |
| Bungee | 400 | arcade | Marquees, neon headlines |
| VT323 | 400 | arcade | Body copy |
| Anton | 400 | arcade, rec-room | No Filler marquee and box title only |
| Righteous | 400 | rec-room | Logo, titles, box titles, buttons |
| Caveat | 500, 700 | rec-room | Handwriting: headings, names, notes |
| Courier Prime | 400, 700 | rec-room | Labels, fine print |

Only load the fonts for the active style if bundle size matters. Each style's set is listed under `font` in its token file.

## Textures (all CSS, no files)

| Texture | Style | How it's made |
|---|---|---|
| Spotlight glow | game-show | Radial gradient behind each screen (`texture.background`) |
| Marquee bulb frame | game-show | Four radial gradients on a 44px tile over `#2A1D08`, animated with `@keyframes chase` |
| Footer stripes | game-show | `repeating-linear-gradient(90deg, …)` on the lobby footer |
| Coming-soon stripes / red curtain | game-show | Repeating linear gradients (`texture.comingSoon`, `texture.comingSoonTeaser`) |
| Podium shape | game-show | `clip-path: polygon(7% 0, 93% 0, 100% 100%, 0 100%)` |
| Buzzer dome | game-show | Radial gradient `#FF9466 → #F0592A → #B83A14` |
| Neon glow | arcade | Layered `text-shadow`, flicker via `@keyframes flicker` |
| Arcade carpet | arcade | Radial-gradient dots and rings on `#120E26`, 132×84 tile (`texture.footer`) |
| Scanlines + vignette | arcade | Repeating linear gradient + radial gradient overlay; host toggle (`texture.overlay`) |
| Wood paneling | rec-room | Repeating linear gradients on `#5A3A22` (`texture.background`) |
| Shag rug | rec-room | Repeating linear gradient at 100° on `#C8551F` (`texture.footer`) |
| Felt table | rec-room | Radial gradient `#8A9C45 → #6A7A30`, 12px walnut ring via box-shadow (`texture.feature`) |
| Ruled notepad | rec-room | Linear gradients for the margin line and ruled lines (`texture.paper`) |
| Shrink-wrap sheen | rec-room | Translucent white linear gradient at 115° over coming-soon boxes |
| Tri-stripe | rec-room | Hard-stop linear gradient `#D9A21B / #C8551F / #7A8B3A` |

The keyframes (`chase`, `flicker`, `blink`) are in `tokens/themes.css`.

## Generated visuals

| Item | Status |
|---|---|
| QR codes | **Placeholder.** A seeded 25×25 grid of CSS cells with finder squares, not a scannable code. The app needs a real QR generator for the join URL (`juju.games`) and the host sign-in URL (`juju.games/host`); both URLs come from the design copy. |
| Game screens | **Placeholder.** Dashed or felt panels reading "Game screen placeholder" / "game screen goes here". |

## Text glyphs (unicode, no icon set)

These are typed characters, not icons: `▸` (button arrows), `▼` (leading / host pick in arcade), `✓` (verified, selected color), `→` (rec-room links), `…` and `_` (waiting and cursor), `•` (password mask in game-show and rec-room; arcade uses `*`), `|` (rec-room vote tally marks).

## Not in the design

- No logo file: "JuJu Studios" is set in each style's logo font.
- No game art: each game is identified by its color, title and tag (`palette.games`).
- No audio, although Host settings has a "Sound on the TV" toggle.
- No favicon or app icons.
