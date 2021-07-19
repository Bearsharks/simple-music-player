import { Draggable } from "react-beautiful-dnd";
import { memo } from 'react'
import MusicListEle from "./MusicListEle";

export default memo(function MusicListDraggable(props) {
    const selectMusicHandler = (e, index) => {
        e.stopPropagation();
        props.selectMusic(index);
        console.log(e.target.offsetTop);
    }
    return (
        <Draggable
            draggableId={props.ele.key}
            index={props.index}
        >
            {(provided, snapshot) =>
                <li
                    ref={provided.innerRef}
                    className={'musicListElement'}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={(e) => selectMusicHandler(e, props.index)}
                >

                    <div style={(props.isCurMusic) ? { border: "1px solid black" } : {}}>
                        <MusicListEle
                            ele={props.ele}
                            index={props.index}
                            deleteMusic={props.deleteMusic}
                            modMusicList={props.modMusicList}
                        >
                        </MusicListEle>
                    </div>
                </li>
            }
        </Draggable>
    )
});