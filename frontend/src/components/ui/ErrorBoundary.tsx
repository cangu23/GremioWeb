'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return (this.props.fallback as (error: Error, reset: () => void) => React.ReactNode)(
          this.state.error,
          this.handleReset
        );
      }
      return this.props.fallback || (
        <div
          className="container"
          style={{
            padding: '40px 20px',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div
            className="glass"
            style={{
              padding: '40px 24px',
              borderRadius: '20px',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
              Algo salió mal
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '20px',
                fontFamily: 'monospace',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </p>
            <button
              onClick={this.handleReset}
              className="btn"
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
