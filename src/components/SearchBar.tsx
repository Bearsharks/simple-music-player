import React, { useEffect, useRef, useState } from "react";
import OuterClickEventCatcher from "components/OuterClickEventCatcher";
import styles from './SearchBar.module.scss';
export interface SearchBarProps {
    search: (event: React.MouseEvent, textarea: HTMLTextAreaElement) => void;
    initialExpand?: boolean;
}

function SearchBar(props: SearchBarProps) {
    const textInput = useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setExpended] = useState(props.initialExpand ? props.initialExpand : false);
    const search = (event: React.MouseEvent) => {
        if (textInput.current !== null && textInput.current.value) {
            props.search(event, textInput.current);
        }
    }
    function resize(e: React.KeyboardEvent) {
        e.stopPropagation();
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
        if (!isExpanded) setExpended(true);
    }
    const shirinkTextBox = () => {
        if (isExpanded) setExpended(false);
    }
    const curRef = useRef<HTMLDivElement>(null);
    return (
        <div>
            <div
                className={`${styles['search-button']}`}
                onClick={expandTextArea}
            >
                <span className="material-icons md-28">
                    search
                </span>
            </div>
            <div ref={curRef} className={`${styles['wrapper']} ${isExpanded && styles['wrapper--expand']}`}>
                <div className={styles['search-panel']}>
                    <div className={styles['text-wrapper']}>
                        <textarea
                            ref={textInput}
                            onKeyDown={resize}
                        ></textarea>
                        <div
                            className={styles['close-btn']}
                            onClick={() => setExpended(false)}>
                            <span className="material-icons md-38">close</span>
                        </div>
                    </div>
                    <div className={`${styles['expanded-menu']}`}>
                        <div>ex)노래명 - 가수명 / 유튜브 url(재생목록, 동영상)</div>
                        <div
                            className={`${styles['search-button']} ${styles['search-button--expand']}`}
                            onClick={search}
                        >
                            <span className="material-icons md-28">
                                search
                            </span>
                        </div>
                    </div>
                    <OuterClickEventCatcher
                        openState={[isExpanded, setExpended]}
                        onClickHandler={shirinkTextBox}
                        wrapper={curRef}
                    ></OuterClickEventCatcher>
                </div>
            </div>
        </div>

    )
}
export default SearchBar;
