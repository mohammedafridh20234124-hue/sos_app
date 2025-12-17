import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5',
          fontFamily: 'sans-serif',
        }}>
          <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>Application Error</h1>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <details style={{ whiteSpace: 'pre-wrap', maxWidth: '80%', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <code style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', display: 'block', overflow: 'auto' }}>
              {this.state.error?.stack}
            </code>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
