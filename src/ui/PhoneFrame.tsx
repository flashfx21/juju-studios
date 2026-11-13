// ABOUTME: The page around every phone screen: portrait layout, the style's background, and spacing from the design.
// ABOUTME: With cardTag, the rec room style wraps the screen in its cream phone card; with fit, it never scrolls.
import type { ReactNode } from 'react'
import './PhoneFrame.css'

interface PhoneFrameProps {
  label: string
  /** Rec room card header text (e.g. "HOST SIGN-IN"); omit for screens that sit straight on the wood. */
  cardTag?: string
  /** Exactly one screen tall with tighter edges, for game screens that must never scroll. */
  fit?: boolean
  children?: ReactNode
}

export function PhoneFrame({ label, cardTag, fit, children }: PhoneFrameProps) {
  return (
    <main
      className="phone-frame"
      aria-label={label}
      data-card={cardTag ? 'true' : undefined}
      data-fit={fit ? 'true' : undefined}
    >
      <div className="phone-frame__inner">
        {cardTag ? (
          <div className="phone-frame__card">
            <div className="phone-frame__card-header">
              <div className="phone-frame__card-titles">
                <span className="phone-frame__card-logo">JuJu Studios</span>
                <span className="phone-frame__card-tag">{cardTag}</span>
              </div>
              <div className="phone-frame__tri-stripe" aria-hidden="true" />
            </div>
            <div className="phone-frame__card-body">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  )
}
