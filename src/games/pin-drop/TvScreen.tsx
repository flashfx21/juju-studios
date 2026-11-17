// ABOUTME: Pin Drop on the TV: the round's photo large with the clock and who has locked in, the results map where pins
// ABOUTME: drop from farthest to closest beside their distances, the round standings, and the final standings with photo credits.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { creditText, distanceText, placeText } from './format'
import { PinMap } from './PinMap'
import { COUNTDOWN_SECONDS, currentRound, rules, totals, type Photo, type PinDropState, type Round } from './rules'
import { useMapPlayers } from './useMapPlayers'
import '../../ui/TvGame.css'
import './TvScreen.css'

interface TvScreenProps {
  /** The room's public state: no place name or pins until the reveal, and nothing of the rounds to come. */
  state: PinDropState
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left to guess, or null when nothing is timed. */
  secondsLeft: number | null
}

const DIFFICULTY_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
/** Time between pins dropping at the reveal. */
const STEP_MS = 900
/** How long a photo that failed to load waits before it is asked for again. */
const PHOTO_RETRY_MS = 5000
/** More players than this and lists tighten up to fit the panel. */
const ROOMY_PLAYERS = 8

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Counts from 0 up to `last`, one step every STEP_MS; straight to the end with reduced motion. */
function useSteps(last: number): number {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? last : 0))
  useEffect(() => {
    if (step >= last) return
    const timer = setTimeout(() => setStep(step + 1), STEP_MS)
    return () => clearTimeout(timer)
  }, [step, last])
  return step
}

function namesOf(looks: Record<PlayerId, PlayerLook>, ids: readonly PlayerId[]): string {
  return ids.map((id) => looks[id]?.name).join(' and ')
}

/** The round's photo, whole (never cropped). One that fails to load is asked for again every few seconds. */
function RoundPhoto({ photo, label }: { photo: Photo; label: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!failed) return
    const timer = setTimeout(() => setFailed(false), PHOTO_RETRY_MS)
    return () => clearTimeout(timer)
  }, [failed])
  return (
    <div className="pd-tv-photo" data-testid="pd-tv-photo">
      {failed ? (
        <p className="pd-tv-photo__failed" role="status" data-testid="pd-tv-photo-failed">
          The photo didn't load. Trying again.
        </p>
      ) : (
        <img className="pd-tv-photo__image" src={photo.image} alt={label} onError={() => setFailed(true)} />
      )}
    </div>
  )
}

// ---------- The photo round ----------

function Guessing({ state, looks, secondsLeft }: TvScreenProps) {
  const round = currentRound(state)
  const crowded = state.players.length > ROOMY_PLAYERS
  return (
    <div className="pd-tv-guessing" data-testid="pd-tv-guessing">
      <figure className="pd-tv-figure">
        <RoundPhoto key={round.photo.id} photo={round.photo} label="This round's photo" />
        {/* A credit that names the place waits for the reveal. */}
        {!round.photo.creditSpoiler && (
          <figcaption className="pd-tv-credit" data-testid="pd-tv-credit">
            {creditText(round.photo)}
          </figcaption>
        )}
      </figure>
      <div className="pd-tv-side">
        <div className="pd-tv-side__top">
          {secondsLeft !== null && (
            <span className="tv-tote pd-tv-clock" role="timer" data-low={secondsLeft <= COUNTDOWN_SECONDS || undefined} data-testid="pd-tv-clock">
              {secondsLeft}
            </span>
          )}
          <div className="pd-tv-difficulty" data-testid="pd-tv-difficulty">
            <span className="tv-label">Difficulty</span>
            <span className="pd-tv-difficulty__name">{DIFFICULTY_NAMES[round.photo.difficulty]}</span>
          </div>
        </div>
        <span className="tv-label">
          Locked in · {round.locked.length} of {state.players.length}
        </span>
        <ul className="pd-tv-locks" aria-label="Who has locked in" data-crowded={crowded || undefined}>
          {state.players.map((id) => {
            const locked = round.locked.includes(id)
            return (
              <li key={id} className="pd-tv-lock" data-locked={locked || undefined} data-testid={`pd-tv-lock-${id}`}>
                <PlayerDot look={looks[id]} size={crowded ? 26 : 32} />
                <span className="pd-tv-lock__name">{looks[id]?.name}</span>
                <span className="pd-tv-lock__state">{locked ? '✓ In' : '…'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ---------- The reveal: the map, then each pin from farthest to closest ----------

/** Everyone with a pin, farthest first: the order the pins drop. */
function farthestFirst(players: readonly PlayerId[], results: Round['results']): PlayerId[] {
  const km = (id: PlayerId) => results?.[id]?.km ?? null
  return players.filter((id) => km(id) !== null).sort((a, b) => km(b)! - km(a)!)
}

/** The pins dropped so far. The list only changes when another pin drops, so the map redraws once per pin. */
function useDropped(dropOrder: readonly PlayerId[], step: number): PlayerId[] {
  const dropped = JSON.stringify(dropOrder.slice(0, step))
  return useMemo(() => JSON.parse(dropped) as PlayerId[], [dropped])
}

function Reveal({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const round = currentRound(state)
  const results = round.results
  const mapPlayers = useMapPlayers(state, looks)
  const match = state.settings.scoring === 'match'
  const units = state.settings.units
  const crowded = state.players.length > ROOMY_PLAYERS
  const dropOrder = farthestFirst(state.players, results)
  // Each step drops one pin; the last names the closest and lists anyone without a pin.
  const last = dropOrder.length + 1
  const step = useSteps(last)
  const dropped = useDropped(dropOrder, step)
  const done = step >= last
  const noPin = state.players.filter((id) => !dropOrder.includes(id))
  const closest = dropOrder.filter((id) => results?.[id].place === 1)

  return (
    <div className="pd-tv-reveal" data-testid="pd-tv-reveal">
      <div className="pd-tv-map">
        <PinMap label="Results map" pins={round.pins} players={mapPlayers} answer={round.photo} shown={dropped} still />
      </div>
      <div className="pd-tv-reveal__side">
        <div className="pd-tv-answer">
          <RoundPhoto key={round.photo.id} photo={round.photo} label={round.photo.place} />
          <div className="pd-tv-answer__words">
            <p className="pd-tv-answer__place" data-testid="pd-tv-answer">
              {round.photo.place}
            </p>
            {done && (
              <p className="pd-tv-answer__closest" data-testid="pd-tv-closest">
                {closest.length > 0 ? (
                  <>
                    <span className="pd-tv-answer__closest-name">Closest: {namesOf(looks, closest)}</span>
                    <span>, {distanceText(results![closest[0]].km!, units)}</span>
                  </>
                ) : (
                  'Nobody dropped a pin'
                )}
              </p>
            )}
          </div>
        </div>
        <ol
          className="pd-tv-distances"
          aria-label="Distances, closest first"
          data-crowded={crowded || undefined}
          data-points={match || undefined}
          data-testid="pd-tv-distances"
        >
          {[...dropped].reverse().map((id) => (
            <li key={id} className="pd-tv-distance" data-closest={(done && results![id].place === 1) || undefined} data-testid={`pd-tv-distance-${id}`}>
              <span className="pd-tv-distance__place">{placeText(results![id].place!)}</span>
              <PlayerDot look={looks[id]} size={crowded ? 22 : 28} />
              <span className="pd-tv-distance__name">{looks[id]?.name}</span>
              <span className="pd-tv-distance__km">{distanceText(results![id].km!, units)}</span>
              {match && <span className="pd-tv-distance__points">+{results![id].points}</span>}
            </li>
          ))}
          {done &&
            noPin.map((id) => (
              <li key={id} className="pd-tv-distance" data-testid={`pd-tv-distance-${id}`}>
                <span className="pd-tv-distance__place">-</span>
                <PlayerDot look={looks[id]} size={crowded ? 22 : 28} />
                <span className="pd-tv-distance__name">{looks[id]?.name}</span>
                <span className="pd-tv-distance__km">No pin</span>
                {match && <span className="pd-tv-distance__points">+0</span>}
              </li>
            ))}
        </ol>
        <p className="pd-tv-credit pd-tv-credit--full" data-testid="pd-tv-credit">
          {creditText(round.photo)}
        </p>
      </div>
    </div>
  )
}

// ---------- Round standings and the final standings ----------

function Standings({ state, looks, final }: Pick<TvScreenProps, 'state' | 'looks'> & { final: boolean }) {
  const scores = totals(state)
  const places = rules.finishingOrder(state)
  const results = currentRound(state).results
  const match = state.settings.scoring === 'match'
  const units = state.settings.units
  const crowded = state.players.length > ROOMY_PLAYERS
  const rankOf = (index: number) => 1 + places.slice(0, index).reduce((sum, place) => sum + place.length, 0)

  function roundText(id: PlayerId): string {
    const result = results?.[id]
    if (match) return `+${result?.points ?? 0}`
    return typeof result?.km === 'number' ? distanceText(result.km, units) : 'No pin'
  }

  return (
    <table className="pd-tv-table" data-crowded={crowded || undefined} data-testid="pd-tv-standings">
      <caption className="visually-hidden">{final ? 'Final standings' : `Standings after round ${state.roundIndex + 1}`}</caption>
      <thead>
        <tr>
          <th scope="col" className="pd-tv-table__place">
            Place
          </th>
          <th scope="col">Player</th>
          {!final && (
            <th scope="col" className="pd-tv-table__num">
              This round
            </th>
          )}
          <th scope="col" className="pd-tv-table__num pd-tv-table__total">
            {match ? 'Points' : 'Distance'}
          </th>
        </tr>
      </thead>
      <tbody>
        {places.map((place, i) =>
          place.map((id) => (
            <tr key={id} data-top={(final && i === 0) || undefined} data-testid={`pd-tv-standing-${id}`}>
              <td className="pd-tv-table__place">{place.length > 1 ? `Tied ${placeText(rankOf(i))}` : placeText(rankOf(i))}</td>
              <th scope="row">
                <span className="pd-tv-table__who">
                  <PlayerDot look={looks[id]} size={crowded ? 24 : 30} />
                  <span className="pd-tv-table__name">{looks[id]?.name}</span>
                </span>
              </th>
              {!final && <td className="pd-tv-table__num">{roundText(id)}</td>}
              <td className="pd-tv-table__num pd-tv-table__total">{match ? scores[id].points : distanceText(scores[id].km, units)}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  )
}

/** The final standings beside a credit for every photo the game showed. */
function Final({ state, looks }: Pick<TvScreenProps, 'state' | 'looks'>) {
  const played = state.rounds.slice(0, state.roundIndex + 1).map((round) => round.photo)
  return (
    <div className="pd-tv-final" data-testid="pd-tv-final">
      <div className="pd-tv-final__standings">
        <Standings state={state} looks={looks} final />
      </div>
      <div className="pd-tv-final__credits">
        <span className="tv-label">Photo credits</span>
        <ul className="pd-tv-credits" aria-label="Photo credits" data-testid="pd-tv-credits">
          {played.map((photo) => (
            <li key={photo.id} className="pd-tv-credits__row">
              <strong>{photo.place}</strong> · {photo.author} · {photo.license}
            </li>
          ))}
          <li className="pd-tv-credits__row">Photos from Wikimedia Commons</li>
        </ul>
      </div>
    </div>
  )
}

export function TvScreen(props: TvScreenProps) {
  const { state, looks } = props
  let body: ReactNode
  switch (state.phase) {
    case 'guessing':
      body = <Guessing {...props} />
      break
    case 'reveal':
      body = <Reveal key={state.roundIndex} state={state} looks={looks} />
      break
    case 'standings':
      body = <Standings state={state} looks={looks} final={false} />
      break
    default:
      body = <Final state={state} looks={looks} />
  }
  return <div className="pd-tv-body">{body}</div>
}
