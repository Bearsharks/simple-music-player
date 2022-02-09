import { useRef, useState } from "react";
import styles from './SearchBar.module.scss';
export interface SearchBarProps {
    search: (event: React.MouseEvent, textarea: HTMLTextAreaElement) => void
}
function SearchBar(props: SearchBarProps) {
    const textInput = useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setExpended] = useState(false);
    const search = (event: React.MouseEvent) => {
        if (textInput.current !== null) {
            props.search(event, textInput.current);
        }
    }
    function resize() {
        if (textInput.current !== null) {
            const height: number = parseInt(textInput.current.style.height);
            if (height > 200) {
                return;
            }
            const candi = (textInput.current.scrollHeight - 4);
            let nextHeight = candi > 44 ? candi : 44;
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

    return (
        <div className={styles['wrapper']}>
            <div className={`${styles['closeBtn']} ${isExpanded && styles['closeBtn--show']}`} onClick={shirinkTextBox}></div>
            <textarea ref={textInput} onKeyDown={resize} onKeyUp={resize} onClick={expandTextArea}></textarea >
            <button className={styles['searchBtn']} onClick={search}>검색</button>
        </div>
    )
}
export default SearchBar;