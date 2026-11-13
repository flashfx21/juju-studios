// ABOUTME: The player symbols (animals and objects) paired with a player color, drawn as simple one-color shapes.
// ABOUTME: SVG markup on a 24x24 grid: shapes fill with ink; "line" strokes in ink; "cut" and "cut-line" show the player color through.

export type PlayerSymbolId =
  | 'wolf'
  | 'fox'
  | 'bear'
  | 'owl'
  | 'cat'
  | 'dog'
  | 'pig'
  | 'rabbit'
  | 'frog'
  | 'turtle'
  | 'penguin'
  | 'bee'
  | 'star'
  | 'moon'
  | 'rocket'
  | 'crown'

export interface PlayerSymbol {
  name: string
  /** Inner SVG markup for a 0 0 24 24 view box. */
  markup: string
}

/** A five-point star centered at (cx, cy). */
function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`
  }).join(' ')
}

export const PLAYER_SYMBOLS: Record<PlayerSymbolId, PlayerSymbol> = {
  wolf: {
    name: 'Wolf',
    markup:
      // Front view with a jagged ruff of fur at the cheeks.
      '<path d="M4.6 1.6l4.2 4.6h6.4l4.2-4.6.2 8 2.4 2.8-2.8 1 1.4 2.6-3.8.4L12 22.6l-4.8-6.2-3.8-.4 1.4-2.6-2.8-1 2.4-2.8z"/>' +
      '<path class="cut" d="M6.4 4.6l2 2.6-1.8.8zM17.6 4.6l-2 2.6 1.8.8z"/>' +
      '<path class="cut" d="M7.4 10.2l3.4 1.6-3 .7zM16.6 10.2l-3.4 1.6 3 .7z"/>' +
      '<path class="cut" d="M12 12.2l-2 4.6 2 3 2-3z"/>' +
      '<circle cx="12" cy="18.4" r="1.3"/>',
  },
  fox: {
    name: 'Fox',
    markup:
      // Sitting, seen whole: a big pointed head forward, body turned, the full tail curled around the front.
      '<path d="M3.6 1l3 3.4H10L13 1l.2 5.8-1.6 2.6L8.3 12 5 9.4 3.4 6.8z"/>' +
      '<path d="M6 10.6c-1.4 2.8-1.8 6.2-1 9.2l.6 1.6h9c2 0 3-1.6 2.6-3.6-.6-3-3.4-6-6.8-7.4z"/>' +
      '<path d="M14.8 12.6c5.2-1.2 8.8 2 8.4 5.8-.4 3.6-4.4 5.2-10.6 4.8H5.2c-1 0-1.2-1.6 0-1.8h8.4c3.6 0 5.4-1.4 5.2-3.4-.2-1.6-1.8-2.8-4-2.8z"/>' +
      '<path class="cut" d="M5 3.2l1.4 2-1.3.6zM11.6 3.2l-1.4 2 1.3.6z"/>' +
      '<path class="cut" d="M4.9 6.8l2.5 1-2.1.7zM11.7 6.8l-2.5 1 2.1.7z"/>' +
      '<path class="cut" d="M6.8 11.6l1.5 1.6 1.5-1.6-1.5 4.4z"/>' +
      '<path class="cut-line" d="M5.4 21.4h8.2c3.6 0 5.4-1.4 5.2-3.4" stroke-width="0.9"/>',
  },
  bear: {
    name: 'Bear',
    markup:
      '<circle cx="5.6" cy="5.6" r="3.4"/><circle cx="18.4" cy="5.6" r="3.4"/><circle cx="12" cy="13" r="8.6"/>' +
      '<circle class="cut" cx="5.6" cy="5.6" r="1.4"/><circle class="cut" cx="18.4" cy="5.6" r="1.4"/>' +
      '<circle class="cut" cx="8.8" cy="11.4" r="1.2"/><circle class="cut" cx="15.2" cy="11.4" r="1.2"/>' +
      '<ellipse class="cut" cx="12" cy="16.4" rx="3.6" ry="2.8"/><ellipse cx="12" cy="15.4" rx="1.6" ry="1.1"/>',
  },
  owl: {
    name: 'Owl',
    markup:
      // Whole owl: head with ear tufts, round eyes, wings drawn as curved lines down each side.
      '<path d="M5.2 2.6l3.2 2.6c2.3-.8 4.9-.8 7.2 0l3.2-2.6-.2 6.2c0 1.6-.6 2.8-1.4 3.6 1.4 2 1.8 4.2 1.2 6.2-.8 2.4-3.4 4-6.4 4s-5.6-1.6-6.4-4c-.6-2-.2-4.2 1.2-6.2-.8-.8-1.4-2-1.4-3.6z"/>' +
      '<circle class="cut" cx="9.2" cy="8.8" r="2.4"/><circle class="cut" cx="14.8" cy="8.8" r="2.4"/>' +
      '<circle cx="9.2" cy="8.9" r="1.1"/><circle cx="14.8" cy="8.9" r="1.1"/>' +
      '<path class="cut" d="M12 10.6l-1 1.2 1 1.6 1-1.6z"/>' +
      '<path class="cut-line" d="M7.6 13.4c-.8 2.6-.2 5.4 2 7.4M16.4 13.4c.8 2.6.2 5.4-2 7.4" stroke-width="1.1"/>',
  },
  cat: {
    name: 'Cat',
    markup:
      '<path d="M3.5 2l5 5.2a9 9 0 0 1 7 0l5-5.2V14a8.5 8.5 0 0 1-17 0z"/>' +
      '<ellipse class="cut" cx="8.8" cy="12.6" rx="1.3" ry="2"/><ellipse class="cut" cx="15.2" cy="12.6" rx="1.3" ry="2"/>' +
      '<path class="cut" d="M10.8 15.6h2.4L12 17z"/>' +
      '<path class="cut-line" d="M1.5 15.4l5.5.6M1.8 18.6l5.3-1.2M22.5 15.4l-5.5.6M22.2 18.6l-5.3-1.2" stroke-width="0.9"/>',
  },
  dog: {
    name: 'Dog',
    markup:
      '<ellipse cx="12" cy="12.6" rx="6.6" ry="8"/>' +
      '<path d="M7.2 4.2C3.2 3.6 1.4 7.6 1.6 12.6c.1 2.6 1.4 3.8 2.9 3.6 1.9-.3 2.6-3 3-5.6z"/>' +
      '<path d="M16.8 4.2c4-.6 5.8 3.4 5.6 8.4-.1 2.6-1.4 3.8-2.9 3.6-1.9-.3-2.6-3-3-5.6z"/>' +
      '<circle class="cut" cx="9.6" cy="11" r="1.2"/><circle class="cut" cx="14.4" cy="11" r="1.2"/>' +
      '<ellipse class="cut" cx="12" cy="15.6" rx="2.2" ry="1.6"/>' +
      '<path class="cut-line" d="M12 17.2v2" stroke-width="1"/>',
  },
  pig: {
    name: 'Pig',
    markup:
      '<path d="M5.4 8.6L3.6 1.8l6.2 3zM18.6 8.6l1.8-6.8-6.2 3z"/><circle cx="12" cy="13.2" r="8.6"/>' +
      '<circle class="cut" cx="8.4" cy="10.4" r="1.1"/><circle class="cut" cx="15.6" cy="10.4" r="1.1"/>' +
      '<ellipse class="cut" cx="12" cy="15.4" rx="3.9" ry="2.9"/>' +
      '<ellipse cx="10.5" cy="15.4" rx=".9" ry="1.2"/><ellipse cx="13.5" cy="15.4" rx=".9" ry="1.2"/>',
  },
  rabbit: {
    name: 'Rabbit',
    markup:
      '<ellipse cx="8.6" cy="6" rx="2.4" ry="5.6"/><ellipse cx="15.4" cy="6" rx="2.4" ry="5.6"/>' +
      '<circle cx="12" cy="15.6" r="7"/>' +
      '<ellipse class="cut" cx="8.6" cy="6" rx="1" ry="3.8"/><ellipse class="cut" cx="15.4" cy="6" rx="1" ry="3.8"/>' +
      '<circle class="cut" cx="9.4" cy="14.6" r="1.1"/><circle class="cut" cx="14.6" cy="14.6" r="1.1"/>' +
      '<path class="cut" d="M10.9 17.2h2.2L12 18.5z"/>',
  },
  frog: {
    name: 'Frog',
    markup:
      '<circle cx="6.6" cy="7.4" r="4"/><circle cx="17.4" cy="7.4" r="4"/><ellipse cx="12" cy="14.6" rx="10.2" ry="6.8"/>' +
      '<circle class="cut" cx="6.6" cy="7.4" r="2.1"/><circle class="cut" cx="17.4" cy="7.4" r="2.1"/>' +
      '<circle cx="6.6" cy="7.6" r="1"/><circle cx="17.4" cy="7.6" r="1"/>' +
      '<path class="cut-line" d="M5.5 15.2q6.5 4.6 13 0" stroke-width="1.4"/>',
  },
  turtle: {
    name: 'Turtle',
    markup:
      '<circle cx="12" cy="3.4" r="2.7"/>' +
      '<ellipse cx="5" cy="7.6" rx="2.6" ry="2" transform="rotate(-35 5 7.6)"/>' +
      '<ellipse cx="19" cy="7.6" rx="2.6" ry="2" transform="rotate(35 19 7.6)"/>' +
      '<ellipse cx="5" cy="18" rx="2.6" ry="2" transform="rotate(35 5 18)"/>' +
      '<ellipse cx="19" cy="18" rx="2.6" ry="2" transform="rotate(-35 19 18)"/>' +
      '<path d="M12 20.5l-1.4 3h2.8z"/>' +
      '<ellipse cx="12" cy="12.8" rx="6.8" ry="7.6"/>' +
      '<path class="cut-line" d="M12 8.6l3.4 2.1v4.2L12 17l-3.4-2.1v-4.2z" stroke-width="1.2"/>',
  },
  penguin: {
    name: 'Penguin',
    markup:
      '<path d="M12 1.5c4.2 0 6.5 4 6.5 9.4v6.2c0 3.4-3 5.4-6.5 5.4s-6.5-2-6.5-5.4v-6.2c0-5.4 2.3-9.4 6.5-9.4z"/>' +
      '<path d="M5.8 10.5c-2.6 1.6-3.6 4.6-3.4 7.6 1.8-.6 3.1-2 3.6-3.6zM18.2 10.5c2.6 1.6 3.6 4.6 3.4 7.6-1.8-.6-3.1-2-3.6-3.6z"/>' +
      '<ellipse class="cut" cx="12" cy="15.2" rx="4" ry="6.4"/>' +
      '<circle class="cut" cx="10.2" cy="6" r="1"/><circle class="cut" cx="13.8" cy="6" r="1"/>' +
      '<path d="M12 8l-1.6 1.9h3.2z"/>' +
      '<ellipse cx="9.4" cy="22.6" rx="2.2" ry="1"/><ellipse cx="14.6" cy="22.6" rx="2.2" ry="1"/>',
  },
  bee: {
    name: 'Bee',
    markup:
      // Seen from above: head, striped body, a wing each side and two feelers.
      '<path class="line" d="M10.6 3.6L8.6.9M13.4 3.6l2-2.7" stroke-width="1.2"/>' +
      '<ellipse cx="5.6" cy="10.6" rx="4" ry="2.8" transform="rotate(-28 5.6 10.6)"/>' +
      '<ellipse cx="18.4" cy="10.6" rx="4" ry="2.8" transform="rotate(28 18.4 10.6)"/>' +
      '<ellipse class="cut" cx="5.6" cy="10.6" rx="2.6" ry="1.5" transform="rotate(-28 5.6 10.6)"/>' +
      '<ellipse class="cut" cx="18.4" cy="10.6" rx="2.6" ry="1.5" transform="rotate(28 18.4 10.6)"/>' +
      '<circle cx="12" cy="6" r="2.9"/>' +
      '<ellipse cx="12" cy="14.4" rx="4.6" ry="6.6"/>' +
      '<path d="M12 23.4l-1.3-2.4h2.6z"/>' +
      '<path class="cut-line" d="M7.6 12.6h8.8M7.6 16.2h8.8" stroke-width="1.6"/>',
  },
  star: {
    name: 'Star',
    markup: `<polygon points="${starPoints(12, 12.8, 11, 4.6)}"/>`,
  },
  moon: {
    name: 'Moon',
    markup: '<path d="M14.6 1.6A10.6 10.6 0 1 0 22.4 17 8.6 8.6 0 0 1 14.6 1.6z"/>',
  },
  rocket: {
    name: 'Rocket',
    markup:
      '<path d="M12 .8c3.8 3 5.4 7.2 5.4 11.4v5.2H6.6v-5.2C6.6 8 8.2 3.8 12 .8z"/>' +
      '<path d="M6.6 11.6l-3.4 5v3.6l3.4-2.4zM17.4 11.6l3.4 5v3.6l-3.4-2.4z"/>' +
      '<path d="M9.6 18.6h4.8L12 23.4z"/>' +
      '<circle class="cut" cx="12" cy="9.2" r="2.2"/>',
  },
  crown: {
    name: 'Crown',
    markup:
      '<path d="M2 6.4l5.2 5L12 3l4.8 8.4 5.2-5-2.2 12.2H4.2z"/><rect x="4.2" y="19.8" width="15.6" height="2.6"/>' +
      '<circle cx="2" cy="6" r="1.5"/><circle cx="12" cy="2.6" r="1.5"/><circle cx="22" cy="6" r="1.5"/>' +
      '<circle class="cut" cx="8" cy="15.6" r="1.2"/><circle class="cut" cx="12" cy="15.6" r="1.4"/><circle class="cut" cx="16" cy="15.6" r="1.2"/>',
  },
}

export const PLAYER_SYMBOL_IDS = Object.keys(PLAYER_SYMBOLS) as PlayerSymbolId[]

export function isPlayerSymbolId(value: unknown): value is PlayerSymbolId {
  return typeof value === 'string' && value in PLAYER_SYMBOLS
}

/** A symbol for a new profile, so setup needs no extra step; the player can pick another. */
export function randomPlayerSymbol(): PlayerSymbolId {
  return PLAYER_SYMBOL_IDS[Math.floor(Math.random() * PLAYER_SYMBOL_IDS.length)]
}

/** The symbol as an SVG string, for places that take HTML (map pins). Style it with PlayerSymbol.css. */
export function playerSymbolHtml(symbol: PlayerSymbolId): string {
  return `<svg class="player-symbol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${PLAYER_SYMBOLS[symbol].markup}</svg>`
}
