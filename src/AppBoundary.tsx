import { Component, type ReactNode } from "react";
export class AppBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error("Workspace rendering failed", error);
  }
  render() {
    if (this.state.error)
      return (
        <main
          className="og-recovery"
          role="alert"
          data-error-message={this.state.error.message}
          data-error-stack={this.state.error.stack}
        >
          <span>ON-GROUND · CALL CENTRE</span>
          <h1>This screen couldn’t open.</h1>
          <p>
            Your saved calls and requests are still in your workspace. Reload to
            continue.
          </p>
          <button className="og-primary" onClick={() => location.reload()}>
            Reload workspace
          </button>
        </main>
      );
    return this.props.children;
  }
}
