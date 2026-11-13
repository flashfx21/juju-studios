// ABOUTME: Pin Drop solo playtest on one phone: you plus two bots, no room or server. The round's photo sits above
// ABOUTME: the map in place of the TV; a dev box stands in for the other phones and the engine timer.
import { useState } from 'react'
import { PhoneFrame } from '../../ui/PhoneFrame'
import type { PlayerId, RulesContext } from '../types'
import { PhoneScreen, PinDropTitle, type PlayerLook } from './PhoneScreen'
import {
  currentRound,
  DEFAULT_SETTINGS,
  ROUND_COUNTS,
  rules,
  SCORINGS,
  UNITS,
  type PinDropSettings,
  type PinDropState,
} from './rules'
import '../../ui/PhoneForm.css'
import '../../ui/PlaytestDev.css'
import { botGuess } from './bots'
import { OptionRow, RoundPhoto } from './Pieces'

const YOU = 'you'
const PLAYERS: PlayerId[] = [YOU, 'bot-a', 'bot-b']
const LOOKS: Record<PlayerId, PlayerLook> = {
  you: { name: 'You', initials: 'YOU', color: '#c2255c' },
  'bot-a': { name: 'Bot A', initials: 'BA', color: '#1f5fa8' },
  'bot-b': { name: 'Bot B', initials: 'BB', color: '#2f7a3a' },
}

const SCORING_NAMES = { match: 'Match play', stroke: 'Stroke play' }
const UNIT_NAMES = { mi: 'Miles', km: 'Kilometers' }

function context(): RulesContext {
  return { now: Date.now(), random: Math.random }
}

/** Bot A guesses like a sharp player and Bot B like a casual one, always at a real city (see bots.ts). */
function botsLockIn(state: PinDropState): PinDropState {
  const round = currentRound(state)
  return PLAYERS.filter((player) => player !== YOU && !round.locked.includes(player)).reduce((next, bot) => {
    const pin = botGuess(round.photo, bot === 'bot-a' ? 'sharp' : 'casual', Math.random)
    const pinned = rules.onInput(next, bot, { type: 'pin', ...pin }, context())
    return rules.onInput(pinned, bot, { type: 'lock' }, context())
  }, state)
}

export function Playtest() {
  const [state, setState] = useState<PinDropState | null>(null)

  if (!state) {
    return (
      <PhoneFrame label="Pin Drop playtest" cardTag="Playtest">
        <Start onStart={(settings) => setState(rules.setup(PLAYERS, settings, context()))} />
      </PhoneFrame>
    )
  }

  const apply = (change: (current: PinDropState) => PinDropState) => setState((current) => current && change(current))

  return (
    <PhoneFrame label="Pin Drop playtest" cardTag="Playtest" fit>
      <PhoneScreen
        state={state}
        player={YOU}
        looks={LOOKS}
        isHost
        onPin={(pin) => apply((s) => rules.onInput(s, YOU, { type: 'pin', ...pin }, context()))}
        onLock={() => apply((s) => rules.onInput(s, YOU, { type: 'lock' }, context()))}
        onFlag={() => apply((s) => rules.onInput(s, YOU, { type: 'flag' }, context()))}
        onNext={() => apply((s) => rules.onTimer(s, context()))}
        above={<RoundPhoto key={currentRound(state).photo.id} photo={currentRound(state).photo} />}
        summaryAction={
          <button type="button" className="phone-button" data-testid="pd-play-again" onClick={() => setState(null)}>
            Play again
          </button>
        }
      />
      <DevBar state={state} onChange={apply} />
    </PhoneFrame>
  )
}

function Start({ onStart }: { onStart: (settings: PinDropSettings) => void }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const choose = <K extends keyof PinDropSettings>(key: K, value: PinDropSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }))

  return (
    <>
      <PinDropTitle />
      <p className="cue-card__text">
        Solo test: you play against two bots that guess near the answer. The photo shows above the map in place of the
        TV. Use the dev box to stand in for the other phones and the timer.
      </p>
      <OptionRow label="Scoring" options={SCORINGS} names={SCORING_NAMES} value={settings.scoring} onChoose={(v) => choose('scoring', v)} />
      <OptionRow
        label="Rounds"
        options={ROUND_COUNTS}
        names={{ 5: '5', 7: '7', 9: '9' }}
        value={settings.rounds}
        onChoose={(v) => choose('rounds', v)}
      />
      <OptionRow label="Units" options={UNITS} names={UNIT_NAMES} value={settings.units} onChoose={(v) => choose('units', v)} />
      <button type="button" className="phone-button" data-testid="pd-start" onClick={() => onStart(settings)}>
        Start
      </button>
      <p className="preview-note">Playtest: nothing is saved, flags included.</p>
    </>
  )
}

interface DevBarProps {
  state: PinDropState
  onChange: (change: (current: PinDropState) => PinDropState) => void
}

/** Controls a real game gets from the other phones and the engine timer. */
function DevBar({ state, onChange }: DevBarProps) {
  if (state.phase !== 'guessing' && state.phase !== 'reveal') return null
  const round = currentRound(state)
  const botsWaiting = PLAYERS.some((player) => player !== YOU && !round.locked.includes(player))

  return (
    <section className="playtest-dev" aria-label="Playtest controls">
      <h2 className="playtest-dev__heading">Dev</h2>
      <div className="playtest-dev__buttons">
        {state.phase === 'guessing' && botsWaiting && (
          <button type="button" className="playtest-dev__button" data-testid="pd-dev-bots" onClick={() => onChange(botsLockIn)}>
            Bots lock in
          </button>
        )}
        <button
          type="button"
          className="playtest-dev__button"
          data-testid="pd-dev-timer"
          onClick={() => onChange((s) => rules.onTimer(s, context()))}
        >
          {state.phase === 'guessing' ? "Time's up" : 'Reveal done'}
        </button>
      </div>
    </section>
  )
}
