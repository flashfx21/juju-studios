// ABOUTME: Catches a crash anywhere on the page (such as a game's code failing to load after the site updated)
// ABOUTME: and shows a message with a Reload button instead of a blank screen.
import { Component, type ErrorInfo, type ReactNode } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The page crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="crash" role="alert" data-testid="crash">
        <h1 className="crash__title">Something went wrong</h1>
        <p className="crash__text">This screen didn't load. Reload to pick up where you were: your room and your game are kept.</p>
        <button type="button" className="crash__button" data-testid="crash-reload" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    )
  }
}
