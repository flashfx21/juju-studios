// ABOUTME: How to play: the list of games at #/how-to-play, each game's page at #/how-to-play/<game-id>,
// ABOUTME: and a button that opens a game's page as a panel, so the lobby can show it without leaving the room.
import { useRef } from 'react'
import { MenuItems } from '../ui/FrameMenu'
import { PhoneFrame } from '../ui/PhoneFrame'
import '../ui/PhoneForm.css'
import { gameFacts, HOW_TO_PLAY_GAMES, howToPlayFor, type HowToPlayPage } from './howToPlayPages'
import { PlayerBadge } from './PlayerBadge'
import { goBack, href } from './useHashRoute'
import './HowToPlay.css'

const SECTIONS: { key: 'needs' | 'steps' | 'scoring' | 'goodToKnow' | 'hostPicks'; heading: string }[] = [
  { key: 'needs', heading: 'What you need' },
  { key: 'steps', heading: 'How to play' },
  { key: 'scoring', heading: 'Scoring' },
  { key: 'goodToKnow', heading: 'Good to know' },
  { key: 'hostPicks', heading: 'The host picks' },
]

/** The intro and every section of a game's page. Section headings sit one level under the page title. */
function HowToPlayWords({ page, gameId, Heading }: { page: HowToPlayPage; gameId: string; Heading: 'h2' | 'h3' }) {
  return (
    <>
      <p className="how-to-play__intro">{page.words.intro}</p>
      {SECTIONS.map(({ key, heading }) => {
        const lines = page.words[key]
        const List = key === 'steps' ? 'ol' : 'ul'
        return (
          <section key={key} className="cue-card how-to-play__card" aria-labelledby={`htp-${gameId}-${key}`}>
            <Heading className="cue-card__label" id={`htp-${gameId}-${key}`}>
              {heading}
            </Heading>
            <List className="how-to-play__list">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </List>
          </section>
        )
      })}
    </>
  )
}

function GameList() {
  return (
    <PhoneFrame label="How to play" cardTag="How to play">
      <PlayerBadge />
      <div className="phone-top">
        <h1 className="phone-top__title">How to play</h1>
      </div>
      <p className="cue-card__text">Pick a game to read how it works.</p>
      {HOW_TO_PLAY_GAMES.map((game) => (
        <a key={game.id} className="phone-button" href={href('how-to-play', game.id)} data-testid={`how-to-play-${game.id}`}>
          {game.title}
        </a>
      ))}
      <MenuItems>
        <a href={href('home')} data-testid="how-to-play-home">
          Home
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

function GamePage({ gameId, page }: { gameId: string; page: HowToPlayPage }) {
  return (
    <PhoneFrame label={`How to play ${page.manifest.title}`} cardTag="How to play">
      <PlayerBadge />
      <div className="how-to-play__top">
        <h1 className="phone-top__title" data-testid="how-to-play-title">
          {page.manifest.title}
        </h1>
        <p className="how-to-play__facts">{gameFacts(page)}</p>
      </div>
      <HowToPlayWords page={page} gameId={gameId} Heading="h2" />
      <MenuItems>
        <button type="button" data-testid="how-to-play-back" onClick={goBack}>
          Back
        </button>
        <a href={href('how-to-play')} data-testid="how-to-play-all">
          All games
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

function UnknownGame() {
  return (
    <PhoneFrame label="No such game" cardTag="How to play">
      <p className="cue-card__text">There's no How to play page for that game yet.</p>
      <MenuItems>
        <a href={href('how-to-play')} data-testid="how-to-play-all">
          All games
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

/** The page at #/how-to-play (gameId empty) or #/how-to-play/<gameId>. Open to everyone, signed in or not. */
export function HowToPlay({ gameId }: { gameId: string }) {
  if (gameId === '') return <GameList />
  const page = howToPlayFor(gameId)
  return page ? <GamePage gameId={gameId} page={page} /> : <UnknownGame />
}

/** A small "?" button that opens the game's How to play as a panel over the current screen. Nothing for games without a page. */
export function HowToPlayButton({ gameId }: { gameId: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const page = howToPlayFor(gameId)
  if (!page) return null
  const titleId = `htp-panel-${gameId}`

  return (
    <>
      <button
        type="button"
        className="how-to-play__open"
        aria-label={`How to play ${page.manifest.title}`}
        title="How to play"
        data-testid={`how-to-play-open-${gameId}`}
        onClick={() => dialog.current?.showModal()}
      >
        ?
      </button>
      <dialog ref={dialog} className="how-to-play__panel" aria-labelledby={titleId} data-testid={`how-to-play-panel-${gameId}`}>
        <div className="how-to-play__top">
          <h2 className="phone-top__title" id={titleId}>
            {page.manifest.title}
          </h2>
          <p className="how-to-play__facts">{gameFacts(page)}</p>
        </div>
        <HowToPlayWords page={page} gameId={`panel-${gameId}`} Heading="h3" />
        <button type="button" className="phone-button" data-testid="how-to-play-close" onClick={() => dialog.current?.close()}>
          Close
        </button>
      </dialog>
    </>
  )
}
