import { RefObject, useEffect } from "react";


interface OuterClickEventCatcherProps {
    openState: [boolean, (_: boolean) => void];
    wrapper: RefObject<HTMLDivElement>;
    onClickHandler?: (arg0: MouseEvent | TouchEvent) => void;
}
function OuterClickEventCatcher({ wrapper, openState, onClickHandler }: OuterClickEventCatcherProps) {
    const [isOpen, setOpen] = openState;
    useEffect(() => {
        const onClickOutsideHandler = (event: MouseEvent | TouchEvent) => {
            if (wrapper.current && wrapper.current.contains(event.target as Node)) {

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
    const [isOpen, setOpen] = props.openState;
    return isOpen ? <OuterClickEventCatcher {...props}></OuterClickEventCatcher> : <></>;
}
export default Wrapper;