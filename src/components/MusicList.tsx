import React, { memo } from "react";
import { MusicInfo, MusicInfoItem } from "../refs/constants";
import styles from './MusicList.module.scss';
import { DragDropContext, Droppable, DropResult, Draggable, DroppableProvided } from "react-beautiful-dnd";
import { useRecoilValue } from "recoil";
import { curMusicIdxState } from "../recoilStates/atoms/playlistAtoms";
import MoreVert from "./MoreVert";

export interface MusicListProps {
    items: MusicInfoItem[];
    openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfo[]) => void;
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
                        <MusicListItems provided={provided} items={props.items}
                            openOptionsPopup={props.openOptionsPopup}
                            playMusic={props.playMusic}
                        ></MusicListItems>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
export default memo(MusicList);


interface MusicListItemsProps {
    provided: DroppableProvided
    items: MusicInfoItem[];
    openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfo[]) => void;
    playMusic: (idx: number | undefined) => void;
}
function MusicListItems({ provided, items, playMusic, openOptionsPopup }: MusicListItemsProps) {
    const curMusicIdx = useRecoilValue(curMusicIdxState);
    return (<div ref={provided.innerRef}>
        {items.map((item: MusicInfoItem, idx) =>
            <Draggable
                key={item.key}
                draggableId={item.key}
                index={idx}
            >
                {(provided, snapshot) =>
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${styles['wrapper']} ${curMusicIdx === idx && styles['wrapper--selected']}`}
                    >
                        <div
                            className={styles[`drag_handle`]}
                            {...provided.dragHandleProps}>
                            <span className="material-icons md-28">drag_handle</span>
                        </div>
                        <MusicItem
                            idx={idx}
                            item={item}
                            playMusic={playMusic}
                            openOptionsPopup={openOptionsPopup}
                            isCurMusic={curMusicIdx === idx}
                        ></MusicItem>
                    </div>
                }
            </Draggable>)}
        {provided.placeholder}
    </div>)
}

export interface MusicItemProps {
    idx: number;
    item: MusicInfoItem;
    playMusic: (idx: number | undefined) => void;
    openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfoItem[]) => void;
    isCurMusic?: boolean;
};
export function MusicItem({ idx, item, playMusic, openOptionsPopup, isCurMusic }: MusicItemProps) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event.target as HTMLElement, [item]);
    }
    return (
        <div className={styles['wrapper']} >
            <div className={styles[`grid-container`]}>
                <div className={`${styles[`grid-item`]} ${styles["grid-item--fit"]}`} onClick={() => { playMusic(idx) }}>
                    {item.thumbnail ?
                        <img className={styles["thumbnail"]} alt={item.name} src={item.thumbnail} /> :
                        <div className={styles["thumbnail"]}>
                            <span className="material-icons md-32">
                                question_mark
                            </span>
                        </div>
                    }

                    <div className={`${styles["overlay"]} ${isCurMusic && styles["overlay--show"]}`}>
                        <span className="material-icons md-32">
                            play_arrow
                        </span>
                    </div>
                </div>
                <div className={styles[`grid-item`]} onClick={() => { playMusic(idx) }}>
                    <div
                        className={styles[`grid-item__text`]}
                        title={item.name}
                    >
                        {item.name}
                    </div>
                    <div
                        className={`${styles[`grid-item__text`]} ${styles[`grid-item__text--light`]}`}
                        title={item.owner}
                    >
                        {item.owner}
                    </div>
                </div>
                <MoreVert onClick={popupOpen} ></MoreVert>
            </div>
        </div>
    );
}
