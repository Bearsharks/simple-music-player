import { Draggable } from "react-beautiful-dnd";
import { memo } from 'react'
import MusicListEle from "./MusicListEle";

export default memo(function MusicListDraggable(props) {
    return (
        <Draggable
            draggableId={props.ele.key}
            index={props.index}
        >
            {(provided, snapshot) =>
                <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={(e) => { props.selectMusic(props.index) }}
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