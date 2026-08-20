import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error in app tree:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-lg font-semibold ink dark:text-slate-100">Something went wrong</p>
          <p className="muted2 dark:text-slate-400">
            Please try reloading the page. If the problem continues, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
