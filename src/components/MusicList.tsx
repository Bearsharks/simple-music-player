import React, { memo } from "react";
import { MusicInfo, MusicInfoItem } from "../refs/constants";
import styles from './MusicList.module.scss';
import { DragDropContext, Droppable, DropResult, Draggable, DraggableProvidedDragHandleProps } from "react-beautiful-dnd";

export interface MusicListProps {
    items: MusicInfoItem[];
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
    addToPlaylist: (event: React.MouseEvent<Element, MouseEvent>, items: MusicInfo[]) => void;
    playMusic: (idx: number | undefined) => void;
    changeOrder: (src: number, dst: number) => void;
}

function MusicList(props: MusicListProps) {
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
            <DragDropContext
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
            >
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef}>
                            {props.items.map((item: MusicInfoItem, idx) =>
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
                                                dragHandleProps={provided.dragHandleProps}
                                            ></MusicItem>

                                        </div>
                                    }
                                </Draggable>)}
                            {provided.placeholder}
                        </div>)}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
export default memo(MusicList);

interface MusicItemProps {
    idx: number;
    item: MusicInfoItem;
    playMusic: (idx: number | undefined) => void;
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
    dragHandleProps: DraggableProvidedDragHandleProps | undefined;
};
function MusicItem({ idx, item, playMusic, openOptionsPopup, dragHandleProps }: MusicItemProps) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event, [item]);
    }
    return (
        <div style={{ 'display': 'flex', 'alignItems': 'center' }}>
            <div
                className={styles[`drag_handle`]}
                {...dragHandleProps}>
                <span className="material-icons md-28">drag_handle</span>
            </div>
            <div className={styles[`container`]} onClick={() => { playMusic(idx) }}>
                <img className={styles[`item`]} alt={item.name} src={item.thumbnail} />
                <div className={styles[`item`]}>
                    <div
                        className={styles[`item__text`]}
                        title={item.name}
                    >
                        {item.name}
                    </div>
                    <div
                        className={`${styles[`item__text`]} ${styles[`item__text--light`]}`}
                        title={item.owner}
                    >
                        {item.owner}
                    </div>
                </div>
                <div className={styles[`item`]} onClick={popupOpen}>
                    <span className="material-icons">more_vert</span>
                </div>
            </div>
        </div>
    );
}
