import { useState } from "react";
import QueryDetail from "./QueryDetail";

export default function MusicListEle(props) {
    const [isDetailOpened, setDetailOpened] = useState(false);
    const deleteMusicHandler = (e, index) => {
        e.stopPropagation();
        e.preventDefault();
        props.deleteMusic(index);
    }
    const togleDetailOpen = (e) => {
        e.stopPropagation();
        setDetailOpened((isDetailOpened) ? false : true)
    }
    const selectQuery = (item) => {
        props.modMusicList(props.index, item);
    }
    return (
        <div>
            {props.ele.q} <button onClick={(e) => deleteMusicHandler(e, props.index)}> X </button >
            <button onClick={togleDetailOpen}>펼치기 </button >
            {isDetailOpened &&
                <QueryDetail query={props.ele.q} selectQuery={selectQuery} curItemId={props.ele.id} />
            }
        </div>
    )
}