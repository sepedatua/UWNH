import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../logger';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      'ReactBoundary',
      `Component crashed in ${this.props.fallbackTitle || 'Interface Component'}: ${error.message}`,
      {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    );
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gradient-to-b from-[#2a130b] to-[#1a0c07] border-2 border-red-500 text-amber-100 p-5 m-3 rounded-xl shadow-2xl font-mono text-xs max-w-lg mx-auto pointer-events-auto">
          <div className="flex items-center gap-2 font-bold text-sm mb-2 text-red-300">
            <span className="text-xl">⚠️</span>
            <span>Interface Anomaly: {this.props.fallbackTitle || 'Component Error'}</span>
          </div>
          <p className="text-neutral-300 text-[11px] mb-2 leading-relaxed">
            A rendering exception occurred. Full stack trace and game state have been recorded to{' '}
            <code className="text-yellow-400 bg-black/60 px-1 py-0.5 rounded">game_debug.log</code>.
          </p>
          <div className="p-2.5 bg-black/70 rounded border border-red-900/60 mb-3 text-red-200 text-[11px] break-all max-h-28 overflow-y-auto font-mono">
            {this.state.error?.message}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition-colors cursor-pointer"
            >
              🔄 Retry Component
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
