// ABOUTME: The header across the top of every TV screen: studio logo, screen title, and an optional right-hand slot.
// ABOUTME: Styled per lobby style in TvChrome.css; arcade shortens the logo to "JuJu" and shows the subtitle.
import type { ReactNode } from 'react'
import './TvChrome.css'

interface TvHeaderProps {
  title: string
  /** Shown under the title in styles that have one (arcade). */
  subtitle?: string
  children?: ReactNode
}

export function TvHeader({ title, subtitle, children }: TvHeaderProps) {
  return (
    <header className="tv-header">
      <div className="tv-header__brand">
        <span className="tv-logo">
          JuJu<span className="tv-logo__rest"> Studios</span>
        </span>
        <div className="tv-header__titles">
          <h1 className="tv-title">{title}</h1>
          {subtitle && <p className="tv-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  )
}
