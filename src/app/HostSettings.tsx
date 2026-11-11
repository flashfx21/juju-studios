// ABOUTME: Host settings on the big screen: the host's own style, how the next game is chosen, and CRT scanlines.
// ABOUTME: Layout follows docs/design (screen 8, Host settings); each style dresses it in HostSettings.css.
import { StyleCards } from '../ui/StyleCards'
import { TvHeader } from '../ui/TvHeader'
import { TvStage } from '../ui/TvStage'
import type { LobbyStyleId } from '../ui/themes/lobbyStyles'
import type { HostSettings as Settings } from './useHostSettings'
import { href } from './useHashRoute'
import './HostSettings.css'

interface HostSettingsProps {
  settings: Settings
  onChange: (change: Partial<Settings>) => void
  /** The host's own style, shown on the TV and the host's phone. */
  style: LobbyStyleId
  onStyleChange: (style: LobbyStyleId) => void
}

export function HostSettings({ settings, onChange, style, onStyleChange }: HostSettingsProps) {
  return (
    <TvStage label="Host settings">
      <div className="tv-screen host-settings">
        <TvHeader title="Host settings">
          <a className="host-settings__back" href={href('lobby')} data-testid="back-to-lobby">
            Back to lobby
          </a>
        </TvHeader>

        <div className="host-settings__body">
          <section className="host-settings__styles" aria-labelledby="lobby-style-heading">
            <h2 className="host-settings__heading" id="lobby-style-heading">
              <span className="host-settings__heading-label">Your style</span>
              <span className="host-settings__heading-sep" aria-hidden="true">
                {' · '}
              </span>
              <span className="host-settings__heading-note">the TV and your phone</span>
            </h2>
            <StyleCards current={style} size="tv" labelledBy="lobby-style-heading" onPick={onStyleChange} />
          </section>

          <div className="host-settings__options">
            <SettingRow
              id="game-choice"
              name="Game choice"
              note="How tonight's game gets picked"
              value={settings.gameChoice}
              options={[
                { value: 'vote', label: 'Group vote' },
                { value: 'leader', label: 'Leader pick' },
              ]}
              onSelect={(gameChoice) => onChange({ gameChoice })}
            />
            <SettingRow
              id="scanlines"
              name="CRT scanlines"
              note="Arcade style only"
              value={settings.scanlines ? 'on' : 'off'}
              options={[
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
              onSelect={(choice) => onChange({ scanlines: choice === 'on' })}
            />
          </div>
        </div>

        <div className="host-settings__floor" aria-hidden="true" />
      </div>
    </TvStage>
  )
}

interface SettingRowProps<Value extends string> {
  id: string
  name: string
  note: string
  value: Value
  options: { value: Value; label: string }[]
  onSelect: (value: Value) => void
}

/** One labelled setting with a pair of pressed/unpressed choice buttons. */
function SettingRow<Value extends string>({ id, name, note, value, options, onSelect }: SettingRowProps<Value>) {
  return (
    <div className="setting-row" role="group" aria-labelledby={`${id}-name`}>
      <div className="setting-row__text">
        <span className="setting-row__name" id={`${id}-name`}>
          {name}
        </span>
        <span className="setting-row__note">{note}</span>
      </div>
      <div className="setting-row__choices">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="setting-row__choice"
            data-testid={`${id}-${option.value}`}
            aria-pressed={option.value === value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
