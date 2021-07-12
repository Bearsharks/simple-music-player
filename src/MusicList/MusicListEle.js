import { Draggable } from "react-beautiful-dnd";
import { memo } from 'react'
// {
//     ele,
//     index,
//     playMusic,
//     deleteMusic
// }
export default memo(function MusicListEle(props) {
    const deleteMusicHandler = (e, index) => {
        e.stopPropagation();
        e.preventDefault();
        props.deleteMusic(index);
    }

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
                    onClick={(e) => { props.playMusic(props.index) }}
                >
                    {props.ele.q}<button onClick={(e) => deleteMusicHandler(e, props.index)}>X </button>
                </li>
            }
        </Draggable>
    )
});