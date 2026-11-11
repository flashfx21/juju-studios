// ABOUTME: One-player Chainword practice on this device: runs the real rules in the browser, with no room or backend.
// ABOUTME: Nothing is saved; refreshing the page deals a fresh chain.
import { useState } from 'react'
import { PhoneScreen } from '../games/chainword/PhoneScreen'
import { DEFAULT_SETTINGS, rules, type ChainLength, type ChainwordState } from '../games/chainword/rules'
import { PhoneFrame } from '../ui/PhoneFrame'
import '../ui/PhoneForm.css'

const PLAYER = 'you'

function context() {
  return { now: Date.now(), random: Math.random }
}

function deal(chainLength: ChainLength): ChainwordState {
  return rules.setup([PLAYER], { chainLength }, context())
}

export function ChainwordPractice() {
  const [state, setState] = useState(() => deal(DEFAULT_SETTINGS.chainLength))
  const over = rules.isOver(state)

  return (
    <PhoneFrame label="Chainword practice" cardTag="Practice">
      <PhoneScreen
        key={state.startedAt}
        state={state}
        player={PLAYER}
        onGuess={(word) => setState((s) => rules.onInput(s, PLAYER, { type: 'guess', word }, context()))}
      />
      {over && (
        <>
          <button
            type="button"
            className="phone-button"
            data-testid="cw-play-again-3"
            onClick={() => setState(deal(3))}
          >
            Play again: 3 words
          </button>
          <button
            type="button"
            className="phone-button phone-button--secondary"
            data-testid="cw-play-again-5"
            onClick={() => setState(deal(5))}
          >
            Play again: 5 words
          </button>
        </>
      )}
      <p className="preview-note">Practice: just you, on this device. Nothing is saved.</p>
    </PhoneFrame>
  )
}
