// ABOUTME: The host's bot choice in a waiting room: every bot by name, Casual and Sharp side by side, so a game can mix them.
// ABOUTME: Tap a name to add that bot, tap again to take it out; up to MAX_BOTS. Chosen bots join in the order they were picked.
import type { PlayerId } from '../types'
import { allBotIds, BOT_SKILL_NAMES, BOT_SKILLS, MAX_BOTS } from './bots'
import { PlayerDot } from './RoomPage'
import type { PlayerLook } from './usePlayerLooks'
import '../../ui/OptionRow.css'
import './BotPicker.css'

interface BotPickerProps {
  chosen: readonly PlayerId[]
  /** Looks for every bot, so each name shows its color and symbol. */
  looks: Record<PlayerId, PlayerLook>
  onChange: (chosen: PlayerId[]) => void
}

export function BotPicker({ chosen, looks, onChange }: BotPickerProps) {
  const full = chosen.length >= MAX_BOTS
  return (
    <div className="option-row bot-picker" role="group" aria-labelledby="bot-picker-label">
      <span className="option-row__label" id="bot-picker-label">
        Bots: {chosen.length} of up to {MAX_BOTS}
      </span>
      {BOT_SKILLS.map((skill) => (
        <div key={skill} className="bot-picker__skill" role="group" aria-label={`${BOT_SKILL_NAMES[skill]} bots`}>
          <span className="bot-picker__skill-name">{BOT_SKILL_NAMES[skill]}</span>
          <div className="bot-picker__names">
            {allBotIds(skill).map((id) => {
              const picked = chosen.includes(id)
              const unavailable = full && !picked
              return (
                <button
                  key={id}
                  type="button"
                  className="bot-picker__bot"
                  aria-pressed={picked}
                  aria-disabled={unavailable || undefined}
                  data-testid={`bot-pick-${id}`}
                  onClick={() => {
                    if (picked) onChange(chosen.filter((other) => other !== id))
                    else if (!unavailable) onChange([...chosen, id])
                  }}
                >
                  <PlayerDot look={looks[id]} />
                  <span className="bot-picker__name">{looks[id].name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
