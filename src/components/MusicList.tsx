import React,{memo} from "react";
import { MusicInfo } from "../refs/constants";
import styles from './MusicList.module.scss';
import { DragDropContext, Droppable, DropResult,Draggable } from "react-beautiful-dnd";

export interface MusicListProps {
    items: MusicInfo[];
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
    addToPlaylist: (items: MusicInfo[]) => void;
    playMusic : (idx : number|undefined)=>void;
    changeOrder:(src:number, dst:number)=>void;
}
interface MusicInfoItem extends MusicInfo{
    idx :number;
    key : string;
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
    const items:MusicInfoItem[] = props.items.map((item,idx)=>{
        return {...item, idx: idx, key:item.name};
    })

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
                            items.map((item: MusicInfoItem) =>
                            <Draggable
                                key={item.key}
                                draggableId={item.key}
                                index={item.idx}
                            >
                                {(provided, snapshot) =>
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}                                        
                                    >
                                        <MusicItem                                            
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

interface MusicItemProps{ 
    children: React.ReactChild;
    item: MusicInfoItem;
    playMusic : (idx : number|undefined)=>void;
    openOptionsPopup: (event: React.MouseEvent, musicInfos: MusicInfo[]) => void;
};
function MusicItem({ children, item, playMusic, openOptionsPopup }: MusicItemProps) {
    const popupOpen = (event: React.MouseEvent) => {
        openOptionsPopup(event, [item]);
    }
    return (
        <div>
            <div className={styles[`music-list_item`]} onClick={()=>{playMusic(item.idx)}}>
                <img alt="사진 |" />
                <div>{item.name}|</div>
                <button onClick={popupOpen}>버튼</button>
            </div>                
            {children}
        </div>   
        
    );
}
