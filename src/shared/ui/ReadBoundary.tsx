import { Component, type ReactNode } from "react";
/** Local read recovery. It never writes or clears user data. */
export default class ReadBoundary extends Component<
  { children: ReactNode; onRetry: () => void; compact?: boolean },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="error-box" role="alert">
        <strong>저장 목록을 불러오지 못했습니다.</strong>
        {!this.props.compact && (
          <p>
            목록을 삭제하지 않았습니다. 브라우저 저장 공간을 사용할 수 있는지
            확인하고 다시 시도해 주세요.
          </p>
        )}
        <button
          className="secondary-button"
          onClick={() => {
            this.props.onRetry();
            this.setState({ failed: false });
          }}
        >
          다시 시도
        </button>
      </section>
    );
  }
}
