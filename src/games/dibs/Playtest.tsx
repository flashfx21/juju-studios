// ABOUTME: Dibs playtest on one phone: you and two stand-in players, no room or server, with the host's choices at the start.
// ABOUTME: Dibs has no bots, so a dev box types the stand-ins' answers, challenges and votes, and stands in for the timer.
import { useState } from 'react'
import { DEFAULT_PACE } from '../../engine/pace'
import { OptionRow } from '../../ui/OptionRow'
import { PhoneFrame } from '../../ui/PhoneFrame'
import { botFor } from '../room/bots'
import type { PlayerId, RulesContext } from '../types'
import { DibsTitle, PhoneScreen } from './PhoneScreen'
import {
  CATEGORY_CHOICES,
  currentChallenge,
  currentRound,
  dealAgain,
  ROUND_COUNTS,
  rules,
  votersFor,
  type CategoryChoice,
  type DibsInput,
  type DibsState,
  type RoundCount,
  type Vote,
} from './rules'
import '../../ui/PhoneForm.css'
import '../../ui/PlaytestDev.css'
import './Playtest.css'

const YOU = 'you'
const OTHERS: PlayerId[] = ['bot-casual-1', 'bot-sharp-1']
const PLAYERS: PlayerId[] = [YOU, ...OTHERS]
const NAMES: Record<PlayerId, string> = Object.fromEntries(PLAYERS.map((id) => [id, id === YOU ? 'You' : botFor(id)!.look.name]))
const ROUND_NAMES: Record<RoundCount, string> = { 5: '5', 7: '7', 9: '9' }
const CATEGORY_NAMES: Record<CategoryChoice, string> = {
  family: 'Family only',
  everything: 'Everything',
}

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

export function Playtest() {
  const [state, setState] = useState<DibsState | null>(null)
  const [rounds, setRounds] = useState<RoundCount>(5)
  const [categories, setCategories] = useState<CategoryChoice>('family')
  const apply = (next: DibsState, player: PlayerId, input: DibsInput) => rules.onInput(next, player, input, context())

  return (
    <PhoneFrame label="Dibs playtest" cardTag="Playtest" fit={state !== null}>
      {state ? (
        <>
          <PhoneScreen
            state={state}
            player={YOU}
            names={NAMES}
            isHost
            onInput={(input) => setState(apply(state, YOU, input))}
            onDealAgain={() => setState(dealAgain(state, context()))}
            onNext={() => setState(rules.onTimer(state, context()))}
            summaryAction={
              <button type="button" className="phone-button" data-testid="db-play-again" onClick={() => setState(null)}>
                Play again
              </button>
            }
          />
          <DevBox state={state} apply={apply} onChange={setState} />
        </>
      ) : (
        <>
          <DibsTitle />
          <p className="cue-card__text">
            Interface test: you and two stand-in players. The Dev box types their answers, challenges and votes, and stands in for the timer.
          </p>
          <OptionRow label="Rounds" options={ROUND_COUNTS} names={ROUND_NAMES} value={rounds} onChoose={setRounds} />
          <OptionRow label="Categories" options={CATEGORY_CHOICES} names={CATEGORY_NAMES} value={categories} onChoose={setCategories} />
          <button
            type="button"
            className="phone-button"
            data-testid="db-start"
            onClick={() => setState(rules.setup(PLAYERS, { pace: DEFAULT_PACE, rounds, categories }, context()))}
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
  state: DibsState
  apply: (state: DibsState, player: PlayerId, input: DibsInput) => DibsState
  onChange: (state: DibsState) => void
}

/** Controls a real game gets from other phones and the engine timer. */
function DevBox({ state, apply, onChange }: DevBoxProps) {
  const [typed, setTyped] = useState<Record<PlayerId, string>>({})
  const round = currentRound(state)
  const timeUp = (
    <button type="button" className="playtest-dev__button" data-testid="db-dev-timer" onClick={() => onChange(rules.onTimer(state, context()))}>
      {state.phase === 'category' ? 'Drop the letter' : "Time's up"}
    </button>
  )
  const everyone = (input: DibsInput, who: PlayerId[]) => onChange(who.reduce((next, id) => apply(next, id, input), state))

  if (state.phase === 'scores' || state.phase === 'over') return null
  const racing = OTHERS.filter((id) => !round.out.includes(id) && !round.claims.some((c) => c.player === id))
  const challenge = currentChallenge(state)
  const voting = challenge ? votersFor(state, challenge).filter((id) => id !== YOU && !(id in challenge.votes)) : []
  const mine = round.claims.some((c) => c.player === YOU)

  return (
    <section className="playtest-dev" aria-label="Playtest controls">
      <h2 className="playtest-dev__heading">Dev</h2>
      <div className="db-dev">
        {state.phase === 'race' &&
          racing.map((id) => (
            <form
              key={id}
              className="db-dev__row"
              onSubmit={(event) => {
                event.preventDefault()
                onChange(apply(state, id, { type: 'answer', text: typed[id] ?? '' }))
              }}
            >
              <label className="db-dev__label" htmlFor={`db-dev-${id}`}>
                {NAMES[id]}
              </label>
              <input
                id={`db-dev-${id}`}
                className="db-dev__input"
                value={typed[id] ?? ''}
                data-testid={`db-dev-answer-${id}`}
                onChange={(event) => setTyped({ ...typed, [id]: event.target.value })}
              />
              <button type="submit" className="playtest-dev__button" data-testid={`db-dev-send-${id}`}>
                Answer
              </button>
              <button type="button" className="playtest-dev__button" onClick={() => onChange(apply(state, id, { type: 'out' }))}>
                Out
              </button>
            </form>
          ))}
        <div className="playtest-dev__buttons">
          {state.phase === 'review' && mine && (
            <button
              type="button"
              className="playtest-dev__button"
              data-testid="db-dev-challenge"
              onClick={() => onChange(apply(state, OTHERS[0], { type: 'challenge', author: YOU }))}
            >
              {NAMES[OTHERS[0]]} challenges you
            </button>
          )}
          {state.phase === 'review' && (
            <button type="button" className="playtest-dev__button" data-testid="db-dev-done" onClick={() => everyone({ type: 'done' }, OTHERS)}>
              Others done
            </button>
          )}
          {state.phase === 'vote' &&
            voting.length > 0 &&
            (['valid', 'not-valid'] as Vote[]).map((vote) => (
              <button
                key={vote}
                type="button"
                className="playtest-dev__button"
                data-testid={`db-dev-vote-${vote}`}
                onClick={() => everyone({ type: 'vote', vote }, voting)}
              >
                Others: {vote === 'valid' ? 'Valid' : 'Not valid'}
              </button>
            ))}
          {timeUp}
        </div>
      </div>
    </section>
  )
}
