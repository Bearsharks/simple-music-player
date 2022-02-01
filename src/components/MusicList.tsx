import React from "react";
import { MusicInfo } from "../refs/constants";
import styles from './MusicList.module.scss';
import { DragDropContext, Droppable, DropResult,Draggable } from "react-beautiful-dnd";

export interface MusicListProps {
    items: MusicInfo[];
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
    addToPlaylist: (items: MusicInfo[]) => void;
    changeOrder:(src:number, dst:number)=>void;
}

function MusicItem({ children, item, openOptionsPopup }: { children: React.ReactChild, item: MusicInfo, openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void }) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event, [item]);
    }
    return (
        <div className={styles[`music-list_item`]}>
            <img alt="사진 |" />
            <div>{item.name}|</div>
            <button onClick={popupOpen}>버튼</button>
            {children}
        </div>
    );
}
function MusicList(props: MusicListProps) {
    const addToPlaylist = (event: React.MouseEvent) => {
        props.addToPlaylist(props.items);
    }

    const onDragEnd = (result: DropResult) => {
        // dropped outside the list(리스트 밖으로 드랍한 경우)
        if (!result.destination || result.source.index === result.destination.index)  return;
        props.changeOrder(result.source.index, result.destination.index);
    }
    const onDragStart = () => {
        //console.log(musicList);
    }

    return (
        <div className={styles[`music-list`]} >
            <button onClick={addToPlaylist}>+ 재생목록</button>
            <DragDropContext
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
            >
                <Droppable droppableId="droppable">
                {
                    (provided, snapshot) => (
                    <div ref={provided.innerRef}>
                        {
                            props.items.map((item: MusicInfo, idx: number) =>
                            <Draggable
                                key={idx}
                                draggableId={idx+""}
                                index={idx}
                            >
                                {(provided, snapshot) =>
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}                                        
                                    >
                                        <MusicItem
                                            item={{...item,idx}}
                                            openOptionsPopup={props.openOptionsPopup}
                                        ><div {...provided.dragHandleProps}>=</div>
                                        </MusicItem>
                                        
                                    </div>
                                }
                            </Draggable>
                            )}     
                        {provided.placeholder}                   
                    </div>)
                }

                </Droppable>
            </DragDropContext>        
        </div>
    );
}

export default MusicList;