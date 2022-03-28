import { memo } from "react";
import { MusicInfo, MusicInfoItem } from "refs/constants";
import styles from './MusicList.module.scss';
import { DragDropContext, Droppable, DropResult, Draggable, DroppableProvided } from "react-beautiful-dnd";
import { useRecoilValue } from "recoil";
import { curMusicIdxState } from "recoilStates/playlistAtoms";
import { MusicItem } from "./MusicItem";

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
    return <div ref={provided.innerRef}>
        {items.map((item: MusicInfoItem, idx) =>
            <Draggable
                key={item.key}
                draggableId={item.key}
                index={idx}
            >{(provided, snapshot) =>
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
                </div>}
            </Draggable>)}
        {provided.placeholder}
    </div>
}
