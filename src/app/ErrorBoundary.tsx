import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null; componentStack: string | null };

/**
 * Catches a render crash so one broken screen does not blank the whole site.
 *
 * In development it prints the component stack, because the JavaScript stack
 * for a React render error points into React's internals and says nothing about
 * which of your components actually threw.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, componentStack: info.componentStack ?? null });
    console.error('[render error]', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null, componentStack: null });

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash" role="alert">
        <h1>Алдаа гарлаа</h1>
        <p>Энэ хуудсыг харуулах үед алдаа гарлаа.</p>
        <div className="crash__actions">
          <button type="button" onClick={this.reset}>
            Дахин оролдох
          </button>
          <a href="/home">Нүүр хуудас</a>
        </div>
        {import.meta.env.DEV ? (
          <pre className="crash__detail">
            {error.message}
            {componentStack}
          </pre>
        ) : null}
      </div>
    );
  }
}
