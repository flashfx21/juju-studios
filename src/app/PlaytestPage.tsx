// ABOUTME: The pages at #/playtest (list of games in testing) and #/playtest/<game-id>, behind the playtest code.
// ABOUTME: Unknown game ids get a short message instead of a blank page.
import { Suspense } from 'react'
import { PhoneFrame } from '../ui/PhoneFrame'
import { PlaytestGate } from './PlaytestGate'
import { PLAYTESTS } from './playtests'
import { href } from './useHashRoute'
import '../ui/PhoneForm.css'

function Loading() {
  return (
    <PhoneFrame label="Loading playtest" cardTag="Playtest">
      <p className="cue-card__text" role="status">
        Loading the game...
      </p>
    </PhoneFrame>
  )
}

function PlaytestList() {
  return (
    <PhoneFrame label="Playtests" cardTag="Playtest">
      <div className="phone-top">
        <h1 className="phone-top__title">Playtests</h1>
      </div>
      <p className="cue-card__text">Games still being tested. Pick one to play.</p>
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
    <PhoneFrame label="No playtest" cardTag="Playtest">
      <p className="cue-card__text">There's no playtest for that game.</p>
      <a className="phone-link" href={href('playtest')}>
        See the playtests
      </a>
    </PhoneFrame>
  )
}

export function PlaytestPage({ gameId }: { gameId: string }) {
  const playtest = PLAYTESTS[gameId]

  return (
    <PlaytestGate>
      {gameId === '' ? (
        <PlaytestList />
      ) : playtest ? (
        <Suspense fallback={<Loading />}>
          <playtest.Page />
        </Suspense>
      ) : (
        <UnknownPlaytest />
      )}
    </PlaytestGate>
  )
}
