// ABOUTME: Dial It In interface playtest on one phone: you plus two stand-in players, no room or server.
// ABOUTME: A dev bar stands in for the other phones and the engine timer: bots lock in, time's up, next round.
import { useState } from 'react'
import { PhoneFrame } from '../../ui/PhoneFrame'
import type { PlayerId, RulesContext } from '../types'
import { DialItInTitle, PhoneScreen } from './PhoneScreen'
import {
  currentRound,
  DIAL_RANGES,
  guessersFor,
  rules,
  type DialItInState,
  type DialRange,
} from './rules'
import '../../ui/PhoneForm.css'
import './Playtest.css'

const YOU = 'you'
const PLAYERS: PlayerId[] = [YOU, 'bot-a', 'bot-b']
const NAMES: Record<PlayerId, string> = { you: 'You', 'bot-a': 'Bot A', 'bot-b': 'Bot B' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** Every bot that still has to guess this round locks in a random number. */
function botsLockIn(state: DialItInState): DialItInState {
  const round = currentRound(state)
  return guessersFor(state, round)
    .filter((player) => player !== YOU && !(player in round.guesses))
    .reduce(
      (next, bot) =>
        rules.onInput(next, bot, { type: 'guess', value: 1 + Math.floor(Math.random() * state.range) }, context()),
      state,
    )
}

export function Playtest() {
  const [state, setState] = useState<DialItInState | null>(null)

  return (
    <PhoneFrame label="Dial It In playtest" cardTag="Playtest">
      {state ? (
        <>
          <PhoneScreen
            state={state}
            player={YOU}
            names={NAMES}
            onGuess={(value) => setState(rules.onInput(state, YOU, { type: 'guess', value }, context()))}
            summaryAction={
              <button type="button" className="phone-button" data-testid="dii-play-again" onClick={() => setState(null)}>
                Play again
              </button>
            }
          />
          <DevBar state={state} onChange={setState} />
        </>
      ) : (
        <Start onStart={(range) => setState(rules.setup(PLAYERS, { range }, context()))} />
      )}
    </PhoneFrame>
  )
}

function Start({ onStart }: { onStart: (range: DialRange) => void }) {
  return (
    <>
      <DialItInTitle />
      <p className="cue-card__text">
        Interface test: you play against two bots that guess at random. Each player gives the clue once. Use the dev
        buttons to stand in for the other phones and the timer.
      </p>
      {DIAL_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className="phone-button"
          data-testid={`dii-start-${range}`}
          onClick={() => onStart(range)}
        >
          Play 1 to {range}
        </button>
      ))}
      <p className="preview-note">Playtest: nothing is saved.</p>
    </>
  )
}

interface DevBarProps {
  state: DialItInState
  onChange: (state: DialItInState) => void
}

/** Controls a real game gets from other phones and the engine timer. */
function DevBar({ state, onChange }: DevBarProps) {
  if (state.phase === 'over') return null
  const round = currentRound(state)
  const botsWaiting = guessersFor(state, round).some((player) => player !== YOU && !(player in round.guesses))

  return (
    <section className="dii-dev" aria-label="Playtest controls">
      <h2 className="dii-dev__heading">Dev</h2>
      <div className="dii-dev__buttons">
        {state.phase === 'guessing' && botsWaiting && (
          <button
            type="button"
            className="dii-dev__button"
            data-testid="dii-dev-bots"
            onClick={() => onChange(botsLockIn(state))}
          >
            Bots lock in
          </button>
        )}
        <button
          type="button"
          className="dii-dev__button"
          data-testid="dii-dev-timer"
          onClick={() => onChange(rules.onTimer(state, context()))}
        >
          {state.phase === 'guessing' ? "Time's up" : 'Next round'}
        </button>
      </div>
    </section>
  )
}
