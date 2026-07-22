import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation, type I18nContextValue } from '../../i18n';

interface Props {
  children: ReactNode;
  t: I18nContextValue['t'];
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
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
        <div className="min-h-screen bg-surface-secondary dark:bg-surface flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-border">
            <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-danger-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{this.props.t('error.title')}</h2>
            <p className="text-sm text-text-secondary mb-2">{this.props.t('error.unexpected')}</p>
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
              {this.props.t('error.retry')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return <ErrorBoundaryInner t={t}>{children}</ErrorBoundaryInner>;
}
