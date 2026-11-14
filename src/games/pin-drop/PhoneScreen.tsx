// ABOUTME: Pin Drop on a player's phone: the guessing map with Lock in, your result with the Flag photo button,
// ABOUTME: the host's Standings and Next round controls, and the final standings.
import { useMemo, useState, type ReactNode } from 'react'
import type { PlayerSymbolId } from '../../ui/playerSymbols'
import type { PlayerId } from '../types'
import { distanceText } from './format'
import { PinMap, type MapPlayer } from './PinMap'
import { currentRound, rules, totals, type Pin, type PinDropState } from './rules'
import '../../ui/PhoneForm.css'
import './PhoneScreen.css'

export interface PlayerLook {
  name: string
  initials: string
  color: string
  /** Shown on map pins in place of the initials. */
  symbol?: PlayerSymbolId
}

interface PhoneScreenProps {
  state: PinDropState
  player: PlayerId
  /** Name, initials and pin color by player id. */
  looks: Record<PlayerId, PlayerLook>
  /** The host's phone gets Standings on the reveal and Next round on the standings. */
  isHost: boolean
  /** Seconds left to guess, shown beside how many have locked in. Null or missing when nothing is timed. */
  secondsLeft?: number | null
  onPin: (pin: Pin) => void
  /** Locks in this pin: the one on this phone's map, which the host may not have yet. */
  onLock: (pin: Pin) => void
  onFlag: () => void
  onNext: () => void
  /** Shown above the map, such as the playtest's stand-in for the TV photo. */
  above?: ReactNode
  /** Shown under the final standings, such as the playtest's Play again button. */
  summaryAction?: ReactNode
}

function pointsText(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

export function PinDropTitle() {
  return (
    <div className="phone-top">
      <span className="phone-top__logo" aria-hidden="true">
        Pin Drop
      </span>
      <h1 className="phone-top__title">Pin Drop</h1>
    </div>
  )
}

function useMapPlayers(state: PinDropState, looks: Record<PlayerId, PlayerLook>): MapPlayer[] {
  return useMemo(
    () => state.players.map((id) => ({ id, initials: looks[id].initials, color: looks[id].color, symbol: looks[id].symbol })),
    [state.players, looks],
  )
}

/** The round clock and how many have locked in, in one line above the photo. */
function GuessingInfo({ state, secondsLeft }: Pick<PhoneScreenProps, 'state' | 'secondsLeft'>) {
  const lockedCount = currentRound(state).locked.length
  return (
    <p className="pd-info" data-testid="pd-info">
      {secondsLeft !== undefined && secondsLeft !== null && (
        <span role="timer" aria-live={secondsLeft <= 10 ? 'polite' : 'off'} data-testid="pd-clock">
          {secondsLeft} s left
        </span>
      )}
      <span role="status" data-testid="pd-locked-count">
        {lockedCount} of {state.players.length} locked in
      </span>
    </p>
  )
}

function Guessing({ state, player, looks, onPin, onLock }: PhoneScreenProps) {
  const round = currentRound(state)
  const mapPlayers = useMapPlayers(state, looks)
  // The pin on this phone's map shows and can be locked at once, before the host's copy comes back.
  const [draft, setDraft] = useState<{ round: number; pin: Pin } | null>(null)
  const myPin = draft?.round === state.roundIndex ? draft.pin : round.pins[player]
  const locked = round.locked.includes(player)
  const myPins = useMemo(() => (myPin ? { [player]: myPin } : {}), [myPin, player])

  function place(pin: Pin) {
    setDraft({ round: state.roundIndex, pin })
    onPin(pin)
  }

  let status: string
  if (locked) status = 'Locked in. Waiting for the others.'
  else if (myPin) status = 'Drag your pin or tap to move it.'
  else status = 'Tap the map to drop your pin.'

  return (
    <>
      <PinMap
        key={state.roundIndex}
        label="World map"
        pins={myPins}
        players={mapPlayers}
        me={locked ? undefined : player}
        onPin={locked ? undefined : place}
      />
      <div className="pd-actions">
        <p className="pd-status" role="status" data-testid="pd-status">
          {status}
        </p>
        {!locked && (
          <button
            type="button"
            className="phone-button pd-actions__button"
            aria-disabled={myPin ? undefined : 'true'}
            data-testid="pd-lock-in"
            onClick={() => myPin && onLock(myPin)}
          >
            Lock in
          </button>
        )}
      </div>
    </>
  )
}

function FlagButton({ state, player, onFlag }: Pick<PhoneScreenProps, 'state' | 'player' | 'onFlag'>) {
  const round = currentRound(state)
  const flagged = state.flags[player]
  if (flagged === round.photo.id) {
    return (
      <p className="pd-flag-note" role="status" data-testid="pd-flagged">
        Photo flagged. It won't come up in future games.
      </p>
    )
  }
  if (flagged) {
    return (
      <p className="pd-flag-note" data-testid="pd-flag-used">
        You've used your flag this game.
      </p>
    )
  }
  return (
    <button type="button" className="phone-button phone-button--secondary" data-testid="pd-flag" onClick={onFlag}>
      Flag photo (1 left)
    </button>
  )
}

/** The host moves the game on; everyone else waits for them. */
function HostNext({ isHost, onNext, label }: { isHost: boolean; onNext: () => void; label: string }) {
  return isHost ? (
    <button type="button" className="phone-button" data-testid="pd-next" onClick={onNext}>
      {label}
    </button>
  ) : (
    <p className="pd-status" role="status">
      Waiting for the host
    </p>
  )
}

function Reveal(props: PhoneScreenProps) {
  const { state, player, looks, isHost, onNext } = props
  const round = currentRound(state)
  const mapPlayers = useMapPlayers(state, looks)
  const result = round.results?.[player]
  const units = state.settings.units

  let headline: string
  if (!result || result.km === null) headline = 'No pin this round: 0 points'
  else if (state.settings.scoring === 'match') {
    headline = `${distanceText(result.km, units)} away. Place ${result.place}: ${pointsText(result.points)}`
  } else headline = `${distanceText(result.km, units)} away. Place ${result.place}`

  return (
    <>
      <p className="pd-place" data-testid="pd-answer">
        {round.photo.place}
      </p>
      <PinMap label="Results map" pins={round.pins} players={mapPlayers} answer={round.photo} />
      <p className="pd-headline" role="status" data-testid="pd-result">
        {headline}
      </p>
      <FlagButton {...props} />
      <HostNext isHost={isHost} onNext={onNext} label="Standings" />
    </>
  )
}

/** 1 plus everyone in better places, so two tied for 1st are followed by 3rd. */
function rankOf(places: PlayerId[][], index: number): number {
  return 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)
}

function StandingsList({ state, looks, final }: { state: PinDropState; looks: Record<PlayerId, PlayerLook>; final: boolean }) {
  const scores = totals(state)
  const places = rules.finishingOrder(state)
  const round = currentRound(state)
  const match = state.settings.scoring === 'match'
  const units = state.settings.units
  const label = final ? 'Final standings' : 'Standings'

  return (
    <ol className="pd-list" aria-label={label}>
      {places.map((place, i) =>
        place.map((id) => {
          const result = round.results?.[id]
          const roundText = match
            ? `+${result?.points ?? 0}`
            : result?.km === null || result?.km === undefined
              ? 'No pin'
              : distanceText(result.km, units)
          return (
            <li key={id} className="pd-list__row" data-testid={`pd-standing-${id}`}>
              <span>
                {place.length > 1 ? `Tied ${rankOf(places, i)}` : rankOf(places, i)}. {looks[id].name}
              </span>
              {!final && <span className="pd-list__round">{roundText}</span>}
              <span>{match ? pointsText(scores[id].points) : distanceText(scores[id].km, units)}</span>
            </li>
          )
        }),
      )}
    </ol>
  )
}

function Standings(props: PhoneScreenProps) {
  const { state, looks, isHost, onNext } = props
  const lastRound = state.roundIndex === state.rounds.length - 1
  return (
    <>
      <p className="pd-headline">Round {state.roundIndex + 1} standings</p>
      <p className="pd-hint">{state.settings.scoring === 'match' ? 'Round points, then total' : 'This round, then total distance'}</p>
      <StandingsList state={state} looks={looks} final={false} />
      <FlagButton {...props} />
      <HostNext isHost={isHost} onNext={onNext} label={lastRound ? 'Final standings' : 'Next round'} />
    </>
  )
}

function Final({ state, looks, summaryAction }: PhoneScreenProps) {
  return (
    <>
      <p className="pd-headline">Final standings</p>
      <StandingsList state={state} looks={looks} final />
      {summaryAction}
    </>
  )
}

export function PhoneScreen(props: PhoneScreenProps) {
  const { state, above } = props
  return (
    <div className="pd-phone">
      <div className="pd-top">
        <PinDropTitle />
        {state.phase !== 'over' && (
          <span className="pd-top__round" data-testid="pd-round">
            Round {state.roundIndex + 1} of {state.rounds.length}
          </span>
        )}
      </div>
      {state.phase === 'guessing' && <GuessingInfo state={state} secondsLeft={props.secondsLeft} />}
      {state.phase === 'guessing' && above}
      {state.phase === 'guessing' && <Guessing {...props} />}
      {state.phase === 'reveal' && <Reveal {...props} />}
      {state.phase === 'standings' && <Standings {...props} />}
      {state.phase === 'over' && <Final {...props} />}
    </div>
  )
}
