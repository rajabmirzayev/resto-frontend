import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-border">
            <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-danger-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Xəta baş verdi</h2>
            <p className="text-sm text-text-secondary mb-2">Gözlənilməz xəta baş verdi.</p>
            {this.state.error && (
              <p className="text-xs text-text-muted bg-surface-secondary rounded-xl p-3 mb-6 font-mono text-left overflow-auto max-h-32">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Yenidən Cəhd Et
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
