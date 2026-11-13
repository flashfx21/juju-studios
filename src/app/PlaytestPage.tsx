// ABOUTME: Solo play: the pages at #/playtest (games still in testing) and #/playtest/<game-id>, for admins and playtesters.
// ABOUTME: Unknown game ids get a short message instead of a blank page.
import { Suspense } from 'react'
import { LOBBY } from '../engine/net/rooms'
import { rememberedRoom } from '../engine/rememberedRoom'
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
      <a className="phone-link phone-link--quiet" href={href('home')}>
        Back
      </a>
    </PhoneFrame>
  )
}

function UnknownPlaytest() {
  return (
    <PhoneFrame label="No such game" cardTag="Solo play">
      <p className="cue-card__text">There's no solo play for that game.</p>
      <a className="phone-link" href={href('playtest')}>
        See Solo play
      </a>
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
      <a className="phone-link phone-link--quiet" href={href('home')}>
        Back
      </a>
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
      <a className="phone-link phone-link--quiet" href={href('home')}>
        Back
      </a>
    </PhoneFrame>
  )
}

export function PlaytestPage({ gameId }: { gameId: string }) {
  const me = useMe()
  const playtest = PLAYTESTS[gameId]

  if (me.kind === 'checking') return <Loading />
  if (me.kind === 'signed-out') return <SignInFirst />
  if (!me.canPlaytest) return <NotAPlaytester />

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
