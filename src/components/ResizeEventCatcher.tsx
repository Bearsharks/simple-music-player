import { useEffect } from "react";

interface ResizeEventCatcherProps {
    target: Element;
    onResizeHandler: (width: number, height: number) => void;
}
function ResizeEventCatcher({ target, onResizeHandler }: ResizeEventCatcherProps) {
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                onResizeHandler(width, height);
            }
        });
        resizeObserver.observe(target);
        return () => {
            resizeObserver.unobserve(target);
        };
    }, [onResizeHandler, target]);
    return <></>;
}
export default ResizeEventCatcher;