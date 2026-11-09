import { Component, type ErrorInfo, type ReactNode } from "react";

import ErrorState from "./ErrorState";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
          <ErrorState
            title="Something went wrong"
            description="An unexpected error interrupted this page. Your saved analyses are safe — reload the page or head back home."
            code="Unexpected error"
            details={[error.message]}
            onRetry={() => window.location.reload()}
            onBack={() => window.location.assign("/")}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
