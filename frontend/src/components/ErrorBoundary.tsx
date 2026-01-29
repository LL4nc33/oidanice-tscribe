/**
 * React Error Boundary.
 *
 * WHY: Class component required -- React only supports Error Boundaries
 * as class components (no hook equivalent). Catches uncaught JS errors
 * in the component tree and shows a user-friendly fallback instead of
 * a blank white screen.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="font-serif text-3xl tracking-wide">
            Something went wrong
          </h1>

          <p
            className="font-serif text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            An unexpected error occurred. Please reload the page to try again.
          </p>

          <button
            onClick={this.handleReload}
            className="font-serif text-sm px-6 py-2 transition-colors"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
            }}
          >
            [ reload page ]
          </button>
        </div>
      </div>
    )
  }
}
