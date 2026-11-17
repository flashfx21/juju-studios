// ABOUTME: Chainword on the TV: while the chain runs, its clock and which word each player is on, in the room's order
// ABOUTME: (no letters, guess counts or places); once the game is over, the final standings and the chain's words.
import type { CSSProperties } from 'react'
import { PlayerDot } from '../room/RoomPage'
import type { PlayerLook } from '../room/usePlayerLooks'
import type { PlayerId } from '../types'
import { chainFor, readChainCode } from './chainCode'
import { placeText, standings, timeText, type ChainPlay, type Progress } from './roomProgress'
import '../../ui/TvGame.css'
import './TvScreen.css'

interface TvScreenProps {
  /** What the host wrote to the room: the chain code (never the words) and who plays. */
  play: ChainPlay
  /** What each player has shared with the room. */
  shared: Record<PlayerId, Progress>
  looks: Record<PlayerId, PlayerLook>
  /** Seconds left on the chain's clock, or null once it has stopped. */
  secondsLeft: number | null
  /** Everyone has finished, or the chain stopped: places, counts and the words may show. */
  over: boolean
}

/** With this little time left the clock takes a heavier frame. */
const LOW_SECONDS = 30

function nameOf(looks: Record<PlayerId, PlayerLook>, id: PlayerId): string {
  return looks[id]?.name ?? 'Player'
}

function Dot({ look, size }: { look: PlayerLook | undefined; size: number }) {
  return look ? <PlayerDot look={look} size={size} /> : <span style={{ width: size }} />
}

// ---------- While the chain runs ----------

/** One player's place in the chain: a box per word, checked once done. Never how many guesses a word took, or how it went. */
function ChainSteps({ done, finished, chainLength }: { done: number; finished: boolean; chainLength: number }) {
  return (
    <span className="cw-tv-steps" aria-hidden="true">
      {Array.from({ length: chainLength }, (_, i) => {
        const status = finished || i < done ? 'done' : i === done ? 'current' : 'ahead'
        return (
          <span key={i} className="cw-tv-step" data-status={status}>
            {status === 'done' ? '✓' : i + 1}
          </span>
        )
      })}
    </span>
  )
}

function Playing({ play, shared, looks, secondsLeft }: TvScreenProps) {
  const { chainLength, wordLength, hardMode } = readChainCode(play.chainCode)!.settings
  const finished = play.players.filter((id) => shared[id]?.finished).length
  return (
    <div className="cw-tv-split" data-testid="cw-tv-playing">
      <div className="cw-tv-main">
        <span className="tv-label">Where everyone is</span>
        <ul className="cw-tv-racers" aria-label="Which word each player is on">
          {play.players.map((id) => {
            const progress = shared[id]
            const isFinished = progress?.finished ?? false
            const done = progress?.words.length ?? 0
            return (
              <li key={id} className="cw-tv-racer" data-finished={isFinished || undefined} data-testid={`cw-tv-racer-${id}`}>
                <Dot look={looks[id]} size={30} />
                <span className="cw-tv-racer__name">{nameOf(looks, id)}</span>
                <ChainSteps done={done} finished={isFinished} chainLength={chainLength} />
                <span className="cw-tv-racer__state">{isFinished ? '✓ Finished' : `Word ${done + 1} of ${chainLength}`}</span>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="cw-tv-side">
        {secondsLeft !== null && (
          <span className="tv-tote cw-tv-clock" role="timer" data-low={secondsLeft <= LOW_SECONDS || undefined} data-testid="cw-tv-clock">
            {timeText(secondsLeft * 1000)}
          </span>
        )}
        <span className="tv-label" data-testid="cw-tv-finished">
          Finished · {finished} of {play.players.length}
        </span>
        <p className="cw-tv-note">
          {chainLength} hidden words, {wordLength} letters each. 6 guesses a word.{hardMode && ' Hard mode is on.'}
        </p>
        <p className="cw-tv-note">Fewest guesses wins. Places and guesses show when everyone has finished.</p>
      </div>
    </div>
  )
}

// ---------- Game over ----------

/** What each word cost one player: the guess count, green when solved; a missed word is gray and counts 7, more than any solved word. */
function WordCosts({ progress, chainLength }: { progress: Progress; chainLength: number }) {
  return (
    <ol className="cw-tv-costs" aria-label="Guesses on each word">
      {Array.from({ length: chainLength }, (_, i) => {
        const word = progress.words[i]
        if (!word) {
          return (
            <li key={i} className="cw-tv-cost" data-status="none">
              <span className="visually-hidden">Word {i + 1}: not finished</span>
            </li>
          )
        }
        return (
          <li key={i} className="cw-tv-cost" data-status={word.solved ? 'solved' : 'missed'}>
            <span className="visually-hidden">
              Word {i + 1}: {word.solved ? 'solved in' : 'missed, counts as'}{' '}
            </span>
            {word.cost}
          </li>
        )
      })}
    </ol>
  )
}

function Standings({ play, shared, looks }: Pick<TvScreenProps, 'play' | 'shared' | 'looks'>) {
  const { chainLength, wordLength } = readChainCode(play.chainCode)!.settings
  const chain = chainFor(play.chainCode)
  return (
    <div className="cw-tv-split cw-tv-split--over" data-testid="cw-tv-over">
      <table className="cw-tv-table" data-rows={play.players.length} data-testid="cw-tv-standings">
        <caption className="visually-hidden">Final standings</caption>
        <thead>
          <tr>
            <th scope="col" className="cw-tv-table__place">
              <span className="visually-hidden">Place</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Player</span>
            </th>
            <th scope="col" className="cw-tv-table__words" style={{ '--cw-tv-words': chainLength } as CSSProperties}>
              Words
            </th>
            <th scope="col" className="cw-tv-table__num">
              Guesses
            </th>
            <th scope="col" className="cw-tv-table__num">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {standings(play.players, shared).map(({ player, place, progress }) => (
            <tr key={player} data-top={place === 1 || undefined} data-testid={`cw-tv-standing-${player}`}>
              <td className="cw-tv-table__place">{placeText(place)}</td>
              <th scope="row">
                <span className="cw-tv-table__who">
                  <Dot look={looks[player]} size={30} />
                  <span className="cw-tv-table__name">{nameOf(looks, player)}</span>
                </span>
              </th>
              <td className="cw-tv-table__words">
                <WordCosts progress={progress} chainLength={chainLength} />
              </td>
              {progress.finished ? (
                <>
                  <td className="cw-tv-table__num cw-tv-table__total">{progress.totalGuesses}</td>
                  <td className="cw-tv-table__num">{timeText(progress.timeMs ?? 0)}</td>
                </>
              ) : (
                <td className="cw-tv-table__num" colSpan={2}>
                  Word {progress.words.length + 1} of {chainLength}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cw-tv-side">
        <span className="tv-label">The chain</span>
        <ol className="cw-tv-chain" aria-label="The chain's words" style={{ '--cw-tv-letters': wordLength } as CSSProperties} data-testid="cw-tv-chain">
          {chain.map((word, i) => (
            <li key={i} className="cw-tv-word" aria-label={word}>
              {[...word].map((letter, j) => (
                <span key={j} className="cw-tv-tile" aria-hidden="true">
                  {letter}
                </span>
              ))}
            </li>
          ))}
        </ol>
        <p className="cw-tv-note">Fewest guesses wins. A missed word counts as 7.</p>
      </div>
    </div>
  )
}

export function TvScreen(props: TvScreenProps) {
  return <div className="cw-tv-body">{props.over ? <Standings {...props} /> : <Playing {...props} />}</div>
}
