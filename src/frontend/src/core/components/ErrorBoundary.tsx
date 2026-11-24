import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react'

export type ErrorBoundaryResetDetails =
  | {
      reason: 'imperative-api'
      args: unknown[]
    }
  | {
      reason: 'keys'
      prev: readonly unknown[] | undefined
      next: readonly unknown[] | undefined
    }

export type ErrorBoundaryFallbackProps = {
  error: Error
  resetErrorBoundary: (...args: unknown[]) => void
}

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  fallbackRender?: (props: ErrorBoundaryFallbackProps) => ReactNode
  FallbackComponent?: ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: (details: ErrorBoundaryResetDetails) => void
  resetKeys?: readonly unknown[]
}

type ErrorBoundaryState = {
  error: Error | null
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error
  }

  return new Error('Unknown error')
}

function haveResetKeysChanged(
  prevResetKeys: readonly unknown[] | undefined,
  nextResetKeys: readonly unknown[] | undefined,
) {
  if (prevResetKeys === nextResetKeys) {
    return false
  }

  if (prevResetKeys === undefined || nextResetKeys === undefined) {
    return prevResetKeys !== nextResetKeys
  }

  if (prevResetKeys.length !== nextResetKeys.length) {
    return true
  }

  return prevResetKeys.some(
    (resetKey, index) => !Object.is(resetKey, nextResetKeys[index]),
  )
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState,
  ) {
    if (this.state.error === null || prevState.error === null) {
      return
    }

    if (haveResetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.props.onReset?.({
        reason: 'keys',
        prev: prevProps.resetKeys,
        next: this.props.resetKeys,
      })
      this.reset()
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  resetErrorBoundary = (...args: unknown[]) => {
    this.props.onReset?.({ reason: 'imperative-api', args })
    this.reset()
  }

  renderFallback(error: Error) {
    const fallbackProps: ErrorBoundaryFallbackProps = {
      error,
      resetErrorBoundary: this.resetErrorBoundary,
    }

    if (this.props.fallbackRender) {
      return this.props.fallbackRender(fallbackProps)
    }

    if (this.props.FallbackComponent) {
      const FallbackComponent = this.props.FallbackComponent
      return <FallbackComponent {...fallbackProps} />
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <main role="alert">
        <h1>Something went wrong.</h1>
        <p>An unexpected error occurred.</p>
      </main>
    )
  }

  render() {
    if (this.state.error) {
      return this.renderFallback(this.state.error)
    }

    return this.props.children
  }
}
