import { useEffect } from "react";


interface OuterClickEventCatcherProps {
    isOpen: boolean;
    setOpen: (arg0: boolean) => void;
    wrapper: HTMLElement | null;
    onClickHandler?: (arg0: MouseEvent | TouchEvent) => void;
}
function OuterClickEventCatcher({ wrapper, setOpen, onClickHandler }: OuterClickEventCatcherProps) {
    useEffect(() => {
        const onClickOutsideHandler = (event: MouseEvent | TouchEvent) => {
            if (wrapper && wrapper.contains(event.target as Node)) {

                return;
            }
            if (onClickHandler) onClickHandler(event);

            setOpen(false);
        };
        document.addEventListener('click', onClickOutsideHandler);
        document.addEventListener('touchend', onClickOutsideHandler);
        return () => {
            document.removeEventListener('click', onClickOutsideHandler);
            document.removeEventListener('touchend', onClickOutsideHandler);
        };
    }, [setOpen, wrapper, onClickHandler]);
    return <></>;
}
function Wrapper(props: OuterClickEventCatcherProps) {
    return props.isOpen ? <OuterClickEventCatcher {...props}></OuterClickEventCatcher> : <></>;
}
export default Wrapper;