// ABOUTME: Host settings on the big screen: pick the lobby style and turn the arcade CRT scanlines on or off.
// ABOUTME: Layout follows docs/design (screen 8, Host settings); each style dresses it in HostSettings.css.
import { TvStage } from '../ui/TvStage'
import { LOBBY_STYLES } from '../ui/themes/lobbyStyles'
import type { HostSettings as Settings } from './useHostSettings'
import { routeHref } from './useHashRoute'
import './HostSettings.css'

interface HostSettingsProps {
  settings: Settings
  onChange: (change: Partial<Settings>) => void
}

export function HostSettings({ settings, onChange }: HostSettingsProps) {
  return (
    <TvStage label="Host settings">
      <div className="host-settings">
        <header className="host-settings__header">
          <div className="host-settings__brand">
            <span className="host-settings__logo">
              JuJu<span className="host-settings__logo-rest"> Studios</span>
            </span>
            <h1 className="host-settings__title">Host settings</h1>
          </div>
          <a className="host-settings__back" href={routeHref.home} data-testid="back-to-lobby">
            Back to lobby
          </a>
        </header>

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
            <div className="setting-row" role="group" aria-labelledby="scanlines-name">
              <div className="setting-row__text">
                <span className="setting-row__name" id="scanlines-name">
                  CRT scanlines
                </span>
                <span className="setting-row__note">Arcade style only</span>
              </div>
              <div className="setting-row__choices">
                <button
                  type="button"
                  className="setting-row__choice"
                  data-testid="scanlines-on"
                  aria-pressed={settings.scanlines}
                  onClick={() => onChange({ scanlines: true })}
                >
                  On
                </button>
                <button
                  type="button"
                  className="setting-row__choice"
                  data-testid="scanlines-off"
                  aria-pressed={!settings.scanlines}
                  onClick={() => onChange({ scanlines: false })}
                >
                  Off
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="host-settings__floor" aria-hidden="true" />
      </div>
    </TvStage>
  )
}
