// ABOUTME: The front door: host a game on this screen, or join one from a phone. TV and phone versions.
// ABOUTME: Shows the site address where the design has QR codes; real QR codes wait for a QR library.
import { PhoneFrame } from '../ui/PhoneFrame'
import { TvStage } from '../ui/TvStage'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import { useLobbyStyle } from '../ui/themes/useLobbyStyle'
import '../ui/TvChrome.css'
import { PlayerBadge } from './PlayerBadge'
import { siteAddress } from './siteAddress'
import { href } from './useHashRoute'
import { useMe } from './useMe'
import './HostOrJoin.css'

interface ChoiceCopy {
  kicker: string
  title: string
  body: string
  /** Host: the call to action. Join: the words before the address. */
  action: string
  /** Rec room round seal. */
  seal: string
}

interface TvCopy {
  host: ChoiceCopy
  join: ChoiceCopy
  footer: string
}

const TV_COPY: Record<LobbyStyleId, TvCopy> = {
  'game-show': {
    host: {
      kicker: 'Door number one',
      title: 'Host a game',
      body: 'Open a room on this screen. Everyone joins from their phones.',
      action: 'Host on this screen ▸',
      seal: '',
    },
    join: {
      kicker: 'Door number two',
      title: 'Join a game',
      body: 'Got a room code? Join from your phone.',
      action: 'On your phone, go to',
      seal: '',
    },
    footer: 'Pick a door',
  },
  arcade: {
    host: {
      kicker: '1P · Host',
      title: 'Host game',
      body: 'Open a room on this screen. Everyone joins from their phones.',
      action: 'Host on this screen ▸',
      seal: '',
    },
    join: {
      kicker: '2P · Join',
      title: 'Join game',
      body: 'Got a room code? Join from your phone.',
      action: 'ON YOUR PHONE, VISIT',
      seal: '',
    },
    footer: 'Select mode',
  },
  'rec-room': {
    host: {
      kicker: '',
      title: 'Host a game',
      body: 'Open a room on this TV. Everyone joins from their phones.',
      action: 'Host on this screen →',
      seal: 'On this TV',
    },
    join: {
      kicker: '',
      title: 'Join a game',
      body: 'Got a room code? Join from your phone.',
      action: 'On your phone, go to',
      seal: 'On your phone',
    },
    footer: 'Pick a box',
  },
}

export function HostOrJoinTv() {
  const style = useLobbyStyle()
  const copy = TV_COPY[style]

  return (
    <TvStage label="Host or join">
      <div className="tv-screen entry-tv">
        <div className={style === 'game-show' ? 'bulb-frame entry-tv__sign' : 'entry-tv__sign'}>
          <h1 className="entry-tv__logo">
            <span className="entry-tv__lid-kicker" aria-hidden="true">
              The game night collection
            </span>
            <span className="entry-tv__logo-words">
              <span className="entry-tv__word-1">JuJu</span>{' '}
              <span className="entry-tv__word-2">
                Stu<span className="entry-tv__flicker">d</span>ios
              </span>
            </span>
            <span className="entry-tv__lid-stripe" aria-hidden="true" />
          </h1>
        </div>

        <div className="entry-tv__choices">
          <a className="entry-choice entry-choice--host" href={href('host')} data-testid="host-on-this-screen">
            <ChoiceContent copy={copy.host} number="1" />
            <span className="entry-choice__cta">{copy.host.action}</span>
          </a>
          <div className="entry-choice entry-choice--join">
            <ChoiceContent copy={copy.join} number="2" />
            <span className="entry-choice__address">
              {copy.join.action}
              <span className="entry-choice__url" data-testid="join-address">
                {siteAddress()}
              </span>
            </span>
          </div>
        </div>

        <div className="tv-floor entry-tv__floor">
          <span className="tv-floor__message">
            {copy.footer}
            <span className="entry-tv__cursor" aria-hidden="true">
              _
            </span>
          </span>
        </div>
      </div>
    </TvStage>
  )
}

function ChoiceContent({ copy, number }: { copy: ChoiceCopy; number: string }) {
  return (
    <>
      <span className="entry-choice__stripe" aria-hidden="true" />
      <span className="entry-choice__content">
        {copy.kicker && (
          <span className="entry-choice__kicker">
            <span className="entry-choice__bulb" aria-hidden="true">
              {number}
            </span>
            {copy.kicker}
          </span>
        )}
        <span className="entry-choice__title">{copy.title}</span>
        <span className="entry-choice__body">{copy.body}</span>
      </span>
      {copy.seal && (
        <span className="entry-choice__seal" aria-hidden="true">
          {copy.seal}
        </span>
      )}
    </>
  )
}

interface PhoneCopy {
  heading: string
  tagline: string
  join: Omit<ChoiceCopy, 'seal'>
  host: Omit<ChoiceCopy, 'seal'>
  /** Host call to action once this phone is signed in. */
  hostSignedIn: string
  signIn: string
}

const PHONE_COPY: Record<LobbyStyleId, PhoneCopy> = {
  'game-show': {
    heading: 'JuJu Studios',
    tagline: 'Party games on the big screen',
    join: {
      kicker: 'Players',
      title: 'Join a game',
      body: 'Got a room code from the TV? Jump in.',
      action: 'Enter a room code ▸',
    },
    host: {
      kicker: 'Hosts',
      title: 'Host a game',
      body: 'Run the show from this phone and put the board up on a TV.',
      action: 'Sign in to host ▸',
    },
    hostSignedIn: 'Start hosting ▸',
    signIn: 'Already have an account? Sign in',
  },
  arcade: {
    heading: 'JuJu Studios',
    tagline: 'Select mode',
    join: {
      kicker: 'Players',
      title: 'Join game',
      body: 'Got a room code from the TV? Jump in.',
      action: 'Enter room code ▸',
    },
    host: {
      kicker: 'Hosts',
      title: 'Host game',
      body: 'Run the show from this phone and put the board up on a TV.',
      action: 'Sign in to host ▸',
    },
    hostSignedIn: 'Start hosting ▸',
    signIn: 'Have an account? Sign in',
  },
  'rec-room': {
    heading: "What's the plan?",
    tagline: '',
    join: {
      kicker: 'Players',
      title: 'Join a game',
      body: 'Got a room code from the TV? Jump in.',
      action: 'Enter a room code →',
    },
    host: {
      kicker: 'Hosts',
      title: 'Host a game',
      body: 'Run the show from this phone and put the board up on a TV.',
      action: 'Sign in to host →',
    },
    hostSignedIn: 'Start hosting →',
    signIn: 'Already have an account? Sign in',
  },
}

export function HostOrJoinPhone() {
  const style = useLobbyStyle()
  const copy = PHONE_COPY[style]
  const me = useMe()
  const signedIn = me.kind === 'signed-in'
  const canPlaytest = me.kind === 'signed-in' && me.canPlaytest

  return (
    <PhoneFrame label="Host or join" cardTag="Game night">
      <PlayerBadge />
      <div className="entry-phone__header">
        <h1 className="entry-phone__heading">
          {style === 'arcade' ? (
            <>
              JuJu<span className="visually-hidden"> Studios</span>
            </>
          ) : (
            copy.heading
          )}
        </h1>
        {copy.tagline && <p className="entry-phone__tagline">{copy.tagline}</p>}
      </div>
      <PhoneChoice kind="join" copy={copy.join} to={href('join')} />
      {signedIn ? (
        <>
          <PhoneChoice kind="host" copy={{ ...copy.host, action: copy.hostSignedIn }} to={href('lobby')} />
          {canPlaytest && (
            <a className="entry-phone__link" href={href('playtest')} data-testid="solo-play-link">
              Solo play
            </a>
          )}
        </>
      ) : (
        <>
          <PhoneChoice kind="host" copy={copy.host} to={href('sign-in')} />
          <a className="entry-phone__link" href={href('sign-in')} data-testid="sign-in-link">
            {copy.signIn}
          </a>
        </>
      )}
    </PhoneFrame>
  )
}

function PhoneChoice({ kind, copy, to }: { kind: 'join' | 'host'; copy: PhoneCopy['join']; to: string }) {
  return (
    <a className={`entry-phone__choice entry-phone__choice--${kind}`} href={to} data-testid={`phone-${kind}`}>
      <span className="entry-phone__stripe" aria-hidden="true" />
      <span className="entry-phone__content">
        <span className="entry-phone__kicker">{copy.kicker}</span>
        <span className="entry-phone__title">{copy.title}</span>
        <span className="entry-phone__body">{copy.body}</span>
        <span className="entry-phone__cta">{copy.action}</span>
      </span>
    </a>
  )
}
