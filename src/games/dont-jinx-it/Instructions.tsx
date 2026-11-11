// ABOUTME: Don't Jinx It's instructions on the big screen, with the host's settings (pace, long game) and Start game.
// ABOUTME: Individual mode only until teams exist; the length estimate is the handoff's placeholder math.
import { TvHeader } from '../../ui/TvHeader'
import { PACE_SECONDS, PACES, type DontJinxItSettings, type Pace } from './rules'
import './TvScreen.css'
import './Instructions.css'

interface InstructionsProps {
  playerCount: number
  settings: DontJinxItSettings
  onChange: (settings: DontJinxItSettings) => void
  onStart: () => void
}

const PACE_NAMES: Record<Pace, string> = { quick: 'Quick', normal: 'Normal', relaxed: 'Relaxed' }

/** Rough minutes per turn by pace, from the design handoff. A placeholder until real games are timed. */
const MINUTES_PER_TURN: Record<Pace, number> = { quick: 2, normal: 2.5, relaxed: 3.5 }

const STEPS = [
  'One player guesses. Everyone else sees the word.',
  'Everyone else writes a one-word clue.',
  'Any clue written twice gets jinxed.',
  'Guess from what survives.',
]

function lengthSummary(playerCount: number, settings: DontJinxItSettings): string {
  const turns = playerCount * (settings.longGame ? 2 : 1)
  const minutes = Math.round(turns * MINUTES_PER_TURN[settings.pace])
  return `${playerCount} players · ${turns} turns · about ${minutes} min`
}

export function Instructions({ playerCount, settings, onChange, onStart }: InstructionsProps) {
  return (
    <div className="tv-screen dji-tv">
      <TvHeader title="Don't Jinx It" />
      <section className="dji-tv-panel" aria-label="How to play">
        <div className="dji-howto">
          <div className="dji-howto__rules">
            <h2 className="dji-howto__title">Don't Jinx It</h2>
            <ol className="dji-howto__steps">
              {STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="dji-howto__scoring">Correct guess: guesser +2 · every clue that survived +1</p>
            <p className="dji-howto__rule">Table rule: react, but don't say any words.</p>
          </div>
          <div className="cue-card dji-howto__settings">
            <h3 className="cue-card__label">Game settings · host</h3>
            <div className="dji-howto__group" role="group" aria-labelledby="dji-pace">
              <span className="dji-howto__name" id="dji-pace">
                Pace
              </span>
              <div className="dji-howto__options">
                {PACES.map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    className="dji-howto__option"
                    aria-pressed={settings.pace === pace}
                    data-testid={`dji-pace-${pace}`}
                    onClick={() => onChange({ ...settings, pace })}
                  >
                    {PACE_NAMES[pace]}
                    <span className="dji-howto__option-note">
                      {PACE_SECONDS[pace].write}/{PACE_SECONDS[pace].guess} s
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <label className="dji-howto__check">
              <input
                type="checkbox"
                checked={settings.longGame}
                data-testid="dji-long-game"
                onChange={(event) => onChange({ ...settings, longGame: event.target.checked })}
              />
              Long game: everyone guesses twice
            </label>
            <p className="dji-howto__summary" data-testid="dji-length">
              {lengthSummary(playerCount, settings)}
            </p>
          </div>
        </div>
      </section>
      <footer className="dji-tv-hostbar">
        <span className="dji-tv-hostbar__status">Everyone read it?</span>
        <button type="button" className="dji-tv-button dji-tv-button--primary" data-testid="dji-tv-start" onClick={onStart}>
          Start game
        </button>
      </footer>
    </div>
  )
}
