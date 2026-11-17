// ABOUTME: Solo play: the pages at #/playtest (games still in testing) and #/playtest/<game-id>, for admins and playtesters.
// ABOUTME: A room's game page opens for any signed-in player, so everyone in a room can play. Unknown ids get a short message.
import { Suspense } from 'react'
import { LOBBY } from '../engine/net/rooms'
import { rememberedRoom } from '../engine/rememberedRoom'
import { isRoomPage } from '../games/room/roomPages'
import { MenuItems } from '../ui/FrameMenu'
import { GameExitContext } from '../ui/gameExit'
import { PhoneFrame } from '../ui/PhoneFrame'
import { PlayerBadge } from './PlayerBadge'
import { PLAYTESTS } from './playtests'
import { goTo, href } from './useHashRoute'
import { useMe } from './useMe'
import '../ui/PhoneForm.css'

function Loading() {
  return (
    <PhoneFrame label="Loading the game" cardTag="Solo play">
      <p className="cue-card__text" role="status">
        Loading the game...
      </p>
    </PhoneFrame>
  )
}

function PlaytestList() {
  return (
    <PhoneFrame label="Solo play" cardTag="Solo play">
      <PlayerBadge />
      <div className="phone-top">
        <h1 className="phone-top__title">Solo play</h1>
      </div>
      <p className="cue-card__text">Games still being tested, played on this phone against bots. Pick one.</p>
      {Object.entries(PLAYTESTS).map(([id, playtest]) => (
        <a key={id} className="phone-button" href={href('playtest', id)} data-testid={`playtest-${id}`}>
          {playtest.title}
        </a>
      ))}
      <MenuItems>
        <a href={href('home')} data-testid="menu-home">
          Home
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

function UnknownPlaytest() {
  return (
    <PhoneFrame label="No such game" cardTag="Solo play">
      <p className="cue-card__text">There's no solo play for that game.</p>
      <MenuItems>
        <a href={href('playtest')}>
          Solo play
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

/** Solo play is for signed-in players; anyone else is asked to sign in first. */
function SignInFirst() {
  return (
    <PhoneFrame label="Sign in for Solo play" cardTag="Solo play">
      <div className="phone-top">
        <h1 className="phone-top__title">Solo play</h1>
      </div>
      <p className="cue-card__text">Sign in to play the games still being tested.</p>
      <a className="phone-button" href={href('sign-in')} data-testid="solo-play-sign-in">
        Sign in
      </a>
      <MenuItems>
        <a href={href('home')} data-testid="menu-home">
          Home
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

/** Signed in, but an admin hasn't added this player to Solo play yet. */
function NotAPlaytester() {
  return (
    <PhoneFrame label="Solo play" cardTag="Solo play">
      <div className="phone-top">
        <h1 className="phone-top__title">Solo play</h1>
      </div>
      <p className="cue-card__text" data-testid="solo-play-not-yet">
        Solo play is for playtesters. Ask an admin to add you, then open this page again.
      </p>
      <MenuItems>
        <a href={href('home')} data-testid="menu-home">
          Home
        </a>
      </MenuItems>
    </PhoneFrame>
  )
}

export function PlaytestPage({ gameId }: { gameId: string }) {
  const me = useMe()
  const playtest = PLAYTESTS[gameId]

  if (me.kind === 'checking') return <Loading />
  if (me.kind === 'signed-out') return <SignInFirst />
  if (!me.canPlaytest && !isRoomPage(gameId)) return <NotAPlaytester />

  return (
    <>
      {gameId === '' ? (
        <PlaytestList />
      ) : playtest ? (
        <GameExitContext.Provider
          value={() => {
            playtest.onExit?.()
            // Inside tonight's lobby room, leaving a game goes back to the lobby; otherwise to the game picker.
            goTo(rememberedRoom(LOBBY) ? 'room' : 'picker')
          }}
        >
          <Suspense fallback={<Loading />}>
            <playtest.Page />
          </Suspense>
        </GameExitContext.Provider>
      ) : (
        <UnknownPlaytest />
      )}
    </>
  )
}
