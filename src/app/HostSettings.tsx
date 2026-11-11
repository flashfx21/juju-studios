// ABOUTME: Host settings on the big screen: lobby style, how the next game is chosen, and arcade CRT scanlines.
// ABOUTME: Layout follows docs/design (screen 8, Host settings); each style dresses it in HostSettings.css.
import { TvHeader } from '../ui/TvHeader'
import { TvStage } from '../ui/TvStage'
import { LOBBY_STYLES } from '../ui/themes/lobbyStyles'
import type { HostSettings as Settings } from './useHostSettings'
import { href } from './useHashRoute'
import './HostSettings.css'

interface HostSettingsProps {
  settings: Settings
  onChange: (change: Partial<Settings>) => void
}

export function HostSettings({ settings, onChange }: HostSettingsProps) {
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
              <span className="host-settings__heading-label">Lobby style</span>
              <span className="host-settings__heading-sep" aria-hidden="true">
                {' · '}
              </span>
              <span className="host-settings__heading-note">restyles every screen</span>
            </h2>
            <div className="style-cards">
              {LOBBY_STYLES.map((style) => {
                const inUse = style.id === settings.style
                return (
                  <button
                    key={style.id}
                    type="button"
                    className="style-card"
                    data-theme={style.id}
                    data-testid={`style-card-${style.id}`}
                    aria-pressed={inUse}
                    onClick={() => onChange({ style: style.id })}
                  >
                    <span className="style-card__text">
                      <span className="style-card__label">{style.label}</span>
                      <span className="style-card__logo" aria-hidden="true">
                        JuJu Studios
                      </span>
                    </span>
                    <span className="style-card__swatches" aria-hidden="true">
                      {style.swatches.map((color) => (
                        <span key={color} className="style-card__swatch" style={{ background: color }} />
                      ))}
                    </span>
                    {inUse && <span className="style-card__badge">In use</span>}
                  </button>
                )
              })}
            </div>
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
