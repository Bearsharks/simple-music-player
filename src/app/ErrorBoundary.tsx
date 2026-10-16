import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (this.state.failed) return <div role="alert"><p>화면을 불러오지 못했습니다. 연결과 설정을 확인해 주세요.</p><button onClick={() => window.location.reload()}>다시 불러오기</button></div>;
        return this.props.children;
    }
}
