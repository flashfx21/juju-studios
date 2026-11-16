// ABOUTME: Zero In playtest on one phone: you against two bots, no room or server, with the host's choices at the start.
// ABOUTME: A dev box stands in for the other phones and the engine timer: bots lock in, time's up, next.
import { useState } from 'react'
import { DEFAULT_PACE } from '../../engine/pace'
import { OptionRow } from '../../ui/OptionRow'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { botFor } from '../room/bots'
import type { PlayerId, RulesContext } from '../types'
import { PhoneScreen, ZeroInTitle } from './PhoneScreen'
import { botGuess } from './roomViews'
import { currentRound, LANE_CHOICES, ROUND_COUNTS, rules, type LaneChoice, type RoundCount, type ZeroInState } from './rules'
import '../../ui/PhoneForm.css'
import '../../ui/PlaytestDev.css'

const YOU = 'you'
const PLAYERS: PlayerId[] = [YOU, 'bot-casual-1', 'bot-sharp-1']
const NAMES: Record<PlayerId, string> = Object.fromEntries(PLAYERS.map((id) => [id, id === YOU ? 'You' : botFor(id)!.look.name]))
const ROUND_NAMES: Record<RoundCount, string> = { 5: '5', 10: '10', 15: '15' }
const LANE_NAMES: Record<LaneChoice, string> = { mix: 'Mix', price: 'Prices', year: 'Years', number: 'Numbers' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** Every bot that hasn't locked in does now. */
function botsLockIn(state: ZeroInState): ZeroInState {
  const round = currentRound(state)
  return PLAYERS.filter((id) => id !== YOU && !round.locked.includes(id)).reduce(
    (next, bot) =>
      rules.onInput(next, bot, { type: 'lock', value: botGuess(round.question, round.final, botFor(bot)!.skill, Math.random) }, context()),
    state,
  )
}

export function Playtest() {
  const [state, setState] = useState<ZeroInState | null>(null)
  const [rounds, setRounds] = useState<RoundCount>(5)
  const [lanes, setLanes] = useState<LaneChoice>('mix')

  return (
    <PhoneFrame label="Zero In playtest" cardTag="Playtest" fit={state !== null}>
      {state ? (
        <>
          <PhoneScreen
            state={state}
            player={YOU}
            names={NAMES}
            isHost
            onDraft={(value) => setState(rules.onInput(state, YOU, value === null ? { type: 'clear' } : { type: 'draft', value }, context()))}
            onLock={(value) => setState(rules.onInput(state, YOU, { type: 'lock', value }, context()))}
            onNext={() => setState(rules.onTimer(state, context()))}
            summaryAction={
              <button type="button" className="phone-button" data-testid="zi-play-again" onClick={() => setState(null)}>
                Play again
              </button>
            }
          />
          <DevBox state={state} onChange={setState} />
        </>
      ) : (
        <>
          <ZeroInTitle />
          <p className="cue-card__text">
            Interface test: you against two bots. Pick the rounds and lanes, then start. The Dev box stands in for the other phones and the timer.
          </p>
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={rounds} onChoose={setRounds} />
          <OptionRow label="Lanes" options={LANE_CHOICES} names={LANE_NAMES} value={lanes} onChoose={setLanes} />
          <button
            type="button"
            className="phone-button"
            data-testid="zi-start"
            onClick={() => setState(rules.setup(PLAYERS, { pace: DEFAULT_PACE, rounds, lanes }, context()))}
          >
            Start
          </button>
          <p className="preview-note">Playtest: nothing is saved.</p>
        </>
      )}
    </PhoneFrame>
  )
}

/** Controls a real game gets from other phones and the engine timer. */
function DevBox({ state, onChange }: { state: ZeroInState; onChange: (state: ZeroInState) => void }) {
  if (state.phase !== 'guessing') return null
  const botsWaiting = PLAYERS.some((id) => id !== YOU && !currentRound(state).locked.includes(id))
  return (
    <section className="playtest-dev" aria-label="Playtest controls">
      <h2 className="playtest-dev__heading">Dev</h2>
      <div className="playtest-dev__buttons">
        {botsWaiting && (
          <button type="button" className="playtest-dev__button" data-testid="zi-dev-bots" onClick={() => onChange(botsLockIn(state))}>
            Bots lock in
          </button>
        )}
        <button type="button" className="playtest-dev__button" data-testid="zi-dev-timer" onClick={() => onChange(rules.onTimer(state, context()))}>
          Time's up
        </button>
      </div>
    </section>
  )
}
