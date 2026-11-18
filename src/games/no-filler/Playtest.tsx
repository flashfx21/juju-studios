// ABOUTME: No Filler playtest on one phone: you and two stand-in players, no room or server, with the host's target at the start.
// ABOUTME: No Filler has no bots (the app can't hear anyone), so a dev box picks, finishes and votes for the stand-ins and stands in for the clock.
import { useState } from 'react'
import { OptionRow } from '../../ui/OptionRow'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { botFor } from '../room/bots'
import type { PlayerId, RulesContext } from '../types'
import { DIFFICULTY_NAMES, VOTE_NAMES } from './format'
import { NoFillerTitle, PhoneScreen } from './PhoneScreen'
import { DEFAULT_SETTINGS, pickChoices, rules, TARGET_SCORES, votersFor, type NoFillerInput, type NoFillerState, type TargetScore, type Vote } from './rules'
import '../../ui/PhoneForm.css'
import '../../ui/PlaytestDev.css'
import './Playtest.css'

const YOU = 'you'
const OTHERS: PlayerId[] = ['bot-casual-1', 'bot-sharp-1']
const PLAYERS: PlayerId[] = [YOU, ...OTHERS]
const NAMES: Record<PlayerId, string> = Object.fromEntries(PLAYERS.map((id) => [id, id === YOU ? 'You' : botFor(id)!.look.name]))
const TARGET_NAMES: Record<TargetScore, string> = { 10: '10 points', 15: '15 points' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

export function Playtest() {
  const [state, setState] = useState<NoFillerState | null>(null)
  const [target, setTarget] = useState<TargetScore>(10)
  const apply = (next: NoFillerState, player: PlayerId, input: NoFillerInput) => rules.onInput(next, player, input, context())

  return (
    <PhoneFrame label="No Filler playtest" cardTag="Playtest" fit={state !== null}>
      {state ? (
        <>
          <PhoneScreen
            state={state}
            player={YOU}
            names={NAMES}
            isHost
            onInput={(input) => setState(apply(state, YOU, input))}
            summaryAction={
              <button type="button" className="phone-button" data-testid="nf-play-again" onClick={() => setState(null)}>
                Play again
              </button>
            }
          />
          <DevBox state={state} apply={apply} onChange={setState} />
        </>
      ) : (
        <>
          <NoFillerTitle />
          <p className="cue-card__text">
            Interface test: you and two stand-in players. The Dev box picks, finishes and votes for them, and stands in for the clock. Void turn and Skip turn
            are in the top-left menu.
          </p>
          <OptionRow label="Target" options={TARGET_SCORES} names={TARGET_NAMES} value={target} onChoose={setTarget} />
          <button
            type="button"
            className="phone-button"
            data-testid="nf-start"
            onClick={() => setState(rules.setup(PLAYERS, { ...DEFAULT_SETTINGS, target }, context()))}
          >
            Start
          </button>
          <p className="preview-note">Playtest: nothing is saved.</p>
        </>
      )}
    </PhoneFrame>
  )
}

interface DevBoxProps {
  state: NoFillerState
  apply: (state: NoFillerState, player: PlayerId, input: NoFillerInput) => NoFillerState
  onChange: (state: NoFillerState) => void
}

/** Controls a real game gets from other phones and the engine timer. */
function DevBox({ state, apply, onChange }: DevBoxProps) {
  if (state.phase === 'over') return null
  const { speaker } = state.turn
  const standIn = speaker !== YOU
  const waiting = votersFor(state).filter((id) => id !== YOU && !(id in state.turn.votes))
  const everyone = (vote: Vote, who: PlayerId[]) => onChange(who.reduce((next, id) => apply(next, id, { type: 'vote', vote }), state))

  return (
    <section className="playtest-dev" aria-label="Playtest controls">
      <h2 className="playtest-dev__heading">Dev</h2>
      <div className="playtest-dev__buttons nf-dev">
        {state.phase === 'pick' &&
          standIn &&
          pickChoices(state).map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              className="playtest-dev__button"
              data-testid={`nf-dev-pick-${difficulty}`}
              onClick={() => onChange(apply(state, speaker, { type: 'pick', difficulty }))}
            >
              {NAMES[speaker]}: {DIFFICULTY_NAMES[difficulty]}
            </button>
          ))}
        {state.phase === 'pick' && !standIn && <span className="nf-dev__note">Your pick</span>}
        {state.phase === 'speak' && standIn && (
          <button type="button" className="playtest-dev__button" data-testid="nf-dev-done" onClick={() => onChange(apply(state, speaker, { type: 'done' }))}>
            {NAMES[speaker]}: Done
          </button>
        )}
        {state.phase === 'vote' &&
          waiting.length > 0 &&
          (['clean', 'filler'] as Vote[]).map((vote) => (
            <button key={vote} type="button" className="playtest-dev__button" data-testid={`nf-dev-vote-${vote}`} onClick={() => everyone(vote, waiting)}>
              Others: {VOTE_NAMES[vote]}
            </button>
          ))}
        {state.phase === 'vote' && waiting.length === 2 && (
          <button
            type="button"
            className="playtest-dev__button"
            data-testid="nf-dev-vote-split"
            onClick={() => onChange(apply(apply(state, waiting[0], { type: 'vote', vote: 'clean' }), waiting[1], { type: 'vote', vote: 'filler' }))}
          >
            Split
          </button>
        )}
        {state.phase !== 'pick' && (
          <button type="button" className="playtest-dev__button" data-testid="nf-dev-timer" onClick={() => onChange(rules.onTimer(state, context()))}>
            {state.phase === 'reveal' ? 'Next turn' : "Time's up"}
          </button>
        )}
      </div>
    </section>
  )
}
