import { RefObject, useEffect } from "react";


interface OuterClickEventCatcherProps {
    openState: [boolean, (_: boolean) => void];
    wrapper: RefObject<HTMLDivElement | null>;
    onClickHandler?: (arg0: MouseEvent | TouchEvent) => void;
}
function OuterClickEventCatcher({ wrapper, openState, onClickHandler }: OuterClickEventCatcherProps) {
    const [isOpen, setOpen] = openState;
    useEffect(() => {
        const onClickOutsideHandler = (event: PointerEvent) => {
            if (wrapper.current && wrapper.current.contains(event.target as Node)) {

                return;
            }
            if (onClickHandler) onClickHandler(event);

            setOpen(false);
        };
        // Observe the next pointer gesture before target handlers. Listening to the
        // bubbling click can consume the same click that just mounted this popup.
        document.addEventListener('pointerdown', onClickOutsideHandler, true);
        return () => {
            document.removeEventListener('pointerdown', onClickOutsideHandler, true);
        };
    }, [setOpen, wrapper, onClickHandler]);
    return <></>;
}
function Wrapper(props: OuterClickEventCatcherProps) {
    const [isOpen, setOpen] = props.openState;
    return isOpen ? <OuterClickEventCatcher {...props}></OuterClickEventCatcher> : <></>;
}
export default Wrapper;
