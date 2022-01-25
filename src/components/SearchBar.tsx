import { useRef } from "react";

export interface SearchBarProps {
    search: (event: React.MouseEvent, query: string) => void
}
function SearchBar(props: SearchBarProps) {
    const textInput = useRef<HTMLTextAreaElement>(null);

    const search = (event: React.MouseEvent) => {
        if (textInput.current !== null) {
            props.search(event, textInput.current.value);
            textInput.current.value = "";
        }

    }
    function resize() {
        if (textInput.current !== null) {
            const height: number = parseInt(textInput.current.style.height);
            if (height > 100) return;
            textInput.current.style.height = "1px";
            textInput.current.style.height = (2 + textInput.current.scrollHeight) + "px";
        }

    }
    return (
        <div>
            <textarea ref={textInput} onKeyDown={resize} onKeyUp={resize}></textarea >
            <button onClick={search}>검색</button>
        </div>
    )
}
export default SearchBar;