import React, { useEffect, useRef, useState } from "react";
import styles from './SearchBar.module.scss';
export interface SearchBarProps {
    search: (event: React.MouseEvent, textarea: HTMLTextAreaElement) => void;
    //searchPopupOpen: (event: React.MouseEvent, textarea: HTMLTextAreaElement) => void;
}

function SearchBar(props: SearchBarProps) {
    const textInput = useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setExpended] = useState(false);
    const search = (event: React.MouseEvent) => {
        if (textInput.current !== null && textInput.current.value) {
            props.search(event, textInput.current);
        }
    }
    function resize() {
        if (textInput.current !== null) {
            const height: number = parseInt(textInput.current.style.height);
            if (height > 200) return;
            const candi = (textInput.current.scrollHeight - 4);
            let nextHeight = candi > 44 ? candi : 44;
            if (height > 200) {
                nextHeight = 200;
            }
            textInput.current.style.height = `${nextHeight}px`;
        }
    }
    const expandTextArea = () => {
        if (isExpanded) return;
        resize();
        setExpended(true);
    }
    const shirinkTextBox = () => {
        setExpended(false);
        if (textInput.current !== null) {
            textInput.current.style.height = "";
        }
    }
    const curRef = useRef<HTMLDivElement>(null);
    return (
        <div className={`${styles['wrapper']}  ${isExpanded && styles['wrapper--expand']}`} ref={curRef}>
            <textarea
                className={`${isExpanded && styles['text--expand']}`}
                ref={textInput}
                onKeyDown={resize} onKeyUp={resize} onClick={expandTextArea}
            > </textarea >
            {!isExpanded &&
                <button
                    className={`${styles['search-button']}`}
                    onClick={search}
                >
                    <span className="material-icons">
                        search
                    </span>
                </button>}
            {isExpanded &&
                <div className={`${styles['expanded-menu']}`}>
                    <div>ex)노래명 - 가수명 / 유튜브 url(재생목록, 동영상)</div>
                    <button
                        className={`${styles['search-button']} ${styles['search-button--expand']}`}
                        onClick={search}
                    >
                        <span className="material-icons">
                            search
                        </span>
                    </button>
                    <OuterClickEventCatcher
                        onClickHandler={shirinkTextBox}
                        wrapper={curRef.current}
                        setOpen={setExpended}
                    ></OuterClickEventCatcher>
                </div>
            }
        </div>
    )
}
export default SearchBar;

interface OuterClickEventCatcherProps {
    setOpen: (arg0: boolean) => void;
    wrapper: HTMLElement | null;
    onClickHandler: (arg0: MouseEvent | TouchEvent) => void;
}
function OuterClickEventCatcher({ wrapper, setOpen, onClickHandler }: OuterClickEventCatcherProps) {
    useEffect(() => {
        const onClickOutsideHandler = (event: MouseEvent | TouchEvent) => {
            if (wrapper && wrapper.contains(event.target as Node)) {
                return;
            }
            onClickHandler(event);
            setOpen(false);
        };
        document.addEventListener('click', onClickOutsideHandler);
        document.addEventListener('touchend', onClickOutsideHandler);
        return () => {
            document.removeEventListener('click', onClickOutsideHandler);
            document.removeEventListener('touchend', onClickOutsideHandler);
        };
    }, [setOpen, wrapper, onClickHandler]);
    return <></>
}