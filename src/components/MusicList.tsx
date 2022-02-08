import React, { memo } from "react";
import { MusicInfo, MusicInfoItem } from "../refs/constants";
import styles from './MusicList.module.scss';
import { DragDropContext, Droppable, DropResult, Draggable } from "react-beautiful-dnd";

export interface MusicListProps {
    items: MusicInfoItem[];
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
    addToPlaylist: (event: React.MouseEvent<Element, MouseEvent>, items: MusicInfo[]) => void;
    playMusic: (idx: number | undefined) => void;
    changeOrder: (src: number, dst: number) => void;
}

function MusicList(props: MusicListProps) {
    const addToPlaylist = (event: React.MouseEvent<Element, MouseEvent>) => {
        props.addToPlaylist(event, props.items);
    }

    const onDragEnd = (result: DropResult) => {
        // dropped outside the list(리스트 밖으로 드랍한 경우)
        if (!result.destination || result.source.index === result.destination.index) return;
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
                                    props.items.map((item: MusicInfoItem, idx) =>
                                        <Draggable
                                            key={item.key}
                                            draggableId={item.key}
                                            index={idx}
                                        >
                                            {(provided, snapshot) =>
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                >
                                                    <MusicItem
                                                        idx={idx}
                                                        item={item}
                                                        playMusic={props.playMusic}
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

export default memo(MusicList);

interface MusicItemProps {
    children: React.ReactChild;
    idx: number;
    item: MusicInfoItem;
    playMusic: (idx: number | undefined) => void;
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
};
function MusicItem({ children, idx, item, playMusic, openOptionsPopup }: MusicItemProps) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event, [item]);
    }
    return (
        <div>
            <div className={styles[`music-list_item`]} onClick={() => { playMusic(idx) }}>
                <img alt="사진 |" />
                <div>{item.name}|</div>
                <button onClick={popupOpen}>버튼</button>
            </div>
            {children}
        </div>

    );
}
