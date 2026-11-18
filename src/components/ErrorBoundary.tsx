import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('JobSQUAD ErrorBoundary caught:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen jobsquad-canvas flex items-center justify-center p-6">
          <div className="jobsquad-surface max-w-md w-full rounded-xl p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Something went wrong</h2>
            <p className="text-sm text-slate-300 break-words">
              {this.state.errorMessage || 'An unexpected application error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#D9A438] text-[#071121] font-semibold text-sm hover:bg-[#E5B34B] transition-colors cursor-pointer"
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
