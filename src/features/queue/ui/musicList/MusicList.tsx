import { memo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { MusicInfo, MusicInfoItem } from "shared/model/constants";
import Icon from "shared/ui/Icon";
import MusicItem from "./MusicItem";
import styles from "./MusicList.module.scss";
export interface MusicListProps {
  items: MusicInfoItem[];
  openOptionsPopup: (target: HTMLElement, musicInfos: MusicInfo[]) => void;
  playMusic: (idx: number | undefined) => void;
  changeOrder: (src: number, dst: number) => void;
  editing?: boolean;
  currentIndex?: number;
  currentStatus?: string;
}
function MusicList({
  items,
  openOptionsPopup,
  playMusic,
  changeOrder,
  editing = false,
  currentIndex = 0,
  currentStatus,
}: MusicListProps) {
  const [status, setStatus] = useState("");
  const move = (from: number, to: number) => {
    changeOrder(from, to);
    setStatus(`${items[from].name}, ${to + 1}번째로 이동했습니다.`);
  };
  const onDragEnd = (result: DropResult) => {
    if (result.destination && result.source.index !== result.destination.index)
      move(result.source.index, result.destination.index);
  };
  return (
    <div className={styles.list}>
      <span className="sr-only" role="status">
        {status}
      </span>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="queue">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {items.map((item, idx) => (
                <Draggable key={item.key} draggableId={item.key} index={idx}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${styles.row} ${currentIndex === idx ? styles.selected : ""} ${editing ? styles.editing : ""}`}
                    >
                      <button
                        className={`icon-button ${styles.grip}`}
                        {...provided.dragHandleProps}
                        aria-label={`${item.name} 순서 드래그`}
                      >
                        <Icon name="grip" />
                      </button>
                      <MusicItem
                        idx={idx}
                        item={item}
                        playMusic={playMusic}
                        openOptionsPopup={openOptionsPopup}
                        isCurMusic={currentIndex === idx}
                        statusLabel={
                          currentIndex === idx ? currentStatus : undefined
                        }
                      />
                      {editing && (
                        <div className={styles.order}>
                          <button
                            className="icon-button"
                            disabled={idx === 0}
                            aria-label={`${item.name} 위로`}
                            onClick={() => move(idx, idx - 1)}
                          >
                            <Icon name="up" />
                          </button>
                          <button
                            className="icon-button"
                            disabled={idx === items.length - 1}
                            aria-label={`${item.name} 아래로`}
                            onClick={() => move(idx, idx + 1)}
                          >
                            <Icon name="down" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
export default memo(MusicList);
