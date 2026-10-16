// The iframe API itself requires a global callback. Keep ownership in one adapter.
let ready: Promise<any> | undefined;
export function loadIframeApi(): Promise<any> {
    if ((window as any).YT?.Player) return Promise.resolve((window as any).YT);
    if (ready) return ready;
    ready = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        const timer = window.setTimeout(() => { ready = undefined; reject(new Error('YouTube 플레이어 연결 시간 초과')); }, 15000);
        (window as any).onYouTubeIframeAPIReady = () => { clearTimeout(timer); resolve((window as any).YT); };
        script.onerror = () => { clearTimeout(timer); ready = undefined; script.remove(); reject(new Error('YouTube 플레이어를 불러오지 못했습니다.')); };
        document.head.append(script);
    });
    return ready;
}
